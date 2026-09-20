import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { MapPin, Calendar, Clock, X, Search, Phone } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";

const CHANNEL_LABEL = { ONLINE: "En ligne", COUNTER: "Guichet" };
const CHANNEL_STYLE = {
  ONLINE: "bg-purple-50 text-purple-600 border-purple-100",
  COUNTER: "bg-blue-50 text-blue-600 border-blue-100",
};
const STATUS_LABEL = { ACTIVE: "Confirmée", COMPLETED: "Terminée", CANCELLED: "Annulée" };
const STATUS_STYLE = {
  ACTIVE: "bg-brand-green/10 text-brand-green border-brand-green/20",
  COMPLETED: "bg-gray-100 text-anthracite/50 border-gray-200",
  CANCELLED: "bg-red-50 text-red-500 border-red-100",
};

function Badge({ children, className }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${className}`}
    >
      {children}
    </span>
  );
}

function CompanyBookings() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getBookings = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/bookings/get-company-bookings");
      if (response.data.success) {
        const mapped = response.data.data.map((booking) => ({
          key: booking.id,
          reference: booking.id.slice(-8).toUpperCase(),
          passengerName: booking.user?.travelerProfile?.name || booking.user?.email || "Voyageur",
          phone: booking.user?.travelerProfile?.phone || null,
          from: booking.trip?.from || "—",
          to: booking.trip?.to || "—",
          fare: booking.trip?.price || 0,
          date: booking.trip?.date || null,
          time: booking.trip?.departureTime || "—",
          seats: Array.isArray(booking.seats) ? booking.seats : [],
          status: booking.status || "ACTIVE",
          channel: booking.channel || "ONLINE",
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return bookings.filter((b) => {
      const matchesTerm =
        !term ||
        b.passengerName.toLowerCase().includes(term) ||
        b.reference.toLowerCase().includes(term) ||
        (b.phone || "").toLowerCase().includes(term);
      const matchesChannel = channelFilter === "all" || b.channel === channelFilter;
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesTerm && matchesChannel && matchesStatus;
    });
  }, [bookings, searchTerm, channelFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Réservations</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">{filtered.length} réservation(s)</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite/30" />
          <input
            type="text"
            placeholder="Nom, téléphone, référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta/30 bg-white"
        >
          <option value="all">Tous canaux</option>
          <option value="ONLINE">En ligne</option>
          <option value="COUNTER">Guichet</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta/30 bg-white"
        >
          <option value="all">Tous statuts</option>
          <option value="ACTIVE">Confirmée</option>
          <option value="COMPLETED">Terminée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">N° réservation</th>
              <th className="px-5 py-3 font-semibold">Passager</th>
              <th className="px-5 py-3 font-semibold">Trajet / Départ</th>
              <th className="px-5 py-3 font-semibold">Places</th>
              <th className="px-5 py-3 font-semibold">Montant</th>
              <th className="px-5 py-3 font-semibold">Canal</th>
              <th className="px-5 py-3 font-semibold">Statut</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-anthracite/40">
                  Aucune réservation pour l&apos;instant.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-anthracite/50">{b.reference}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-anthracite">{b.passengerName}</p>
                    {b.phone && (
                      <p className="flex items-center gap-1 text-xs text-anthracite/40 mt-0.5">
                        <Phone size={11} /> {b.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin size={12} className="text-brand-green" /> {b.from}
                      <span className="text-anthracite/30 mx-0.5">→</span>
                      {b.to}
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-0.5 text-anthracite/40">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {b.date ? new Date(b.date).toLocaleDateString("fr-FR") : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {b.time}
                      </span>
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
                    <Badge className={CHANNEL_STYLE[b.channel]}>{CHANNEL_LABEL[b.channel]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={STATUS_STYLE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
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
                      <span className="text-xs text-anthracite/30">—</span>
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
