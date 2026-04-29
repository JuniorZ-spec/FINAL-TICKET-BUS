import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Table, Button } from "antd";
import { MapPin, Pencil, Trash, PlusCircle, Building2 } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import StationForm from "../../components/StationForm";
import PageTitle from "../../components/PageTitle";

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
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <MapPin className="w-4 h-4 text-blue-600" />
          {name}
        </div>
      ),
    },
    {
      title: "Adresse",
      dataIndex: "address",
      render: (address) => <span className="text-sm text-gray-600">{address || "—"}</span>,
    },
    {
      title: "Ville",
      dataIndex: "city",
      render: (city) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Building2 className="w-4 h-4 text-gray-500" />
          {city}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="default"
            icon={<Pencil size={16} />}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
            onClick={() => {
              setSelectedStation(record);
              setShowStationForm(true);
            }}
          />
          <Button
            type="default"
            danger
            icon={<Trash size={16} />}
            className="hover:bg-red-50"
            onClick={() => deleteStation(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pt-1 ">
      <div className="p-2  rounded-lg  w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusCircle size={18} />}
            onClick={() => {
              setSelectedStation(null);
              setShowStationForm(true);
            }}
            className="bg-blue-600 text-white px-2py-2 rounded-md hover:bg-blue-700 shadow-md"
          >
            Ajouter une Station
          </Button>
        </div>

        <Table
          className="rounded-lg border pt-1 border-gray-200"
          columns={columns}
          dataSource={stations}
          rowKey="id"
          pagination={{ pageSize: 6 }}
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
