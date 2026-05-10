const prisma = require("../prismaClient");

exports.getCompanyInfo = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { id: true, companyName: true, email: true, isBlocked: true, createdAt: true },
    });
    if (!company) {
      return res.status(404).json({ success: false, message: "Compagnie introuvable" });
    }
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { companyId: req.user.companyId },
      include: {
        bus: true,
        departureStation: true,
        arrivalStation: true,
      },
    });

    const now = new Date();
    const upcoming = [],
      ongoing = [],
      past = [];

    for (const trip of trips) {
      const tripDate = new Date(trip.date);
      const [h, m] = trip.departureTime.split(":").map(Number);
      tripDate.setHours(h, m, 0, 0);
      const tripEnd = new Date(tripDate.getTime() + 480 * 60000);

      if (tripDate > now) upcoming.push(trip);
      else if (now >= tripDate && now <= tripEnd) ongoing.push(trip);
      else past.push(trip);
    }

    res.status(200).json({ success: true, data: { upcoming, ongoing, past } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [bookings, trips, busesCount, stationsCount] = await Promise.all([
      prisma.booking.findMany({ where: { companyId } }),
      prisma.trip.findMany({ where: { companyId }, select: { id: true, price: true } }),
      prisma.bus.count({ where: { companyId } }),
      prisma.station.count({ where: { companyId } }),
    ]);

    const totalRevenue = bookings.reduce((sum, b) => {
      const trip = trips.find((t) => t.id === b.tripId);
      return sum + (trip ? trip.price * b.seats.length : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        busesCount,
        stationsCount,
        tripsCount: trips.length,
        reservationsCount: bookings.length,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, companyName: true, email: true },
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany({ where: { companyId: req.user.companyId } });
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingsPerDay = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ where: { companyId: req.user.companyId } });

    const result = {};
    bookings.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      result[key] = (result[key] || 0) + b.seats.length;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
