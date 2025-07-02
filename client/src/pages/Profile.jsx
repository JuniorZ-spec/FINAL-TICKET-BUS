import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";


function Profile() {
  const { user } = useSelector((state) => state.users); // Récupérer l'utilisateur connecté depuis Redux
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fonction pour modifier le mot de passe
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/users/change-password", {
        userId: user._id,
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success("Mot de passe modifié avec succès !");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la modification du mot de passe.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Profil Utilisateur</h1>

        {/* Informations de l'utilisateur */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Informations Personnelles</h2>
          <div className="space-y-2">
            <p className="text-gray-600"><strong>Nom :</strong> {user?.name}</p>
            <p className="text-gray-600"><strong>Email :</strong> {user?.email}</p>
          </div>
        </div>

        {/* Formulaire de modification du mot de passe */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Modifier le Mot de Passe</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-700">Mot de Passe Actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Nouveau Mot de Passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Confirmer le Nouveau Mot de Passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-500 transition duration-300"
            >
              {loading ? "Chargement..." : "Modifier le Mot de Passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;