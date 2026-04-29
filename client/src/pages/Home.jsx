import { useSelector, useDispatch } from "react-redux";
import { message, Row, Col } from "antd";
import { HideLoading, ShowLoading } from "../redux/alertsSlice";
import { axiosInstance } from "../helpers/axiosInstance";
import { useEffect, useState } from "react";
import Trip from "../components/Trip";
import backgroundImage from "../assets/Z.jpg";
import CotonouParakou from "../assets/CotonouParakou.jpg";
import OuidahParakou from "../assets/OuidahParakou.jpg";
import CotonouBohicon from "../assets/CotonouBohicon.jpeg";

import {
  Clock,
  Shield,
  MapPin,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Star,
  Filter,
  Users,
  Search,
  Bus,
  Euro,
} from "lucide-react";

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
  const [priceRange, setPriceRange] = useState([0, 100]);

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

  const getTripImage = (from, to) => {
    const routeKey = `${from.toLowerCase()}-${to.toLowerCase()}`;
    switch (routeKey) {
      case "cotonou-parakou":
        return CotonouParakou;
      case "ouidah-parakou":
        return OuidahParakou;
      case "cotonou-bohicon":
        return CotonouBohicon;
      default:
        return CotonouParakou;
    }
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
      const matchesTime = selectedTimeRange
        ? hour >= selectedTimeRange[0] && hour < selectedTimeRange[1]
        : true;
      const matchesCompany = selectedCompany
        ? trip.company?.companyName?.toLowerCase() === selectedCompany.toLowerCase()
        : true;

      return matchesFrom && matchesTo && matchesDate && matchesTime && matchesCompany;
    });

    if (serviceFilter === "clim") result = result.filter((trip) => trip.climatisation);
    if (serviceFilter === "wifi") result = result.filter((trip) => trip.wifi);
    if (serviceFilter === "clim-wifi")
      result = result.filter((trip) => trip.climatisation && trip.wifi);

    if (result.length === 0) {
      message.warning("Aucun voyage trouvé pour vos critères.");
    }

    setDisplayedTrips(result);
  };

  useEffect(() => {
    applyAllFilters();
  }, [filteredTrips, selectedCompany, selectedTimeRange, serviceFilter]);

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

  return (
    <div className="w-full">
      {/* SECTION IMAGE DE FOND + FORMULAIRE */}
      <section
        className="relative h-[300px] bg-cover bottom-5 bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, fontFamily: "Poppins, sans-serif" }}
      >
        <div className="absolute inset-0 bg-black/50 z-0" />

        <div className="relative mb-1 z-10 text-white text-center pt-24 pb-1">
          <span className="text-4xl mt-1 font-bold mb-1">
            Réservez votre bus en toute simplicité{" "}
          </span>
          <p className="text-lg">Comparez les prix et horaires de toutes les compagnies</p>
        </div>

        <div className="relative z-40 max-w-6xl mx-auto px-2">
          <div className="bg-white rounded-xl  border border-gray-200 p-6">
            <Row gutter={[24, 24]}>
              <Col lg={8} xs={16}>
                <div className="relative">
                  <MapPin className="absolute left-15 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                  <input
                    type="text"
                    name="from"
                    autoComplete="on"
                    placeholder="Lieu de départ"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    className="w-full text-md border-2 border bg-white text-gray-400 text-center font-semibold border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </Col>
              <Col lg={8} xs={24}>
                <div className="relative">
                  <MapPin className="absolute left-15 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                  <input
                    type="text"
                    name="to"
                    placeholder="Lieu d'arrivée"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    className="w-full text-md border-2 border bg-white text-gray-400 text-center font-semibold border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full border-2 text-md text-gray-400 border-gray-100 p-3 border rounded-lg bg-white font-semibold focus:outline-none focus:border-blue-500"
                  style={{ color: "#4B5563" }}
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]} className="mt-4">
              <Col lg={12} xs={24}>
                <button
                  style={{ borderRadius: "12px", fontFamily: "Poppins, sans-serif" }}
                  className="w-full bg-gradient-to-br from-emerald-600 to-blue-600  hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md flex items-center justify-center space-x-2"
                  onClick={() => handleFilter(filters)}
                >
                  <Search className="h-5 w-5" />
                  <span>Filtrer les résultats</span>
                </button>
              </Col>
              <Col lg={12} xs={24}>
                <button
                  style={{ borderRadius: "12px", fontFamily: "Poppins, sans-serif" }}
                  className="w-full bg-gradient-to-br from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md"
                  onClick={resetFilters}
                >
                  Réinitialiser
                </button>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {searchTriggered && filteredTrips.length > 0 && (
        <section className="px-4 py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filtres à gauche */}
            <aside className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-8 text-gray-700">
              {/* En-tête */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                  <Filter className="w-5 h-5 shrink-0" />
                  <span className="leading-none">Filtres</span>
                </h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Trier par */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold">Trier par</label>
                <select
                  value={sortOrder || ""}
                  onChange={(e) => setSortOrder(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">Prix et Heure</option>
                  <option value="asc">Prix : Le moins cher</option>
                  <option value="time-asc">Départ le plus tôt</option>
                  <option value="time-desc">Départ le plus tard</option>
                </select>
              </div>

              {/* Heure de départ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
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
                      onClick={() => setSelectedTimeRange(range)}
                      className={`text-xs px-3 py-1 rounded-lg border ${
                        selectedTimeRange?.[0] === range[0]
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300"
                      } hover:bg-blue-50 transition-all`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compagnies */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Bus className="w-5 h-5 text-green-500" />
                  Compagnies
                </label>
                <div className="flex flex-col space-y-2">
                  {[...new Set(trips.map((t) => t.company?.companyName).filter(Boolean))].map(
                    (name) => (
                      <label key={name} className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="selectedCompany"
                          checked={selectedCompany === name}
                          onChange={() => setSelectedCompany(name)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{name}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </aside>

            {/* Résultats à droite */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">
                      {filters.from} → {filters.to}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {new Date(filters.journeyDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredTrips.length} trajet{filteredTrips.length !== 1 ? "s" : ""} trouvé
                    {filteredTrips.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedTrips.length > 0 ? (
                  sortedTrips.map((trip) => <Trip key={trip.id} trip={trip} />)
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    Aucun trajet disponible pour votre recherche
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trajets populaires */}
      {!searchTriggered && (
        <section className="py-46 pt-40 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Titre */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <h2 className="text-4xl font-bold text-gray-900">Trajets Populaires</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Découvrez nos destinations les plus demandées avec des prix avantageux
              </p>
            </div>

            {/* Trajets fixes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 px-8">
              {[
                { from: "Cotonou", to: "Parakou", price: 8000 },
                { from: "Ouidah", to: "Parakou", price: 9000 },
                { from: "Cotonou", to: "Bohicon", price: 3000 },
              ].map((trip, index) => (
                <div
                  key={index}
                  className="bg-white w-full max-w-md mx-auto rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer overflow-hidden"
                  onClick={() => handlePopularClick(trip)}
                >
                  <img
                    src={getTripImage(trip.from, trip.to)}
                    alt={`${trip.from} → ${trip.to}`}
                    className="w-full h-42 object-cover rounded-t-xl"
                  />

                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-center text-md font-bold text-gray-900">{trip.from}</div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <div className="w-6 h-px bg-gray-300" />
                        <ArrowRight className="h-4 w-4" />
                        <div className="w-6 h-px bg-gray-300" />
                      </div>
                      <div className="text-center text-md font-bold text-gray-900">{trip.to}</div>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">Très demandé</span>
                    </div>

                    <div className="text-center mb-2">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{trip.price} FCFA</div>
                    </div>

                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                      style={{ borderRadius: "12px", fontFamily: "Poppins, sans-serif" }}
                    >
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
                  Utilisez notre moteur de recherche pour découvrir des centaines de trajets
                  disponibles au Bénin
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                  Voir toutes les destinations
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
