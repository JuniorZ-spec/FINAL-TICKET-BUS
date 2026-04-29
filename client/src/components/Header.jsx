import React from "react";
import { Bell, Search, User } from "lucide-react";
import { useSelector } from "react-redux"; // ← importer Redux

const Header = ({ title, role }) => {
  const { user } = useSelector((state) => state.users); // ← accéder au store

  return (
    <header className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Titre & Rôle */}
        <div className="pt-2 px-6">
          <h7 className="text-lg font-bold text-gray-900">{title}</h7>
          <p className="text-sm text-gray-500">Gérez votre plateforme de réservation</p>
        </div>

        {/* Barre de recherche + Notifications + User */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ height: "40px" }}
            />
          </div>

          <div className="flex items-center  space-x-3">
            <p className="text-xl font-semiblod pt-4 text-gray-400">
              {user?.role === "company" ? user?.companyName : user?.name}
            </p>

            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
