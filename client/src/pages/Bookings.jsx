import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Users, CreditCard, Printer, X, Star } from "lucide-react";
import { Modal, message } from "antd";
import { axiosInstance } from "../helpers/axiosInstance";
import PrintTicket from "../components/PrintTicket";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const getBookings = async () => {
    try {
      const response = await axiosInstance.post("/api/bookings/get-bookings");
      if (response.data.success) {
        const mapped = response.data.data.map((b) => {
          const [h, m] = (b.trip?.departureTime || "00:00").split(":").map(Number);
          const base = b.trip?.date ? new Date(b.trip.date) : null;
          const tripDateTime = base
            ? new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m)
            : null;

          return {
            ...b,
            company: b.trip?.company?.companyName || "N/A",
            passengerName: b.user?.name || "Utilisateur",
            price: b.trip?.price || 0,
            date: b.trip?.date,
            departureTime: b.trip?.departureTime,
            departureCity: b.trip?.from,
            arrivalCity: b.trip?.to,
            seats: Array.isArray(b.seats) ? b.seats : [],
            status: b.status || "ACTIVE",
            companyLogo: "🚌",
            departureStation: b.trip?.departureStation?.name,
            arrivalStation: b.trip?.arrivalStation?.name,
            hasReview: Boolean(b.review),
            isPast: tripDateTime ? tripDateTime <= new Date() : false,
          };
        });
        setBookings(mapped);
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    getBookings();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const cancelBooking = async (id) => {
    try {
      const response = await axiosInstance.post("/api/bookings/cancel-booking", { bookingId: id });
      if (response.data.success) {
        message.success("Réservation annulée");
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    if (!reviewContent.trim()) {
      message.error("Écrivez un mot sur votre trajet avant d'envoyer.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await axiosInstance.post("/api/reviews/create", {
        bookingId: reviewBooking.id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      if (response.data.success) {
        message.success(response.data.message);
        setReviewBooking(null);
        setReviewContent("");
        setReviewRating(5);
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePrint = () => {
    if (!selectedBooking) return;

    const printContent = document.getElementById("print-ticket-content");
    if (!printContent) {
      message.error("Aucun contenu à imprimer");
      return;
    }

    const printWindow = window.open("", "_blank");

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Bus</title>
          ${styles}
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
            .print-container { width: 350px; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);

    setShowPrintModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className="pb-12 pt-4">
      <div className="overflow-x-auto">
        <table className="w-full rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Compagnie
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Passager
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Prix
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Sièges
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Trajet
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                Date & Heure
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{b.companyLogo}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-md">{b.company}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-900">{b.passengerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {b.price * b.seats.length}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm bg-blue-200 px-2 py-1 rounded text-gray-800">
                    {b.seats.join(", ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="text-gray-900">{b.departureCity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-900">{b.arrivalCity}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{new Date(b.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>
                        {b.departureTime} → {b.arrivalTime}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        setShowPrintModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      style={{ borderRadius: "8px" }}
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden xl:inline">Imprimer</span>
                    </button>
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
                      style={{ borderRadius: "8px" }}
                    >
                      Annuler
                    </button>
                    {b.status === "ACTIVE" && b.isPast && !b.hasReview && (
                      <button
                        onClick={() => {
                          setReviewBooking(b);
                          setReviewRating(5);
                          setReviewContent("");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-terracotta text-white rounded-md hover:bg-terracotta-dark text-xs"
                        style={{ borderRadius: "8px" }}
                      >
                        <Star className="w-4 h-4" />
                        <span className="hidden xl:inline">Laisser un avis</span>
                      </button>
                    )}
                    {b.hasReview && (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-anthracite/40">
                        <Star className="w-3.5 h-3.5 fill-saffron text-saffron" />
                        Avis envoyé
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal pour l'aperçu + impression */}
      <Modal
        title="Aperçu du ticket"
        open={showPrintModal}
        onCancel={() => {
          setShowPrintModal(false);
          setSelectedBooking(null);
        }}
        footer={null}
      >
        {selectedBooking && (
          <div>
            <div id="print-ticket-content">
              <PrintTicket booking={selectedBooking} />
            </div>

            <div
              style={{
                marginTop: "1rem",
                justifyContent: "space-between",
                display: "flex",
                textAlign: "right",
              }}
            >
              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "5px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Printer style={{ display: "inline", marginRight: "0.3rem" }} />
                Imprimer
              </button>

              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal pour laisser un avis (uniquement pour un trajet réellement effectué) */}
      <Modal
        title="Laisser un avis"
        open={!!reviewBooking}
        onCancel={() => setReviewBooking(null)}
        footer={null}
      >
        {reviewBooking && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {reviewBooking.company} — {reviewBooking.departureCity} → {reviewBooking.arrivalCity}
            </p>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      n <= reviewRating ? "fill-saffron text-saffron" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Comment s'est passé votre trajet ?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewBooking(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="px-4 py-2 bg-terracotta text-white rounded hover:bg-terracotta-dark text-sm font-semibold disabled:opacity-50"
              >
                {submittingReview ? "Envoi..." : "Envoyer l'avis"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
