const prisma = require("../prismaClient");
const redis = require("../redisClient");
const sqsClient = require("../sqsClient");
const { SendMessageCommand } = require("@aws-sdk/client-sqs");

// Redis n'est qu'un verrou consultatif (évite que deux clients choisissent le
// même siège pendant le paiement) : bookSeat revérifie toujours en base, seule
// source de vérité contre la survente. Si Redis est indisponible, on continue
// sans bloquer la réservation plutôt que de faire échouer tout le parcours.
const safeRedis = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    console.error("❌ Redis indisponible, verrou de siège ignoré :", error.message);
    return fallback;
  }
};

exports.lockSeat = async (req, res) => {
  try {
    const { tripId, seats } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: "Aucun siège fourni" });
    }

    for (const seat of seats) {
      const isLocked = await safeRedis(() => redis.get(`lock:${tripId}:${seat}`), null);
      if (isLocked) {
        return res
          .status(409)
          .json({ success: false, message: `Le siège ${seat} est déjà verrouillé` });
      }
    }

    for (const seat of seats) {
      await safeRedis(() => redis.set(`lock:${tripId}:${seat}`, userId, "EX", 600), null);
    }

    res.status(200).json({ success: true, message: "Sièges verrouillés avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookSeat = async (req, res) => {
  try {
    const { tripId, seats, transactionId } = req.body;
    const userId = req.user.userId;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { departureStation: true, arrivalStation: true },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé" });
    }

    const [h, m] = trip.departureTime.split(":").map(Number);
    const base = new Date(trip.date);
    const tripDateTime = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    if (tripDateTime <= new Date()) {
      return res.status(400).json({ success: false, message: "Ce voyage est déjà passé" });
    }

    const requestedSeats = Array.isArray(seats) ? seats.map(String) : [];

    for (const seat of requestedSeats) {
      let locker;
      try {
        locker = await redis.get(`lock:${tripId}:${seat}`);
      } catch (error) {
        console.error("❌ Redis indisponible, vérification du verrou ignorée :", error.message);
        continue; // la vérification en base ci-dessous reste la protection réelle
      }
      if (locker !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: `Le siège ${seat} n'est pas verrouillé par vous ou le verrou a expiré`,
        });
      }
    }

    // Confirmation asynchrone : cette route ne fait plus qu'enregistrer la
    // demande et l'empiler sur SQS FIFO. La garantie "zero double
    // reservation" ne vient plus d'une lecture optimiste ici (race
    // condition TOCTOU classique), mais de la contrainte @@unique sur
    // BookingSeat, appliquee par la Lambda dans une transaction — voir
    // lambda/booking-processor et docs/decisions.md (Phase 6).
    const bookingRequest = await prisma.bookingRequest.create({
      data: {
        seats: requestedSeats,
        transactionId,
        status: "PENDING",
        userId,
        tripId,
      },
    });

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.BOOKING_QUEUE_URL,
        MessageBody: JSON.stringify({
          bookingRequestId: bookingRequest.id,
          tripId,
          seats: requestedSeats,
          userId,
          companyId: trip.companyId,
          transactionId,
        }),
        // Meme groupe = meme trip => SQS FIFO garantit qu'un seul message
        // de ce trip est en cours de traitement a la fois (une tache
        // Lambda concurrente par groupe). Premiere ligne de defense, pas
        // la preuve d'unicite - celle-ci vient de la contrainte DB.
        MessageGroupId: tripId,
        MessageDeduplicationId: transactionId,
      })
    );

    res.status(202).json({
      success: true,
      message: "Demande de réservation enregistrée, traitement en cours",
      data: { bookingRequestId: bookingRequest.id, status: "PENDING" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!bookingRequest) {
      return res.status(404).json({ success: false, message: "Demande introuvable" });
    }

    if (bookingRequest.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    res.status(200).json({
      success: true,
      data: {
        status: bookingRequest.status,
        booking: bookingRequest.booking,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Réservation non trouvée" });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    res.status(200).json({ success: true, message: "Réservation annulée avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: {
        trip: {
          include: {
            departureStation: true,
            arrivalStation: true,
            company: { select: { companyName: true } },
          },
        },
      },
    });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            travelerProfile: { select: { name: true, phone: true } },
          },
        },
        trip: {
          include: {
            departureStation: true,
            arrivalStation: true,
            bus: { select: { name: true, number: true } },
          },
        },
      },
    });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { email: true, travelerProfile: { select: { name: true } } } },
        company: { select: { companyName: true } },
        trip: {
          include: {
            departureStation: true,
            arrivalStation: true,
            bus: { select: { name: true } },
          },
        },
      },
    });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
