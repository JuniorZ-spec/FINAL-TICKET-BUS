import { useEffect, useState } from "react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { message } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  BusFront,
  Building2,
  CalendarCheck2,
  DollarSign,
  LineChart,
  MapPin,
} from "lucide-react";

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
        const rawData = response.data.data;
  
        const formattedData = Object.entries(rawData).map(([date, reservations]) => ({
          date,
          reservations,
        }));
  
        setBookingData(formattedData);
        console.log("📊 bookingData transformé :", formattedData);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des données de réservation");
      console.error("❌ Erreur de chargement des données :", error);
    }
  };
  

  useEffect(() => {
    getDashboardStats();
    getBookingsPerDay();
  }, []);

  const dashboardItems = [
    {
      title: "Bus",
      count: stats.busesCount,
      icon: <BusFront size={30} />,
    },
    {
      title: "Stations",
      count: stats.stationsCount,
      icon: <MapPin size={30} />,
    },
    {
      title: "Trajets",
      count: stats.tripsCount,
      icon: <Building2 size={30} />,
    },
    {
      title: "Réservations",
      count: stats.reservationsCount,
      icon: <CalendarCheck2 size={30} />,
    },
    {
      title: "Revenus",
      count: `${stats.totalRevenue.toLocaleString()} FCFA`,
     
    },
   
  ];

  return (
    <div className="w-full"> 
    <main className="min-h-screen max-h-screen overflow-y-auto bg-gray-100 p-5">

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {dashboardItems.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 flex justify-between items-center"
        >
          <div>
            <p className="text-sm font-medium text-gray-500">{item.title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{item.count}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            {item.icon}
          </div>
        </div>
      ))}
    </div>

    {/* Graphique des réservations */}
    <div className="mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Réservations Récentes</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bookingData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderColor: "#d1d5db" }}
            labelStyle={{ color: "#374151" }}
            cursor={{ fill: "#f3f4f6" }}
          />
          <Bar
            dataKey="reservations"
            fill="#335eff"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </main> </div>
   
  );
}

export default CompanyHome;
