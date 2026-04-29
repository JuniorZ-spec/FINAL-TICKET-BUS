import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Clock, Wifi, Wind } from "lucide-react";

function Trip({ trip }) {
  const navigate = useNavigate();

  const handleBooking = () => {
    navigate(`/book-now/${trip.id}`);
  };

  const displayDate = trip.date
    ? new Date(trip.date).toLocaleDateString("fr-FR")
    : "Date non spécifiée";

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      {/* Header compagnie + prix */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-start">
        <div className="flex items-center justify-content gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-md flex items-center justify-center font-bold text-lg shadow">
            {trip.company?.companyName?.charAt(0) || "?"}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{trip.company?.companyName}</h3>
            <span className="text-xs text-gray-500">{trip.bus?.type || "Bus Standard"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{trip.price} F</div>
          <div className="text-xs text-gray-500">{trip.availableSeats || "--"} places</div>
        </div>
      </div>

      {/* Lieux */}
      <div className="px-4 pt-2 pb-3 border-t border-b border-gray-100 flex items-center justify-between">
        <div className="flex flex-col text-left">
          <div className="text-base font-bold text-gray-900">{trip.from}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} /> {trip.departureStation?.name || "Station"}
          </div>
        </div>

        <div className="text-center">
          <Clock size={16} className="text-blue-500 mb-1 mx-auto" />
          <div className="text-xs text-gray-500">{trip.departureTime || "--"}</div>
        </div>

        <div className="flex flex-col text-right">
          <div className="text-base font-bold text-gray-900">{trip.to}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
            {trip.arrivalStation?.name || "Station"} <MapPin size={11} />
          </div>
        </div>
      </div>

      {/* Infos pratiques */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-blue-500" />
          {displayDate}
        </div>
        <div className="flex gap-2 items-center">
          {trip.bus?.airConditioning && (
            <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
              <Wind size={11} className="text-blue-500" /> Clim
            </div>
          )}
          {trip.bus?.wifi && (
            <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
              <Wifi size={11} className="text-blue-500" /> Wi-Fi
            </div>
          )}
        </div>
      </div>

      {/* Bouton */}
      <div className="px-3 pb-3 pt-1 text-right">
        <button
          onClick={handleBooking}
          className="text-xs font-semibold bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-all"
          style={{ borderRadius: "8px", fontFamily: "Poppins, sans-serif" }}
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

export default Trip;
