// __tests__/cancelBooking.test.js
//
// Couvre les deux bugs corrigés le 2026-09-17 lors de l'audit du projet :
// 1. N'importe quel utilisateur authentifié pouvait annuler la réservation
//    de n'importe qui d'autre (aucune vérification de propriétaire).
// 2. Annuler une réservation ne libérait jamais la ligne BookingSeat, donc
//    le siège restait bloqué pour toujours sur ce trajet.

jest.mock("../prismaClient", () => {
  const mockPrisma = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookingSeat: {
      deleteMany: jest.fn(),
    },
  };
  // Exécute directement le callback avec le même mock en guise de "tx" :
  // suffisant ici, on ne teste pas l'atomicité réelle de la transaction.
  mockPrisma.$transaction = jest.fn(async (fn) => fn(mockPrisma));
  return mockPrisma;
});
jest.mock("../redisClient", () => ({}));
jest.mock("../sqsClient", () => ({}));
jest.mock("@aws-sdk/client-sqs", () => ({ SendMessageCommand: jest.fn() }));

const prisma = require("../prismaClient");
const bookingController = require("../controllers/bookingController");

const mockReqResNext = (user, body) => {
  const req = { user, body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return { req, res };
};

const baseBooking = {
  id: "booking-1",
  userId: "owner-1",
  companyId: "company-1",
  status: "ACTIVE",
  bookingRequest: { id: "request-1", bookingSeats: [{ id: "seat-row-1" }] },
};

describe("cancelBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("❌ refuse (403) si l'utilisateur n'est ni le propriétaire, ni la compagnie, ni un admin", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "stranger", userType: "TRAVELER", companyId: null },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(prisma.bookingSeat.deleteMany).not.toHaveBeenCalled();
  });

  test("✅ autorise le voyageur propriétaire de la réservation", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "owner-1", userType: "TRAVELER", companyId: null },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "booking-1" }, data: { status: "CANCELLED" } })
    );
  });

  test("✅ autorise un membre de la compagnie concernée", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "staff-1", userType: "COMPANY_MEMBER", companyId: "company-1" },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("❌ refuse un membre d'une AUTRE compagnie", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "staff-2", userType: "COMPANY_MEMBER", companyId: "another-company" },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("✅ autorise un admin quel que soit le propriétaire", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "admin-1", userType: "ADMIN", companyId: null },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("✅ libère la ligne BookingSeat associée (le siège redevient réservable)", async () => {
    prisma.booking.findUnique.mockResolvedValue(baseBooking);
    const { req, res } = mockReqResNext(
      { userId: "owner-1", userType: "TRAVELER", companyId: null },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(prisma.bookingSeat.deleteMany).toHaveBeenCalledWith({
      where: { bookingRequestId: "request-1" },
    });
  });

  test("❌ refuse d'annuler une réservation déjà annulée", async () => {
    prisma.booking.findUnique.mockResolvedValue({ ...baseBooking, status: "CANCELLED" });
    const { req, res } = mockReqResNext(
      { userId: "owner-1", userType: "TRAVELER", companyId: null },
      { bookingId: "booking-1" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("❌ retourne 404 si la réservation n'existe pas", async () => {
    prisma.booking.findUnique.mockResolvedValue(null);
    const { req, res } = mockReqResNext(
      { userId: "owner-1", userType: "TRAVELER", companyId: null },
      { bookingId: "does-not-exist" }
    );

    await bookingController.cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
