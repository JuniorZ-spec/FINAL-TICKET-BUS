import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header"; // ajuste le chemin selon ton arborescence

import {
  Home,
  FileText,
  User,
  LogOut,
  Bus,
  Users,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Building2,
  MapPin,
  LayoutDashboard,
  Settings,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  Search,
  Bell,
} from "lucide-react";

function DefaultLayout({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.users);

  const getIcon = (name) => {
    const props = { size: 20 };
    switch (name) {
      case "Accueil":
        return <Home {...props} />;
      case "Réservations":
        return <FileText {...props} />;
      case "Profile":
        return <User {...props} />;
      case "Déconnexion":
        return <LogOut {...props} />;
      case "Trajets":
        return <LayoutDashboard {...props} />;
      case "Bus":
        return <Bus {...props} />;
      case "Gares":
        return <MapPin {...props} />;
      case "Utilisateurs":
        return <Users {...props} />;
      case "Compagnies":
        return <Building2 {...props} />;
      case "Schema":
        return <Settings {...props} />;
      default:
        return <Home {...props} />;
    }
  };

  const userMenu = [
    { name: "Accueil", path: "/" },
    { name: "Réservations", path: "/bookings" },
    { name: "Profile", path: "/profile" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const adminMenu = [
    { name: "Tableau de Bord", path: "/admin" },
    { name: "Utilisateurs", path: "/admin/users" },
    { name: "Compagnies", path: "/admin/companys" },
    { name: "Schema", path: "/admin/schema" },
    { name: "Réservations", path: "/admin/bookings" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const companyMenu = [
    { name: "Tableau de Bord", path: "/company" },
    { name: "Trajets", path: "/company/trips" },
    { name: "Bus", path: "/company/buses" },
    { name: "Gares", path: "/company/stations" },
    { name: "Réservations", path: "/company/bookings" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const getPageTitle = (path) => {
    const allMenus = [...adminMenu, ...companyMenu];
    const match = allMenus.find((item) => item.path === path);
    return match ? match.name : "Tableau de bord";
  };

  const menuToBeRendered =
    user?.role === "admin" ? adminMenu : user?.role === "company" ? companyMenu : userMenu;

  const activeRoute = window.location.pathname;

  // ✨ PARTIE 'USER' MODIFIÉE POUR NAVBAR FLOTTANTE SUR IMAGE DANS LA PAGE D'ACCUEIL
  return user?.role === "user" ? (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <h8 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Ticket Minute
              </h8>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex gap-x-20 items-center">
              {userMenu.slice(0, -1).map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`text-gray-700 hover:text-blue-600 font-medium transition-all duration-150 ${
                    activeRoute === item.path ? "text-blue-600 font-semibold" : ""
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-2 py-2 rounded-xl hover:shadow-lg transition-all"
                style={{ borderRadius: "12px", fontFamily: "Poppins, sans-serif" }}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Corps de page */}
      <main className="flex-1 bg-gray-100">{children}</main>
    </div>
  ) : (
    <div
      className="h-screen flex text-semiblod bg-gray-50"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* SIDEBAR */}
      <div
        className={`bg-white transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-59"
        } fixed top-0 left-0 h-full z-40 border-r border-gray-200`}
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className={`flex items-center space-x-4 p-6 cursor-pointer ${
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h7 className="text-lg font-bold text-gray-800">Ticket Min</h7>

              <p className="text-xs text-gray-500 capitalize">
                {user?.role === "company" ? "Compagnie" : "Administrateur"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mb-4  pt-4 pb-10 px-2 border-t border-gray-200">
          {menuToBeRendered.slice(0, -1).map((item, index) => {
            const isActive = activeRoute === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600 border-l-4 border-blue-600"
                    : "text-green-600"
                } ${collapsed ? "justify-center space-x-0" : ""}`}
                style={{ borderRadius: "12px" }}
              >
                <div className={`${isActive ? "text-blue-600" : "text-black"}`}>
                  {getIcon(item.name)}
                </div>

                {!collapsed && (
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-blue-600 font-semibold group-active:text-blue-700 focus:text-blue-700"
                        : "text-black"
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Déconnexion */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ${
              collapsed ? "justify-center space-x-0" : ""
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-55"
        } bg-gray-100 flex flex-col relative`}
      >
        {/* Header en fixed */}
        <div className="fixed top-0 left-0 right-0 z-10 ml-20 lg:ml-55 bg-white">
          <Header
            title={getPageTitle(activeRoute)}
            role={user?.role === "company" ? "Compagnie" : "Administrateur"}
          />
        </div>

        {/* Contenu de page avec padding top pour ne pas être caché sous le header */}
        <main className="p-4 mt-20 h-full overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default DefaultLayout;
