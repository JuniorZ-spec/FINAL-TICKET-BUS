// Barre de progression fine en haut d'écran plutôt qu'un plein écran flouté
// avec une roue qui tourne : moins intrusif, ne bloque pas les clics, et
// donne une impression de chargement plus légère même quand la requête
// (souvent un cold start Neon) prend une seconde ou deux.
function Loader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-1 pointer-events-none overflow-hidden">
      <div
        className="h-full w-full animate-shimmer-bar"
        style={{
          backgroundImage: "linear-gradient(90deg, #D85A30, #E8B03D, #0F6E56, #E8B03D, #D85A30)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

export default Loader;
