import React, { useEffect, useState } from "react";
import { Table, Button, Spin, message, Tooltip, Tag } from "antd";
import {
  BankOutlined,
  CarOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  MoneyCollectOutlined,
  EyeOutlined,
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

  const cellStyle = {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1f2937", // gris très foncé pour bon contraste
    padding: "12px 16px",
  };

  const columns = [
    {
      title: (
        <span className="flex items-center gap-1">
          <BankOutlined style={{ color: "#2f54eb" }} />
          <strong>Nom de la compagnie</strong>
        </span>
      ),
      dataIndex: "companyName",
      key: "companyName",
      render: (text) => (
        <span style={{ ...cellStyle, fontWeight: 700 }}>{text}</span>
      ),
      width: 260,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <CarOutlined style={{ color: "#13c2c2" }} />
          <strong>Trajets</strong>
        </span>
      ),
      dataIndex: "tripsCount",
      key: "tripsCount",
      align: "center",
      render: (value) => <Tag color="cyan" style={{ fontWeight: 700, fontSize: 16 }}>{value}</Tag>,
      width: 110,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <EnvironmentOutlined style={{ color: "#2f54eb" }} />
          <strong>Stations</strong>
        </span>
      ),
      dataIndex: "stationsCount",
      key: "stationsCount",
      align: "center",
      render: (value) => <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 16 }}>{value}</Tag>,
      width: 110,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <UsergroupAddOutlined style={{ color: "#52c41a" }} />
          <strong>Réservations</strong>
        </span>
      ),
      dataIndex: "reservationsCount",
      key: "reservationsCount",
      align: "center",
      render: (value) => <Tag color="green" style={{ fontWeight: 700, fontSize: 16 }}>{value}</Tag>,
      width: 130,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <MoneyCollectOutlined style={{ color: "#faad14" }} />
          <strong>Revenus (FCFA)</strong>
        </span>
      ),
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      render: (value) => (
        <span style={cellStyle}>
          {value.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
        </span>
      ),
      width: 180,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Tooltip title={`Voir détails de ${record.companyName}`}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => alert(`Détail pour ${record.companyName}`)}
            size="middle"
            style={{ fontWeight: 600 }}
          >
            Voir détails
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-5xl mx-auto rounded-md shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center gap-3">
        <BankOutlined style={{ fontSize: 30 }} />
        Statistiques des compagnies
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="companyId"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          bordered
          size="middle"
          scroll={{ x: 780 }}
          style={{
            backgroundColor: "white",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            color: "#1f2937",
          }}
        />
      )}
    </div>
  );
}

export default CompanyStats;
