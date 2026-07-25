import { PackageSearch } from "lucide-react";
import WaxPattern from "../components/WaxPattern";

export default function Colis() {
  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-24 bg-offwhite">
      <WaxPattern />
      <div className="relative w-16 h-16 rounded-full bg-saffron/20 flex items-center justify-center mb-6">
        <PackageSearch className="h-8 w-8 text-saffron" />
      </div>
      <h1 className="relative text-2xl font-bold text-anthracite mb-2">
        Envoi de colis — bientôt disponible
      </h1>
      <p className="relative text-anthracite/60 max-w-md">
        Comparez et envoyez vos colis entre villes avec les mêmes compagnies que pour vos trajets.
        Cette fonctionnalité arrive prochainement sur AliGo.
      </p>
    </div>
  );
}
