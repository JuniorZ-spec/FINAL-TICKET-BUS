import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { Table, message, Modal } from "antd";
import { useReactToPrint } from "react-to-print";
import { Bus, Calendar, Clock, MapPin, Users, CreditCard, Printer, XCircle } from "lucide-react";

import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import { axiosInstance } from "../../helpers/axiosInstance";
import PageTitle from "../../components/PageTitle";

function Bookings() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const contentRef = useRef(null);

  const getBookings = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.get("/api/bookings/get-company-bookings");
      dispatch(HideLoading());

      if (response.data.success) {
        const mappedData = response.data.data.map((booking) => ({
          ...booking,
          busName: booking.trip?.bus?.name || "N/A",
          passengerName: booking.user?.name || "N/A",
          busNumber: booking.trip?.bus?.number || "N/A",
          from: booking.trip?.from || "N/A",
          to: booking.trip?.to || "N/A",
          fare: booking.trip?.price || 0,
          departureDate: booking.trip?.date?.substring(0, 10) || "N/A",
          departureTime: booking.trip?.departureTime || "N/A",
          departureStation: booking.trip?.departureStation?.name || "N/A",
          arrivalStation: booking.trip?.arrivalStation?.name || "N/A",
          seats: Array.isArray(booking.seats)
            ? booking.seats.map((s) => (typeof s === "string" ? s : s?.number || "N/A"))
            : [],
          companyName: booking.company?.companyName || "N/A",
          key: booking.id,
        }));

        setBookings(mappedData);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || error.message);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post("/api/bookings/cancel-booking", { bookingId });
      dispatch(HideLoading());

      if (response.data.success) {
        message.success("Réservation annulée");
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.response?.data?.message || error.message);
    }
  };

  const reactToPrintFn = useReactToPrint({
    content: () => contentRef.current,
  });

  useEffect(() => {
    getBookings();
  }, []);

  const columns = [
    {
      title: "Passager",
      render: (_, record) => (
        <div className="flex items-center gap-2 text-gray-800 text-sm">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{record.passengerName}</span>
        </div>
      ),
    },
    {
      title: "Trajet",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>{record.from}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{record.to}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Bus",
      render: (_, record) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1 text-gray-700">
            <Bus className="w-4 h-4 text-gray-500" />
            <span>{record.busName}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Date & Heure",
      render: (_, record) => (
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{record.departureDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{record.departureTime}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Stations",
      render: (_, record) => (
        <div className="space-y-1 text-xs text-gray-700">
          <div>{record.departureStation}</div>
          <div> {record.arrivalStation}</div>
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
        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-gray-800">
          <CreditCard className="w-4 h-4 text-green-600" />
          <span>{new Intl.NumberFormat("fr-FR").format(record.fare * record.seats.length)} F</span>
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
    <div className="p-2 bg-gray-100 min-h-screen">
      <Table
        dataSource={bookings}
        columns={columns}
        rowKey="key"
        bordered
        pagination={{
          pageSize: 6,
          showSizeChanger: true,
          pageSizeOptions: ["5", "6", "10", "20"],
          showTotal: (total) => `Total : ${total} réservations`,
        }}
        locale={{ emptyText: "Aucune réservation disponible." }}
        className="rounded-lg border border-gray-200 mt-4 shadow-sm"
        scroll={{ x: true }}
      />
    </div>
  );
}

export default Bookings;
