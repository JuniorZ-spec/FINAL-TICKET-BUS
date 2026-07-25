import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { message, Popconfirm } from "antd";
import { Pencil, Trash2, Bus, Clock } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import TripForm from "../../components/TripForm";
import LigneForm from "../../components/LigneForm";

const TABS = [
  { key: "departs", label: "Départs du jour" },
  { key: "avenir", label: "À venir" },
  { key: "lignes", label: "Lignes tarifaires" },
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function StatusBadge({ status }) {
  const map = {
    Ouvert: "bg-blue-50 text-blue-600 border-blue-100",
    "En route": "bg-saffron/15 text-saffron border-saffron/20",
    Parti: "bg-brand-green/10 text-brand-green border-brand-green/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${map[status]}`}
    >
      {status}
    </span>
  );
}

function CompanyTrips() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("departs");

  const [trips, setTrips] = useState({ upcoming: [], ongoing: [], past: [] });
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [lignes, setLignes] = useState([]);
  const [showLigneForm, setShowLigneForm] = useState(false);
  const [selectedLigne, setSelectedLigne] = useState(null);

  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/companys/get-company-trips");
      if (response.data.success) setTrips(response.data.data);
      else message.error(response.data.message);
    } catch {
      message.error("Erreur de chargement des trajets");
    } finally {
      dispatch(HideLoading());
    }
  };

  const getLignes = async () => {
    try {
      const response = await axiosInstance.get("/api/companys/get-lignes");
      if (response.data.success) setLignes(response.data.data);
    } catch {
      message.error("Erreur de chargement des lignes tarifaires");
    }
  };

  const deleteTrip = async (id) => {
    try {
      dispatch(ShowLoading());
      await axiosInstance.delete(`/api/trips/delete-trip/${id}`);
      message.success("Trajet supprimé");
      getTrips();
    } catch {
      message.error("Erreur de suppression");
    } finally {
      dispatch(HideLoading());
    }
  };

  const deleteLigne = async (id) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.delete(`/api/companys/delete-ligne/${id}`);
      if (response.data.success) {
        message.success(response.data.message);
        getLignes();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur de suppression");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getTrips();
    getLignes();
  }, []);

  const todayDeparts = useMemo(() => {
    const today = new Date();
    const withStatus = [
      ...trips.upcoming.map((t) => ({ ...t, statusLabel: "Ouvert" })),
      ...trips.ongoing.map((t) => ({ ...t, statusLabel: "En route" })),
      ...trips.past.map((t) => ({ ...t, statusLabel: "Parti" })),
    ];
    return withStatus
      .filter((t) => isSameDay(new Date(t.date), today))
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }, [trips]);

  const upcomingTrips = useMemo(
    () =>
      [...trips.upcoming].sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date) || a.departureTime.localeCompare(b.departureTime)
      ),
    [trips]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-anthracite">Lignes et départs</h1>
          <p className="text-sm text-anthracite/50 mt-0.5">
            Gestion des lignes, horaires et affectations
          </p>
        </div>
        {tab !== "lignes" ? (
          <button
            onClick={() => {
              setSelectedTrip(null);
              setShowTripForm(true);
            }}
            className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
          >
            + Ajouter un trajet
          </button>
        ) : (
          <button
            onClick={() => {
              setSelectedLigne(null);
              setShowLigneForm(true);
            }}
            className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-terracotta-dark transition-colors"
          >
            + Nouvelle ligne
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-offwhite p-1 rounded-xl w-fit mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-1.5 rounded-lg transition-colors font-semibold ${
              tab === t.key
                ? "bg-white text-terracotta shadow-sm"
                : "text-anthracite/50 hover:text-anthracite"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "departs" ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Heure</th>
                <th className="px-5 py-3 font-semibold">Ligne</th>
                <th className="px-5 py-3 font-semibold">Bus</th>
                <th className="px-5 py-3 font-semibold">Vendus</th>
                <th className="px-5 py-3 font-semibold">Remplissage</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayDeparts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-anthracite/40">
                    Aucun départ prévu aujourd&apos;hui.
                  </td>
                </tr>
              ) : (
                todayDeparts.map((trip) => {
                  const pct = trip.bus?.capacity
                    ? Math.round((trip.bookedSeats / trip.bus.capacity) * 100)
                    : 0;
                  const barColor = pct > 88 ? "#EF4444" : pct > 65 ? "#D85A30" : "#0F6E56";
                  return (
                    <tr key={trip.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-mono font-semibold text-anthracite">
                        {trip.departureTime}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-anthracite">{trip.from}</span>
                        <span className="text-anthracite/30 mx-1">→</span>
                        <span className="font-semibold text-anthracite">{trip.to}</span>
                        {trip.ligne?.code && (
                          <span className="ml-2 text-[11px] text-anthracite/40 font-mono">
                            {trip.ligne.code}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-anthracite/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Bus size={14} className="text-anthracite/30" />
                          {trip.bus?.name || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-anthracite">
                        {trip.bookedSeats}/{trip.bus?.capacity ?? "—"}
                      </td>
                      <td className="px-5 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-xs text-anthracite/50 font-mono w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={trip.statusLabel} />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowTripForm(true);
                          }}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : tab === "avenir" ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Heure</th>
                <th className="px-5 py-3 font-semibold">Ligne</th>
                <th className="px-5 py-3 font-semibold">Bus</th>
                <th className="px-5 py-3 font-semibold">Vendus</th>
                <th className="px-5 py-3 font-semibold">Remplissage</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-anthracite/40">
                    Aucun trajet à venir.
                  </td>
                </tr>
              ) : (
                upcomingTrips.map((trip) => {
                  const pct = trip.bus?.capacity
                    ? Math.round((trip.bookedSeats / trip.bus.capacity) * 100)
                    : 0;
                  const barColor = pct > 88 ? "#EF4444" : pct > 65 ? "#D85A30" : "#0F6E56";
                  return (
                    <tr key={trip.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-anthracite/70 whitespace-nowrap">
                        {new Date(trip.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold text-anthracite">
                        {trip.departureTime}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-anthracite">{trip.from}</span>
                        <span className="text-anthracite/30 mx-1">→</span>
                        <span className="font-semibold text-anthracite">{trip.to}</span>
                        {trip.ligne?.code && (
                          <span className="ml-2 text-[11px] text-anthracite/40 font-mono">
                            {trip.ligne.code}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-anthracite/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Bus size={14} className="text-anthracite/30" />
                          {trip.bus?.name || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-anthracite">
                        {trip.bookedSeats}/{trip.bus?.capacity ?? "—"}
                      </td>
                      <td className="px-5 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-xs text-anthracite/50 font-mono w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowTripForm(true);
                          }}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Ligne</th>
                <th className="px-5 py-3 font-semibold">Durée</th>
                <th className="px-5 py-3 font-semibold">Tarif Standard</th>
                <th className="px-5 py-3 font-semibold">Tarif VIP</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-anthracite/40">
                    Aucune ligne tarifaire pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-anthracite/50">{ligne.code}</td>
                    <td className="px-5 py-3 font-semibold text-anthracite">
                      {ligne.from} <span className="text-anthracite/30 mx-1">→</span> {ligne.to}
                    </td>
                    <td className="px-5 py-3 text-anthracite/70">
                      {ligne.duration ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-anthracite/30" />
                          {ligne.duration}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-anthracite">
                      {ligne.standardPrice.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-saffron">
                      {ligne.vipPrice ? `${ligne.vipPrice.toLocaleString("fr-FR")} FCFA` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLigne(ligne);
                            setShowLigneForm(true);
                          }}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-green hover:bg-brand-green/10 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <Popconfirm
                          title="Supprimer cette ligne ?"
                          okText="Supprimer"
                          cancelText="Annuler"
                          onConfirm={() => deleteLigne(ligne.id)}
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
      )}

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

      {showLigneForm && (
        <LigneForm
          open={showLigneForm}
          setOpen={setShowLigneForm}
          selectedLigne={selectedLigne}
          setSelectedLigne={setSelectedLigne}
          getData={getLignes}
          type={selectedLigne ? "edit" : "add"}
        />
      )}
    </div>
  );
}

export default CompanyTrips;
