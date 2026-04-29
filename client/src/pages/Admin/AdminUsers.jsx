import { useEffect, useState } from "react";
import { Table, message, Button } from "antd";
import { useDispatch } from "react-redux";
import { User, ShieldCheck, UserX, Unlock, Lock, Ban, Mail } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import PageTitle from "../../components/PageTitle";

function AdminUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/get-all-users");
      if (response.data.success) {
        const formatted = response.data.data.map((user) => ({
          ...user,
          key: user.id,
        }));
        setUsers(formatted);
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
      const response = await axiosInstance.post("/api/admin/update-user-permissions", payload);
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

  const getStatusBadge = (isBlocked) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
      }`}
    >
      {isBlocked ? <Ban size={12} /> : <User size={12} />}
      {isBlocked ? "Bloqué" : "Actif"}
    </span>
  );

  const getRoleBadge = (role) => {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ";
    switch (role) {
      case "admin":
        return (
          <span className={base + "bg-purple-100 text-purple-700"}>
            <ShieldCheck size={12} />
            Admin
          </span>
        );
      case "company":
        return (
          <span className={base + "bg-yellow-100 text-yellow-700"}>
            <User size={12} />
            Compagnie
          </span>
        );
      default:
        return (
          <span className={base + "bg-blue-100 text-blue-700"}>
            <User size={12} />
            Utilisateur
          </span>
        );
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      render: (email) => (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="truncate max-w-[180px] text-sm text-gray-800">{email}</span>
        </div>
      ),
    },
    {
      title: "Nom",
      dataIndex: "name",
      render: (name) => (
        <span className="text-sm text-gray-700">{name || <i className="text-gray-400">–</i>}</span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "isBlocked",
      render: (isBlocked) => getStatusBadge(isBlocked),
    },
    {
      title: "Rôle",
      dataIndex: "role",
      render: (role) => getRoleBadge(role),
    },
    {
      title: "Actions",
      render: (_, user) => (
        <div className="flex gap-2 flex-wrap justify-center text-xs">
          {user.isBlocked ? (
            <Button
              type="primary"
              size="small"
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
              onClick={() => updateUserPermissions(user, "unblock-user")}
            >
              <Unlock size={14} />
              Débloquer
            </Button>
          ) : (
            <Button
              danger
              size="small"
              className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
              onClick={() => updateUserPermissions(user, "block-user")}
            >
              <Lock size={14} />
              Bloquer
            </Button>
          )}

          {user.role === "admin" ? (
            <Button
              size="small"
              className="bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1"
              onClick={() => updateUserPermissions(user, "remove-admin")}
            >
              <UserX size={14} />
              Retirer Admin
            </Button>
          ) : (
            <Button
              size="small"
              className="bg-blue-600 text-blue hover:bg-blue-700 flex items-center gap-1"
              onClick={() => updateUserPermissions(user, "make-admin")}
            >
              <ShieldCheck size={14} />
              Rendre Admin
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-2 pt-1 max-w-7xl mx-auto">
      <Table
        columns={columns}
        dataSource={users}
        pagination={{ pageSize: 5 }}
        className="rounded-lg border border-gray-200  mt-2"
      />
    </div>
  );
}

export default AdminUsers;
