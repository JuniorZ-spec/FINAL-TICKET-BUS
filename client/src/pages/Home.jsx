import { useSelector, useDispatch } from "react-redux";
import { message } from "antd";
import { HideLoading, ShowLoading } from "../redux/alertsSlice";
import { axiosInstance } from "../helpers/axiosInstance";
import { useEffect, useState } from "react";
import Trip from "../components/Trip";
import WaxPattern from "../components/WaxPattern";
import Reveal from "../components/Reveal";
import TotemAnimal, { getCityAnimal, getCompanyBadge } from "../components/TotemAnimal";
import { useCountUp } from "../hooks/useCountUp";

import imgAmazoneCotonou from "../assets/CotonouParakou.jpg";
import imgRondPointParakou from "../assets/Parakou.jpg";
import imgMosqueePortoNovo from "../assets/PortoCotonou.jpg";
import imgStatueBohicon from "../assets/CotonouBohicon.jpeg";
import imgPorteOuidah from "../assets/OuidahParakou.jpg";
// Ajoutées depuis Wikimedia Commons (licences libres CC BY-SA / CC0) :
// - Abomey.jpg : "Royal Palaces of Abomey", photo UNESCO (Karalyn Monteil, 2012), CC BY-SA 3.0 IGO
// - Natitingou.jpg : "Benin Natitingou2.JPG" (Martin Wegmann / Baliola, 2007), CC BY-SA
// - Djougou.jpg : "La guérite principale du palais royal de Djougou" (2023), CC0
import imgAbomey from "../assets/Abomey.jpg";
import imgNatitingou from "../assets/Natitingou.jpg";
import imgDjougou from "../assets/Djougou.jpg";

// Une photo réelle par ville (pas de montage par paire de villes : trop peu de
// photos dispo pour couvrir toutes les combinaisons). La carte utilise la
// photo de la ville de départ, sinon celle d'arrivée, sinon pas de photo.
const CITY_IMAGES = {
  Cotonou: imgAmazoneCotonou,
  Parakou: imgRondPointParakou,
  "Porto-Novo": imgMosqueePortoNovo,
  Bohicon: imgStatueBohicon,
  Ouidah: imgPorteOuidah,
  Abomey: imgAbomey,
  Natitingou: imgNatitingou,
  Djougou: imgDjougou,
};

const getRouteImage = (from, to) => CITY_IMAGES[from] || CITY_IMAGES[to] || null;

import {
  Clock,
  Shield,
  MapPin,
  ArrowRight,
  ArrowLeftRight,
  Star,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

const FALLBACK_CITIES = [
  "Cotonou",
  "Parakou",
  "Natitingou",
  "Bohicon",
  "Porto-Novo",
  "Djougou",
  "Abomey",
];

export default function Home() {
  const { user } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [displayedTrips, setDisplayedTrips] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    journeyDate: new Date().toISOString().split("T")[0],
  });
  const [sort, setSort] = useState("price");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [showSearchEdit, setShowSearchEdit] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [equipmentFilters, setEquipmentFilters] = useState({ ac: false, wifi: false });
  const [timeWindow, setTimeWindow] = useState("all");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [tripType, setTripType] = useState("aller");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/api/reviews/get-all")
      .then((res) => {
        if (res.data.success) setReviews(res.data.data);
      })
      .catch(() => {});
  }, []);

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
        const now = new Date();

        const validTrips = tripsData.filter((trip) => {
          try {
            const datePart = new Date(trip.date);
            const [hours, minutes] = trip.departureTime.split(":").map(Number);
            datePart.setHours(hours, minutes, 0, 0);
            const departureDate = datePart;
            return departureDate >= now;
          } catch {
            return false;
          }
        });

        setTrips(validTrips);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const initialResults = validTrips.filter((trip) => {
          try {
            const tripDate = new Date(trip.date);
            tripDate.setHours(0, 0, 0, 0);
            return tripDate.getTime() === today.getTime();
          } catch {
            return false;
          }
        });

        setFilteredTrips(initialResults);
        setDisplayedTrips(initialResults);
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
      setMaxPrice(results.length ? Math.max(...results.map((t) => t.price)) : null);

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

  const toggleEquipment = (key) => setEquipmentFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCompany = (name) =>
    setSelectedCompanies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const activeFiltersCount =
    (equipmentFilters.ac ? 1 : 0) +
    (equipmentFilters.wifi ? 1 : 0) +
    (timeWindow !== "all" ? 1 : 0) +
    selectedCompanies.length +
    (maxPrice != null &&
    filteredTrips.length &&
    maxPrice < Math.max(...filteredTrips.map((t) => t.price))
      ? 1
      : 0);

  const resetFilters = () => {
    // Réinitialiser uniquement les filtres secondaires
    setEquipmentFilters({ ac: false, wifi: false });
    setTimeWindow("all");
    setSelectedCompanies([]);
    setSort("price");

    // Relancer une recherche avec les critères de trajet actuels, sans filtres
    const selectedDate = new Date(filters.journeyDate);
    selectedDate.setHours(0, 0, 0, 0);

    const results = trips.filter((trip) => {
      const fromMatch = trip.from.toLowerCase().includes(filters.from.toLowerCase());
      const toMatch = trip.to.toLowerCase().includes(filters.to.toLowerCase());

      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);

      const dateMatch = tripDate.getTime() === selectedDate.getTime();

      return fromMatch && toMatch && dateMatch;
    });

    setFilteredTrips(results);
    setDisplayedTrips(results);
    setMaxPrice(results.length ? Math.max(...results.map((t) => t.price)) : null);
  };

  // Regroupe les trajets d'une route par prochaine date de départ, pour que le
  // nombre de départs affiché sur une carte corresponde exactement à ce que
  // la recherche déclenchée par un clic va montrer (même date retenue).
  const getNextDeparturesForRoute = (from, to) => {
    const matchingTrips = trips.filter(
      (t) => t.from.toLowerCase() === from.toLowerCase() && t.to.toLowerCase() === to.toLowerCase()
    );
    if (!matchingTrips.length) return { nextDate: null, departures: [] };

    const nextDate = matchingTrips.reduce(
      (earliest, t) => (new Date(t.date) < new Date(earliest) ? t.date : earliest),
      matchingTrips[0].date
    );
    const nextDateKey = new Date(nextDate).toDateString();
    const departures = matchingTrips.filter((t) => new Date(t.date).toDateString() === nextDateKey);

    return { nextDate, departures };
  };

  const handlePopularClick = (route) => {
    const { nextDate } = getNextDeparturesForRoute(route.from, route.to);

    const customFilters = {
      ...filters,
      from: route.from,
      to: route.to,
      journeyDate: new Date(nextDate || new Date()).toISOString().split("T")[0],
    };
    setFilters(customFilters);
    handleFilter(customFilters);
  };

  const getCities = () => {
    const fromTrips = new Set();
    trips.forEach((t) => {
      if (t.from) fromTrips.add(t.from);
      if (t.to) fromTrips.add(t.to);
    });
    FALLBACK_CITIES.forEach((c) => fromTrips.add(c));
    return Array.from(fromTrips);
  };

  const swapCities = () => {
    setFilters({ ...filters, from: filters.to, to: filters.from });
  };

  const partnerCount = new Set(trips.map((t) => t.company?.companyName).filter(Boolean)).size;
  const realCitiesCount = new Set(trips.flatMap((t) => [t.from, t.to]).filter(Boolean)).size;
  const companyNames = [...new Set(trips.map((t) => t.company?.companyName).filter(Boolean))];

  // Prénom + initiale du nom pour ne pas exposer l'identité complète d'un
  // voyageur sur une page publique.
  const displayReviewerName = (fullName) => {
    if (!fullName) return "Voyageur AliGo";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  const applyAllFilters = () => {
    const selectedDate = new Date(filters.journeyDate);
    selectedDate.setHours(0, 0, 0, 0);

    let result = trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(0, 0, 0, 0);
      const [hour] = trip.departureTime.split(":").map(Number);

      const matchesFrom = trip.from.toLowerCase() === filters.from.toLowerCase();
      const matchesTo = trip.to.toLowerCase() === filters.to.toLowerCase();
      const matchesDate = tripDate.getTime() === selectedDate.getTime();
      const matchesAc = equipmentFilters.ac ? trip.bus?.airConditioning : true;
      const matchesWifi = equipmentFilters.wifi ? trip.bus?.wifi : true;
      const matchesTime =
        timeWindow === "all"
          ? true
          : timeWindow === "morning"
            ? hour >= 5 && hour < 12
            : timeWindow === "afternoon"
              ? hour >= 12 && hour < 19
              : hour >= 19 || hour < 5;
      const matchesCompany = selectedCompanies.length
        ? selectedCompanies.includes(trip.company?.companyName)
        : true;

      return (
        matchesFrom &&
        matchesTo &&
        matchesDate &&
        matchesAc &&
        matchesWifi &&
        matchesTime &&
        matchesCompany
      );
    });

    if (maxPrice != null) result = result.filter((trip) => trip.price <= maxPrice);

    if (searchTriggered && filteredTrips.length > 0 && result.length === 0) {
      message.warning("Aucun voyage trouvé pour vos critères.");
    }

    setDisplayedTrips(result);
  };

  useEffect(() => {
    applyAllFilters();
  }, [filteredTrips, equipmentFilters, timeWindow, selectedCompanies, maxPrice]);

  const sortedTrips = [...displayedTrips].sort((a, b) => {
    const getTimeInMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    if (sort === "price") return a.price - b.price;
    if (sort === "time")
      return getTimeInMinutes(a.departureTime) - getTimeInMinutes(b.departureTime);
    return 0;
  });

  const cities = getCities();

  // Routes populaires dérivées des vrais trajets en base — aucune route ni
  // aucun prix inventé : si une route n'a pas de trajet réel, elle n'apparaît
  // simplement pas.
  const allRoutes = (() => {
    const routeMap = new Map();
    trips.forEach((t) => {
      const key = `${t.from}→${t.to}`;
      if (!routeMap.has(key)) routeMap.set(key, { from: t.from, to: t.to, prices: [] });
      routeMap.get(key).prices.push(t.price);
    });

    return Array.from(routeMap.values())
      .map((r) => {
        const { departures } = getNextDeparturesForRoute(r.from, r.to);
        return {
          from: r.from,
          to: r.to,
          departsCount: departures.length,
          minPrice: Math.min(...r.prices),
        };
      })
      .sort((a, b) => b.departsCount - a.departsCount);
  })();

  const popularRoutes = allRoutes.slice(0, 6);

  return (
    <div className="w-full">
      {/* SECTION HERO + FORMULAIRE DE RECHERCHE */}
      {!searchTriggered && (
        <section className="relative overflow-hidden bg-offwhite pt-20 pb-12 px-4">
          <WaxPattern />
          <div
            className="absolute top-0 left-0 right-0 h-1.5 animate-shimmer-bar"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #D85A30, #E8B03D, #0F6E56, #E8B03D, #D85A30)",
              backgroundSize: "200% 100%",
            }}
          />

          {/* Formes décoratives flottantes, purement visuelles */}
          <div
            className="hidden md:block absolute top-24 left-[8%] w-16 h-16 rounded-3xl animate-float-soft"
            style={{ backgroundColor: "#D85A3014", animationDelay: "0.3s" }}
            aria-hidden
          />
          <div
            className="hidden md:block absolute top-40 right-[10%] w-10 h-10 rounded-full animate-float-soft"
            style={{ backgroundColor: "#0F6E5618", animationDelay: "1.1s" }}
            aria-hidden
          />
          <div
            className="hidden lg:block absolute bottom-10 left-[16%] w-8 h-8 rounded-2xl rotate-12 animate-float-soft"
            style={{ backgroundColor: "#E8B03D22", animationDelay: "0.7s" }}
            aria-hidden
          />

          <div className="relative z-10 text-center max-w-5xl mx-auto mb-14">
            <span
              className="animate-pop-in inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: "#E8B03D22", color: "#9A6C00" }}
            >
              <span className="w-2 h-2 rounded-full bg-saffron animate-float-soft" />
              {partnerCount > 0
                ? `${partnerCount} compagnie${partnerCount > 1 ? "s" : ""} comparée${partnerCount > 1 ? "s" : ""} en un clic`
                : "Comparez toutes les compagnies de bus du Bénin"}
            </span>
            <h1
              className="animate-pop-in text-4xl md:text-5xl lg:text-6xl font-black mb-7 text-anthracite max-w-3xl mx-auto"
              style={{ lineHeight: 1.15, fontWeight: 900, animationDelay: "0.1s" }}
            >
              Tous les bus du Bénin,
              <br />
              <span className="text-terracotta">comparés en un coup d&apos;œil.</span>
            </h1>
            <p
              className="animate-pop-in text-xl text-anthracite/60 max-w-2xl mx-auto leading-relaxed"
              style={{ animationDelay: "0.2s" }}
            >
              Comparez toutes les compagnies de bus, choisissez votre siège, payez en Mobile Money.
              Simple, rapide, fier.
            </p>
          </div>

          <div
            className="relative z-10 max-w-4xl mx-auto animate-pop-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-left">
              {/* Toggle Aller / Aller-Retour */}
              <div className="flex gap-3 mb-7">
                {[
                  { value: "aller", label: "Aller" },
                  { value: "aller-retour", label: "Aller-Retour" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTripType(value)}
                    className={`px-6 py-3 rounded-full text-lg font-semibold transition-all ${
                      tripType === value ? "text-white" : "text-anthracite/60 bg-offwhite"
                    }`}
                    style={tripType === value ? { backgroundColor: "#D85A30" } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-anthracite/50 uppercase tracking-wider mb-2">
                    Départ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta" />
                    <select
                      value={filters.from}
                      onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                      className="w-full pl-11 pr-3 py-4 border border-gray-200 rounded-2xl bg-white text-lg font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                    >
                      <option value="">Choisir une ville</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-center pb-1">
                  <button
                    onClick={swapCities}
                    className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-terracotta/40 hover:scale-110 active:scale-95 transition-all text-terracotta"
                    aria-label="Inverser départ et arrivée"
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-anthracite/50 uppercase tracking-wider mb-2">
                    Arrivée
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-green" />
                    <select
                      value={filters.to}
                      onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                      className="w-full pl-11 pr-3 py-4 border border-gray-200 rounded-2xl bg-white text-lg font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                    >
                      <option value="">Choisir une ville</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-anthracite/50 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-anthracite/40" />
                    <input
                      type="date"
                      value={filters.journeyDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setFilters({ ...filters, journeyDate: e.target.value })}
                      className="w-full pl-11 pr-3 py-4 border border-gray-200 rounded-2xl bg-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <button
                    onClick={() => handleFilter(filters)}
                    className="w-full py-4 text-white text-lg font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                    style={{ backgroundColor: "#D85A30" }}
                  >
                    <Search className="w-5 h-5" />
                    Chercher
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {searchTriggered && (
        <section className="px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <p className="text-lg font-bold text-anthracite flex items-center gap-2">
                  <span>{filters.from}</span>
                  <ArrowRight className="w-4 h-4 text-terracotta" />
                  <span>{filters.to}</span>
                </p>
                <p className="text-sm text-anthracite/50 capitalize">
                  {new Date(filters.journeyDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSearchEdit((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-bold text-terracotta bg-terracotta/10 hover:bg-terracotta/15 px-4 py-2.5 rounded-full transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {showSearchEdit ? "Fermer" : "Modifier"}
            </button>
          </div>

          {showSearchEdit && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <div className="relative flex-1 min-w-[140px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta pointer-events-none" />
                <select
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value="">Départ</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={swapCities}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-terracotta/40 transition-colors text-terracotta shrink-0"
                aria-label="Inverser départ et arrivée"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              <div className="relative flex-1 min-w-[140px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green pointer-events-none" />
                <select
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value="">Arrivée</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-36 shrink-0">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite/40 pointer-events-none" />
                <input
                  type="date"
                  value={filters.journeyDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFilters({ ...filters, journeyDate: e.target.value })}
                  className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>

              <button
                onClick={() => {
                  handleFilter(filters);
                  setShowSearchEdit(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 shrink-0"
                style={{ backgroundColor: "#D85A30" }}
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Chercher</span>
              </button>
            </div>
          )}
        </section>
      )}

      {searchTriggered && (
        <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-10 max-w-7xl mx-auto">
          {filteredTrips.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-24 text-center">
              <p className="text-anthracite/60 mb-2">
                Aucun trajet ne correspond à votre recherche.
              </p>
              <button
                onClick={() => setSearchTriggered(false)}
                className="text-terracotta font-semibold hover:text-terracotta-dark"
              >
                Nouvelle recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              {/* Filtres à gauche (desktop) */}
              <aside className="hidden lg:block">
                <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-anthracite flex items-center gap-2">
                      <Filter className="w-4 h-4 text-terracotta" />
                      Filtres
                    </h3>
                    {activeFiltersCount > 0 && (
                      <span className="text-xs font-bold bg-terracotta/10 text-terracotta w-5 h-5 rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  <FiltersPanel
                    filteredTrips={filteredTrips}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    equipmentFilters={equipmentFilters}
                    toggleEquipment={toggleEquipment}
                    timeWindow={timeWindow}
                    setTimeWindow={setTimeWindow}
                    trips={trips}
                    selectedCompanies={selectedCompanies}
                    toggleCompany={toggleCompany}
                    resetFilters={resetFilters}
                  />
                </div>
              </aside>

              {/* Résultats à droite */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    {[
                      { id: "price", label: "Moins cher" },
                      { id: "time", label: "Plus tôt" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSort(s.id)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                          sort === s.id
                            ? "bg-anthracite text-white border-anthracite"
                            : "bg-white text-anthracite/60 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowFiltersMobile(true)}
                    className="lg:hidden relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200"
                  >
                    <Filter className="w-4 h-4" /> Filtres
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                <p className="text-sm text-anthracite/50 mb-3">
                  {sortedTrips.length} trajet{sortedTrips.length !== 1 ? "s" : ""} trouvé
                  {sortedTrips.length !== 1 ? "s" : ""}
                </p>

                <div className="space-y-3">
                  {sortedTrips.length > 0 ? (
                    sortedTrips.map((trip) => <Trip key={trip.id} trip={trip} />)
                  ) : (
                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                      <p className="text-anthracite/60 mb-2">
                        Aucun trajet ne correspond à vos filtres.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="text-terracotta font-semibold hover:text-terracotta-dark"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drawer filtres mobile */}
          {showFiltersMobile && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-anthracite/40 backdrop-blur-sm"
                onClick={() => setShowFiltersMobile(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white shadow-xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="font-bold text-anthracite flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filtres
                  </h2>
                  <button
                    onClick={() => setShowFiltersMobile(false)}
                    className="w-9 h-9 rounded-lg hover:bg-offwhite flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <FiltersPanel
                    filteredTrips={filteredTrips}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    equipmentFilters={equipmentFilters}
                    toggleEquipment={toggleEquipment}
                    timeWindow={timeWindow}
                    setTimeWindow={setTimeWindow}
                    trips={trips}
                    selectedCompanies={selectedCompanies}
                    toggleCompany={toggleCompany}
                    resetFilters={resetFilters}
                  />
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowFiltersMobile(false)}
                    className="w-full py-3 rounded-xl text-white font-bold bg-terracotta hover:bg-terracotta-dark transition-colors"
                  >
                    Voir {sortedTrips.length} trajets
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Chiffres réels de la plateforme */}
      {!searchTriggered && trips.length > 0 && (
        <Reveal as="section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-4">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-6 grid grid-cols-3 divide-x divide-gray-100 text-center">
            <StatCounter
              value={trips.length}
              color="text-terracotta"
              label={(n) => `trajet${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`}
            />
            <StatCounter
              value={partnerCount}
              color="text-brand-green"
              label={(n) => `compagnie${n > 1 ? "s" : ""} partenaire${n > 1 ? "s" : ""}`}
            />
            <StatCounter
              value={realCitiesCount}
              color="text-saffron"
              label={(n) => `ville${n > 1 ? "s" : ""} desservie${n > 1 ? "s" : ""}`}
            />
          </div>
        </Reveal>
      )}

      {/* Trajets populaires */}
      {!searchTriggered && (
        <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-anthracite">Trajets populaires</h2>
            <p className="text-anthracite/50 mt-2 text-lg">
              Les routes les plus empruntées au Bénin
            </p>
          </div>

          {popularRoutes.length === 0 ? (
            <p className="text-anthracite/40 text-center py-12">
              Aucun trajet disponible pour l&apos;instant.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularRoutes.map((route, index) => {
                const routeImage = getRouteImage(route.from, route.to);
                return (
                  <Reveal
                    as="button"
                    key={`${route.from}-${route.to}`}
                    delay={index * 70}
                    onClick={() => handlePopularClick(route)}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-terracotta/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
                  >
                    {routeImage ? (
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={routeImage}
                          alt={`${route.from} - ${route.to}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-anthracite/75 via-anthracite/10 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white text-base font-bold">
                          <span>{route.from}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                          <span>{route.to}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-6 pt-6">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#D85A3015" }}
                        >
                          <TotemAnimal type={getCityAnimal(route.from)} size={22} color="#D85A30" />
                        </div>
                        <div className="flex items-center gap-2 text-base font-bold text-anthracite">
                          <span>{route.from}</span>
                          <ArrowRight className="w-4 h-4 text-anthracite/30" />
                          <span>{route.to}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-6 py-5">
                      <div className="flex items-center gap-1.5 text-sm text-anthracite/50">
                        <Clock className="w-4 h-4" />
                        {route.departsCount} départ{route.departsCount > 1 ? "s" : ""}
                      </div>
                      <div className="text-lg font-extrabold text-terracotta">
                        dès {route.minPrice.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </Reveal>
      )}

      {/* Recherches populaires — mêmes routes réelles que les cartes
          ci-dessus, présentées en pastilles compactes (utile pour repérer
          vite une destination sans photo). */}
      {!searchTriggered && allRoutes.length > 0 && (
        <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="text-xl font-bold text-anthracite mb-5">Recherches populaires</h2>
          <div className="flex flex-wrap gap-3">
            {allRoutes.map((route) => (
              <button
                key={`pill-${route.from}-${route.to}`}
                onClick={() => handlePopularClick(route)}
                className="px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-semibold text-anthracite/70 hover:border-terracotta/40 hover:text-terracotta transition-colors"
              >
                Bus de {route.from} à {route.to}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {/* Compagnies partenaires */}
      {!searchTriggered && companyNames.length > 0 && (
        <Reveal as="section" className="border-t border-gray-100 py-20 bg-offwhite">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-anthracite">
                Nos compagnies partenaires
              </h2>
              <p className="text-anthracite/50 mt-2 text-lg">
                {partnerCount} compagnie{partnerCount > 1 ? "s" : ""} de bus vérifiée
                {partnerCount > 1 ? "s" : ""} sur la plateforme
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {companyNames.map((name, index) => {
                const badge = getCompanyBadge(name);
                return (
                  <Reveal
                    key={name}
                    delay={index * 60}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${badge.color}15` }}
                    >
                      <TotemAnimal type={badge.animal} size={18} color={badge.color} />
                    </span>
                    <span className="text-sm font-bold text-anthracite truncate">{name}</span>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Avis de voyageurs réels — laissés depuis un trajet effectivement
          réservé (voir reviewController.createReview). Section masquée tant
          qu'aucun avis n'existe : pas de témoignage inventé. */}
      {!searchTriggered && reviews.length > 0 && (
        <Reveal as="section" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-anthracite">
                Ce que disent nos voyageurs
              </h2>
              <p className="text-anthracite/50 mt-2 text-lg">
                Avis laissés après un trajet réellement effectué sur AliGo
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map((review, index) => (
                <Reveal
                  key={review.id}
                  delay={index * 70}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  {review.rating != null && (
                    <div className="flex gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= review.rating ? "fill-saffron text-saffron" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-base text-anthracite/70 leading-relaxed mb-4">
                    &laquo; {review.content} &raquo;
                  </p>
                  <p className="text-sm font-bold text-anthracite">
                    {displayReviewerName(review.user?.travelerProfile?.name)}
                  </p>
                  <p className="text-xs text-anthracite/40">
                    Trajet avec {review.company?.companyName}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Confiance */}
      {!searchTriggered && (
        <Reveal as="section" className="border-t border-gray-100 py-20 bg-offwhite">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: <Shield className="w-7 h-7" />,
                  title: "Paiement sécurisé",
                  desc: "MTN MoMo et Moov Money acceptés. Remboursement garanti en cas d'annulation.",
                  color: "#D85A30",
                },
                {
                  icon: <Star className="w-7 h-7" />,
                  title: "Compagnies vérifiées",
                  desc: "Chaque partenaire est évalué sur la ponctualité, la sécurité et la qualité de service.",
                  color: "#0F6E56",
                },
                {
                  icon: <RefreshCw className="w-7 h-7" />,
                  title: "Temps réel",
                  desc: "Places disponibles, retards et annulations — tout est mis à jour en direct.",
                  color: "#E8B03D",
                },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 90} className="flex gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-anthracite">{item.title}</h3>
                    <p className="text-base text-anthracite/60 leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Contenu éditorial : pourquoi le bus, spécifique au contexte béninois
          (pas de statistique inventée ici, uniquement des arguments réels). */}
      {!searchTriggered && (
        <Reveal as="section" className="border-t border-gray-100 py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-anthracite mb-10">
              Pourquoi réserver son bus à l&apos;avance ?
            </h2>

            <div className="space-y-8">
              {[
                {
                  title: "Un départ à l'heure annoncée",
                  desc: "Avec AliGo, l'heure de départ est fixée et connue à l'avance — vous n'attendez pas que le véhicule se remplisse avant de partir, contrairement à beaucoup de gares routières traditionnelles.",
                },
                {
                  title: "Comparer avant de payer",
                  desc: "Plusieurs compagnies, plusieurs horaires, un seul endroit pour comparer les prix et les équipements (climatisation, WiFi) avant de choisir votre trajet.",
                },
                {
                  title: "Un siège garanti",
                  desc: "Vous choisissez votre place à la réservation. Pas de place debout, pas de surbooking : le siège que vous avez payé est le vôtre.",
                },
                {
                  title: "Paiement Mobile Money, sans espèces à transporter",
                  desc: "MTN MoMo et Moov Money directement depuis votre téléphone — pas besoin d'avoir du liquide sur vous au moment du départ.",
                },
              ].map((item, i) => (
                <Reveal
                  key={item.title}
                  delay={i * 80}
                  className="border-l-2 border-terracotta/30 pl-5"
                >
                  <h3 className="text-lg font-bold text-anthracite mb-1.5">{item.title}</h3>
                  <p className="text-base text-anthracite/60 leading-relaxed">{item.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function StatCounter({ value, color, label }) {
  const [count, ref] = useCountUp(value);
  return (
    <div ref={ref}>
      <p className={`text-2xl md:text-3xl font-extrabold ${color}`}>{count}</p>
      <p className="text-sm text-anthracite/50 mt-1">{label(value)}</p>
    </div>
  );
}

const TIME_WINDOWS = [
  { id: "all", label: "Toutes" },
  { id: "morning", label: "Matin (5h-12h)" },
  { id: "afternoon", label: "Après-midi (12h-19h)" },
  { id: "night", label: "Nuit (19h-5h)" },
];

function FiltersPanel({
  filteredTrips,
  maxPrice,
  setMaxPrice,
  equipmentFilters,
  toggleEquipment,
  timeWindow,
  setTimeWindow,
  trips,
  selectedCompanies,
  toggleCompany,
  resetFilters,
}) {
  const priceFloor = filteredTrips.length ? Math.min(...filteredTrips.map((t) => t.price)) : 0;
  const priceCeiling = filteredTrips.length ? Math.max(...filteredTrips.map((t) => t.price)) : 0;
  const hasPriceRange = priceCeiling > priceFloor;
  const companyNames = [...new Set(trips.map((t) => t.company?.companyName).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-anthracite mb-2">Prix maximum</h4>
        {hasPriceRange ? (
          <>
            <input
              type="range"
              min={priceFloor}
              max={priceCeiling}
              step={100}
              value={maxPrice ?? priceCeiling}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-terracotta"
            />
            <div className="flex justify-between text-xs text-anthracite/40 mt-1.5">
              <span>{priceFloor.toLocaleString("fr-FR")} F</span>
              <span className="font-bold text-terracotta">
                {(maxPrice ?? priceCeiling).toLocaleString("fr-FR")} F
              </span>
              <span>{priceCeiling.toLocaleString("fr-FR")} F</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-anthracite/50">{priceCeiling.toLocaleString("fr-FR")} FCFA</p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-anthracite mb-3">Heure de départ</h4>
        <div className="grid grid-cols-2 gap-2">
          {TIME_WINDOWS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeWindow(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left ${
                timeWindow === t.id
                  ? "bg-terracotta/10 text-terracotta border-terracotta/30"
                  : "bg-white text-anthracite/60 border-gray-200 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-anthracite mb-3">Compagnie</h4>
        <div className="space-y-1.5">
          {companyNames.map((name) => {
            const badge = getCompanyBadge(name);
            const active = selectedCompanies.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleCompany(name)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${badge.color}15` }}
                  >
                    <TotemAnimal type={badge.animal} size={15} color={badge.color} />
                  </span>
                  <span className="text-sm font-medium text-anthracite truncate">{name}</span>
                </span>
                <span
                  className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    active ? "bg-terracotta border-terracotta" : "border-gray-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-anthracite mb-3">Équipements</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-sm text-anthracite/70 cursor-pointer">
            <input
              type="checkbox"
              checked={equipmentFilters.ac}
              onChange={() => toggleEquipment("ac")}
              className="rounded accent-terracotta"
            />
            Climatisation
          </label>
          <label className="flex items-center gap-2.5 text-sm text-anthracite/70 cursor-pointer">
            <input
              type="checkbox"
              checked={equipmentFilters.wifi}
              onChange={() => toggleEquipment("wifi")}
              className="rounded accent-terracotta"
            />
            WiFi à bord
          </label>
        </div>
      </div>

      <button
        onClick={resetFilters}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-anthracite/60 border border-gray-200 hover:bg-offwhite transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
