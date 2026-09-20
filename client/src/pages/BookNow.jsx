import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { message, Spin } from "antd";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import { axiosInstance } from "../helpers/axiosInstance";
import {
  ArrowRight,
  ArrowLeft,
  Users,
  CreditCard,
  ShieldCheck,
  Bus,
  Wind,
  Wifi,
  Smartphone,
} from "lucide-react";
import SeatSelection from "../components/SeatSelection";
import { useKKiaPay } from "kkiapay-react";

const SEAT_LOCK_SECONDS = 600; // doit rester aligné avec le TTL Redis backend (lockSeat, EX 600)

const PAYMENT_METHODS = [
  { id: "mtn", label: "MTN MoMo", sub: "Paiement via MTN Mobile Money", providers: ["mtn"] },
  { id: "moov", label: "Moov Money", sub: "Paiement via Moov Money", providers: ["moov"] },
  {
    id: "card",
    label: "Carte bancaire",
    sub: "Visa / Mastercard",
    providers: ["visa", "mastercard"],
  },
];

function BookNow() {
  const [step, setStep] = useState("seats"); // "seats" | "payment"
  const [selectedSeats, setSelectedSeats] = useState([]);
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const params = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");

  const { openKkiapayWidget, addKkiapayListener, removeKkiapayListener } = useKKiaPay();

  useEffect(() => {
    if (user) {
      setPassengerName(user.name || "");
      setPassengerPhone(user.travelerProfile?.phone || "");
    }
  }, [user]);

  const formatDate = (date) => {
    const d = new Date(date);
    return date && !isNaN(d)
      ? d.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Date non disponible";
  };

  const getTrip = async () => {
    try {
      const response = await axiosInstance.post("/api/trips/get-trip-by-id", { id: params.id });
      if (response.data.success && response.data.data) {
        setTrip(response.data.data);
      } else {
        message.error("Le trajet n'a pas pu être récupéré.");
      }
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (response) => {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const storedSeats = localStorage.getItem("pendingSeats");
        const pendingSeats = storedSeats ? JSON.parse(storedSeats) : [];

        if (!pendingSeats.length) {
          message.error("Aucune place sélectionnée. Veuillez recommencer.");
          return;
        }

        dispatch(ShowLoading());

        const res = await axiosInstance.post("/api/bookings/book-seat", {
          tripId: trip.id,
          seats: pendingSeats,
          busId: trip.bus.id,
          transactionId: response.transactionId,
        });

        if (res.data.success) {
          message.success(res.data.message);
          setSelectedSeats([]);
          localStorage.removeItem("pendingSeats");
          await getTrip();
          navigate("/bookings");
        } else {
          message.error(res.data.message);
        }
      } catch (error) {
        message.error(error.response?.data?.message || error.message);
      } finally {
        dispatch(HideLoading());
        setIsProcessing(false);
      }
    },
    [trip, isProcessing, dispatch, navigate]
  );

  // Verrouille les sièges et passe à l'étape paiement (le compte à rebours
  // correspond exactement au TTL du verrou côté backend).
  const goToPayment = async () => {
    if (!trip) return message.error("Trajet non chargé.");
    if (!selectedSeats.length) return message.error("Veuillez sélectionner au moins une place.");

    try {
      dispatch(ShowLoading());
      const res = await axiosInstance.post("/api/bookings/lock-seat", {
        tripId: trip.id,
        seats: selectedSeats,
      });
      if (!res.data.success) {
        return message.error(res.data.message || "Erreur lors du verrouillage.");
      }

      setTimeLeft(SEAT_LOCK_SECONDS);
      setTimerActive(true);
      setStep("payment");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Impossible de vérifier la disponibilité des sièges."
      );
    } finally {
      dispatch(HideLoading());
    }
  };

  const payNow = () => {
    if (!passengerName.trim() || !passengerPhone.trim()) {
      return message.error("Veuillez renseigner le nom et le téléphone du passager.");
    }

    localStorage.setItem("pendingSeats", JSON.stringify(selectedSeats));
    const method = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

    openKkiapayWidget({
      amount: trip.price * selectedSeats.length,
      api_key: import.meta.env.VITE_KKIAPAY_KEY,
      // Reste en sandbox sauf si explicitement désactivé — une variable
      // d'environnement absente ou mal orthographiée ne doit jamais faire
      // basculer accidentellement en paiement réel.
      sandbox: import.meta.env.VITE_KKIAPAY_SANDBOX !== "false",
      fullname: passengerName,
      email: user?.email || "client@example.com",
      phone: passengerPhone,
      providers: { accept: method?.providers || [] },
    });
  };

  useEffect(() => {
    addKkiapayListener("success", handlePaymentSuccess);
    return () => removeKkiapayListener("success", handlePaymentSuccess);
  }, [handlePaymentSuccess]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setStep("seats");
      message.warning("Le délai de blocage de vos sièges a expiré. Veuillez recommencer.");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    getTrip();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-offwhite">
        <Spin size="large" />
      </div>
    );
  }

  if (!trip) return null;

  const capacity = trip.bus?.capacity || 0;
  const bookedCount = (trip.bus?.seatsBooked || []).length;
  const availableSeats = Math.max(capacity - bookedCount, 0);
  const total = trip.price * selectedSeats.length;
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {step === "payment" && (
          <button
            onClick={() => setStep("seats")}
            className="flex items-center gap-1.5 text-sm text-anthracite/50 hover:text-anthracite mb-4"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        )}

        {/* Bandeau récapitulatif du trajet */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0">
              <Bus size={20} className="text-terracotta" />
            </div>
            <div>
              <p className="font-bold text-anthracite flex items-center gap-2">
                {trip.from} <ArrowRight size={15} className="text-terracotta" /> {trip.to}
              </p>
              <p className="text-sm text-anthracite/50">
                {trip.company?.companyName || "Compagnie"} · {trip.departureTime} ·{" "}
                {formatDate(trip.date)}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              availableSeats <= 5 ? "bg-red-50 text-red-600" : "bg-brand-green/10 text-brand-green"
            }`}
          >
            {availableSeats} place{availableSeats !== 1 ? "s" : ""} libre
            {availableSeats !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale : sièges ou paiement */}
          <div className="lg:col-span-2 space-y-5">
            {step === "seats" ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-anthracite">Choisissez vos sièges</h2>
                  {(trip.bus?.airConditioning || trip.bus?.wifi) && (
                    <div className="flex items-center gap-2">
                      {trip.bus.airConditioning && (
                        <span className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg text-xs font-semibold">
                          <Wind size={11} /> Clim
                        </span>
                      )}
                      {trip.bus.wifi && (
                        <span className="inline-flex items-center gap-1 bg-saffron/15 text-saffron px-2 py-1 rounded-lg text-xs font-semibold">
                          <Wifi size={11} /> Wi-Fi
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <SeatSelection
                  selectedSeats={selectedSeats}
                  setSelectedSeats={setSelectedSeats}
                  bus={trip.bus}
                />
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-anthracite mb-4">Informations passager</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-anthracite/50 uppercase tracking-wide mb-1.5">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="Ex : Amadou Kouassi"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-anthracite/50 uppercase tracking-wide mb-1.5">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                        placeholder="+229 XX XX XX XX"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-anthracite mb-4">Mode de paiement</h2>
                  <div className="space-y-2.5">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === m.id
                            ? "border-terracotta bg-terracotta/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                          className="accent-terracotta"
                        />
                        <Smartphone size={18} className="text-anthracite/40 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-anthracite">{m.label}</p>
                          <p className="text-xs text-anthracite/50">{m.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 sticky top-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-anthracite mb-3">Récapitulatif</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-anthracite/50">Trajet</span>
                    <span className="font-semibold text-anthracite">
                      {trip.from} → {trip.to}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-anthracite/50">Compagnie</span>
                    <span className="font-semibold text-anthracite">
                      {trip.company?.companyName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-anthracite/50">Départ</span>
                    <span className="font-semibold text-anthracite">
                      {trip.departureTime}
                      {trip.departureStation && ` · ${trip.departureStation.name}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-anthracite/70 mb-2 flex items-center gap-1.5">
                  <Users size={14} /> Sièges sélectionnés
                </p>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-anthracite/40">
                    Aucun siège choisi pour l&apos;instant.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-mono font-semibold bg-terracotta/10 text-terracotta px-2 py-1 rounded-lg"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-anthracite/50">
                    {selectedSeats.length} × {trip.price.toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="font-semibold text-anthracite">
                    {total.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-anthracite/50">Frais de service</span>
                  <span className="font-semibold text-anthracite">0 FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                  <span className="font-bold text-anthracite">Total</span>
                  <span className="font-bold text-terracotta text-lg">
                    {total.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>

              {timerActive && (
                <div className="flex items-center gap-2 bg-brand-green/10 text-brand-green text-xs font-medium px-3 py-2.5 rounded-xl">
                  <ShieldCheck size={15} className="shrink-0" />
                  Vos sièges sont bloqués{" "}
                  <span className="font-mono font-bold">
                    {minutes}:{seconds}
                  </span>{" "}
                  pendant le paiement.
                </div>
              )}

              {step === "seats" ? (
                <button
                  onClick={goToPayment}
                  disabled={selectedSeats.length === 0}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                    selectedSeats.length === 0
                      ? "bg-gray-100 text-anthracite/30 cursor-not-allowed"
                      : "bg-terracotta text-white hover:bg-terracotta-dark"
                  }`}
                >
                  <CreditCard size={17} />
                  {selectedSeats.length === 0
                    ? "Sélectionnez un siège"
                    : "Continuer vers le paiement"}
                </button>
              ) : (
                <button
                  onClick={payNow}
                  className="w-full py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm bg-terracotta text-white hover:bg-terracotta-dark"
                >
                  <CreditCard size={17} />
                  Payer maintenant
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookNow;
