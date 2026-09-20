import { useEffect, useState } from "react";
import { message } from "antd";
import { Building2, Bus, MapPin, Users, Wallet } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";

function AdminSchema() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/company-stats");
      if (response.data.success) setData(response.data.data);
      else message.error("Échec du chargement des statistiques.");
    } catch {
      message.error("Une erreur est survenue lors de la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPrice = (value) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(value) + " FCFA";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-anthracite">Statistiques par compagnie</h1>
        <p className="text-sm text-anthracite/50 mt-0.5">
          Vue synthétique des compagnies partenaires vérifiées
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-anthracite/40">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-anthracite/40 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={13} /> Compagnie
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Bus size={13} /> Trajets
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} /> Gares
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} /> Réservations
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet size={13} /> Revenus
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-anthracite/40">
                    Aucune compagnie vérifiée pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                data.map((c) => (
                  <tr key={c.companyId} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-anthracite">{c.companyName}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-terracotta/10 text-terracotta rounded-full">
                        {c.tripsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-saffron/15 text-saffron rounded-full">
                        {c.stationsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-brand-green/10 text-brand-green rounded-full">
                        {c.reservationsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-anthracite">
                      {formatPrice(c.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminSchema;
