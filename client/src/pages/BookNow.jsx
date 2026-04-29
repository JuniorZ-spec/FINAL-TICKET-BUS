import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { message, Col, Row, Spin, Card } from "antd";
import { ShowLoading, HideLoading } from "../redux/alertsSlice";
import { axiosInstance } from "../helpers/axiosInstance";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Truck,
  FerrisWheel as SteeringWheel,
  CreditCard,
  ChevronRight,
  Bus,
} from "lucide-react";
import { useSelector } from "react-redux";
import moment from "moment";
import SeatSelection from "../components/SeatSelection";
import { useKKiaPay } from "kkiapay-react";

function BookNow() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const params = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [comments, setComments] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // en secondes
  const [timerActive, setTimerActive] = useState(false);

  const formatDate = (date) => {
    return date && moment(date, moment.ISO_8601, true).isValid()
      ? moment(date).format("YYYY-MM-DD")
      : "Date non disponible";
  };

  const { openKkiapayWidget, addKkiapayListener, removeKkiapayListener } = useKKiaPay();

  const getTrip = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/trips/get-trip-by-id", {
        id: params.id,
      });
      dispatch(HideLoading());

      if (response.data.success && response.data.data) {
        setTrip(response.data.data);
      } else {
        message.error("Le trajet n'a pas pu être récupéré.");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (response) => {
      if (isProcessing) {
        console.log(" Une opération est déjà en cours, on ignore cet appel.");
        return;
      }

      setIsProcessing(true);

      try {
        // 🔐 On récupère les sièges depuis localStorage
        const storedSeats = localStorage.getItem("pendingSeats");
        const pendingSeats = storedSeats ? JSON.parse(storedSeats) : [];

        console.log("🪑 Seats en attente (localStorage) :", pendingSeats);

        if (!pendingSeats.length) {
          console.error("❌ Aucun siège en attente.");
          message.error("Aucune place sélectionnée. Veuillez recommencer.");
          return;
        }

        dispatch(ShowLoading());

        console.log("📤 Payload envoyé :", {
          tripId: trip.id,
          seats: pendingSeats,
          busId: trip.bus.id,
          transactionId: response.transactionId,
        });

        const res = await axiosInstance.post("/api/bookings/book-seat", {
          tripId: trip.id,
          seats: pendingSeats,
          busId: trip.bus.id,
          transactionId: response.transactionId,
        });

        dispatch(HideLoading());

        if (res.data.success) {
          console.log("✅ Réservation réussie :", res.data.message);
          message.success(res.data.message);
          setSelectedSeats([]);
          localStorage.removeItem("pendingSeats"); // 🧹 nettoyage
          await getTrip();
          navigate("/bookings");
        } else {
          console.warn("⚠️ Réservation échouée :", res.data.message);
          message.error(res.data.message);
        }
      } catch (error) {
        dispatch(HideLoading());
        console.error("❌ Erreur lors de la réservation :", error);
        message.error(error.response?.data?.message || error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [trip, isProcessing, dispatch, navigate, getTrip]
  );

  const openPayment = async () => {
    if (!trip) return message.error("Trajet non chargé.");
    if (!selectedSeats.length) return message.error("Veuillez sélectionner au moins une place.");

    try {
      const res = await axiosInstance.post("/api/bookings/lock-seat", {
        tripId: trip.id,
        seats: selectedSeats,
      });
      if (!res.data.success) {
        return message.error(res.data.message || "Erreur lors du verrouillage.");
      }

      // Stocke les sièges et lance le timer à 3 minutes
      localStorage.setItem("pendingSeats", JSON.stringify(selectedSeats));
      setTimeLeft(180);
      setTimerActive(true);
      message.info("⏳ Vous avez 3 minutes pour finaliser votre paiement");

      openKkiapayWidget({
        amount: trip.price * selectedSeats.length,
        api_key: "c56683b01f7511f087baa9b5af50e7ed",
        sandbox: true,
        email: user?.email || "client@example.com",
        phone: user?.phone || "97000000",
      });
    } catch (err) {
      const backendMsg = err?.response?.data?.message;
      message.error(backendMsg || "Impossible de vérifier la disponibilité des sièges.");
    }
  };

  useEffect(() => {
    console.log("✅ Listener success attaché à Kkiapay");
    addKkiapayListener("success", handlePaymentSuccess);
    return () => {
      console.log("🔁 Listener success détaché");
      removeKkiapayListener("success", handlePaymentSuccess);
    };
  }, [handlePaymentSuccess]);

  useEffect(() => {
    let interval;

    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      // On prévient sans vider la sélection : l'utilisateur peut relancer
      message.warning(
        "⏳ Votre verrou a expiré. Cliquez à nouveau sur « Confirmer la réservation » pour relocker vos sièges."
      );
    }

    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const getCommentsForCompany = async (companyId) => {
    try {
      const response = await axiosInstance.get(`/api/comments/company/${companyId}`);
      if (response.data.success) {
        setComments(response.data.data);
      } else {
        message.error("Impossible de récupérer les commentaires.");
      }
    } catch (error) {
      message.error("Erreur lors de la récupération des commentaires.");
    }
  };

  useEffect(() => {
    if (trip?.company?.id) {
      getCommentsForCompany(trip.company.id);
    }
  }, [trip]);

  useEffect(() => {
    getTrip();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-gradient-to-br bg-gray-100 from-blue-50 to-indigo-50 overflow-hidden"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 py-4 flex gap-6">
        {trip && (
          <Row
            gutter={[20, 20]}
            justify="space-between"
            style={{ width: "100%", padding: "0 5px" }}
          >
            <Col lg={15} xs={24} sm={24} style={{ padding: "10px", maxWidth: "500px" }}>
              <div className="space-y-3">
                {/* Bloc Détails du trajet */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-3 border border-white/60 flex flex-col gap-4">
                  {/* Lieux de départ et d'arrivée */}
                  <div className="space-y-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {/* Départ */}
                    <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-md">
                      <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{trip.from}</div>
                        {trip.departureStation && (
                          <div className="text-xs text-blue-600">{trip.departureStation.name}</div>
                        )}
                      </div>
                    </div>

                    {/* Arrivée */}
                    <div className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-100 p-2 rounded-md">
                      <div className="w-9 h-9 bg-green-200 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-700" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{trip.to}</div>
                        {trip.arrivalStation && (
                          <div className="text-xs text-green-600">{trip.arrivalStation.name}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date / Heure / Bus / Services */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {/* Date */}
                    <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div className="text-sm text-gray-700 font-medium">
                        {formatDate(trip.date)}
                      </div>
                    </div>

                    {/* Heure */}
                    <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div className="text-sm text-gray-700 font-medium">{trip.departureTime}</div>
                    </div>

                    {/* Bus Name */}
                    {trip.bus?.name && (
                      <div className="flex items-center gap-2 p-2 bg-white border rounded-md col-span-1">
                        <SteeringWheel className="w-4 h-4 text-blue-500" />
                        <div className="text-sm font-medium text-gray-700">{trip.bus.name}</div>
                      </div>
                    )}

                    {/* Services */}
                    {(trip.bus?.airConditioning || trip.bus?.wifi) && (
                      <div className="flex items-center gap-2 p-2 bg-white border rounded-md col-span-1">
                        <Bus className="w-4 h-4 text-blue-500" />
                        <div className="text-xs text-gray-700 font-medium">
                          {trip.bus.airConditioning && "Climatisation"}
                          {trip.bus.airConditioning && trip.bus.wifi && " · "}
                          {trip.bus.wifi && "Wi-Fi"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloc Récapitulatif + Paiement */}
                <div
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/60"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prix par siège</span>
                      <span className="font-semibold text-gray-900">
                        {trip.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sièges sélectionnés</span>
                      <span className="font-bold text-gray-900">{selectedSeats.length}</span>
                    </div>

                    <hr className="border-gray-200 my-1" />

                    <div className="flex justify-between items-center font-bold text-base">
                      <span className="text-gray-800">Total</span>
                      <span className="text-blue-600">
                        {(trip.price * selectedSeats.length).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={openPayment}
                    disabled={selectedSeats.length === 0}
                    className={`w-full mt-3 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                      selectedSeats.length === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 via-indigo-600 to-green-600 hover:brightness-105 text-white shadow-md hover:shadow-lg"
                    } `}
                  >
                    <CreditCard className="w-5 h-5" />
                    {selectedSeats.length === 0
                      ? "Sélectionnez un siège"
                      : "Confirmer la réservation"}
                  </button>

                  <div className="mt-2 text-center text-xs text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Paiement sécurisé SSL 256-bit
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <div
              style={{
                width: "50%", // encore un peu réduit
                height: "600px",
                paddingtop: "1px",
                margintop: "1px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div className="w-200px mt-3 max-h-[600px] rounded-lg overflow-hidden transition-all text-[10px] leading-tight">
                {/* Header */}
                <div className="bg-gray-900 text-white pt-2 text-[12px]">
                  <div className="flex items-center justify-center text-center space-x-10 p-2">
                    <div className="flex items-center space-x-[2px]">
                      <div className="w-[10px] h-[10px] bg-blue-700 border border-blue-300 rounded-sm"></div>
                      <span>Dispo</span>
                    </div>
                    <div className="flex items-center space-x-[2px]">
                      <div className="w-[10px] h-[10px] bg-green-500 border border-green-600 rounded-sm"></div>
                      <span>Choisis</span>
                    </div>
                    <div className="flex items-center space-x-[2px]">
                      <div className="w-[10px] h-[10px] bg-red-800 border border-red-600 rounded-sm"></div>
                      <span>Reserver</span>
                    </div>
                  </div>
                </div>

                {/* Bus front */}
                <div className="bg-gray-300 space-x-1 pt-1 mt-1">
                  {/* Seats */}
                  <SeatSelection
                    selectedSeats={selectedSeats}
                    setSelectedSeats={setSelectedSeats}
                    bus={trip.bus}
                  />
                </div>
              </div>
            </div>
          </Row>
        )}
      </div>
    </div>
  );
}

export default BookNow;
