import React, { useEffect } from "react";
import { UserOutlined } from "@ant-design/icons";

const SeatSelection = ({ selectedSeats = [], setSelectedSeats, bus }) => {
  const rows = 10;
  const seatsPerSide = 2;

  useEffect(() => {
    const styleId = "seat-hover-style";
    if (!document.getElementById(styleId)) {
      const hoverStyle = document.createElement("style");
      hoverStyle.id = styleId;
      hoverStyle.innerHTML = `
        .seat-hover:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.20);
        }
      `;
      document.head.appendChild(hoverStyle);
    }
  }, []);

  console.log("Bus reçu dans SeatSelection :", bus);

  if (!bus) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "gray" }}>
        Chargement des données du bus...
      </div>
    );
  }

  const bookedSeats = (bus.seatsBooked || []).map((seat) => seat.toString());

  const selectOrUnselectSeats = (seatId) => {
    const seatStr = seatId.toString();
    if (bookedSeats.includes(seatStr)) return;

    setSelectedSeats((prev) =>
      prev.includes(seatStr) ? prev.filter((s) => s !== seatStr) : [...prev, seatStr]
    );
  };

  const renderRow = (rowIndex) => {
    const leftSeats = [];
    const rightSeats = [];

    const renderSeat = (seatId) => {
      const seatStr = seatId.toString();
      const isBooked = bookedSeats.includes(seatStr);
      const isSelected = selectedSeats.includes(seatStr);

      const iconColor = isBooked || isSelected ? "white" : "grey";
      const textColor = isBooked || isSelected ? "white" : "black";

      return (
        <div
          key={seatId}
          className="seat-hover"
          title={`Siège ${seatId}`}
          style={{
            ...styles.seat,
            ...(isBooked ? styles.booked : isSelected ? styles.selected : styles.available),
          }}
          onClick={isBooked ? undefined : () => selectOrUnselectSeats(seatId)}
        >
          <UserOutlined style={{ color: iconColor }} />
          <span style={{ fontSize: "11px", marginTop: "1px", color: textColor }}>{seatId}</span>
        </div>
      );
    };

    for (let i = 0; i < seatsPerSide; i++) {
      const leftSeatId = rowIndex * seatsPerSide * 2 + i + 1;
      const rightSeatId = rowIndex * seatsPerSide * 2 + i + seatsPerSide + 1;

      leftSeats.push(renderSeat(leftSeatId));
      rightSeats.push(renderSeat(rightSeatId));
    }

    return (
      <div key={rowIndex} style={styles.row}>
        <div style={styles.side}>{leftSeats}</div>
        <div style={styles.aisle}></div>
        <div style={styles.side}>{rightSeats}</div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.layout}>{[...Array(rows)].map((_, index) => renderRow(index))}</div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "10px",
    color: "white",
  },
  layout: {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px",
    border: "1px solid #ddd",
    width: "fit-content",
    margin: "0 auto",
    backgroundColor: "white",
  },
  row: {
    display: "flex",
    marginBottom: "5px",
  },
  side: {
    display: "flex",
    gap: "10px",
  },
  aisle: {
    width: "75px",
  },
  seat: {
    width: "50px",
    height: "35px",
    border: "1px solid gray",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
    userSelect: "none",
  },
  available: {
    backgroundColor: "rgba(0, 180, 255, 0.2)",
    borderColor: "#007bff",
    color: "#007bff",
  },
  selected: {
    backgroundColor: "#52c41a",
    borderColor: "grey",
    color: "white",
  },
  booked: {
    backgroundColor: "#dc3545",
    borderColor: "#a71d2a",
    color: "white",
    cursor: "not-allowed",
    pointerEvents: "none",
  },
};

export default SeatSelection;
