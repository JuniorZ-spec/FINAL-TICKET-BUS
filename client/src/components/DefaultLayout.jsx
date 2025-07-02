import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
    { name: "Accueil", path: "/admin" },
    { name: "Utilisateurs", path: "/admin/users" },
    { name: "Compagnies", path: "/admin/companys" },
    { name: "Schema", path: "/admin/schema" },
    { name: "Réservations", path: "/admin/bookings" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const companyMenu = [
    { name: "Accueil", path: "/company" },
    { name: "Trajets", path: "/company/trips" },
    { name: "Bus", path: "/company/buses" },
    { name: "Gares", path: "/company/stations" },
    { name: "Réservations", path: "/company/bookings" },
    { name: "Déconnexion", path: "/logout" },
  ];

  const menuToBeRendered =
    user?.role === "admin"
      ? adminMenu
      : user?.role === "company"
      ? companyMenu
      : userMenu;

  const activeRoute = window.location.pathname;

  return user?.role === "user" ? (
    // NAVBAR UTILISATEUR
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/90 text-gray-600 backdrop-blur-md py-2 px-6 fixed top-0 left-0 text-sm right-0 z-10 shadow-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg mr-3">
              <Ticket className="text-white" size={24} />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Ticket Minute
            </span>
          </div>

          <nav className="flex items-center space-x-2">
            {userMenu.slice(0, -1).map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-5 px-4 py-2.5 rounded-xl transition-all ${
                  activeRoute === item.path
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100/80"
                }`}
              >
                {getIcon(item.name)}
                <span className="font-medium">{item.name}</span>
              </button>
            ))}

            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2.5 rounded-xl hover:shadow-md transition-all flex items-center space-x-2 ml-2"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 mt-10 mx-auto w-full">
        <div className="bg-white">
          {children}
        </div>
      </main>
    </div>
  ) : (
    // SIDEBAR ADMIN/COMPANY
    <div className="h-screen flex overflow-hidden from-gray-50 to-gray-100">
      <div className={`bg-white/90 backdrop-blur-md h-full transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } fixed top-0 left-0 border-gray-200/50`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 bg-white rounded-full p-2 transform transition-all hover:scale-110 shadow-md hover:bg-gray-100 border border-gray-200 z-20"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-blue-600" />
          ) : (
            <ChevronLeft size={16} className="text-blue-600" />
          )}
        </button>

        <div className="p-4 h-full flex flex-col">
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } mb-8 pt-2`}
            onClick={() => navigate("/")}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
              <Ticket className="text-white" size={24} />
            </div>
            {!collapsed && (
              <span className="ml-3 font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                TICK MIN
              </span>
            )}
          </div>

          {!collapsed && (
            <div className="m-1 border-b border-gray-200/50 pb-1">
              <h3 className="text-gray-800 font-bold text-lg">
                {user?.role === "company" ? user?.companyName : user?.name}
              </h3>
              <p className="text-gray-500 text-sm font-medium capitalize mt-1">
                {user?.role}
              </p>
            </div>
          )}

          <nav className="flex-1 flex flex-col">
            {menuToBeRendered.slice(0, -1).map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-4 py-3 mb-1 transition-all duration-200 ease-in-out rounded-xl ${
                  activeRoute === item.path 
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100/80"
                } ${collapsed ? "justify-center" : "justify-start"}`}
              >
                <div className={activeRoute === item.path ? "text-white" : "text-blue-600"}>
                  {getIcon(item.name)}
                </div>
                {!collapsed && (
                  <span className="ml-3 font-medium">{item.name}</span> 
                )}
              </button>
            ))}
          </nav>

          <div className="mt-1 pt-1">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className={`flex items-center w-full px-4 py-3 transition-all duration-200 ease-in-out rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-md ${
                collapsed ? "justify-center" : "justify-start"
              }`}
            >
              <LogOut size={20} />
              {!collapsed && <span className="ml-3 font-medium">Déconnexion</span>}
            </button>
          </div>

        </div>
      </div>

      <div className={`flex-1 ${collapsed ? "ml-20" : "ml-64"} h-screen`}>
        <main className="h-full">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>


    </div>
  );
}

export default DefaultLayout;
