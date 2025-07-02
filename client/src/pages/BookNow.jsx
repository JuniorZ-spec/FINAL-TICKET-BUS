import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { message, Col, Row, Spin, Card } from 'antd';
import { ShowLoading, HideLoading } from '../redux/alertsSlice';
import { axiosInstance } from '../helpers/axiosInstance';
import { Calendar, Clock, MapPin, ArrowRight, Truck, FerrisWheel as SteeringWheel, CreditCard, ChevronRight, Bus } from 'lucide-react';
import { useSelector } from "react-redux";
import moment from 'moment';
import SeatSelection from '../components/SeatSelection';
import { useKKiaPay } from 'kkiapay-react';



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


  const formatDate = (date) => {
    return date && moment(date, moment.ISO_8601, true).isValid()
      ? moment(date).format('YYYY-MM-DD')
      : 'Date non disponible';
  };


  const {
    openKkiapayWidget,
    addKkiapayListener,
    removeKkiapayListener
  } = useKKiaPay();


  const getTrip = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/trips/get-trip-by-id", {
        _id: params.id,
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
      console.log("🚨 handlePaymentSuccess déclenché avec response :", response);

      if (isProcessing) {
        console.log("⚠️ Une opération est déjà en cours, on ignore cet appel.");
        return;
      }
      setIsProcessing(true);

      try {
        console.log("🧨 Tentative de réservation en cours…");
        console.log("🪑 Seats sélectionnés au moment du paiement :", selectedSeats);

        if (!selectedSeats.length) {
          console.error("❌ Aucun siège sélectionné.");
          message.error("Veuillez sélectionner au moins une place.");
          return;
        }

        dispatch(ShowLoading());

        const res = await axiosInstance.post("/api/bookings/book-seat", {
          tripId: trip._id,
          seats: selectedSeats,
          busId: trip.bus._id,
          transactionId: response.transactionId,
        });

        dispatch(HideLoading());

        if (res.data.success) {
          console.log("✅ Réservation réussie :", res.data.message);
          message.success(res.data.message);
          setSelectedSeats([]);    // ← on vide la sélection
          await getTrip();         // ← on recharge trip (et trip.bus.seatsBooked)
          navigate("/bookings");   // ← puis on navigue
        } else {
          console.warn("⚠️ Réservation échouée :", res.data.message);
          message.error(res.data.message);
        }
      } catch (error) {
        dispatch(HideLoading());
        console.error("❌ Erreur :", error);
        message.error(error.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedSeats, trip, isProcessing, dispatch, navigate, getTrip]
  );





  const openPayment = () => {
    console.log("Bouton paiement cliqué !");

    if (!trip) {
      return message.error("Trajet non chargé.");
    }

    if (selectedSeats.length === 0) {
      return message.error("Veuillez sélectionner au moins une place.");
    }

    openKkiapayWidget({
      amount: trip.price * selectedSeats.length,
      api_key: "c56683b01f7511f087baa9b5af50e7ed", // remplace par ta vraie clé
      sandbox: true,
      email: user?.email || "client@example.com",
      // tu peux prendre l’email du user s’il est connecté
      phone: user?.phone || "97000000", // pareil pour le numéro
    });
  };

  useEffect(() => {
    console.log("✅ Listener success attaché à Kkiapay");
    addKkiapayListener("success", handlePaymentSuccess);
    return () => {
      console.log("🔁 Listener success détaché");
      removeKkiapayListener("success", handlePaymentSuccess);
    };
  }, [handlePaymentSuccess]);


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
    if (trip?.company?._id) {
      getCommentsForCompany(trip.company._id);
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
    <div className=" bg-gradient-to-br from-blue-50 to-indigo-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-5xl  max-h-xl mx-auto px-3 py-2">
        {trip && (
          <Row gutter={[20, 20]} justify="space-between" style={{ width: '100%', padding: '0 5px' }}>
            <Col lg={15} xs={24} sm={24} style={{ padding: '10px', maxWidth: '450px' }}>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">



                {/* Itinéraire - Villes et Stations */}
                <div className="space-y-2 mb-10">

                  {/* Départ */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-900">{trip.from}</span>
                      {trip.departureStations?.[0] && (
                        <span className="text-sm text-blue-700">{trip.departureStations[0].name}</span>
                      )}

                    </div>
                  </div>

                  {/* Trait vertical */}
                  <div className="ml-6 h-6 w-0.5 bg-blue-200 rounded" />

                  {/* Arrivée */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-900">{trip.to}</span>
                      {trip.arrivalStations?.[0] && (
                        <span className="text-sm text-green-700">{trip.arrivalStations[0].name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div className="space-y-2 mb-3">

                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700 text-md">Date</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatDate(trip.date)}</span>
                  </div>

                  {/* Heure */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Départ</span>
                    </div>
                    <span className="font-bold text-gray-900">{trip.departureTime}</span>
                  </div>

                  {/* Services */}
                  {trip.bus?.services && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bus className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">Services</span>
                      </div>
                      <div>
                        {trip.bus.services.airConditioning && (
                          <span className="font-semibold text-gray-900">
                            Climatisation
                          </span>
                        )},
                        {trip.bus.services.wifi && (
                          <span className="font-semibold text-gray-900">
                            Wi-Fi
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Résumé Réservation */}
                <div className="border-t text-md border-gray-300 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Prix par siège</span>
                    <span className="font-semibold text-gray-900">{trip.price.toLocaleString()} FCFA</span>
                  </div>

                  <div className="flex items-center  justify-between mb-2">
                    <span className="text-gray-600">Sièges sélectionnés</span>
                    <span className="font-bold text-gray-900">{selectedSeats.length}</span>
                  </div>

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-blue-600">{(trip.price * selectedSeats.length).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Bouton de réservation */}
                <button
                  onClick={openPayment}
                  disabled={selectedSeats.length === 0}
                  style={{ borderRadius: '12px' }}
                  className={`w-full mt-2 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${selectedSeats.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg'
                    }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Confirmer la réservation
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </Col>







            <div
              style={{
                width: '50%', // encore un peu réduit
                height: '600px',
                paddingtop: '1px',
                margintop: '1px',
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div className="w-200px mt-3 max-h-[700px] rounded-lg overflow-hidden transition-all text-[10px] leading-tight">
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
                  <SeatSelection selectedSeats={selectedSeats} setSelectedSeats={setSelectedSeats} bus={trip.bus} />
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
