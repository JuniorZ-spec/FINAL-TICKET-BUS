export default function WaxPattern({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wax-hex" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
            <polygon
              points="32,3 61,19 61,45 32,61 3,45 3,19"
              fill="none"
              stroke="#D85A30"
              strokeWidth="0.7"
              opacity="0.28"
            />
            <polygon
              points="32,16 48,25 48,39 32,48 16,39 16,25"
              fill="none"
              stroke="#0F6E56"
              strokeWidth="0.5"
              opacity="0.18"
            />
            <circle cx="32" cy="32" r="2.5" fill="#E8B03D" opacity="0.2" />
            <circle cx="3" cy="3" r="1.2" fill="#D85A30" opacity="0.15" />
            <circle cx="61" cy="3" r="1.2" fill="#D85A30" opacity="0.15" />
            <circle cx="3" cy="61" r="1.2" fill="#D85A30" opacity="0.15" />
            <circle cx="61" cy="61" r="1.2" fill="#D85A30" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wax-hex)" />
      </svg>
    </div>
  );
}
