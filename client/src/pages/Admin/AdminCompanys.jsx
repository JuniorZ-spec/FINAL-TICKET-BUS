import React, { useEffect, useState } from "react";
import { Eye, Edit2, Trash2, Filter, Search, MapPin, Star, Mail } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { message, Form, Input, Modal } from "antd";
import { useNavigate } from "react-router-dom";

export default function AdminCompanies() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form] = Form.useForm();

  const getCompanies = async () => {
    try {
      dispatch(ShowLoading());
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/api/admin/company-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCompanies(response.data.data);
      } else {
        message.error("Erreur lors du chargement des compagnies");
      }
    } catch (error) {
      message.error("Erreur serveur");
    } finally {
      dispatch(HideLoading());
    }
  };

  const createCompany = async () => {
    try {
      const values = await form.validateFields();
      dispatch(ShowLoading());

      const response = await axiosInstance.post("/api/admin/create-company", {
        email: values.email,
        password: values.password,
        companyName: values.companyName,
        name: values.companyName, // ✅ ajoute ceci
      });

      if (response.data.success) {
        message.success(`Compagnie ${response.data.data.companyName} créée !`);
        setShowAddModal(false);
        form.resetFields();
        await getCompanies();
      } else {
        message.warning(response.data.message);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.debug ||
        "Erreur lors de la création";
      message.error(errorMessage);
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getCompanies();
  }, []);

  const filteredCompanies = Array.isArray(companies)
    ? companies.filter((company) =>
        company.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div
      className="space-y-1.5 px-2 pt-1 lg:px-16  min-h-screen"
      style={{ borderRadius: "8px", fontFamily: "Poppins, sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex  md:flex-row px-2">
        <button
          onClick={() => setShowAddModal(true)}
          style={{ borderRadius: "8px", fontFamily: "Poppins, sans-serif" }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          type="button"
        >
          + Nouvelle Compagnie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredCompanies.length === 0 && (
          <p className="text-center col-span-full text-gray-500">Aucune compagnie trouvée.</p>
        )}

        {filteredCompanies.map((company) => (
          <div
            key={company.companyId}
            className="bg-white rounded-xl  border border-gray-200 p-4 hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[12rem]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-4xl select-none">
                  🚌
                </div>
                <div>
                  <h3 className="text-1xl font-bold text-gray-900 leading-tight">
                    {company.companyName}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 truncate">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                  <span
                    className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                      company.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {company.isBlocked ? "Inactif" : "Actif"}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 text-gray-500">
                <button
                  onClick={() => navigate(`/admin/companies/${company.companyId}`)}
                  aria-label={`Voir détails de ${company.companyName}`}
                  className="p-1 rounded hover:text-blue-600 transition-colors"
                  type="button"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  aria-label={`Modifier ${company.companyName}`}
                  className="p-1 rounded hover:text-green-600 transition-colors"
                  type="button"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  aria-label={`Supprimer ${company.companyName}`}
                  className="p-1 rounded hover:text-red-600 transition-colors"
                  type="button"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-gray-700 text-sm font-medium">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                Trajets :<span className="ml-2 font-semibold">{company.tripsCount ?? 0}</span>
              </div>

              <div className="flex items-center gap-2 col-span-2 truncate">
                <Star className="w-5 h-5 text-gray-400 flex-shrink-0" />
                Revenus :
                <span className="ml-2 font-bold text-green-600 whitespace-nowrap">
                  {company.totalRevenue?.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREATION */}
      <Modal
        title="Créer une nouvelle compagnie"
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onOk={createCompany}
        okText="Créer"
        cancelText="Annuler"
        centered
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Nom de la compagnie" name="companyName">
            <Input placeholder="Nom de la compagnie" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input placeholder="Adresse email" />
          </Form.Item>

          <Form.Item label="Adresse" name="address">
            <Input placeholder="Adresse de la compagnie" />
          </Form.Item>

          <Form.Item label="Téléphone" name="phone">
            <Input placeholder="Numéro de téléphone" />
          </Form.Item>

          <Form.Item label="Mot de passe" name="password">
            <Input.Password placeholder="Mot de passe" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
