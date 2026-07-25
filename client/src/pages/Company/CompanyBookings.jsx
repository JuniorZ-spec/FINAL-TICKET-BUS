import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { MapPin, Calendar, Clock, X, Search } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";

function CompanyBookings() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const getBookings = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/bookings/get-company-bookings");
      if (response.data.success) {
        const mapped = response.data.data.map((booking) => ({
          key: booking.id,
          passengerName: booking.user?.travelerProfile?.name || booking.user?.email || "Voyageur",
          from: booking.trip?.from || "—",
          to: booking.trip?.to || "—",
          busName: booking.trip?.bus?.name || "—",
          fare: booking.trip?.price || 0,
          date: booking.trip?.date || null,
          time: booking.trip?.departureTime || "—",
          seats: Array.isArray(booking.seats) ? booking.seats : [],
          status: booking.status || "ACTIVE",
        }));
        setBookings(mapped);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch(HideLoading());
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/bookings/cancel-booking", { bookingId });
      if (response.data.success) {
        message.success("Réservation annulée");
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getBookings();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const filtered = bookings.filter((b) =>
    b.passengerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Réservations</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">{filtered.length} réservation(s)</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite/30" />
          <input
            type="text"
            placeholder="Nom du passager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Passager</th>
              <th className="px-5 py-3 font-semibold">Trajet</th>
              <th className="px-5 py-3 font-semibold">Bus</th>
              <th className="px-5 py-3 font-semibold">Date & heure</th>
              <th className="px-5 py-3 font-semibold">Places</th>
              <th className="px-5 py-3 font-semibold">Montant</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-anthracite/40">
                  Aucune réservation pour l&apos;instant.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-anthracite">{b.passengerName}</td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin size={12} className="text-brand-green" /> {b.from}
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-0.5">
                      <MapPin size={12} className="text-terracotta" /> {b.to}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">{b.busName}</td>
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
                    {formatPrice(b.fare * b.seats.length)}
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

export default CompanyBookings;
