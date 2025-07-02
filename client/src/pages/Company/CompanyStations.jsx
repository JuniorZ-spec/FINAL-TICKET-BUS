import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Table, Button } from "antd";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import StationForm from "../../components/StationForm";
import PageTitle from "../../components/PageTitle";
import {
  MapPin,
  Pencil,
  Trash,
  PlusCircle,
  Building2,
} from "lucide-react";

function CompanyStations() {
  const dispatch = useDispatch();
  const [stations, setStations] = useState([]);
  const [showStationForm, setShowStationForm] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    getStations();
  }, []);

  const getStations = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-company-stations");
      dispatch(HideLoading());

      if (response.data.success) {
        setStations(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur de chargement des stations");
    }
  };

  const deleteStation = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.delete(`/api/stations/delete-station/${id}`);
      dispatch(HideLoading());

      if (response.data.success) {
        message.success("Station supprimée");
        getStations();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || "Erreur de suppression");
    }
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "name",
      render: (name) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: "Adresse",
      dataIndex: "address",
      render: (address) => (
        <span className="text-sm text-gray-700">{address}</span>
      ),
    },
    {
      title: "Ville",
      dataIndex: "city",
      render: (city) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{city}</span>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<Pencil size={16} />}
            onClick={() => {
              setSelectedStation(record);
              setShowStationForm(true);
            }}
          />
          <Button
            icon={<Trash size={16} />}
            danger
            onClick={() => deleteStation(record._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="p-6 bg-white shadow-md w-full max-w-6xl mx-auto rounded-lg overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <PageTitle title="Mes Stations" />
          <Button
            type="primary"
            icon={<PlusCircle size={18} />}
            onClick={() => {
              setSelectedStation(null);
              setShowStationForm(true);
            }}
          >
            Ajouter une Station
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={stations}
          rowKey="_id"
          pagination={{ pageSize: 6 }}
          bordered
          locale={{ emptyText: "Aucune station disponible." }}
        />

        {showStationForm && (
          <StationForm
            showStationForm={showStationForm}
            setShowStationForm={setShowStationForm}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            getData={getStations}
            type={selectedStation ? "edit" : "add"}
          />
        )}
      </div>
    </div>
  );
}

export default CompanyStations;
