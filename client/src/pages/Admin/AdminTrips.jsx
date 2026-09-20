import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import TripForm from "../../components/TripForm";
import { useEffect, useState } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../helpers/axiosInstance";
import { Pencil, Trash2, Bus } from "lucide-react";

function AdminTrips() {
  const dispatch = useDispatch();
  const [showTripForm, setShowTripForm] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/trips/get-all-trips");
      if (response.data.success) setTrips(response.data.data);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      dispatch(HideLoading());
    }
  };

  const deleteTrip = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.delete(`/api/trips/delete-trip/${id}`);
      if (response.data.success) {
        message.success(response.data.message);
        getTrips();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getTrips();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Trajets & Départs</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">
            Tous les départs, toutes compagnies confondues
          </p>
        </div>
        <button
          onClick={() => setShowTripForm(true)}
          className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
        >
          + Ajouter un trajet
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Compagnie</th>
              <th className="px-5 py-3 font-semibold">Trajet</th>
              <th className="px-5 py-3 font-semibold">Horaire</th>
              <th className="px-5 py-3 font-semibold">Prix</th>
              <th className="px-5 py-3 font-semibold">Bus</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-anthracite/40">
                  Aucun trajet pour l&apos;instant.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-anthracite">
                    {trip.company?.companyName || "—"}
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">
                    {trip.from} → {trip.to}
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">
                    {new Date(trip.date).toLocaleDateString("fr-FR")} · {trip.departureTime}
                  </td>
                  <td className="px-5 py-3 text-anthracite/70">{trip.price} FCFA</td>
                  <td className="px-5 py-3 text-anthracite/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Bus size={14} className="text-anthracite/30" />
                      {trip.bus?.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowTripForm(true);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTrip(trip.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showTripForm && (
        <TripForm
          showTripForm={showTripForm}
          setShowTripForm={setShowTripForm}
          type={selectedTrip ? "edit" : "add"}
          getData={getTrips}
          selectedTrip={selectedTrip}
          setSelectedTrip={setSelectedTrip}
        />
      )}
    </div>
  );
}

export default AdminTrips;
