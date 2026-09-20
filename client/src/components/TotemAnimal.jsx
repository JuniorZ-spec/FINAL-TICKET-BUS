const KNOWN = ["shark", "lion", "eagle", "elephant", "panther", "chameleon"];

// Villes du Bénin -> animal-totem (esprit appliqués d'Abomey, avec parcimonie)
export const CITY_ANIMALS = {
  Cotonou: "shark",
  Parakou: "lion",
  Bohicon: "eagle",
  Natitingou: "elephant",
  "Porto-Novo": "panther",
  Djougou: "chameleon",
  Abomey: "lion",
};

export function getCityAnimal(city) {
  return CITY_ANIMALS[city] || "eagle";
}

// Palette de badges (icône + couleur) attribuée de façon déterministe à chaque
// compagnie — un simple repère visuel, pas une donnée réelle sur la compagnie.
const COMPANY_BADGES = [
  { animal: "lion", color: "#D85A30" },
  { animal: "eagle", color: "#0F6E56" },
  { animal: "shark", color: "#E8B03D" },
  { animal: "elephant", color: "#B84020" },
  { animal: "panther", color: "#0B5443" },
  { animal: "chameleon", color: "#9A6C00" },
];

export function getCompanyBadge(companyName = "") {
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = (hash * 31 + companyName.charCodeAt(i)) >>> 0;
  }
  return COMPANY_BADGES[hash % COMPANY_BADGES.length];
}

export default function TotemAnimal({ type, size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      {type === "shark" && (
        <path d="M3 13 C7 5 11 9 12 11 C13 9 17 5 21 13 C17 17 14 15 12 14 C10 15 7 17 3 13Z M12 14 L10.5 20 L13.5 20Z" />
      )}
      {type === "lion" && (
        <>
          <circle cx="12" cy="11" r="4.5" />
          <path d="M7.5 9 Q5 6 7 5 Q9 7 8 9Z M16.5 9 Q19 6 17 5 Q15 7 16 9Z M9.5 9 Q8 6 10 6 Q11 8 10 9Z M14.5 9 Q16 6 14 6 Q13 8 14 9Z" />
          <ellipse cx="12" cy="17" rx="4" ry="3" />
        </>
      )}
      {type === "eagle" && (
        <path d="M12 3 L5 13 L9.5 11 L9.5 19 L12 21 L14.5 19 L14.5 11 L19 13 Z" />
      )}
      {type === "elephant" && (
        <>
          <ellipse cx="13.5" cy="11" rx="6" ry="5" />
          <ellipse cx="7" cy="13.5" rx="3" ry="2" />
          <path
            d="M4.5 13 Q3 18 6.5 19 Q7.5 17 5 14.5"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="9" r="1" fill="white" />
        </>
      )}
      {type === "panther" && (
        <>
          <ellipse cx="12" cy="12" rx="7" ry="4.5" />
          <path d="M5.5 10 Q3.5 7 5.5 6.5 Q7 8.5 6.5 10Z M18.5 10 Q20.5 7 18.5 6.5 Q17 8.5 17.5 10Z" />
          <path
            d="M8 16 Q9 20 10 20 M14 16 Q15 20 16 20"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {type === "chameleon" && (
        <>
          <ellipse cx="11.5" cy="13" rx="6" ry="3.5" />
          <circle cx="8" cy="11" r="1.8" />
          <path
            d="M17.5 11 Q22 8 22 5"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M5.5 14.5 Q3.5 18 2.5 20"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="10.5" r="0.7" fill="white" />
        </>
      )}
      {!KNOWN.includes(type) && <circle cx="12" cy="12" r="6" />}
    </svg>
  );
}
