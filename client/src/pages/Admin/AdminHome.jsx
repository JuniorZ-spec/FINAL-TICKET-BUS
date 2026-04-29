import { useEffect, useState } from "react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { message } from "antd";

import { Building2, BusFront, CalendarCheck2, DollarSign, MapPin, Star } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function AdminHome() {
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    companiesCount: 0,
    tripsCount: 0,
    reservationsCount: 0,
    totalRevenue: 0,
    popularTrips: [],
    revenueByDay: [],
  });

  const [companiesData, setCompaniesData] = useState([]);

  const getDashboardStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-dashboard-stats");
      dispatch(HideLoading());
      if (response.data.success) {
        setStats((prev) => ({ ...prev, ...response.data.data }));
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur lors du chargement des statistiques");
    }
  };

  const getRevenueByDay = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-bookings-per-day");
      dispatch(HideLoading());
      if (response.data.success) {
        const formattedData = Object.entries(response.data.data).map(([date, count]) => ({
          date,
          count,
        }));
        setStats((prev) => ({
          ...prev,
          revenueByDay: formattedData,
        }));
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur lors de la récupération des réservations journalières");
    }
  };

  const getCompaniesData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-companies-reservations");
      dispatch(HideLoading());
      if (response.data.success) {
        setCompaniesData(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur lors de la récupération des réservations des compagnies");
    }
  };

  useEffect(() => {
    getDashboardStats();
    getCompaniesData();
    getRevenueByDay();
  }, []);

  const getChangeColor = (type) => {
    switch (type) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const COLORS = PIE_COLORS;

  const pieData = companiesData.map((company) => ({
    name: company.companyName,
    value: company.bookingsCount || 0,
  }));

  return (
    <main
      className="min-h-screen max-w-7xl mx-auto px-7 font-sans flex flex-col"
      style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", fontFamily: "Poppins, sans-serif" }}
    >
      {/* Cartes récapitulatives */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {[
          {
            title: "Compagnies Actives",
            value: stats.companiesCount,
            change: "+3% ce mois",
            changeType: "increase",
            icon: Building2,
            color: "bg-indigo-500",
          },
          {
            title: "Trajets disponibles",
            value: stats.tripsCount,
            change: "-1% ce mois",
            changeType: "decrease",
            icon: BusFront,
            color: "bg-emerald-500",
          },
          {
            title: "Réservations Totales",
            value: stats.reservationsCount,
            change: "+12% ce mois",
            changeType: "increase",
            icon: CalendarCheck2,
            color: "bg-yellow-400",
          },
          {
            title: "Revenus Totaux",
            value: `${stats.totalRevenue.toLocaleString()} F`,
            change: "+5% ce mois",
            changeType: "increase",
            icon: DollarSign,
            color: "bg-pink-500",
          },
          {
            title: "Trajets populaires",
            value: stats.popularTrips.length,
            change: "+2 ce mois",
            changeType: "increase",
            icon: MapPin,
            color: "bg-orange-400",
          },
          {
            title: "",
            value: "",
            change: "",
            changeType: "increase",
            icon: Star,
            color: "bg-yellow-500",
          },
        ].map(({ title, value, icon: Icon, color, change, changeType }, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 hover:shadow-md transition-shadow duration-200 flex items-center justify-between"
            style={{ height: 120 }}
          >
            <div className="flex flex-col justify-center gap-[7px]">
              <span className="text-sm font-medium text-gray-600 leading-tight">{title}</span>
              <span
                className={`text-[22px] font-bold leading-tight ${title === "Réservations Totales" && Number(value) === 0 ? "text-gray-400" : "text-gray-900"}`}
              >
                {value}
              </span>
              <span className={`text-xs ${getChangeColor(changeType)} leading-tight`}>
                {change}
              </span>
            </div>
            <div className={`${color} w-11 h-11 rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </section>

      {/* Graphiques */}
      <section className="grid grid-cols-2 gap-3 flex-grow">
        {/* BarChart */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 shadow-md flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Réservations des 7 derniers jours
          </h2>
          <div className="h-72 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Array.isArray(stats.revenueByDay) ? stats.revenueByDay : []}
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  formatter={(value) => [`${value}`, "Réservations"]}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} barSize={55} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 shadow-md flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Répartition des réservations par compagnie
          </h2>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 px-4">
            {pieData.map((seg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></span>
                  <span className="text-sm text-gray-700 font-medium">{seg.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {seg.value.toLocaleString()} réservation{seg.value > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminHome;
