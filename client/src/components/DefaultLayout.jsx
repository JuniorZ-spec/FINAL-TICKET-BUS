import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { axiosInstance } from "../helpers/axiosInstance";
import Header from "../components/Header"; // ajuste le chemin selon ton arborescence
import Footer from "../components/Footer";

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
  PackageSearch,
} from "lucide-react";

function DefaultLayout({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.users);
  const [pendingCompaniesCount, setPendingCompaniesCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;
    axiosInstance
      .get("/api/admin/get-pending-companies")
      .then((res) => {
        if (res.data.success) setPendingCompaniesCount(res.data.data.length);
      })
      .catch(() => {});
  }, [user?.role]);

  const getIcon = (name) => {
    const props = { size: 20 };
    switch (name) {
      case "Accueil":
      case "Vue d'ensemble":
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
    { name: "Vue d'ensemble", path: "/admin", group: "Principal" },
    { name: "Compagnies", path: "/admin/companys", group: "Gestion", badge: pendingCompaniesCount },
    { name: "Trajets", path: "/admin/trips", group: "Gestion" },
    { name: "Réservations", path: "/admin/bookings", group: "Gestion" },
    { name: "Utilisateurs", path: "/admin/users", group: "Opérations" },
    { name: "Schema", path: "/admin/schema", group: "Configuration" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const companyMenu = [
    { name: "Tableau de Bord", path: "/company", group: "Principal" },
    { name: "Trajets", path: "/company/trips", group: "Gestion" },
    { name: "Bus", path: "/company/buses", group: "Gestion" },
    { name: "Gares", path: "/company/stations", group: "Gestion" },
    { name: "Réservations", path: "/company/bookings", group: "Gestion" },
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

  const isGuest = !user;

  const guestNav = [
    { name: "Voyager", path: "/", icon: Bus },
    { name: "Colis", path: "/colis", icon: PackageSearch },
  ];

  // ✨ PARTIE 'USER' (+ invité) : NAVBAR FLOTTANTE SUR IMAGE DANS LA PAGE D'ACCUEIL
  return isGuest || user?.role === "user" ? (
    <div className="min-h-screen flex flex-col bg-offwhite">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: "linear-gradient(135deg, #D85A30 60%, #B84020 100%)" }}
              >
                <span className="text-white font-black text-lg tracking-tight">A</span>
              </div>
              <span className="flex items-baseline gap-1">
                <span className="font-black text-2xl tracking-tight text-anthracite">AliGo</span>
                <span className="text-sm font-semibold text-anthracite/50">.bj</span>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex gap-x-1 items-center">
              {isGuest
                ? guestNav.map((item) => {
                    const isActive = activeRoute === item.path;
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        className={`px-5 py-2.5 rounded-full text-base font-semibold transition-all ${
                          isActive
                            ? "text-white"
                            : "text-anthracite/60 hover:text-anthracite hover:bg-offwhite"
                        }`}
                        style={isActive ? { backgroundColor: "#D85A30" } : {}}
                      >
                        {item.name}
                      </button>
                    );
                  })
                : userMenu.slice(0, -1).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(item.path)}
                      className={`px-5 py-2.5 text-base font-medium transition-all duration-150 ${
                        activeRoute === item.path
                          ? "text-terracotta font-semibold"
                          : "text-anthracite/70 hover:text-terracotta"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {isGuest ? (
                <>
                  <button
                    onClick={() => navigate("/company/login")}
                    className="hidden lg:block text-sm text-terracotta hover:text-terracotta-dark font-medium px-2"
                  >
                    Espace compagnie
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="hidden sm:block text-base text-anthracite/60 hover:text-anthracite font-medium px-3 py-2"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="bg-brand-green text-white px-5 py-2.5 rounded-full text-base font-bold hover:opacity-90 transition-opacity"
                  >
                    S&apos;inscrire
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                  }}
                  className="flex items-center space-x-2 bg-terracotta text-white px-5 py-2.5 rounded-full text-base hover:bg-terracotta-dark transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Corps de page */}
      <main className="flex-1">{children}</main>

      <Footer />
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
          <div className="w-12 h-12 bg-terracotta rounded-lg flex items-center justify-center">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-anthracite">AliGo</h2>

              <p className="text-xs text-anthracite/50 capitalize">
                {user?.role === "company" ? "Compagnie" : "Administrateur"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mb-4 pt-4 pb-10 px-2 border-t border-gray-200 overflow-y-auto">
          {Array.from(new Set(menuToBeRendered.slice(0, -1).map((item) => item.group || ""))).map(
            (group) => (
              <div key={group} className="mb-4">
                {!collapsed && group && (
                  <p className="px-4 mb-1.5 text-[11px] font-bold tracking-widest uppercase text-anthracite/30">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {menuToBeRendered
                    .slice(0, -1)
                    .filter((item) => (item.group || "") === group)
                    .map((item, index) => {
                      const isActive = activeRoute === item.path;
                      return (
                        <button
                          key={index}
                          onClick={() => navigate(item.path)}
                          className={`relative w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-colors ${
                            isActive
                              ? "bg-terracotta/10 text-terracotta"
                              : "text-anthracite/60 hover:bg-offwhite hover:text-anthracite"
                          } ${collapsed ? "justify-center space-x-0" : ""}`}
                        >
                          <div className={isActive ? "text-terracotta" : "text-anthracite/50"}>
                            {getIcon(item.name)}
                          </div>

                          {!collapsed && (
                            <span
                              className={`text-sm font-semibold transition-colors flex-1 text-left ${
                                isActive ? "text-terracotta" : "text-anthracite/70"
                              }`}
                            >
                              {item.name}
                            </span>
                          )}

                          {!!item.badge && (
                            <span
                              className={`text-xs font-bold rounded-full flex items-center justify-center ${
                                collapsed
                                  ? "absolute top-1 right-1 w-2 h-2 p-0"
                                  : "min-w-[20px] h-5 px-1.5"
                              } bg-terracotta text-white`}
                            >
                              {!collapsed && item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )
          )}
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
