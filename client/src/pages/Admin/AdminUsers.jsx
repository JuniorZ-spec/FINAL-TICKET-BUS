import { useEffect, useState } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { User, Lock, Unlock } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";

const STATUS_BADGE = {
  ACTIVE: { label: "Actif", className: "bg-brand-green/10 text-brand-green" },
  SUSPENDED: { label: "Suspendu", className: "bg-red-50 text-red-600" },
  PENDING_VERIFICATION: { label: "Non vérifié", className: "bg-saffron/15 text-saffron" },
};

function AdminUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);

  const getUsers = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/get-all-users");
      if (response.data.success) setUsers(response.data.data);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur serveur");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const toggleSuspend = async (user) => {
    const nextStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/update-user-permissions", {
        id: user.id,
        status: nextStatus,
      });
      if (response.data.success) {
        message.success(response.data.message);
        getUsers();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      dispatch(HideLoading());
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-anthracite">Utilisateurs</h1>
        <p className="text-sm text-anthracite/50 mt-0.5">Voyageurs inscrits sur la plateforme</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Utilisateur</th>
              <th className="px-5 py-3 font-semibold">Téléphone</th>
              <th className="px-5 py-3 font-semibold">Statut</th>
              <th className="px-5 py-3 font-semibold">Inscription</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-anthracite/40">
                  Aucun utilisateur pour l&apos;instant.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const badge = STATUS_BADGE[u.status] || STATUS_BADGE.ACTIVE;
                return (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-terracotta" />
                        </div>
                        <div>
                          <p className="font-semibold text-anthracite">
                            {u.travelerProfile?.name || "—"}
                          </p>
                          <p className="text-xs text-anthracite/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-anthracite/70">
                      {u.travelerProfile?.phone || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-anthracite/50 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleSuspend(u)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          u.status === "SUSPENDED"
                            ? "text-brand-green hover:bg-brand-green/10"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {u.status === "SUSPENDED" ? (
                          <>
                            <Unlock size={13} /> Débloquer
                          </>
                        ) : (
                          <>
                            <Lock size={13} /> Bloquer
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
