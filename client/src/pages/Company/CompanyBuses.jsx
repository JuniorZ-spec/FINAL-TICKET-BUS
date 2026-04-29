import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Table, Button, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Bus, User, Settings, Users } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import BusForm from "../../components/BusForm";
import PageTitle from "../../components/PageTitle";

function CompanyBuses() {
  const dispatch = useDispatch();
  const [showBusForm, setShowBusForm] = useState(false);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const { user } = useSelector((state) => state.users);

  const getBuses = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/buses/get-buses-company", {
        role: "company",
      });
      dispatch(HideLoading());

      if (response.data.success) {
        setBuses(response.data.data);
      } else {
        message.error(response.data.message || "Aucun bus trouvé");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur de chargement");
    }
  };

  const deleteBus = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/buses/delete-bus", { _id: id });
      dispatch(HideLoading());
      if (response.data.success) {
        message.success("Bus supprimé");
        getBuses();
      } else {
        message.error(response.data.message || "Échec de la suppression");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const columns = [
    {
      title: "Bus",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-800">{record.name || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <span className="text-gray-500">N°:</span> {record.number || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Capacité",
      dataIndex: "capacity",
      render: (capacity) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Users className="w-4 h-4 text-indigo-500" />
          <span>{capacity || "N/A"} places</span>
        </div>
      ),
    },
    {
      title: "Services",
      key: "services",
      render: (_, record) => (
        <div className="flex gap-2 flex-wrap">
          {record.airConditioning && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
              Climatisation
            </span>
          )}
          {record.wifi && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
              Wi-Fi
            </span>
          )}
          {!record.airConditioning && !record.wifi && (
            <span className="text-gray-400 text-xs">Aucun</span>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm
            title="Supprimer ce bus ?"
            onConfirm={() => deleteBus(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="default" danger icon={<DeleteOutlined />} className="hover:bg-red-50" />
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
    <div className="min-h-screen pt-2 py-6 px-4 bg-gray-100">
      <div className="  rounded-lg  w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedBus(null);
              setShowBusForm(true);
            }}
            className="bg-blue-600 text-white mx-6 px-3 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
          >
            Ajouter Bus
          </Button>
        </div>

        <Table
          className="rounded-lg border border-gray-200"
          columns={columns}
          dataSource={buses}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: true }}
        />

        {showBusForm && (
          <BusForm
            showBusForm={showBusForm}
            setShowBusForm={setShowBusForm}
            selectedBus={selectedBus}
            setSelectedBus={setSelectedBus}
            type={selectedBus ? "update" : "add"}
            getData={getBuses}
          />
        )}
      </div>
    </div>
  );
}

export default CompanyBuses;
