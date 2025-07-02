import { useEffect, useState } from "react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { useDispatch } from "react-redux";
import { message } from "antd";

import {
  Building2,
  BusFront,
  CalendarCheck2,
  DollarSign,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function AdminHome() {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    companiesCount: 0,
    tripsCount: 0,
    reservationsCount: 0,
    totalRevenue: 0,
    popularTrips: [],
  });

  const [companiesRevenue, setCompaniesRevenue] = useState([]);

  const getDashboardStats = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-dashboard-stats");
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

  const getCompaniesRevenue = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-companies-revenue");
      dispatch(HideLoading());
      if (response.data.success) {
        setCompaniesRevenue(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur lors de la récupération des revenus des compagnies");
    }
  };

  useEffect(() => {
    getDashboardStats();
    getCompaniesRevenue();
  }, []);

  const statsCards = [
    {
      title: "Compagnies",
      value: stats.companiesCount,
      icon: Building2,
      color: "indigo",
      change: "+3%",
      trend: "up",
    },
    {
      title: "Trajets",
      value: stats.tripsCount,
      icon: BusFront,
      color: "emerald",
      change: "-1%",
      trend: "down",
    },
    {
      title: "Réservations",
      value: stats.reservationsCount,
      icon: CalendarCheck2,
      color: "yellow",
      change: "+12%",
      trend: "up",
    },
    {
      title: "Revenus",
      value: `${stats.totalRevenue.toLocaleString()} F`,
      icon: DollarSign,
      color: "pink",
      change: "+5%",
      trend: "up",
    },
  ];

  return (
    <main
      className="min-h-screen max-w-7xl mx-auto bg-gray-50 p-6 font-sans flex flex-col"
      style={{ height: "calc(100vh - 2.5rem)" }}
    >
      {/* Titre */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6 select-none flex-shrink-0">
        Tableau de bord
      </h1>

      {/* Cartes statistiques */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 flex-shrink-0"
        style={{ minHeight: 110 }}
      >
        {statsCards.map(({ title, value, icon: Icon, color, change, trend }, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-300 p-3 flex flex-col justify-between cursor-default hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-lg bg-${color}-100 text-${color}-600 flex items-center justify-center`}
                style={{ width: 40, height: 40 }}
              >
                <Icon size={35} />
              </div>
              <div>
                <p className="text-md font-semibold text-gray-600 tracking-wide">{title}</p>
                <p className="mt-0.5 text-2xl font-extrabold text-gray-900">{value}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs font-semibold select-none">
              {trend === "up" ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
              )}
              <span
                className={`ml-1 ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {change} vs période précédente
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Tables section */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden flex-grow"
        style={{ minHeight: 0 }}
      >
        {/* Top trajets populaires */}
        <div
          className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm flex flex-col"
          style={{ minHeight: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 select-none flex-shrink-0">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Top trajets populaires
          </h2>
          <div
            className="overflow-auto flex-grow scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100"
            style={{ maxHeight: "calc(100% - 48px)" }}
          >
            <table className="w-full text-left text-gray-700 text-sm border-collapse">
              <thead className="bg-indigo-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 uppercase font-semibold text-indigo-700 border-b border-indigo-200">
                    Départ
                  </th>
                  <th className="py-2 px-3 uppercase font-semibold text-indigo-700 border-b border-indigo-200">
                    Arrivée
                  </th>
                  <th className="py-2 px-3 uppercase font-semibold text-indigo-700 border-b border-indigo-200 text-right">
                    Réservations
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...new Map(
                  stats.popularTrips.map((item) => [`${item.trip.from}-${item.trip.to}`, item])
                ).values()].map((tripData, i) => (
                  <tr
                    key={i}
                    className={`border-b cursor-pointer hover:bg-indigo-100 transition-colors
                    ${i % 2 === 0 ? "bg-white" : "bg-indigo-50"}`}
                  >
                    <td className="py-1.5 px-3 flex items-center gap-1 font-medium text-indigo-900">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {tripData.trip.from}
                    </td>
                    <td className="py-1.5 px-3 flex items-center gap-1 font-medium text-indigo-900">
                      <MapPin className="w-4 h-4 text-indigo-600 rotate-180" />
                      {tripData.trip.to}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-indigo-700 text-right">
                      {tripData.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenus des compagnies */}
        <div
          className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm flex flex-col"
          style={{ minHeight: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 select-none flex-shrink-0">
            <DollarSign className="w-5 h-5 text-pink-600" />
            Revenus des compagnies
          </h2>
          <div
            className="overflow-auto flex-grow scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100"
            style={{ maxHeight: "calc(100% - 48px)" }}
          >
            <table className="w-full text-left text-gray-700 text-sm border-collapse">
              <thead className="bg-pink-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 uppercase font-semibold text-pink-700 border-b border-pink-200">
                    Compagnie
                  </th>
                  <th className="py-2 px-3 uppercase font-semibold text-pink-700 border-b border-pink-200 text-right">
                    Revenu
                  </th>
                </tr>
              </thead>
              <tbody>
                {companiesRevenue.map((company, i) => (
                  <tr
                    key={i}
                    className={`border-b cursor-pointer hover:bg-pink-100 transition-colors
                    ${i % 2 === 0 ? "bg-white" : "bg-pink-50"}`}
                  >
                    <td className="py-1.5 px-3 flex items-center gap-1 font-medium text-pink-900">
                      <DollarSign className="w-4 h-4" />
                      {company.companyName}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-pink-600 text-right">
                      {company.revenue.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminHome;
