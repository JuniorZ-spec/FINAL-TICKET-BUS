import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Table, Button, Tabs } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Bus, MapPin, Calendar, CreditCard } from "lucide-react";
import moment from "moment";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import TripForm from "../../components/TripForm";

const { TabPane } = Tabs;

function CompanyTrips() {
  const dispatch = useDispatch();

  const [upcoming, setUpcoming] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [past, setPast] = useState([]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    getTrips();
  }, []);

  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-company-trips");
      dispatch(HideLoading());

      if (response.data.success) {
        const { upcoming = [], ongoing = [], past = [] } = response.data.data;
        setUpcoming(upcoming);
        setOngoing(ongoing);
        setPast(past);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur de chargement des trajets");
    }
  };

  const deleteTrip = async (id) => {
    try {
      dispatch(ShowLoading());
      await axiosInstance.delete(`/api/trips/delete-trip/${id}`);
      dispatch(HideLoading());
      message.success("Trajet supprimé");
      getTrips();
    } catch (error) {
      dispatch(HideLoading());
      message.error("Erreur de suppression");
    }
  };

  const getColumns = (editable = true) => [
    {
      title: "Trajet",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-gray-800">{record.from}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-gray-800">{record.to}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Stations",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <span className="text-gray-800">{record.departureStation?.name || "N/A"}</span>
          <br />
          <span className="text-gray-800">{record.arrivalStation?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Bus",
      dataIndex: "bus",
      render: (bus) => (
        <div className="flex items-center gap-2 text-sm">
          <Bus className="w-5 h-5 text-blue-500" />
          <span>{bus?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Date & Heure",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{moment(record.date).format("DD/MM/YYYY")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">🕒</span>
            <span>{record.departureTime || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Prix",
      dataIndex: "price",
      render: (price) => (
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-5 h-5 text-green-500" />
          <span>{price ? `${price.toLocaleString("fr-FR")} FCFA` : "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) =>
        editable ? (
          <div className="flex gap-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedTrip(record);
                setShowTripForm(true);
              }}
            />
            <Button icon={<DeleteOutlined />} danger onClick={() => deleteTrip(record.id)} />
          </div>
        ) : (
          <span className="text-gray-400">Indisponible</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen py-3 px-4">
      <div className="max-w-7xl mx-auto rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedTrip(null);
              setShowTripForm(true);
            }}
          >
            Ajouter un Trajet
          </Button>
        </div>

        <Tabs defaultActiveKey="1">
          <TabPane tab="À venir" key="1">
            <Table
              columns={getColumns(true)}
              dataSource={upcoming}
              rowKey="id"
              pagination={{ pageSize: 4 }}
              className="rounded-lg border"
            />
          </TabPane>
          <TabPane tab="En cours" key="2">
            <Table
              columns={getColumns(false)}
              dataSource={ongoing}
              rowKey="id"
              pagination={{ pageSize: 4 }}
              className="rounded-lg border"
            />
          </TabPane>
          <TabPane tab="Terminés" key="3">
            <Table
              columns={getColumns(false)}
              dataSource={past}
              rowKey="id"
              pagination={{ pageSize: 4 }}
              className="rounded-lg border"
            />
          </TabPane>
        </Tabs>

        {showTripForm && (
          <TripForm
            showTripForm={showTripForm}
            setShowTripForm={setShowTripForm}
            selectedTrip={selectedTrip}
            setSelectedTrip={setSelectedTrip}
            getData={getTrips}
            type={selectedTrip ? "edit" : "add"}
          />
        )}
      </div>
    </div>
  );
}

export default CompanyTrips;
