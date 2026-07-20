import { useEffect, useState } from "react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { message } from "antd";
import { Ticket, Wallet, Bus, Package, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CompanyHome() {
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    busesCount: 0,
    tripsCount: 0,
    reservationsCount: 0,
    totalRevenue: 0,
    ticketsToday: 0,
    revenueToday: 0,
    avgFillRate: 0,
  });
  const [bookingData, setBookingData] = useState([]);
  const [period, setPeriod] = useState(7);
  const [upcoming, setUpcoming] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    getDashboardStats();
    getBookingsPerDay();
    getUpcomingTrips();
    getRecentBookings();
  }, []);

  const getDashboardStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-dashboard-stats");
      if (response.data.success) setStats((prev) => ({ ...prev, ...response.data.data }));
      else message.error(response.data.message);
    } catch {
      message.error("Erreur lors du chargement des statistiques");
    } finally {
      dispatch(HideLoading());
    }
  };

  const getBookingsPerDay = async () => {
    try {
      const response = await axiosInstance.get("/api/companys/get-bookings-per-day");
      if (response.data.success) {
        const formatted = Object.entries(response.data.data)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-14)
          .map(([date, billets]) => ({
            date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
            billets,
          }));
        setBookingData(formatted);
      }
    } catch {
      message.error("Erreur lors du chargement des données de réservation");
    }
  };

  const getUpcomingTrips = async () => {
    try {
      const response = await axiosInstance.get("/api/companys/get-company-trips");
      if (response.data.success) setUpcoming(response.data.data.upcoming.slice(0, 4));
    } catch {
      // silencieux : panneau secondaire
    }
  };

  const getRecentBookings = async () => {
    try {
      const response = await axiosInstance.get("/api/bookings/get-company-bookings");
      if (response.data.success) {
        const sorted = [...response.data.data]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
        setRecentBookings(sorted);
      }
    } catch {
      // silencieux : panneau secondaire
    }
  };

  const chartData = bookingData.slice(-period);
  const yesterday = bookingData.length >= 2 ? bookingData[bookingData.length - 2].billets : null;
  const ticketsDelta = yesterday !== null ? stats.ticketsToday - yesterday : null;

  const kpis = [
    {
      title: "Billets vendus aujourd'hui",
      value: stats.ticketsToday,
      icon: Ticket,
      color: "terracotta",
      delta: ticketsDelta,
    },
    {
      title: "Revenus du jour",
      value: `${stats.revenueToday.toLocaleString()} FCFA`,
      icon: Wallet,
      color: "brand-green",
      delta: null,
    },
    {
      title: "Remplissage moyen",
      value: `${stats.avgFillRate} %`,
      icon: Bus,
      color: "saffron",
      delta: null,
    },
    {
      title: "Bus disponibles",
      value: stats.busesCount,
      icon: Package,
      color: "terracotta",
      delta: null,
    },
  ];

  const colorClasses = {
    terracotta: "bg-terracotta/10 text-terracotta",
    "brand-green": "bg-brand-green/10 text-brand-green",
    saffron: "bg-saffron/15 text-saffron",
  };

  return (
    <main className="max-w-7xl mx-auto">
      {/* Cartes KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ title, value, icon: Icon, color, delta }, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider">
                  {title}
                </p>
                <p className="text-2xl font-extrabold text-anthracite leading-none mt-2">{value}</p>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}
              >
                <Icon size={18} />
              </div>
            </div>
            {delta !== null && (
              <div className="mt-3 flex items-center gap-1">
                {delta >= 0 ? (
                  <TrendingUp size={12} className="text-brand-green" />
                ) : (
                  <TrendingDown size={12} className="text-red-500" />
                )}
                <span
                  className={`text-[11px] font-medium ${delta >= 0 ? "text-brand-green" : "text-red-500"}`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta} vs hier
                </span>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-anthracite">Billets vendus</h2>
            <div className="flex gap-1 bg-offwhite p-0.5 rounded-lg">
              {[7, 14].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1 rounded-md transition-colors font-semibold ${
                    period === p
                      ? "bg-white text-terracotta shadow-sm"
                      : "text-anthracite/50 hover:text-anthracite"
                  }`}
                >
                  {p}j
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D85A30" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#D85A30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0ede8" vertical={false} />
                <XAxis dataKey="date" stroke="#8a8580" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a8580" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e5e0d8",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#1a1a1a", fontWeight: 600 }}
                  formatter={(value) => [`${value}`, "Billets"]}
                />
                <Area
                  type="monotone"
                  dataKey="billets"
                  stroke="#D85A30"
                  strokeWidth={2}
                  fill="url(#ca)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-anthracite mb-4">Prochains départs</h2>
          {upcoming.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-anthracite/40">
              Aucun départ à venir
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((trip) => {
                const pct = Math.round((trip.bookedSeats / trip.bus.capacity) * 100);
                const barColor = pct > 88 ? "#EF4444" : pct > 65 ? "#D85A30" : "#0F6E56";
                return (
                  <div key={trip.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-anthracite">
                          {trip.departureTime}
                        </span>
                        <span className="text-xs text-anthracite/50">
                          {trip.from} → {trip.to}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-anthracite/40">
                        {trip.bookedSeats}/{trip.bus.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className="text-right text-[10px] text-anthracite/40 mt-0.5">
                      {pct}% rempli · {trip.bus?.name}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
        <h2 className="text-base font-bold text-anthracite mb-1">Réservations récentes</h2>
        <p className="text-xs text-anthracite/40 mb-4">Dernières réservations enregistrées</p>
        {recentBookings.length === 0 ? (
          <div className="py-8 text-center text-sm text-anthracite/40">
            Aucune réservation pour l&apos;instant
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-anthracite font-semibold">
                    {b.user?.travelerProfile?.name || b.user?.email || "Voyageur"}
                  </span>
                  <ChevronRight size={12} className="text-anthracite/20 shrink-0" />
                  <span className="text-sm text-anthracite/60">
                    {b.trip?.from} → {b.trip?.to}
                  </span>
                  <span className="text-[11px] text-anthracite/40 bg-offwhite px-1.5 py-0.5 rounded font-mono">
                    {(b.seats || []).join(", ")}
                  </span>
                </div>
                <span className="text-sm font-mono font-semibold text-anthracite shrink-0">
                  {((b.trip?.price || 0) * (b.seats?.length || 0)).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CompanyHome;
