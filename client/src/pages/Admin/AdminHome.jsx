import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { message } from "antd";

import {
  Building2,
  CalendarCheck2,
  Wallet,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  Legend,
} from "recharts";

const PRIORITY_LABEL = { HIGH: "haute", NORMAL: "normale", LOW: "basse" };
const PRIORITY_CLASS = { HIGH: "text-red-500", NORMAL: "text-saffron", LOW: "text-anthracite/40" };

function AdminHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    companiesCount: 0,
    pendingCompaniesCount: 0,
    reservationsCount: 0,
    totalRevenue: 0,
    parcelsInCirculation: 0,
    parcelsAwaitingPickup: 0,
    openDisputes: 0,
    highPriorityDisputes: 0,
  });
  const [activity, setActivity] = useState([]);
  const [companiesRevenue, setCompaniesRevenue] = useState([]);
  const [pending, setPending] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const getDashboardStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-dashboard-stats");
      if (response.data.success) setStats((prev) => ({ ...prev, ...response.data.data }));
    } catch {
      message.error("Erreur lors du chargement des statistiques");
    } finally {
      dispatch(HideLoading());
    }
  };

  const getActivity = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/get-activity-per-day");
      if (response.data.success) {
        setActivity(
          response.data.data.map((d) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
            }),
          }))
        );
      }
    } catch {
      message.error("Erreur lors de la récupération de l'activité");
    }
  };

  const getCompaniesRevenue = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/get-companies-revenue");
      if (response.data.success) setCompaniesRevenue(response.data.data.slice(0, 6));
    } catch {
      message.error("Erreur lors de la récupération des revenus par compagnie");
    }
  };

  const getPending = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/get-pending-companies");
      if (response.data.success) setPending(response.data.data.slice(0, 4));
    } catch {
      // silencieux : panneau secondaire
    }
  };

  const getDisputes = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/get-recent-disputes");
      if (response.data.success) setDisputes(response.data.data);
    } catch {
      // silencieux : panneau secondaire
    }
  };

  useEffect(() => {
    getDashboardStats();
    getCompaniesRevenue();
    getActivity();
    getPending();
    getDisputes();
  }, []);

  const todayCount = activity.length ? activity[activity.length - 1].reservations : 0;
  const yesterdayCount = activity.length > 1 ? activity[activity.length - 2].reservations : 0;
  const trendPct =
    yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : null;

  const kpis = [
    {
      title: "Compagnies actives",
      value: stats.companiesCount,
      sub: stats.pendingCompaniesCount
        ? `${stats.pendingCompaniesCount} en attente de validation`
        : "Aucune demande en attente",
      icon: Building2,
      color: "terracotta",
    },
    {
      title: "Réservations du jour",
      value: todayCount,
      sub: trendPct !== null ? `${trendPct >= 0 ? "+" : ""}${trendPct} % vs hier` : "—",
      trend: trendPct !== null ? (trendPct >= 0 ? "up" : "down") : null,
      icon: CalendarCheck2,
      color: "brand-green",
    },
    {
      title: "Colis en circulation",
      value: stats.parcelsInCirculation,
      sub: stats.parcelsAwaitingPickup
        ? `${stats.parcelsAwaitingPickup} en attente de retrait`
        : "Aucun en attente de retrait",
      icon: Package,
      color: "saffron",
    },
    {
      title: "Revenus des trajets",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      sub: "chiffre d'affaires brut, hors commission",
      icon: Wallet,
      color: "brand-green",
    },
    {
      title: "Litiges ouverts",
      value: stats.openDisputes,
      sub: stats.highPriorityDisputes
        ? `${stats.highPriorityDisputes} priorité haute`
        : "Aucune priorité haute",
      icon: AlertTriangle,
      color: "red",
      alert: stats.openDisputes > 0,
    },
  ];

  const colorClasses = {
    terracotta: "bg-terracotta/10 text-terracotta",
    "brand-green": "bg-brand-green/10 text-brand-green",
    saffron: "bg-saffron/15 text-saffron",
    red: "bg-red-50 text-red-500",
  };

  return (
    <main className="max-w-7xl mx-auto">
      {/* Cartes KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {kpis.map(({ title, value, sub, icon: Icon, color, trend, alert }, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-5 ${alert ? "border-red-200" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
              >
                <Icon size={18} />
              </div>
              {trend === "up" && <TrendingUp size={16} className="text-brand-green" />}
              {trend === "down" && <TrendingDown size={16} className="text-red-500" />}
            </div>
            <p className="text-2xl font-extrabold text-anthracite leading-none">{value}</p>
            <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider mt-2">
              {title}
            </p>
            <p
              className={`text-xs mt-2 ${alert ? "text-red-500 font-semibold" : "text-anthracite/50"}`}
            >
              {sub}
            </p>
          </div>
        ))}
      </section>

      {/* Graphiques */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-anthracite">Activité — 14 derniers jours</h2>
          <p className="text-xs text-anthracite/40 mb-4">Réservations et colis enregistrés</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="reservations"
                  name="Réservations"
                  stroke="#D85A30"
                  fill="#D85A3022"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="colis"
                  name="Colis"
                  stroke="#0F6E56"
                  fill="#0F6E5615"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-anthracite mb-4">Revenus par compagnie</h2>
          {companiesRevenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-anthracite/40">
              Aucun revenu pour l&apos;instant
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={companiesRevenue}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="companyName" stroke="#8a8580" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#8a8580"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderColor: "#e5e0d8",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#1a1a1a", fontWeight: 600 }}
                    formatter={(value) => [`${value.toLocaleString("fr-FR")} FCFA`, "Revenus"]}
                    cursor={{ fill: "#faf7f2" }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                    {companiesRevenue.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? "#D85A30" : "#e5e0d8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* À traiter */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demandes de partenariat */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-anthracite/40" />
              <h3 className="text-sm font-bold text-anthracite">Demandes de partenariat</h3>
              {pending.length > 0 && (
                <span className="bg-saffron/15 text-saffron text-xs font-bold px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/admin/companys")}
              className="text-xs text-terracotta hover:text-terracotta-dark font-semibold flex items-center gap-1"
            >
              Voir tout <ChevronRight size={13} />
            </button>
          </div>
          {pending.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center px-4">
              <CheckCircle2 size={20} className="text-brand-green mb-2" />
              <p className="text-sm font-semibold text-anthracite">Aucune demande en attente</p>
              <p className="text-xs text-anthracite/40 mt-1">
                Toutes les demandes ont été traitées.
              </p>
            </div>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3.5 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-anthracite truncate">{p.companyName}</p>
                  <p className="text-xs text-anthracite/40 mt-0.5">
                    RCCM : {p.rccm || "—"} · {p.contactPhone}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => navigate("/admin/companys")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                    title="Traiter cette demande"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => navigate("/admin/companys")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    title="Traiter cette demande"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Litiges récents */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-anthracite/40" />
              <h3 className="text-sm font-bold text-anthracite">Litiges récents</h3>
              {disputes.length > 0 && (
                <span className="bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  {disputes.length}
                </span>
              )}
            </div>
          </div>
          {disputes.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center px-4">
              <CheckCircle2 size={20} className="text-brand-green mb-2" />
              <p className="text-sm font-semibold text-anthracite">Aucun litige ouvert</p>
              <p className="text-xs text-anthracite/40 mt-1">
                Rien à signaler pour l&apos;instant.
              </p>
            </div>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="px-5 py-3.5 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-semibold text-anthracite/40">
                        {d.reference}
                      </span>
                      <span className={`text-xs font-semibold ${PRIORITY_CLASS[d.priority]}`}>
                        Priorité {PRIORITY_LABEL[d.priority]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-anthracite truncate">{d.subject}</p>
                    <p className="text-xs text-anthracite/40 mt-0.5">
                      {d.company?.companyName} · Ouvert le{" "}
                      {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock size={12} className="text-anthracite/30" />
                    <span className="text-xs font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                      Ouvert
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminHome;
