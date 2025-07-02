import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Table, Button, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";

import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import BusForm from "../../components/BusForm";
import PageTitle from "../../components/PageTitle";

function AdminBuses() {
  const dispatch = useDispatch();
  const [buses, setBuses] = useState([]);
  const [showBusForm, setShowBusForm] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  const getBuses = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/buses/get-all-buses");
      dispatch(HideLoading());
      if (response.data.success) {
        setBuses(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur lors du chargement des bus");
    }
  };

  const deleteBus = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/buses/delete-bus", { _id: id });
      dispatch(HideLoading());
      if (response.data.success) {
        message.success(response.data.message);
        getBuses();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    getBuses();
  }, []);

  const columns = [
    {
      title: "Nom du Bus",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Numéro",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Capacité",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) => <span>{capacity} sièges</span>,
    },
    {
      title: "Compagnie",
      dataIndex: ["company", "companyName"],
      key: "company",
      render: (companyName) => <span>{companyName || "N/A"}</span>,
    },
    {
      title: "Créé le",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedBus(record);
              setShowBusForm(true);
            }}
          />
          <Popconfirm
            title="Confirmer la suppression de ce bus ?"
            onConfirm={() => deleteBus(record._id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Liste des Bus" />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedBus(null);
            setShowBusForm(true);
          }}
        >
          Ajouter un Bus
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          dataSource={buses}
          rowKey="_id"
          pagination={{ pageSize: 6 }}
          bordered
        />
      </div>

      {showBusForm && (
        <BusForm
          showBusForm={showBusForm}
          setShowBusForm={setShowBusForm}
          type={selectedBus ? "update" : "add"}
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
          getData={getBuses}
        />
      )}
    </main>
  );
}

export default AdminBuses;
