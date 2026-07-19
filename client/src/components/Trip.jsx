import { useNavigate } from "react-router-dom";
import { Clock, Wifi, Wind, Users } from "lucide-react";
import TotemAnimal, { getCompanyBadge } from "./TotemAnimal";

function Trip({ trip }) {
  const navigate = useNavigate();
  const badge = getCompanyBadge(trip.company?.companyName);
  const seatsLeft = trip.availableSeats;
  const lowSeats = typeof seatsLeft === "number" && seatsLeft <= 5;

  const handleBooking = () => {
    navigate(`/book-now/${trip.id}`);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-terracotta/30 transition-all p-5">
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Compagnie */}
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-full sm:basis-auto">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${badge.color}15` }}
          >
            <TotemAnimal type={badge.animal} size={24} color={badge.color} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-anthracite truncate">
              {trip.company?.companyName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {trip.bus?.airConditioning && (
                <span className="flex items-center gap-1 text-xs text-anthracite/50">
                  <Wind size={12} /> Clim
                </span>
              )}
              {trip.bus?.wifi && (
                <span className="flex items-center gap-1 text-xs text-anthracite/50">
                  <Wifi size={12} /> Wi-Fi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Départ */}
        <div className="text-center flex-shrink-0">
          <div className="text-2xl font-extrabold text-anthracite tabular-nums">
            {trip.departureTime || "--"}
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-anthracite/50 mt-0.5">
            <Clock size={11} /> Départ
          </div>
        </div>

        {/* Prix + places + action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-auto">
          <div className="text-xl font-extrabold text-terracotta">{trip.price} FCFA</div>
          {typeof seatsLeft === "number" && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                lowSeats ? "bg-red-50 text-red-600" : "bg-cream text-anthracite/70"
              }`}
            >
              <Users size={11} />
              {seatsLeft > 0 ? `${seatsLeft} place${seatsLeft > 1 ? "s" : ""}` : "Complet"}
            </span>
          )}
          <button
            onClick={handleBooking}
            disabled={seatsLeft === 0}
            className="text-sm font-bold bg-terracotta text-white px-4 py-2 rounded-full hover:bg-terracotta-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Choisir →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Trip;
