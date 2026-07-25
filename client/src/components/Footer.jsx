import { useNavigate } from "react-router-dom";
import { Bus } from "lucide-react";

const columns = [
  {
    title: "Voyager",
    links: [
      { label: "Rechercher un trajet", path: "/" },
      { label: "Trajets populaires", path: "/" },
      { label: "Mes billets", path: "/bookings" },
    ],
  },
  {
    title: "Colis",
    links: [
      { label: "Envoyer un colis", path: "/colis" },
      { label: "Suivre un colis", path: "/colis" },
    ],
  },
  {
    title: "Compagnies",
    links: [
      { label: "Espace compagnie", path: "/company/login" },
      { label: "Devenir partenaire", path: "/company/login" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center">
                <Bus className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-anthracite">
                AliGo<span className="text-terracotta">.bj</span>
              </span>
            </div>
            <p className="text-sm text-anthracite/60">
              L&apos;agrégateur neutre des bus et colis au Bénin. Comparez, réservez, voyagez.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-brand-green mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-sm text-anthracite/60 hover:text-terracotta transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-anthracite/40">
          © {new Date().getFullYear()} AliGo.bj — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
