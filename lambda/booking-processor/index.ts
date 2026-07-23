import type { SQSEvent, SQSHandler, SQSBatchResponse } from "aws-lambda";

const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

interface BookingMessage {
  bookingRequestId: string;
  tripId: string;
  seats: string[];
  userId: string;
  companyId: string;
  transactionId: string;
}

// Traitement au cas par cas plutot qu'en lot : si un message echoue pour
// une raison technique (pas un refus de siege), on le signale dans le
// batchItemFailures pour que SQS le represente (jusqu'a maxReceiveCount
// avant DLQ), sans faire echouer les messages d'autres trips traites
// dans le meme batch.
export const handler: SQSHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      await processMessage(JSON.parse(record.body));
    } catch (error) {
      console.error(`Erreur technique sur le message ${record.messageId} :`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

async function processMessage(message: BookingMessage): Promise<void> {
  const { bookingRequestId, tripId, seats, userId, companyId, transactionId } = message;

  try {
    const booking = await prisma.$transaction(async (tx: any) => {
      // Seule veritable garantie d'unicite du projet : la contrainte
      // @@unique([tripId, seat]) sur BookingSeat. Si un des sieges
      // demandes est deja pris, cette insertion leve une violation de
      // contrainte (code Prisma P2002) et toute la transaction est
      // annulee - aucun siege partiellement reserve, aucun Booking cree.
      await tx.bookingSeat.createMany({
        data: seats.map((seat) => ({ tripId, seat, bookingRequestId })),
      });

      const newBooking = await tx.booking.create({
        data: {
          seats,
          transactionId,
          status: "ACTIVE",
          userId,
          tripId,
          companyId,
        },
      });

      await tx.bookingRequest.update({
        where: { id: bookingRequestId },
        data: { status: "CONFIRMED", bookingId: newBooking.id },
      });

      return newBooking;
    });

    console.log(`Reservation confirmee : ${booking.id} (demande ${bookingRequestId})`);
  } catch (error: any) {
    const isUniqueConstraintViolation =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

    if (!isUniqueConstraintViolation) {
      // Erreur technique (DB injoignable, etc.) : on relance pour que SQS
      // remette le message en jeu / le route vers la DLQ apres
      // maxReceiveCount. Ce n'est PAS un refus de siege.
      throw error;
    }

    // Refus normal : un ou plusieurs sieges etaient deja pris. Pas une
    // erreur technique, donc pas de retry - juste marquer la demande
    // comme refusee.
    await prisma.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: "REJECTED" },
    });

    console.log(`Reservation refusee (siege deja pris) : demande ${bookingRequestId}`);
  }
}
