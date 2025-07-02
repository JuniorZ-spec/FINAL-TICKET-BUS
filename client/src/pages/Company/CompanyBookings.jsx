import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { message, Table, Modal } from "antd";
import { useReactToPrint } from "react-to-print";
import { axiosInstance } from "../../helpers/axiosInstance";
import { ShowLoading, HideLoading } from "../../redux/alertsSlice";
import PageTitle from "../../components/PageTitle";
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Printer,
  XCircle,
} from "lucide-react";

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
          busName: booking.bus?.name || "N/A",
          passengerName: booking.user?.name || "N/A",
          busNumber: booking.bus?.number || "N/A",
          from: booking.trip?.from || "N/A",
          to: booking.trip?.to || "N/A",
          fare: booking.trip?.price || 0,
          departureDate: booking.trip?.date?.substring(0, 10) || "N/A",
          departureTime: booking.trip?.departureTime || "N/A",
          departureStation: booking.departureStation?.name || booking.departureStation || "N/A",
          arrivalStation: booking.arrivalStation?.name || booking.arrivalStation || "N/A",
          seats: Array.isArray(booking.seats)
            ? booking.seats.map((s) => (typeof s === "string" ? s : s?.number || "N/A"))
            : [],
          companyName: booking.company?.companyName || "N/A",
          key: booking._id,
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

  const columns = [



      {
      title: "Passager",
      render: (_, record) => (
        <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-900">{record.passengerName}</span>
                  </div>
                </div>
      ),
    },
    {
      title: "Trajet",
      render: (_, record) => (
        <div className="text-sm space-y-1">
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
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <Bus className="w-4 h-4 text-gray-500" />
            <span>{record.busName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">N°</span>
            <span>{record.busNumber}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Date & Heure",
      render: (_, record) => (
        <div className="text-sm space-y-1">
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
        <div className="text-sm space-y-1">
          <div className="text-gray-700">
            <strong>Départ:</strong> {record.departureStation}
          </div>
          <div className="text-gray-700">
            <strong>Arrivée:</strong> {record.arrivalStation}
          </div>
        </div>
      ),
    },
    {
      title: "Places",
      dataIndex: "seats",
      render: (seats) => (
        <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
          {seats.length > 0 ? seats.join(", ") : "N/A"}
        </span>
      ),
    },
    {
      title: "Montant",
      render: (_, record) => (
        <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
          <CreditCard className="w-4 h-4 text-gray-500" />
          {record.fare * record.seats.length} FCFA
        </div>
      ),
    },

        {
      title: "Actions",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
       
          <span
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
            onClick={() => cancelBooking(record.key)}
          >
            Annuler
          </span>
        </div>
      ),
    },
    
  ];

  const reactToPrintFn = useReactToPrint({
    content: () => contentRef.current,
  });

  useEffect(() => {
    getBookings();
  }, []);

  return (
    <div className="p-6 bg-gray-100 shadow-lg rounded-lg">
      <PageTitle title="Réservations" />

      <Table
        dataSource={bookings}
        columns={columns}
        pagination={{
          pageSize: 7,
          showSizeChanger: true,
          pageSizeOptions: ['5', '7', '10', '20'],
        }}
        rowKey="key"
        bordered
        locale={{ emptyText: "Aucune réservation disponible." }}
      />

      <Modal
        title="🖨️ Imprimer le Ticket"
        open={showPrintModal}
        onCancel={() => {
          setShowPrintModal(false);
          setSelectedBooking(null);
        }}
        onOk={() => {
          reactToPrintFn();
          setShowPrintModal(false);
        }}
      >
        <div ref={contentRef} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          {selectedBooking ? (
            <div className="space-y-2 text-sm">
              <h2 className="text-lg font-bold text-blue-600">🎫 Ticket de Réservation</h2>
              <p><strong>Compagnie :</strong> {selectedBooking.companyName}</p>
              <p><strong>Bus :</strong> {selectedBooking.busName} (N° {selectedBooking.busNumber})</p>
              <p><strong>Trajet :</strong> {selectedBooking.from} → {selectedBooking.to}</p>
              <p><strong>Stations :</strong> {selectedBooking.departureStation} → {selectedBooking.arrivalStation}</p>
              <p><strong>Date :</strong> {selectedBooking.departureDate}</p>
              <p><strong>Heure :</strong> {selectedBooking.departureTime}</p>
              <p><strong>Places :</strong> {selectedBooking.seats.join(", ")}</p>
              <p><strong>Total :</strong> {selectedBooking.fare * selectedBooking.seats.length} FCFA</p>
            </div>
          ) : (
            <p>Aucune réservation sélectionnée</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Bookings;
