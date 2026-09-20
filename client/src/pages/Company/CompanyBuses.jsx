import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Popconfirm } from "antd";
import { Bus, Users, Pencil, Trash2, Wind, Wifi } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import BusForm from "../../components/BusForm";

function CompanyBuses() {
  const dispatch = useDispatch();
  const [showBusForm, setShowBusForm] = useState(false);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);

  const getBuses = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/buses/get-buses-company");
      if (response.data.success) setBuses(response.data.data);
      else message.error(response.data.message || "Aucun bus trouvé");
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur de chargement");
    } finally {
      dispatch(HideLoading());
    }
  };

  const deleteBus = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/buses/delete-bus", { _id: id });
      if (response.data.success) {
        message.success("Bus supprimé");
        getBuses();
      } else {
        message.error(response.data.message || "Échec de la suppression");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getBuses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Bus</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">Gestion de la flotte de véhicules</p>
        </div>
        <button
          onClick={() => {
            setSelectedBus(null);
            setShowBusForm(true);
          }}
          className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
        >
          + Ajouter un bus
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Bus</th>
              <th className="px-5 py-3 font-semibold">Capacité</th>
              <th className="px-5 py-3 font-semibold">Services</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-anthracite/40">
                  Aucun bus pour l&apos;instant.
                </td>
              </tr>
            ) : (
              buses.map((bus) => (
                <tr key={bus.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                        <Bus size={15} className="text-terracotta" />
                      </div>
                      <div>
                        <p className="font-semibold text-anthracite">{bus.name || "—"}</p>
                        <p className="text-xs text-anthracite/40 font-mono">{bus.number || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} className="text-anthracite/30" />
                      {bus.capacity || "—"} places
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {bus.airConditioning && (
                        <span className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg text-xs font-semibold">
                          <Wind size={11} /> Clim
                        </span>
                      )}
                      {bus.wifi && (
                        <span className="inline-flex items-center gap-1 bg-saffron/15 text-saffron px-2 py-1 rounded-lg text-xs font-semibold">
                          <Wifi size={11} /> Wi-Fi
                        </span>
                      )}
                      {!bus.airConditioning && !bus.wifi && (
                        <span className="text-xs text-anthracite/30">Aucun</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowBusForm(true);
                        }}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <Popconfirm
                        title="Supprimer ce bus ?"
                        okText="Supprimer"
                        cancelText="Annuler"
                        onConfirm={() => deleteBus(bus.id)}
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
  );
}

export default CompanyBuses;
