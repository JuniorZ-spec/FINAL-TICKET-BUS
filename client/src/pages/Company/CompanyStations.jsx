import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Popconfirm } from "antd";
import { MapPin, Building2, Pencil, Trash2 } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import StationForm from "../../components/StationForm";

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
      if (response.data.success) setStations(response.data.data);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur de chargement des stations");
    } finally {
      dispatch(HideLoading());
    }
  };

  const deleteStation = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.delete(`/api/stations/delete-station/${id}`);
      if (response.data.success) {
        message.success("Station supprimée");
        getStations();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur de suppression");
    } finally {
      dispatch(HideLoading());
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Gares</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">Gestion des gares et points de départ</p>
        </div>
        <button
          onClick={() => {
            setSelectedStation(null);
            setShowStationForm(true);
          }}
          className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
        >
          + Ajouter une gare
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Nom</th>
              <th className="px-5 py-3 font-semibold">Adresse</th>
              <th className="px-5 py-3 font-semibold">Ville</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-anthracite/40">
                  Aucune gare pour l&apos;instant.
                </td>
              </tr>
            ) : (
              stations.map((station) => (
                <tr key={station.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-anthracite">
                      <MapPin size={14} className="text-terracotta" />
                      {station.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">{station.address || "—"}</td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={13} className="text-anthracite/30" />
                      {station.city}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedStation(station);
                          setShowStationForm(true);
                        }}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <Popconfirm
                        title="Supprimer cette gare ?"
                        okText="Supprimer"
                        cancelText="Annuler"
                        onConfirm={() => deleteStation(station.id)}
                      >
                        <button
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
  );
}

export default CompanyStations;
