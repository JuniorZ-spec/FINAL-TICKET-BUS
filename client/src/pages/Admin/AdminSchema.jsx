import React, { useEffect, useState } from "react";
import { Table, Button, Spin, message, Tooltip } from "antd";
import { Eye } from "lucide-react";
import {
  BankOutlined,
  CarOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import axios from "axios";

function CompanyStats() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/company-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        message.error("Échec du chargement des statistiques.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques :", error);
      message.error("Une erreur est survenue lors de la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPrice = (value) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(value) + " FCFA";

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1 font-semibold text-gray-700">
          <BankOutlined className="text-blue-600" />
          Nom de la compagnie
        </div>
      ),
      dataIndex: "companyName",
      render: (text) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: (
        <div className="flex items-center gap-1 font-semibold text-gray-700 justify-center">
          <CarOutlined className="text-cyan-600" />
          Trajets
        </div>
      ),
      dataIndex: "tripsCount",
      align: "center",
      render: (value) => (
        <span className="px-2 py-1 text-sm bg-cyan-100 text-cyan-800 rounded font-semibold">
          {value}
        </span>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1 font-semibold text-gray-700 justify-center">
          <EnvironmentOutlined className="text-blue-600" />
          Stations
        </div>
      ),
      dataIndex: "stationsCount",
      align: "center",
      render: (value) => (
        <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded font-semibold">
          {value}
        </span>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1 font-semibold text-gray-700 justify-center">
          <UsergroupAddOutlined className="text-green-600" />
          Réservations
        </div>
      ),
      dataIndex: "reservationsCount",
      align: "center",
      render: (value) => (
        <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded font-semibold">
          {value}
        </span>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1 font-semibold text-gray-700 justify-end">
          <MoneyCollectOutlined className="text-yellow-600" />
          Revenus
        </div>
      ),
      dataIndex: "totalRevenue",
      align: "right",
      render: (value) => (
        <span className="text-sm font-semibold text-gray-800">{formatPrice(value)}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Tooltip title={`Voir détails de ${record.companyName}`}>
          <Button
            type="primary"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => alert(`Détail pour ${record.companyName}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
          >
            Voir détails
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen max-w-6xl mx-auto">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="companyId"
          pagination={{ pageSize: 5 }}
          className="rounded-lg border border-gray-200"
        />
      )}
    </div>
  );
}

export default CompanyStats;
