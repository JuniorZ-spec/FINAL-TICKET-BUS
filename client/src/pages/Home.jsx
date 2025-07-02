import { useSelector, useDispatch } from 'react-redux';
import { message, Row, Col } from 'antd';
import { HideLoading, ShowLoading } from '../redux/alertsSlice';
import { axiosInstance } from '../helpers/axiosInstance';
import { useEffect, useState } from 'react';
import Trip from '../components/Trip';

import {
  Clock, Shield, MapPin, TrendingUp, ArrowDown,
  ArrowUp, ArrowRight, Wifi, Sparkles , Star
} from 'lucide-react';

export default function Home() {
  const { user } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    journeyDate: new Date().toISOString().split('T')[0],
  });
  const [sortOrder, setSortOrder] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [serviceFilter, setServiceFilter] = useState(null);

  const getTrips = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/trips/get-all-trips", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        const tripsData = response.data.data;
        setTrips(tripsData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const initialResults = tripsData.filter((trip) => {
          try {
            const tripDate = new Date(trip.date);
            tripDate.setHours(0, 0, 0, 0);
            return tripDate.getTime() === today.getTime();
          } catch {
            return false;
          }
        });

        setFilteredTrips(initialResults);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des trajets");
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    getTrips();
  }, []);

  const handleFilter = (customFilters = filters) => {
    if (!customFilters.from || !customFilters.to) {
      message.warning("Veuillez sélectionner une ville de départ et d'arrivée");
      return;
    }

    dispatch(ShowLoading());

    try {
      const selectedDate = new Date(customFilters.journeyDate);
      selectedDate.setHours(0, 0, 0, 0);

      const results = trips.filter((trip) => {
        const fromMatch = trip.from.toLowerCase().includes(customFilters.from.toLowerCase());
        const toMatch = trip.to.toLowerCase().includes(customFilters.to.toLowerCase());

        const tripDate = new Date(trip.date);
        tripDate.setHours(0, 0, 0, 0);

        const dateMatch = tripDate.getTime() === selectedDate.getTime();

        return fromMatch && toMatch && dateMatch;
      });

      setFilteredTrips(results);
      setSearchTriggered(true);

      if (results.length === 0) {
        message.warning("Aucun trajet ne correspond à cette sélection.");
      } else {
        message.success(`${results.length} trajet(s) trouvé(s)`);
      }
    } catch (error) {
      message.error("Erreur lors du filtrage des trajets");
    } finally {
      dispatch(HideLoading());
    }
  };

  const resetFilters = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setFilters({
      from: '',
      to: '',
      journeyDate: today.toISOString().split('T')[0],
    });

    const todayTrips = trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });

    setFilteredTrips(todayTrips);
    setSearchTriggered(false);
  };

  const handlePopularClick = (trip) => {
    const customFilters = {
      ...filters,
      from: trip.from,
      to: trip.to,
      journeyDate: new Date().toISOString().split('T')[0],
    };
    setFilters(customFilters);
    handleFilter(customFilters);
  };

  const getUniqueTrips = () => {
    const seen = new Set();
    return filteredTrips.filter((trip) => {
      const key = `${trip.from.toLowerCase()}-${trip.to.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const sortedTrips = [...filteredTrips]
    .filter((trip) => {
      if (serviceFilter === 'clim') return trip.climatisation;
      if (serviceFilter === 'wifi') return trip.wifi;
      if (serviceFilter === 'clim-wifi') return trip.climatisation && trip.wifi;
      return true;
    })
    .sort((a, b) => {
      const getTimeInMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      if (sortOrder === 'time-asc') return getTimeInMinutes(a.departureTime) - getTimeInMinutes(b.departureTime);
      if (sortOrder === 'time-desc') return getTimeInMinutes(b.departureTime) - getTimeInMinutes(a.departureTime);
      return 0;
    });

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative bg-gradient-to-r p-5 bg-blue-600 text-white py-24 overflow-hidden">

        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/30 rounded-full animate-pulse" />
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/30 rounded-full animate-bounce" />
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/30 rounded-full animate-ping" />
          <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white/30 rounded-full animate-pulse" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-4 ">
            <Sparkles className="h-8 w-8 text-yellow-300 animate-spin" />
            <h7 className="text-5xl font-bold text-white mb-4">
              Voyagez en toute  <span className="bg-gradient-to-r from-yellow-400 to-white bg-clip-text text-transparent">simplicité</span>
            </h7> 
            <Sparkles className="h-8 w-8 text-yello-300 animate-spin" />

            
          </div>
          
       
          <div className="flex justify-center flex-wrap gap-4 pt-1 pb-2 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Prix comparés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 text-white" />
              <span>Réservation instantanée</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Billetterie électronique</span>
            </div>
          </div>
        </div>

         
       
<div className="bg-white rounded-xl mx-auto w-3/4  p-3 shadow-lg border border-gray-200">

  <div className="flex items-center justify-center space-x-2 mb-6">
       
        </div>
          <Row gutter={[24, 24]}>
            <Col lg={8} xs={16}>
       
              <div className="relative">
                <MapPin className="absolute left-17 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="from"
                  autoComplete="on"
                  placeholder="Lieu de départ"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  className="w-full bg-white text-black text-center border font-bold border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </Col>
            <Col lg={8} xs={16}>
           
              <div className="relative">
                <MapPin className="absolute left-17 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="to"
                  autoComplete="on"
                  placeholder="Lieu d'arrivée"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  className="w-full bg-white text-black text-center font-bold border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </Col>
            <Col lg={8} xs={24}>
              
              <input
                type="date"
                autoComplete="on"
                value={filters.journeyDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFilters({ ...filters, journeyDate: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg bg-white font-bold text-gray-100 focus:outline-none focus:border-blue-500"
                style={{ color: '#4B5563' }}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-3">
            <Col lg={12} xs={24}>
              <button
                style={{ borderRadius: '12px' }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-md"
                onClick={() => handleFilter(filters)}
              >
                Filtrer les résultats
              </button>
            </Col>
            <Col lg={12} xs={24}>
              <button
                style={{ borderRadius: '12px' }}
                className="w-full bg-blue-600 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-all duration-200 shadow-md"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            </Col>
          </Row>
        </div>
       
    
      </section>

           {searchTriggered && filteredTrips.length > 0 && (
<div className="bg-white rounded-lg shadow p-3 mb-3 max-w-3xl mx-auto">
    <div className="flex flex-wrap justify-center gap-2">
  
  <button
      onClick={() => setSortOrder('asc')}
      style={{
        padding: '8px 16px',
        borderRadius: '9999px',
        backgroundColor: sortOrder === 'asc' ? '#007bff' : '#f1f1f1',
        color: sortOrder === 'asc' ? '#ffffff' : '#333333',
        fontSize: '14px',
        fontWeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        boxShadow: sortOrder === 'asc' ? '0 2px 4px rgba(0, 123, 255, 0.2)' : 'none',
      }}
    >
      
      Prix le plus bas
      {sortOrder === 'asc' && <ArrowDown className="h-4 w-4 ml-2" />}
    </button>

    <button
      onClick={() => setSortOrder('time-asc')}
      style={{
        padding: '8px 16px',
        borderRadius: '9999px',
        backgroundColor: sortOrder === 'time-asc' ? '#007bff' : '#f1f1f1',
        color: sortOrder === 'time-asc' ? '#ffffff' : '#333333',
        fontSize: '14px',
        fontWeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        boxShadow: sortOrder === 'time-asc' ? '0 2px 4px rgba(0, 123, 255, 0.2)' : 'none',
      }}
    >
      <Clock className="h-4 w-4 mr-2" />
      Le plus tôt
      {sortOrder === 'time-asc' && <ArrowUp className="h-4 w-4 ml-2" />}
    </button>

    <button
      onClick={() => setSortOrder('time-desc')}
      style={{
        padding: '8px 16px',
        borderRadius: '9999px',
        backgroundColor: sortOrder === 'time-desc' ? '#007bff' : '#f1f1f1',
        color: sortOrder === 'time-desc' ? '#ffffff' : '#333333',
        fontSize: '14px',
        fontWeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        boxShadow: sortOrder === 'time-desc' ? '0 2px 4px rgba(0, 123, 255, 0.2)' : 'none',
      }}
    >
      <Clock className="h-4 w-4 mr-2" />
      Le plus tard
      {sortOrder === 'time-desc' && <ArrowDown className="h-4 w-4 ml-2" />}
    </button>


  {/* Section filtre par services */}
 
    <button
      onClick={() => setServiceFilter('all')}
      style={{
        padding: '8px 16px',
        borderRadius: '9999px',
        backgroundColor: serviceFilter === 'all' ? '#007bff' : '#f1f1f1',
        color: serviceFilter === 'all' ? '#ffffff' : '#333333',
        fontSize: '14px',
        fontWeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        boxShadow: serviceFilter === 'all' ? '0 2px 4px rgba(0, 123, 255, 0.2)' : 'none',
      }}
    >
      Clim , Wifi etc..
      <Wifi className="h-4 w-4 mr-2" />
    </button>

    
    </div>
</div> )}

      {/* Formulaire */}
     

      {/* Trajets populaires */}
{!searchTriggered && (
  <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      {/* Titre */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h8 className="text-4xl font-bold text-gray-900">Trajets Populaires</h8>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Découvrez nos destinations les plus demandées avec des prix avantageux
        </p>
      </div>

      {/* Grille des trajets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getUniqueTrips().map((trip, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer"
            onClick={() => handlePopularClick(trip)}
          >
            {/* En-tête */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{trip.from}</div>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-8 h-px bg-gray-300"></div>
                  <ArrowRight className="h-4 w-4" />
                  <div className="w-8 h-px bg-gray-300"></div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{trip.to}</div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              {/* Étoiles */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">Très demandé</span>
              </div>

              {/* Prix */}
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {trip.price} FCFA
                </div>
                <div className="text-sm text-gray-500">à partir de</div>
              </div>

              {/* Bouton */}
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2">
                <span>Réserver</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="text-center mt-12">
        <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Vous ne trouvez pas votre destination ?
          </h3>
          <p className="text-gray-600 mb-6">
            Utilisez notre moteur de recherche pour découvrir des centaines de trajets disponibles au Bénin
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
            Voir toutes les destinations
          </button>
        </div>
      </div>
    </div>
  </section>
)}



      {/* Résultats filtrés */}
      {filteredTrips && searchTriggered && (
        <div className="px-4 md:px-16 mt-12">
          <Row gutter={[16, 16]}>
            {sortedTrips.length > 0 ? (
              sortedTrips.map((trip) => (
                <Col key={trip._id} lg={12} xs={24}>
                  <Trip trip={trip} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <p className="text-center text-gray-500 py-8">
                  Aucun trajet disponible pour votre recherche
                </p>
              </Col>
            )}
          </Row>
        </div>
      )}
    </div>
  );
}
