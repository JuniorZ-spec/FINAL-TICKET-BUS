const prisma = require("../prismaClient");

exports.getCompanyBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      where: { companyId: req.user.companyId },
      include: { company: { select: { companyName: true } } },
    });
    res.status(200).json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addBus = async (req, res) => {
  try {
    const { name, number, capacity, services } = req.body;

    const bus = await prisma.bus.create({
      data: {
        name,
        number,
        capacity: parseInt(capacity),
        airConditioning: services?.airConditioning || false,
        wifi: services?.wifi || false,
        companyId: req.user.companyId,
      },
    });

    res.status(201).json({ success: true, message: "Bus ajouté avec succès", data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBus = async (req, res) => {
  try {
    const { _id, name, number, capacity } = req.body;

    const bus = await prisma.bus.update({
      where: { id: _id },
      data: { name, number, capacity: capacity ? parseInt(capacity) : undefined },
    });

    res.status(200).json({ success: true, message: "Bus mis à jour avec succès", data: bus });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Bus introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBus = async (req, res) => {
  try {
    await prisma.bus.delete({ where: { id: req.body._id } });
    res.status(200).json({ success: true, message: "Bus supprimé avec succès" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Bus introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: req.body._id },
      include: { trips: true },
    });
    if (!bus) {
      return res.status(404).json({ success: false, message: "Bus introuvable" });
    }
    res.status(200).json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
