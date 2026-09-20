import React from "react";
import { Bell, Search, User } from "lucide-react";
import { useSelector } from "react-redux"; // ← importer Redux

const Header = ({ title, role }) => {
  const { user } = useSelector((state) => state.users); // ← accéder au store

  return (
    <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between py-3">
        {/* Titre & Rôle */}
        <div className="px-6">
          <h2 className="text-lg font-bold text-anthracite">{title}</h2>
          <p className="text-sm text-anthracite/50">
            {user?.role === "company"
              ? "Tableau de bord compagnie"
              : "Tableau de bord opérationnel"}{" "}
            · {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Barre de recherche + Notifications + User */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-4 pr-12 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              style={{ height: "40px" }}
            />
          </div>

          <div className="flex items-center space-x-3">
            <p className="text-sm font-semibold text-anthracite/70">
              {user?.role === "company" ? user?.companyName : user?.name}
            </p>

            <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
