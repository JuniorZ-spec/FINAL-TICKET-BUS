import { useEffect, useState } from "react";
import { message } from "antd";
import { axiosInstance } from "../../helpers/axiosInstance";
import PageTitle from "../../components/PageTitle";
import { MapPin, Calendar, Clock, X } from "lucide-react";

export default function AdminBooking() {
  const [bookings, setBookings] = useState([]);

  const getBookings = async () => {
    try {
      const response = await axiosInstance.get("/api/bookings/get-all-bookings");
      if (response.data.success) {
        const mappedData = response.data.data.map((booking) => ({
          id: booking._id,
          companyName: booking.company?.companyName || "N/A",
          passengerName: booking.user?.name || "Utilisateur",
          price: booking.trip?.price || 0,
          departureDate: booking.trip?.date?.substring(0, 10) || "N/A",
          departureTime: booking.trip?.departureTime || "N/A",
          departureStation: booking.departureStation?.name || "N/A",
          arrivalStation: booking.arrivalStation?.name || "N/A",
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

  const formatPrice = (price) =>
    new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

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

  return (
    <div className="p-6 bg-white min-h-screen max-w-7xl mx-auto">
      <PageTitle title="Réservations" />
      <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="w-[160px] px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                Compagnie
              </th>
              <th className="w-[140px] px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                Passager
              </th>
              <th className="w-[200px] px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                Stations
              </th>
              <th className="w-[140px] px-4 py-3 text-left font-semibold text-gray-600 uppercase">
                Date & Heure
              </th>
              <th className="w-[100px] px-4 py-3 text-center font-semibold text-gray-600 uppercase">
                Places
              </th>
              <th className="w-[120px] px-4 py-3 text-right font-semibold text-gray-600 uppercase">
                Montant
              </th>
              <th className="w-[100px] px-4 py-3 text-center font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500">
                  Aucune réservation trouvée.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 py-3 font-semibold text-gray-900 truncate" title={b.companyName}>
                  {b.companyName}
                </td>
                <td className="px-4 py-3 truncate" title={b.passengerName}>
                  {b.passengerName}
                </td>
                <td className="px-4 py-3 break-words">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 truncate" title={b.departureStation}>
                      <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="truncate max-w-full">{b.departureStation}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate" title={b.arrivalStation}>
                      <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="truncate max-w-full">{b.arrivalStation}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 break-words">
                  <div className="flex flex-col gap-1 text-gray-700 text-sm">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{new Date(b.departureDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{b.departureTime}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-mono px-2 py-1 rounded">
                    {b.seats.length > 0 ? b.seats.join(", ") : "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(b.price * b.seats.length)}
                </td>
                <td className="px-4 py-3 text-center">
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
                      title="Annuler la réservation"
                    >
                     
                      <span className="hidden md:inline">Annuler</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
