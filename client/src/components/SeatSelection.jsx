import { User } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

const SeatSelection = ({ selectedSeats = [], setSelectedSeats, bus }) => {
  if (!bus) {
    return (
      <div className="text-center py-10 text-anthracite/40 text-sm">
        Chargement du plan des sièges...
      </div>
    );
  }

  const capacity = bus.capacity || 40;
  const bookedSeats = (bus.seatsBooked || []).map((seat) => seat.toString());

  const selectOrUnselectSeats = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const renderSeat = (seatId) => {
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);

    return (
      <button
        key={seatId}
        type="button"
        title={`Siège ${seatId}`}
        disabled={isBooked}
        onClick={() => selectOrUnselectSeats(seatId)}
        className={`w-11 h-11 rounded-t-lg border flex flex-col items-center justify-center text-[11px] font-semibold transition-all ${
          isBooked
            ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
            : isSelected
              ? "bg-terracotta border-terracotta text-white scale-105 shadow-sm"
              : "bg-white border-gray-200 text-anthracite/60 hover:border-terracotta/40 hover:scale-105"
        }`}
      >
        <User size={13} />
        <span className="mt-0.5">{seatId}</span>
      </button>
    );
  };

  const rows = [];
  let remaining = capacity;
  let rowNum = 1;
  while (remaining > 0) {
    const count = Math.min(4, remaining);
    const labels = LETTERS.slice(0, count).map((l) => `${l}${rowNum}`);
    rows.push({ rowNum, left: labels.slice(0, 2), right: labels.slice(2, 4) });
    remaining -= count;
    rowNum++;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-6 mb-5 text-xs text-anthracite/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded border border-gray-300 bg-white inline-block" />{" "}
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-terracotta inline-block" /> Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-gray-300 inline-block" /> Occupé
        </span>
      </div>

      <div className="bg-offwhite rounded-2xl border border-gray-100 p-6 w-fit mx-auto">
        <div className="flex flex-col items-center gap-1.5">
          {rows.map((row) => (
            <div key={row.rowNum} className="flex items-center gap-3">
              <div className="flex gap-1.5">{row.left.map(renderSeat)}</div>
              <span className="w-5 text-center text-[10px] text-anthracite/30 font-mono">
                {row.rowNum}
              </span>
              <div className="flex gap-1.5">{row.right.map(renderSeat)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
