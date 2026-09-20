import React, { useEffect, useState } from "react";
import {
  Search,
  Building2,
  FileText,
  User as UserIcon,
  Phone,
  Mail,
  Check,
  X,
  Ban,
  RotateCcw,
} from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";
import { useDispatch } from "react-redux";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { message, Form, Input, Modal } from "antd";

const STATUS_BADGE = {
  VERIFIED: { label: "Vérifiée", className: "bg-brand-green/10 text-brand-green" },
  SUSPENDED: { label: "Suspendue", className: "bg-red-50 text-red-600" },
  PENDING: { label: "En attente", className: "bg-saffron/15 text-saffron" },
  REJECTED: { label: "Refusée", className: "bg-gray-100 text-gray-500" },
};

export default function AdminCompanys() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("partners");
  const [companies, setCompanies] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [form] = Form.useForm();
  const [approveForm] = Form.useForm();

  const getCompanies = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-all-companies");
      if (response.data.success) setCompanies(response.data.data);
    } catch {
      message.error("Erreur lors du chargement des compagnies");
    } finally {
      dispatch(HideLoading());
    }
  };

  const getPending = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/get-pending-companies");
      if (response.data.success) setPending(response.data.data);
    } catch {
      message.error("Erreur lors du chargement des demandes");
    }
  };

  useEffect(() => {
    getCompanies();
    getPending();
  }, []);

  const createCompany = async () => {
    try {
      const values = await form.validateFields();
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/create-company", values);
      if (response.data.success) {
        message.success(`Compagnie ${response.data.data.company.companyName} créée`);
        setShowAddModal(false);
        form.resetFields();
        await getCompanies();
      } else {
        message.warning(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la création");
    } finally {
      dispatch(HideLoading());
    }
  };

  const approveCompany = async () => {
    try {
      const values = await approveForm.validateFields();
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/approve-company", {
        companyId: approveTarget.id,
        password: values.password,
      });
      if (response.data.success) {
        message.success("Compagnie validée");
        setApproveTarget(null);
        approveForm.resetFields();
        await Promise.all([getCompanies(), getPending()]);
      } else {
        message.warning(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la validation");
    } finally {
      dispatch(HideLoading());
    }
  };

  const rejectCompany = async (companyId) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/reject-company", { companyId });
      if (response.data.success) {
        message.success("Demande refusée");
        await getPending();
      }
    } catch {
      message.error("Erreur lors du refus");
    } finally {
      dispatch(HideLoading());
    }
  };

  const toggleSuspend = async (company) => {
    const newStatus = company.status === "SUSPENDED" ? "VERIFIED" : "SUSPENDED";
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/admin/set-company-status", {
        companyId: company.id,
        status: newStatus,
      });
      if (response.data.success) {
        message.success(newStatus === "SUSPENDED" ? "Compagnie suspendue" : "Compagnie réactivée");
        await getCompanies();
      }
    } catch {
      message.error("Erreur lors de la mise à jour");
    } finally {
      dispatch(HideLoading());
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Onglets */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
        {[
          { key: "partners", label: "Compagnies partenaires" },
          { key: "pending", label: "Demandes en attente", badge: pending.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "text-terracotta border-terracotta"
                : "text-anthracite/50 border-transparent hover:text-anthracite"
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="bg-terracotta text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "partners" ? (
        <>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite/30" />
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                <option value="">Tous les statuts</option>
                <option value="VERIFIED">Vérifiée</option>
                <option value="SUSPENDED">Suspendue</option>
              </select>
              <span className="text-sm text-anthracite/40">
                {filteredCompanies.length} compagnie(s)
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
            >
              + Ajouter une compagnie
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Compagnie</th>
                  <th className="px-5 py-3 font-semibold">RCCM / IFU</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Trajets</th>
                  <th className="px-5 py-3 font-semibold">Revenus générés</th>
                  <th className="px-5 py-3 font-semibold">Inscription</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-anthracite/40">
                      Aucune compagnie trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => {
                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.VERIFIED;
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 font-semibold text-anthracite">{c.companyName}</td>
                        <td className="px-5 py-3 text-anthracite/60 text-xs">
                          {c.rccm || "—"}
                          {c.ifu && <div>{c.ifu}</div>}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-anthracite/70">{c.tripsCount}</td>
                        <td className="px-5 py-3 text-anthracite/70">
                          {c.revenue.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td className="px-5 py-3 text-anthracite/50 text-xs">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => toggleSuspend(c)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              c.status === "SUSPENDED"
                                ? "text-brand-green hover:bg-brand-green/10"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {c.status === "SUSPENDED" ? (
                              <>
                                <RotateCcw size={13} /> Réactiver
                              </>
                            ) : (
                              <>
                                <Ban size={13} /> Suspendre
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
        </>
      ) : (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center text-anthracite/40">
              Aucune demande en attente.
            </div>
          ) : (
            pending.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-saffron/15 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-saffron" />
                    </div>
                    <div>
                      <h3 className="font-bold text-anthracite">{c.companyName}</h3>
                      <p className="text-xs text-anthracite/40">
                        Soumis le {new Date(c.requestedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-saffron/15 text-saffron">
                      En attente
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setApproveTarget(c)}
                      className="flex items-center gap-1.5 bg-brand-green text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-green-dark transition-colors"
                    >
                      <Check size={15} /> Valider
                    </button>
                    <button
                      onClick={() => rejectCompany(c.id)}
                      className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
                    >
                      <X size={15} /> Refuser
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider mb-2">
                      Identité légale
                    </p>
                    <div className="flex items-center gap-2 text-anthracite/70 mb-1">
                      <FileText size={14} className="text-anthracite/30" /> RCCM : {c.rccm || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-anthracite/70">
                      <FileText size={14} className="text-anthracite/30" /> IFU : {c.ifu || "—"}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider mb-2">
                      Contact
                    </p>
                    <div className="flex items-center gap-2 text-anthracite/70 mb-1">
                      <UserIcon size={14} className="text-anthracite/30" /> {c.contactName}
                    </div>
                    <div className="flex items-center gap-2 text-anthracite/70 mb-1">
                      <Phone size={14} className="text-anthracite/30" /> {c.contactPhone}
                    </div>
                    <div className="flex items-center gap-2 text-anthracite/70">
                      <Mail size={14} className="text-anthracite/30" /> {c.email}
                    </div>
                  </div>
                  {c.routesNote && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-anthracite/40 uppercase tracking-wider mb-2">
                        Lignes exploitées
                      </p>
                      <p className="text-anthracite/70">{c.routesNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL CREATION DIRECTE */}
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
          <Form.Item label="Nom de la compagnie" name="companyName" rules={[{ required: true }]}>
            <Input placeholder="Nom de la compagnie" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input placeholder="Adresse email" />
          </Form.Item>
          <Form.Item label="Mot de passe" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="Mot de passe" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL VALIDATION DEMANDE */}
      <Modal
        title={`Valider ${approveTarget?.companyName || ""}`}
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        onOk={approveCompany}
        okText="Créer le compte et valider"
        cancelText="Annuler"
        centered
      >
        <p className="text-sm text-anthracite/60 mb-4">
          Définis un mot de passe initial pour le compte de {approveTarget?.email}. La compagnie
          pourra le changer après sa première connexion.
        </p>
        <Form layout="vertical" form={approveForm}>
          <Form.Item
            label="Mot de passe initial"
            name="password"
            rules={[{ required: true, min: 8, message: "8 caractères minimum" }]}
          >
            <Input.Password placeholder="Mot de passe" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
