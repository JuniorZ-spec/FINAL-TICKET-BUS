import { useEffect, useState } from "react";
import { Table, message, Button } from "antd";
import { MapPin, Calendar, Clock, CreditCard } from "lucide-react";
import { axiosInstance } from "../../helpers/axiosInstance";
import PageTitle from "../../components/PageTitle";

export default function AdminBooking() {
  const [bookings, setBookings] = useState([]);

  const getBookings = async () => {
    try {
      const response = await axiosInstance.get("/api/bookings/get-all-bookings");
      if (response.data.success) {
        const mappedData = response.data.data.map((booking) => ({
          key: booking.id,
          companyName: booking.company?.companyName || "N/A",
          passengerName: booking.user?.name || "Utilisateur",
          price: booking.trip?.price || 0,
          date: booking.trip?.date || "N/A",
          time: booking.trip?.departureTime || "N/A",
          departureStation: booking.trip?.departureStation?.name || "N/A",
          arrivalStation: booking.trip?.arrivalStation?.name || "N/A",
          seats: Array.isArray(booking.seats) ? booking.seats : [],
          status: booking.status || "confirmed",
        }));
        setBookings(mappedData);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  useEffect(() => {
    getBookings();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const cancelBooking = async (id) => {
    try {
      const response = await axiosInstance.post("/api/bookings/cancel-booking", {
        bookingId: id,
      });
      if (response.data.success) {
        message.success("Réservation annulée");
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: "Compagnie",
      dataIndex: "companyName",
      render: (text) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: "Passager",
      dataIndex: "passengerName",
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: "Stations",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-gray-800">{record.departureStation}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="text-gray-800">{record.arrivalStation}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Date & Heure",
      render: (_, record) => (
        <div className="text-xs text-gray-700 space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(record.date).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{record.time}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Places",
      dataIndex: "seats",
      render: (seats) => (
        <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {seats.length > 0 ? seats.join(", ") : "N/A"}
        </span>
      ),
    },
    {
      title: "Montant",
      render: (_, record) => (
        <div className="flex items-center gap-2 text-sm justify-end">
          <CreditCard className="w-5 h-5 text-green-600" />
          <span>{formatPrice(record.price * record.seats.length)}</span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <button
          onClick={() => cancelBooking(record.key)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
          style={{ borderRadius: "8px" }}
        >
          Annuler
        </button>
      ),
    },
  ];

  return (
    <div className="p-2 pt-1 min-h-screen max-w-9xl mx-auto">
      <Table
        columns={columns}
        dataSource={bookings}
        pagination={{ pageSize: 5 }}
        className="rounded-lg border border-gray-200"
      />
    </div>
  );
}
