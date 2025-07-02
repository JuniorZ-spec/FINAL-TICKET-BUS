import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Modal } from "antd";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import PageTitle from "../../components/PageTitle";
import { axiosInstance } from "../../helpers/axiosInstance";
import {
  ShieldCheck,
  Ban,
  User,
  UserCheck,
  UserX,
  Unlock,
  Lock,
} from "lucide-react";

function AdminUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/get-all-users");
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur serveur");
    } finally {
      dispatch(HideLoading());
    }
  };

  const updateUserPermissions = async (user, action) => {
    try {
      let payload = { ...user };

      if (action === "make-admin") payload.role = "admin";
      else if (action === "remove-admin") payload.role = "user";
      else if (action === "block-user") payload.isBlocked = true;
      else if (action === "unblock-user") payload.isBlocked = false;

      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/users/update-user-permissions", payload);
      dispatch(HideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        getUsers();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  // Badge statuts
  const renderStatusTag = (isBlocked) => {
    if (isBlocked)
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded">
          <Ban size={16} />
          Bloqué
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded">
        <UserCheck size={16} />
        Actif
      </span>
    );
  };

  // Badge rôles
  const renderRoleTag = (role) => {
    if (role === "admin")
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded">
          <ShieldCheck size={16} />
          Admin
        </span>
      );
    if (role === "company")
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1 rounded">
          <User size={16} />
          Compagnie
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded">
        <User size={16} />
        Utilisateur
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <PageTitle title="Gestion des Utilisateurs" />

        <div className="overflow-x-auto mt-6">
          <table className="w-full max-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase border-b border-gray-300">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase border-b border-gray-300 w-36">
                  Statut
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase border-b border-gray-300 w-36">
                  Rôle
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 uppercase border-b border-gray-300 w-72">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500 text-base">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-gray-900 font-medium text-base">{user.email}</td>
                    <td className="px-6 py-4">{renderStatusTag(user.isBlocked)}</td>
                    <td className="px-6 py-4">{renderRoleTag(user.role)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-nowrap gap-2 justify-center">
                        {user.isBlocked ? (
                          <button
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1 rounded whitespace-nowrap"
                            onClick={() => updateUserPermissions(user, "unblock-user")}
                            title="Débloquer l'utilisateur"
                          >
                            <Unlock size={16} />
                            Débloquer
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1 rounded whitespace-nowrap"
                            onClick={() => updateUserPermissions(user, "block-user")}
                            title="Bloquer l'utilisateur"
                          >
                            <Lock size={16} />
                            Bloquer
                          </button>
                        )}

                        {user.role === "admin" ? (
                          <button
                            className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-3 py-1 rounded whitespace-nowrap"
                            onClick={() => updateUserPermissions(user, "remove-admin")}
                            title="Retirer le rôle admin"
                          >
                            <UserX size={16} />
                            Retirer Admin
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1 rounded whitespace-nowrap"
                            onClick={() => updateUserPermissions(user, "make-admin")}
                            title="Donner le rôle admin"
                          >
                            <ShieldCheck size={16} />
                            Rendre Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal (optionnel) */}
      <Modal
        title="Détails de l'utilisateur"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedUser && (
          <div>
            <p>Email : {selectedUser.email}</p>
            <p>Rôle : {selectedUser.role}</p>
            <p>Statut : {selectedUser.isBlocked ? "Bloqué" : "Actif"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminUsers;
