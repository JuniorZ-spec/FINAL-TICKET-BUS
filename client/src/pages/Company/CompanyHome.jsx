import { useEffect, useState } from "react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { message } from "antd";
import { BusFront, Building2, CalendarCheck2, DollarSign, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function CompanyHome() {
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    busesCount: 0,
    stationsCount: 0,
    tripsCount: 0,
    reservationsCount: 0,
    totalRevenue: 0,
    fillRate: 0,
  });

  const [bookingData, setBookingData] = useState([]);

  useEffect(() => {
    getDashboardStats();
    getBookingsPerDay();
  }, []);

  const getDashboardStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-dashboard-stats");
      dispatch(HideLoading());
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur lors du chargement des statistiques");
    }
  };

  const getBookingsPerDay = async () => {
    try {
      const response = await axiosInstance.get("/api/companys/get-bookings-per-day");
      if (response.data.success) {
        const formattedData = Object.entries(response.data.data).map(([date, reservations]) => ({
          date,
          reservations,
        }));
        setBookingData(formattedData);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des données de réservation");
    }
  };

  const dashboardItems = [
    {
      title: "Bus disponibles",
      value: stats.busesCount,
      icon: BusFront,
      color: "bg-indigo-500",
    },
    {
      title: "Stations enregistrées",
      value: stats.stationsCount,
      icon: MapPin,
      color: "bg-teal-500",
    },
    {
      title: "Trajets enregistrés",
      value: stats.tripsCount,
      icon: Building2,
      color: "bg-orange-400",
    },
    {
      title: "Réservations Totales",
      value: stats.reservationsCount,
      icon: CalendarCheck2,
      color: "bg-yellow-400",
    },
    {
      title: "Revenus totaux",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      icon: DollarSign,
      color: "bg-pink-500",
    },
  ];

  return (
    <main className="min-h-screen max-w-7xl mx-auto pt-1 px-4 bg-gray-100 font-sans">
      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {dashboardItems.map(({ title, value, icon: Icon, color }, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">{title}</span>
              <span className="text-2xl font-bold text-gray-800">{value}</span>
            </div>
            <div className={`${color} w-11 h-11 rounded-lg flex items-center justify-center`}>
              <Icon className="text-white w-5 h-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Graphique des Réservations */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Réservations Récentes</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", borderColor: "#d1d5db" }}
                labelStyle={{ color: "#374151", fontWeight: 900 }}
                formatter={(value) => [`${value}`, "Réservations"]}
                cursor={{ fill: "#f3f4f6" }}
              />
              <defs>
                <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Bar dataKey="reservations" fill="url(#colorReservations)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

export default CompanyHome;
