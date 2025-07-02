import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  Wifi,
  Wind
} from 'lucide-react';

function Trip({ trip }) {
  const navigate = useNavigate();
  const handleBooking = () => {
    navigate(`/book-now/${trip._id}`);
  };

  const displayDate = trip.date
    ? new Date(trip.date).toLocaleDateString('fr-FR')
    : 'Date non spécifiée';

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col transition-all hover:shadow-xl duration-300">
      {/* En-tête */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-bold">{trip.company.companyName}</h2>
        <div className="flex items-center gap-5 text-sm">
          {trip.bus?.services?.airConditioning && (
            <div className="flex items-center gap-1">
              <Wind  size={16} />
              <span>Clim</span>
            </div>
          )}
          {trip.bus?.services?.wifi && (
            <div className="flex items-center gap-1">
              <Wifi size={16} />
              <span>Wi-Fi</span>
            </div>
          )}
        </div>
      </div>

      {/* Section trajet */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
            <MapPin size={20} />
            <span>Départ</span>
          </div>
          <div className="text-base font-bold text-gray-900">{trip.from || "N/A"}</div>
          {trip.departureStations?.length > 0 && (
            <div className="text-xs text-blue-600">{trip.departureStations[0].name}</div>
          )}
        </div>

        <div className="mx-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <ArrowRight size={20} />
          </div>
        </div>

        <div className="text-right">
          <div className="flex justify-end items-center gap-1 text-sm text-blue-600 font-semibold">
            <MapPin size={20} />
            <span>Arrivée</span>
          </div>
          <div className="text-base font-bold text-gray-900">{trip.to || "N/A"}</div>
          {trip.arrivalStations?.length > 0 && (
            <div className="text-xs text-blue-600">{trip.arrivalStations[0].name}</div>
          )}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="px-4 py-3 grid grid-cols-3 gap-4 text-sm text-gray-700 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1 font-semibold">
            <Calendar size={20} className="text-blue-600" />
            <span>Date</span>
          </div>
          <div className="font-bold text-gray-900">{displayDate}</div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-semibold">
            <Clock size={14} className="text-blue-600" />
            <span>Heure</span>
          </div>
          <div className="font-bold text-gray-900">{trip.departureTime}</div>
        </div>

        <div>
          <div className="font-semibold">Tarif</div>
          <div className="font-bold text-gray-900">{trip.price} FCFA</div>
        </div>
      </div>

     
      <div className="px-3 py-3 text-right font-bold">
        <button style={ {borderRadius: '8px'}}
          onClick={handleBooking}
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold text-md hover:bg-blue-700 hover:scale-105 transition-all"
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

export default Trip;
