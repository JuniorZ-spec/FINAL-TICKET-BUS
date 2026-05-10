const prisma = require("../prismaClient");

const tripInclude = {
  bus: {
    select: {
      id: true,
      name: true,
      number: true,
      capacity: true,
      airConditioning: true,
      wifi: true,
    },
  },
  departureStation: true,
  arrivalStation: true,
  company: { select: { id: true, companyName: true } },
};

exports.addTrip = async (req, res) => {
  try {
    const { from, to, departureStationId, arrivalStationId, busId, date, departureTime, price } =
      req.body;

    const trip = await prisma.trip.create({
      data: {
        from,
        to,
        date: new Date(date),
        departureTime,
        price: parseFloat(price),
        companyId: req.user.companyId,
        busId,
        departureStationId,
        arrivalStationId,
      },
    });

    res.status(201).json({ success: true, message: "Trajet ajouté avec succès", data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({ include: tripInclude });
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.body.id },
      include: tripInclude,
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }

    const bookings = await prisma.booking.findMany({
      where: { tripId: trip.id, status: "ACTIVE" },
    });
    const bookedSeats = bookings.flatMap((b) => b.seats);

    const data = { ...trip, bus: { ...trip.bus, seatsBooked: bookedSeats } };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const { from, to, departureStationId, arrivalStationId, busId, date, departureTime, price } =
      req.body;

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        from,
        to,
        date: date ? new Date(date) : undefined,
        departureTime,
        price: price ? parseFloat(price) : undefined,
        busId,
        departureStationId,
        arrivalStationId,
      },
    });

    res.status(200).json({ success: true, message: "Trajet mis à jour", data: trip });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    await prisma.trip.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Trajet supprimé avec succès" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
