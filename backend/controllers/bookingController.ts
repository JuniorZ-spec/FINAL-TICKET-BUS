const prisma = require("../prismaClient");
const redis = require("../redisClient");

exports.lockSeat = async (req, res) => {
  try {
    const { tripId, seats } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: "Aucun siège fourni" });
    }

    for (const seat of seats) {
      const isLocked = await redis.get(`lock:${tripId}:${seat}`);
      if (isLocked) {
        return res
          .status(409)
          .json({ success: false, message: `Le siège ${seat} est déjà verrouillé` });
      }
    }

    for (const seat of seats) {
      await redis.set(`lock:${tripId}:${seat}`, userId, "EX", 600);
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
      const locker = await redis.get(`lock:${tripId}:${seat}`);
      if (locker !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: `Le siège ${seat} n'est pas verrouillé par vous ou le verrou a expiré`,
        });
      }
    }

    const activeBookings = await prisma.booking.findMany({
      where: { tripId, status: "ACTIVE" },
    });
    const alreadyBooked = activeBookings.flatMap((b) => b.seats);
    if (requestedSeats.some((s) => alreadyBooked.includes(s))) {
      return res
        .status(400)
        .json({ success: false, message: "Un ou plusieurs sièges sont déjà réservés" });
    }

    const booking = await prisma.booking.create({
      data: {
        seats: requestedSeats,
        transactionId,
        status: "ACTIVE",
        userId,
        tripId,
        companyId: trip.companyId,
      },
    });

    await Promise.all(requestedSeats.map((seat) => redis.del(`lock:${tripId}:${seat}`)));

    res.status(200).json({ success: true, message: "Réservation réussie", data: { booking } });
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
      include: {
        user: { select: { email: true, travelerProfile: { select: { name: true } } } },
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
