import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import BusForm from "../../components/BusForm";
import PageTitle from "../../components/PageTitle";
import { useEffect, useState } from "react";
import { message, Table, Button, Popconfirm } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../helpers/axiosInstance";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

function CompanyBuses() {
  const dispatch = useDispatch();
  const [showBusForm, setShowBusForm] = useState(false);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const { user } = useSelector((state) => state.users);

  const getBuses = async () => {
    try {
      dispatch(ShowLoading());
      console.log("🧾 Rôle de l'utilisateur :", user.role);
      console.log("👤 ID de l'utilisateur :", user._id);

      const response = await axiosInstance.post("/api/buses/get-buses-company", {
        role: "company",
      });

      dispatch(HideLoading());
      if (response.data.success) {
        setBuses(response.data.data);
      } else {
        message.error(response.data.message || "No buses found");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Error fetching buses");
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
        message.error(response.data.message || "Failed to delete bus");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Error deleting bus");
    }
  };

  const columns = [
    {
      title: "Numéro du Bus",
      dataIndex: "number",
      key: "number",
      render: (number) => number || "N/A",
    },
    {
      title: "Nom du Bus",
      dataIndex: "name",
      key: "name",
      render: (name) => name || "N/A",
    },
    {
      title: "Capacité",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) => capacity || "N/A",
    },
    {
      title: "Services",
      key: "services",
      render: (text, record) => (
        <span className="flex gap-2">
          {record.services?.airConditioning && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              Climatisation
            </span>
          )}
          {record.services?.wifi && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              Wi-Fi
            </span>
          )}
          {!record.services?.airConditioning && !record.services?.wifi && "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm
            title="Supprimer ce bus ?"
            onConfirm={() => deleteBus(record._id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            />
          </Popconfirm>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedBus(record);
              setShowBusForm(true);
            }}
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    getBuses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="p-6 bg-white shadow-md w-full max-w-6xl mx-auto rounded-lg overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <PageTitle title="Mes Bus" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowBusForm(true)}
          >
            Ajouter Bus
          </Button>
        </div>
  
        <div className="overflow-x-auto">
          <Table
            className="mt-4 rounded-lg border border-gray-200"
            columns={columns}
            dataSource={buses}
            rowKey="_id"
            pagination={{ pageSize: 5, showSizeChanger: true }}
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
      </div>
    </div>
  );
  
}

export default CompanyBuses;
