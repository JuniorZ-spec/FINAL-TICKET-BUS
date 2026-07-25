const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");

exports.createCompany = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    if (!email || !password || !companyName) {
      return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
    }

    const existingCompany = await prisma.company.findFirst({
      where: { OR: [{ email }, { companyName }] },
    });
    if (existingCompany) {
      const field = existingCompany.email === email ? "email" : "companyName";
      return res.status(409).json({ success: false, message: `${field} déjà utilisé` });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Un compte avec cet email existe déjà" });
    }

    const [company, user] = await prisma.$transaction(async (tx) => {
      const c = await tx.company.create({ data: { companyName, email, status: "VERIFIED" } });
      const u = await tx.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          userType: "COMPANY_MEMBER",
          status: "ACTIVE",
          companyMember: { create: { companyId: c.id, role: "OWNER" } },
        },
      });
      return [c, u];
    });

    res.status(201).json({
      success: true,
      message: "Compagnie créée avec succès",
      data: { company, ownerId: user.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { status: { in: ["VERIFIED", "SUSPENDED"] } },
      select: {
        id: true,
        companyName: true,
        email: true,
        status: true,
        rccm: true,
        ifu: true,
        createdAt: true,
        _count: { select: { trips: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = await Promise.all(
      companies.map(async (company) => {
        const [trips, bookings] = await Promise.all([
          prisma.trip.findMany({ where: { companyId: company.id }, select: { id: true, price: true } }),
          prisma.booking.findMany({ where: { companyId: company.id }, select: { tripId: true, seats: true } }),
        ]);
        const revenue = bookings.reduce((sum, b) => {
          const trip = trips.find((t) => t.id === b.tripId);
          return sum + (trip ? trip.price * b.seats.length : 0);
        }, 0);
        return {
          id: company.id,
          companyName: company.companyName,
          email: company.email,
          status: company.status,
          rccm: company.rccm,
          ifu: company.ifu,
          createdAt: company.createdAt,
          tripsCount: company._count.trips,
          revenue,
        };
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "desc" },
    });
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveCompany = async (req, res) => {
  try {
    const { companyId, password } = req.body;
    if (!companyId || !password) {
      return res
        .status(400)
        .json({ success: false, message: "companyId et mot de passe requis" });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.status !== "PENDING") {
      return res.status(404).json({ success: false, message: "Demande introuvable" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: company.email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Un compte avec cet email existe déjà" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { status: "VERIFIED" } });
      await tx.user.create({
        data: {
          email: company.email,
          password: await bcrypt.hash(password, 10),
          userType: "COMPANY_MEMBER",
          status: "ACTIVE",
          companyMember: { create: { companyId, role: "OWNER" } },
        },
      });
    });

    res.status(200).json({ success: true, message: "Compagnie validée avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.status !== "PENDING") {
      return res.status(404).json({ success: false, message: "Demande introuvable" });
    }
    await prisma.company.update({ where: { id: companyId }, data: { status: "REJECTED" } });
    res.status(200).json({ success: true, message: "Demande refusée" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setCompanyStatus = async (req, res) => {
  try {
    const { companyId, status } = req.body;
    if (!["VERIFIED", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Statut invalide" });
    }
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ success: false, message: "Compagnie non trouvée" });
    }
    await prisma.company.update({ where: { id: companyId }, data: { status } });
    res.status(200).json({ success: true, message: "Statut mis à jour" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { userType: "TRAVELER" },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        travelerProfile: { select: { name: true, phone: true } },
      },
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
    if (!user || user.userType !== "TRAVELER") {
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
    const [
      companiesCount,
      pendingCompaniesCount,
      tripsCount,
      bookings,
      trips,
      parcelsInCirculation,
      parcelsAwaitingPickup,
      openDisputes,
      highPriorityDisputes,
    ] = await Promise.all([
      prisma.company.count({ where: { status: "VERIFIED" } }),
      prisma.company.count({ where: { status: "PENDING" } }),
      prisma.trip.count(),
      prisma.booking.findMany(),
      prisma.trip.findMany({ select: { id: true, price: true } }),
      prisma.parcel.count({ where: { status: { not: "DELIVERED" } } }),
      prisma.parcel.count({ where: { status: "AWAITING_PICKUP" } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.dispute.count({ where: { status: "OPEN", priority: "HIGH" } }),
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
        pendingCompaniesCount,
        tripsCount,
        reservationsCount: bookings.length,
        totalRevenue,
        popularTrips,
        parcelsInCirculation,
        parcelsAwaitingPickup,
        openDisputes,
        highPriorityDisputes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyStats = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({ where: { status: "VERIFIED" } });

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
          status: company.status,
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
    const companies = await prisma.company.findMany({ where: { status: "VERIFIED" } });

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
    const companies = await prisma.company.findMany({ where: { status: "VERIFIED" } });

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

exports.getActivityPerDay = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13);

    const [bookings, parcels] = await Promise.all([
      prisma.booking.findMany({ where: { createdAt: { gte: fourteenDaysAgo } } }),
      prisma.parcel.findMany({ where: { createdAt: { gte: fourteenDaysAgo } } }),
    ]);

    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(fourteenDaysAgo.getDate() + i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        reservations: 0,
        colis: 0,
      });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.date, d]));
    bookings.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      if (byKey[key]) byKey[key].reservations++;
    });
    parcels.forEach((p) => {
      const key = new Date(p.createdAt).toISOString().split("T")[0];
      if (byKey[key]) byKey[key].colis++;
    });

    res.status(200).json({ success: true, data: days });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { company: { select: { companyName: true } } },
    });
    res.status(200).json({ success: true, data: disputes });
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
    const { id, userType, status } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const data: Record<string, any> = {};
    if (userType !== undefined) data.userType = userType.toUpperCase();
    if (status !== undefined) data.status = status.toUpperCase();

    await prisma.user.update({ where: { id }, data });
    res.status(200).json({ success: true, message: "Permissions mises à jour" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompaniesReservations = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({ where: { status: "VERIFIED" } });
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
