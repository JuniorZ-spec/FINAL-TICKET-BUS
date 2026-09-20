const prisma = require("../prismaClient");

exports.addStation = async (req, res) => {
  try {
    const { name, address, city } = req.body;

    const station = await prisma.station.create({
      data: { name, address, city, companyId: req.user.companyId },
    });

    res.status(201).json({ success: true, message: "Station ajoutée avec succès", data: station });
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

exports.getStationById = async (req, res) => {
  try {
    const station = await prisma.station.findUnique({ where: { id: req.params.id } });
    if (!station) {
      return res.status(404).json({ success: false, message: "Station introuvable" });
    }
    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const { name, address, city } = req.body;

    const station = await prisma.station.update({
      where: { id: req.params.id },
      data: { name, address, city },
    });

    res
      .status(200)
      .json({ success: true, message: "Station mise à jour avec succès", data: station });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Station introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    await prisma.station.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Station supprimée avec succès" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Station introuvable" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
