import { useEffect, useState } from "react";
import { message } from "antd";
import { MapPin, Calendar, Clock, X } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";

export default function AdminBooking() {
  const [bookings, setBookings] = useState([]);

  const getBookings = async () => {
    try {
      const response = await axiosInstance.get("/api/bookings/get-all-bookings");
      if (response.data.success) {
        const mappedData = response.data.data.map((booking) => ({
          key: booking.id,
          companyName: booking.company?.companyName || "—",
          passengerName: booking.user?.travelerProfile?.name || booking.user?.email || "Voyageur",
          price: booking.trip?.price || 0,
          date: booking.trip?.date || null,
          time: booking.trip?.departureTime || "—",
          departureStation: booking.trip?.departureStation?.name || "—",
          arrivalStation: booking.trip?.arrivalStation?.name || "—",
          seats: Array.isArray(booking.seats) ? booking.seats : [],
          status: booking.status || "ACTIVE",
        }));
        setBookings(mappedData);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-anthracite">Réservations</h1>
        <p className="text-sm text-anthracite/50 mt-0.5">
          Historique des billets réservés, toutes compagnies confondues
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Compagnie</th>
              <th className="px-5 py-3 font-semibold">Passager</th>
              <th className="px-5 py-3 font-semibold">Trajet</th>
              <th className="px-5 py-3 font-semibold">Date & heure</th>
              <th className="px-5 py-3 font-semibold">Places</th>
              <th className="px-5 py-3 font-semibold">Montant</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-anthracite/40">
                  Aucune réservation pour l&apos;instant.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-anthracite">{b.companyName}</td>
                  <td className="px-5 py-3 text-anthracite/70">{b.passengerName}</td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin size={12} className="text-brand-green" /> {b.departureStation}
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-0.5">
                      <MapPin size={12} className="text-terracotta" /> {b.arrivalStation}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-anthracite/70 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {b.date ? new Date(b.date).toLocaleDateString("fr-FR") : "—"}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> {b.time}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono bg-offwhite text-anthracite/70 px-2 py-1 rounded-lg">
                      {b.seats.length > 0 ? b.seats.join(", ") : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-anthracite">
                    {formatPrice(b.price * b.seats.length)}
                  </td>
                  <td className="px-5 py-3">
                    {b.status === "ACTIVE" ? (
                      <button
                        onClick={() => cancelBooking(b.key)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <X size={13} /> Annuler
                      </button>
                    ) : (
                      <span className="text-xs text-anthracite/40 capitalize">
                        {b.status.toLowerCase()}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
