import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2 } from "lucide-react";

function RoleSelector() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (role === "user") {
      navigate("/login");
    } else if (role === "company") {
      navigate("/company/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4">
      {/* Titre principal */}
      <div className="text-center mb-12">
        <span className="text-3xl font-bold text-black text-center mb-10" style={{ fontFamily: 'Poppins, sans-serif' }}> 
          Bienvenue sur TicketMinute
        </span>
        <p className="text-lg text-gray-600 ">
          Réservez vos billets de bus en toute simplicité
        </p>
      </div>

      {/* Cartes */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Utilisateur */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
          <div className="flex flex-col items-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Users className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Voyageurs
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Réservez vos billets et planifiez votre voyage
            </p>
            <button
              onClick={() => handleRoleSelect("user")} style={{ borderRadius: '12px' }}
              className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Espace Voyageur
            </button>
          </div>
        </div>

        {/* Compagnie */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
          <div className="flex flex-col items-center">
            <div className="bg-emerald-100 p-4 rounded-full">
              <Building2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h5 className="mt-6 text-2xl font-bold text-gray-900">
              Compagnies
            </h5>
            <p className="mt-2 text-gray-600 text-center">
              Gérez vos services et vos réservations
            </p>
            <button
              onClick={() => handleRoleSelect("company")} style={{ borderRadius: '12px' }}
              className="mt-8 bg-emerald-600 hover:bg-emerald-700  text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200" 
            >
              Espace Compagnie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelector;
