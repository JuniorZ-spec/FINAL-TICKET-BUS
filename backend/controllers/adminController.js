const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");

exports.createCompany = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    if (!email || !password || !companyName) {
      return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
    }

    const existing = await prisma.company.findFirst({
      where: { OR: [{ email }, { companyName }] },
    });
    if (existing) {
      const field = existing.email === email ? "email" : "companyName";
      return res.status(409).json({ success: false, message: `${field} déjà utilisé` });
    }

    const company = await prisma.company.create({
      data: { email, companyName, password: await bcrypt.hash(password, 10) },
    });

    const { password: _, ...data } = company;
    res.status(201).json({ success: true, message: "Compagnie créée avec succès", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, companyName: true, email: true, isBlocked: true, createdAt: true },
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true, email: true, phone: true, isBlocked: true, createdAt: true },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ success: false, message: "Compagnie non trouvée" });
    }
    await prisma.company.delete({ where: { id: companyId } });
    res.status(200).json({ success: true, message: "Compagnie supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "USER") {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [companiesCount, tripsCount, bookings, trips] = await Promise.all([
      prisma.company.count(),
      prisma.trip.count(),
      prisma.booking.findMany(),
      prisma.trip.findMany({ select: { id: true, price: true } }),
    ]);

    const totalRevenue = bookings.reduce((sum, b) => {
      const trip = trips.find((t) => t.id === b.tripId);
      return sum + (trip ? trip.price * b.seats.length : 0);
    }, 0);

    const popularAgg = await prisma.booking.groupBy({
      by: ["tripId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const popularTrips = await Promise.all(
      popularAgg.map(async (item) => ({
        trip: await prisma.trip.findUnique({ where: { id: item.tripId } }),
        count: item._count.id,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        companiesCount,
        tripsCount,
        reservationsCount: bookings.length,
        totalRevenue,
        popularTrips,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyStats = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();

    const stats = await Promise.all(
      companies.map(async (company) => {
        const [trips, bookings, stationsCount] = await Promise.all([
          prisma.trip.findMany({
            where: { companyId: company.id },
            select: { id: true, price: true },
          }),
          prisma.booking.findMany({ where: { companyId: company.id } }),
          prisma.station.count({ where: { companyId: company.id } }),
        ]);

        const totalRevenue = bookings.reduce((sum, b) => {
          const trip = trips.find((t) => t.id === b.tripId);
          return sum + (trip ? trip.price * b.seats.length : 0);
        }, 0);

        return {
          companyId: company.id,
          companyName: company.companyName,
          email: company.email,
          tripsCount: trips.length,
          stationsCount,
          reservationsCount: bookings.length,
          totalRevenue,
          isBlocked: company.isBlocked,
        };
      })
    );

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompaniesRevenue = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();

    const revenues = await Promise.all(
      companies.map(async (company) => {
        const [bookings, trips] = await Promise.all([
          prisma.booking.findMany({ where: { companyId: company.id } }),
          prisma.trip.findMany({
            where: { companyId: company.id },
            select: { id: true, price: true },
          }),
        ]);

        const revenue = bookings.reduce((sum, b) => {
          const trip = trips.find((t) => t.id === b.tripId);
          return sum + (trip ? trip.price * b.seats.length : 0);
        }, 0);

        return { companyName: company.companyName, revenue };
      })
    );

    revenues.sort((a, b) => b.revenue - a.revenue);
    res.status(200).json({ success: true, data: revenues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingsPerCompany = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();

    const data = await Promise.all(
      companies.map(async (company) => {
        const count = await prisma.booking.count({ where: { companyId: company.id } });
        return { companyName: company.companyName, bookingsCount: count };
      })
    );

    const total = data.reduce((sum, c) => sum + c.bookingsCount, 0);
    const result = data.map((c) => ({
      name: c.companyName,
      value: total > 0 ? parseFloat(((c.bookingsCount / total) * 100).toFixed(2)) : 0,
      bookings: c.bookingsCount,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingsPerDay = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const result = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      result[d.toISOString().split("T")[0]] = 0;
    }
    bookings.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      if (result[key] !== undefined) result[key]++;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      include: { company: { select: { companyName: true } } },
    });
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserPermissions = async (req, res) => {
  try {
    const { id, role, isBlocked } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const data = {};
    if (role !== undefined) data.role = role.toUpperCase();
    if (isBlocked !== undefined) data.isBlocked = isBlocked;

    await prisma.user.update({ where: { id }, data });
    res.status(200).json({ success: true, message: "Permissions mises à jour" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompaniesReservations = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    const data = await Promise.all(
      companies.map(async (company) => ({
        companyName: company.companyName,
        bookingsCount: await prisma.booking.count({ where: { companyId: company.id } }),
      }))
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
