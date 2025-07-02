import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  Tag,
  Tooltip,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import PageTitle from "../../components/PageTitle";
import { axiosInstance } from "../../helpers/axiosInstance";

function AdminCompanies() {
  const dispatch = useDispatch();
  const [companies, setCompanies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form] = Form.useForm();

  const getCompanies = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/admin/get-all-companies");
      if (response.data.success) {
        setCompanies(response.data.data);
      } else {
        message.error("Échec du chargement des compagnies");
      }
    } catch (error) {
      message.error("Erreur serveur");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getCompanies();
  }, []);

  const createCompany = async () => {
    try {
      const values = await form.validateFields();
      dispatch(ShowLoading());

      const response = await axiosInstance.post("/api/admin/create-company", {
        companyName: values.companyName,
        email: values.email,
        password: values.password,
      });

      if (response.data.success) {
        message.success("Compagnie créée !");
        form.resetFields();
        setShowAddModal(false);
        getCompanies();
      } else {
        message.warning(response.data.message);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || "Erreur lors de la création"
      );
    } finally {
      dispatch(HideLoading());
    }
  };

  const toggleBlock = async (companyId) => {
    try {
      dispatch(ShowLoading());
      await axiosInstance.post("/api/admin/toggle-block-company", { companyId });
      getCompanies();
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur");
    } finally {
      dispatch(HideLoading());
    }
  };

  const deleteCompany = async (companyId) => {
    Modal.confirm({
      title: "Confirmation",
      content: "Voulez-vous vraiment supprimer cette compagnie ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          dispatch(ShowLoading());
          const response = await axiosInstance.post("/api/admin/delete-company", {
            companyId,
          });
          if (response.data.success) {
            message.success("Compagnie supprimée");
            getCompanies();
          } else {
            message.error(response.data.message);
          }
        } catch (error) {
          message.error("Erreur lors de la suppression");
        } finally {
          dispatch(HideLoading());
        }
      },
    });
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "companyName",
      key: "companyName",
      width: 250,
      render: (text) => (
        <span className="flex items-center gap-2 font-semibold text-blue-700 text-base">
          <BankOutlined style={{ fontSize: 18, color: "#2563EB" }} />
          {text}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 280,
      render: (email) => (
        <span className="flex items-center gap-2 text-gray-700 text-sm">
          <MailOutlined style={{ fontSize: 16, color: "#6B7280" }} />
          {email}
        </span>
      ),
    },
    {
      title: "Statut",
      key: "status",
      width: 110,
      render: (_, record) =>
        record.isBlocked ? (
          <Tag color="red" style={{ fontWeight: "600", fontSize: 14 }}>
            Bloqué
          </Tag>
        ) : (
          <Tag color="green" style={{ fontWeight: "600", fontSize: 14 }}>
            Actif
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Space size="small" wrap={false}>
          <Tooltip title={record.isBlocked ? "Débloquer" : "Bloquer"}>
            <Button
              type={record.isBlocked ? "primary" : "default"}
              icon={
                record.isBlocked ? (
                  <UnlockOutlined style={{ fontSize: 18 }} />
                ) : (
                  <LockOutlined style={{ fontSize: 18 }} />
                )
              }
              onClick={() => toggleBlock(record._id)}
              style={{ minWidth: 38, height: 38 }}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              danger
              icon={<DeleteOutlined style={{ fontSize: 18 }} />}
              onClick={() => deleteCompany(record._id)}
              style={{ minWidth: 38, height: 38 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-5">
          <PageTitle title="Gestion des Compagnies" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddModal(true)}
            size="large"
          >
            Ajouter
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={companies}
          rowKey="_id"
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: "Aucune compagnie trouvée." }}
          scroll={{ x: 700 }}
          bordered
          size="middle"
          style={{ borderRadius: 8 }}
        />
      </div>

      <Modal
        title="Nouvelle Compagnie"
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>,
          <Button key="submit" type="primary" onClick={createCompany}>
            Créer
          </Button>,
        ]}
        centered
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="companyName"
            label="Nom de la compagnie"
            rules={[{ required: true, message: "Ce champ est requis" }]}
          >
            <Input placeholder="Ex: Gozem Transport" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email requis" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input placeholder="email@exemple.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: "Mot de passe requis" }]}
          >
            <Input.Password placeholder="Mot de passe temporaire" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminCompanies;
