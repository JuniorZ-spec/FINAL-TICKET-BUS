import { useSelector, useDispatch } from "react-redux";
import { message } from "antd";
import { HideLoading, ShowLoading } from "../redux/alertsSlice";
import { axiosInstance } from "../helpers/axiosInstance";
import { useEffect, useState } from "react";
import Trip from "../components/Trip";
import WaxPattern from "../components/WaxPattern";
import TotemAnimal, { getCityAnimal } from "../components/TotemAnimal";

import {
  Clock,
  Shield,
  MapPin,
  ArrowRight,
  ArrowLeftRight,
  Star,
  Filter,
  Search,
  Bus,
  Calendar,
  RefreshCw,
  Wifi,
  Wind,
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
  const [sortOrder, setSortOrder] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [serviceFilter, setServiceFilter] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [tripType, setTripType] = useState("aller");

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

  const resetFilters = () => {
    // Réinitialiser uniquement les filtres secondaires
    setSelectedTimeRange(null);
    setSelectedCompany(null);
    setServiceFilter(null);
    setSortOrder(null);

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

  const handlePopularClick = (trip) => {
    const customFilters = {
      ...filters,
      from: trip.from,
      to: trip.to,
      journeyDate: new Date().toISOString().split("T")[0],
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
      const matchesTime = selectedTimeRange
        ? hour >= selectedTimeRange[0] && hour < selectedTimeRange[1]
        : true;
      const matchesCompany = selectedCompany
        ? trip.company?.companyName?.toLowerCase() === selectedCompany.toLowerCase()
        : true;

      return matchesFrom && matchesTo && matchesDate && matchesTime && matchesCompany;
    });

    if (serviceFilter === "clim") result = result.filter((trip) => trip.bus?.airConditioning);
    if (serviceFilter === "wifi") result = result.filter((trip) => trip.bus?.wifi);
    if (serviceFilter === "clim-wifi")
      result = result.filter((trip) => trip.bus?.airConditioning && trip.bus?.wifi);

    if (maxPrice != null) result = result.filter((trip) => trip.price <= maxPrice);

    if (searchTriggered && filteredTrips.length > 0 && result.length === 0) {
      message.warning("Aucun voyage trouvé pour vos critères.");
    }

    setDisplayedTrips(result);
  };

  useEffect(() => {
    applyAllFilters();
  }, [filteredTrips, selectedCompany, selectedTimeRange, serviceFilter, maxPrice]);

  const sortedTrips = [...displayedTrips].sort((a, b) => {
    const getTimeInMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    if (sortOrder === "asc") return a.price - b.price;
    if (sortOrder === "desc") return b.price - a.price;
    if (sortOrder === "time-asc")
      return getTimeInMinutes(a.departureTime) - getTimeInMinutes(b.departureTime);
    if (sortOrder === "time-desc")
      return getTimeInMinutes(b.departureTime) - getTimeInMinutes(a.departureTime);
    return 0;
  });

  const cities = getCities();

  return (
    <div className="w-full">
      {/* SECTION HERO + FORMULAIRE DE RECHERCHE */}
      <section className="relative overflow-hidden bg-offwhite pt-20 pb-12 px-4">
        <WaxPattern />
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: "linear-gradient(90deg, #D85A30, #E8B03D, #0F6E56)" }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto mb-14">
          <span
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: "#E8B03D22", color: "#9A6C00" }}
          >
            <span className="w-2 h-2 rounded-full bg-saffron" />
            Agrégateur de bus N°1 au Bénin — {partnerCount || 4} compagnies comparées en un clic
          </span>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-7 text-anthracite max-w-3xl mx-auto"
            style={{ lineHeight: 1.15, fontWeight: 900 }}
          >
            Tous les bus du Bénin,
            <br />
            <span className="text-terracotta">comparés en un coup d&apos;œil.</span>
          </h1>
          <p className="text-xl text-anthracite/60 max-w-2xl mx-auto leading-relaxed">
            Comparez toutes les compagnies de bus, choisissez votre siège, payez en Mobile Money.
            Simple, rapide, fier.
          </p>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
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

              <div className="md:col-span-1">
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
                    className="w-full pl-11 pr-2 py-4 border border-gray-200 rounded-2xl bg-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-terracotta/30"
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

      {searchTriggered && (
        <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
          {/* Fil d'ariane */}
          <button
            onClick={() => setSearchTriggered(false)}
            className="flex items-center gap-2 text-sm text-anthracite/50 hover:text-anthracite mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Nouvelle recherche
          </button>

          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-anthracite flex items-center gap-3">
                <span>{filters.from}</span>
                <ArrowRight className="w-6 h-6 text-terracotta" />
                <span>{filters.to}</span>
              </h1>
              <p className="text-anthracite/50 mt-1">
                {filteredTrips.length} trajet{filteredTrips.length !== 1 ? "s" : ""} trouvé
                {filteredTrips.length !== 1 ? "s" : ""} ·{" "}
                {new Date(filters.journeyDate).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {filteredTrips.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-anthracite/50">Trier par</span>
                <select
                  value={sortOrder || ""}
                  onChange={(e) => setSortOrder(e.target.value || null)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  <option value="">Prix et heure</option>
                  <option value="asc">Prix croissant</option>
                  <option value="desc">Prix décroissant</option>
                  <option value="time-asc">Départ le plus tôt</option>
                  <option value="time-desc">Départ le plus tard</option>
                </select>
              </div>
            )}
          </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filtres à gauche */}
              <aside className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8 h-fit">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-terracotta flex items-center gap-2">
                    <Filter className="w-5 h-5 shrink-0" />
                    <span className="leading-none">Filtres</span>
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-terracotta hover:text-terracotta-dark font-medium"
                  >
                    Réinitialiser
                  </button>
                </div>

                {/* Prix max */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Prix max</span>
                    <span className="text-terracotta font-bold">{maxPrice ?? 0} FCFA</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={filteredTrips.length ? Math.max(...filteredTrips.map((t) => t.price)) : 0}
                    step={100}
                    value={maxPrice ?? 0}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-terracotta"
                  />
                </div>

                {/* Heure de départ */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-saffron" />
                    Heure de départ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "6h-12h", range: [6, 12] },
                      { label: "12h-18h", range: [12, 18] },
                      { label: "18h-24h", range: [18, 24] },
                      { label: "0h-6h", range: [0, 6] },
                    ].map(({ label, range }) => (
                      <button
                        key={label}
                        onClick={() =>
                          setSelectedTimeRange(selectedTimeRange?.[0] === range[0] ? null : range)
                        }
                        className={`text-xs px-3 py-1 rounded-full border ${
                          selectedTimeRange?.[0] === range[0]
                            ? "border-terracotta bg-terracotta/10"
                            : "border-gray-300"
                        } hover:bg-terracotta/10 transition-all`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confort */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Wind className="w-4 h-4 text-brand-green" />
                    Confort
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Wi-Fi", value: "wifi", icon: Wifi },
                      { label: "Clim", value: "clim", icon: Wind },
                    ].map(({ label, value, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setServiceFilter(serviceFilter === value ? null : value)}
                        className={`flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl border ${
                          serviceFilter === value
                            ? "border-brand-green bg-brand-green/10 text-brand-green"
                            : "border-gray-300 text-anthracite/60"
                        } transition-all`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compagnies */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-anthracite/70">
                    <Bus className="w-5 h-5 text-brand-green" />
                    Compagnies
                  </label>
                  <div className="flex flex-col space-y-2">
                    {[...new Set(trips.map((t) => t.company?.companyName).filter(Boolean))].map(
                      (name) => (
                        <label
                          key={name}
                          className="flex items-center gap-3 text-sm text-anthracite/70"
                        >
                          <input
                            type="radio"
                            name="selectedCompany"
                            checked={selectedCompany === name}
                            onChange={() => setSelectedCompany(name)}
                            className="rounded border-gray-300 text-terracotta focus:ring-terracotta"
                          />
                          <span>{name}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </aside>

              {/* Résultats à droite */}
              <div className="lg:col-span-3 space-y-4">
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
          )}
        </section>
      )}

      {/* Trajets populaires */}
      {!searchTriggered && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-anthracite">Trajets populaires</h2>
            <p className="text-anthracite/50 mt-2 text-lg">
              Les routes les plus empruntées au Bénin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { from: "Cotonou", to: "Parakou", fallbackPrice: 8000 },
              { from: "Ouidah", to: "Parakou", fallbackPrice: 9000 },
              { from: "Cotonou", to: "Bohicon", fallbackPrice: 3000 },
              { from: "Cotonou", to: "Natitingou", fallbackPrice: 9500 },
              { from: "Cotonou", to: "Djougou", fallbackPrice: 8500 },
              { from: "Porto-Novo", to: "Cotonou", fallbackPrice: 1500 },
            ].map((route, index) => {
              const matching = trips.filter(
                (t) =>
                  t.from.toLowerCase() === route.from.toLowerCase() &&
                  t.to.toLowerCase() === route.to.toLowerCase()
              );
              const departsCount = matching.length;
              const minPrice = departsCount
                ? Math.min(...matching.map((t) => t.price))
                : route.fallbackPrice;

              return (
                <button
                  key={index}
                  onClick={() => handlePopularClick(route)}
                  className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-terracotta/30 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-5">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-anthracite/50">
                      <Clock className="w-4 h-4" />
                      {departsCount > 0
                        ? `${departsCount} départ${departsCount > 1 ? "s" : ""}`
                        : "Bientôt"}
                    </div>
                    <div className="text-lg font-extrabold text-terracotta">
                      dès {minPrice} FCFA
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Confiance */}
      {!searchTriggered && (
        <section className="border-t border-gray-100 py-20 bg-offwhite">
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
                <div key={i} className="flex gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-anthracite">{item.title}</h3>
                    <p className="text-base text-anthracite/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
