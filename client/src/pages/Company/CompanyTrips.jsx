import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Table, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Bus, MapPin, Calendar, CreditCard } from "lucide-react";
import moment from "moment";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import TripForm from "../../components/TripForm";
import PageTitle from "../../components/PageTitle";

function CompanyTrips() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const [trips, setTrips] = useState([]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    getTrips();
  }, [user]);

  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/trips/get-company-trips", {
        role: "company",
      });
      dispatch(HideLoading());

      if (response.data.success) {
        setTrips(response.data.data);
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

  const formatStations = (stations) =>
    Array.isArray(stations) && stations.length > 0
      ? stations.map((st) => st.name).join(", ")
      : "N/A";

  const columns = [
    {
      title: "Trajet",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-green-600" />
            <span className="text-gray-800">{record.from}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span className="text-gray-800">{record.to}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Stations",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-700">Départ :</span>
            <span className="text-gray-800">{formatStations(record.departureStations)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-700">Arrivée :</span>
            <span className="text-gray-800">{formatStations(record.arrivalStations)}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Bus",
      dataIndex: "bus",
      render: (bus) => (
        <div className="flex items-center gap-2 text-sm">
          <Bus className="w-4 h-4 text-gray-500" />
          <span>{bus?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{moment(date).format("DD/MM/YYYY")}</span>
        </div>
      ),
    },
    {
      title: "Prix",
      dataIndex: "price",
      render: (price) => (
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <span>{price ? `${price.toLocaleString("fr-FR")} FCFA` : "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedTrip(record);
              setShowTripForm(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteTrip(record._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="p-6 bg-white shadow-md w-full max-w-6xl mx-auto rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <PageTitle title="Mes Trajets" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedTrip(null);
              setShowTripForm(true);
            }}
          >
            Ajouter un Trajet
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={trips}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          className="rounded-lg border border-gray-200"
        />

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
