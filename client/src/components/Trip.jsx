import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users, Wifi, Wind } from "lucide-react";
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
    <div className="w-full bg-white border border-gray-200 rounded-2xl hover:shadow-md hover:border-terracotta/30 transition-all p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Compagnie */}
        <div className="flex items-center gap-3 md:w-56 shrink-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${badge.color}15` }}
          >
            <TotemAnimal type={badge.animal} size={24} color={badge.color} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-anthracite truncate">{trip.company?.companyName}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green mt-0.5">
              <ShieldCheck size={12} /> Vérifiée
            </span>
          </div>
        </div>

        {/* Horaires */}
        <div className="flex items-center gap-3 md:flex-1">
          <div className="text-center">
            <p className="text-2xl font-black text-anthracite tabular-nums">
              {trip.departureTime || "--"}
            </p>
            <p className="text-xs text-anthracite/40 mt-0.5">Départ</p>
          </div>
          {trip.ligne?.duration && (
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-xs text-anthracite/40 mb-1">{trip.ligne.duration}</span>
              <div className="relative w-full h-px bg-gray-200">
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-terracotta" />
              </div>
            </div>
          )}
        </div>

        {/* Équipements + places */}
        <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-1.5 md:w-36 shrink-0">
          {(trip.bus?.airConditioning || trip.bus?.wifi) && (
            <div className="flex items-center gap-1.5">
              {trip.bus.airConditioning && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-anthracite/50 bg-offwhite px-1.5 py-0.5 rounded">
                  <Wind size={11} /> AC
                </span>
              )}
              {trip.bus.wifi && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-anthracite/50 bg-offwhite px-1.5 py-0.5 rounded">
                  <Wifi size={11} /> WiFi
                </span>
              )}
            </div>
          )}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              lowSeats ? "bg-red-50 text-red-600" : "bg-cream text-anthracite/70"
            }`}
          >
            <Users size={11} />
            {seatsLeft > 0 ? `${seatsLeft} places` : "Complet"}
          </span>
        </div>

        {/* Prix + action */}
        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:w-36 shrink-0 md:border-l md:pl-4 md:border-gray-100">
          <div className="md:text-right">
            <p className="text-2xl font-black text-terracotta">
              {trip.price.toLocaleString("fr-FR")} F
            </p>
            <p className="text-xs text-anthracite/40">par personne</p>
          </div>
          <button
            onClick={handleBooking}
            disabled={seatsLeft === 0}
            className="flex items-center gap-1.5 text-sm font-bold bg-terracotta text-white px-4 py-2 rounded-full hover:bg-terracotta-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Choisir <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Trip;
