const prisma = require("../prismaClient");

// Un avis n'est possible que pour une réservation réelle, active, dont le
// voyage a déjà eu lieu, et une seule fois par réservation (contrainte
// @@unique sur Review.bookingId côté Prisma).
exports.createReview = async (req, res) => {
  try {
    const { bookingId, content, rating } = req.body;
    const userId = req.user.userId;

    if (!bookingId || !content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Réservation et contenu de l'avis requis" });
    }
    if (rating != null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "La note doit être entre 1 et 5" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true, review: true },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ success: false, message: "Réservation introuvable" });
    }
    if (booking.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ success: false, message: "Cette réservation n'est plus active" });
    }
    if (booking.review) {
      return res
        .status(409)
        .json({ success: false, message: "Vous avez déjà laissé un avis pour ce trajet" });
    }

    const [hours, minutes] = booking.trip.departureTime.split(":").map(Number);
    const base = new Date(booking.trip.date);
    const tripDateTime = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      hours,
      minutes
    );
    if (tripDateTime > new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Vous pourrez laisser un avis après le départ du bus" });
    }

    const review = await prisma.review.create({
      data: {
        content: content.trim(),
        rating: rating ?? null,
        userId,
        companyId: booking.companyId,
        bookingId,
      },
    });

    res.status(201).json({ success: true, message: "Merci pour votre avis", data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public : derniers avis réels de la plateforme, pour la page d'accueil.
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { travelerProfile: { select: { name: true } } } },
        company: { select: { companyName: true } },
      },
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
