import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, CreditCard, Printer, X } from 'lucide-react';
import { Modal, message } from 'antd';
import { axiosInstance } from '../helpers/axiosInstance';
import PrintTicket from '../components/PrintTicket';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const getBookings = async () => {
    try {
      const response = await axiosInstance.post('/api/bookings/get-bookings');
      if (response.data.success) {
        const mapped = response.data.data.map((b) => ({
          ...b,
          id: b._id,
          company: b.company?.companyName || 'N/A',
          passengerName: b.user?.name || 'Utilisateur',
          price: b.trip?.price || 0,
          date: b.trip?.date,
          departureTime: b.trip?.departureTime,
          arrivalTime: b.arrivalTime,
          departureCity: b.trip?.from,
          arrivalCity: b.trip?.to,
          seats: Array.isArray(b.seats) ? b.seats : [],
          status: b.status || 'confirmed',
          companyLogo: '🚌',
          departureStation: b.departureStation?.name,
          arrivalStation: b.arrivalStation?.name,
        }));
        setBookings(mapped);
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    getBookings();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';

  const getStatusBadge = (status) => {
    const classes = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const label = {
      confirmed: 'Confirmée',
      cancelled: 'Annulée',
      expired: 'Expirée',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${classes[status]}`}>
        {label[status]}
      </span>
    );
  };

  const cancelBooking = async (id) => {
    try {
      const response = await axiosInstance.post('/api/bookings/cancel-booking', { bookingId: id });
      if (response.data.success) {
        message.success('Réservation annulée');
        getBookings();
      } else {
        message.error(response.data.message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handlePrint = () => {
    if (!selectedBooking) return;

    const printContent = document.getElementById('print-ticket-content');
    if (!printContent) {
      message.error('Aucun contenu à imprimer');
      return;
    }

    const printWindow = window.open('', '_blank');

    // Récupère les styles de la page pour garder le style dans l'impression
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Bus</title>
          ${styles}
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
            .print-container { width: 350px; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);

    setShowPrintModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className="pb-12">
     

      <div className="overflow-x-auto">
        <table className="w-full rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Compagnie</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Passager</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Prix</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sièges</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Trajet</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date & Heure</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{b.companyLogo}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-md">{b.company}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-900">{b.passengerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(b.price * b.seats.length)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm bg-blue-200 px-2 py-1 rounded text-gray-800">
                    {b.seats.join(', ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="text-gray-900">{b.departureCity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-900">{b.arrivalCity}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{new Date(b.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>
                        {b.departureTime} → {b.arrivalTime}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        setShowPrintModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden xl:inline">Imprimer</span>
                    </button>
            {b.status === 'confirmed' && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden xl:inline">Annuler</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal pour l'aperçu + impression */}
      <Modal
        title="Aperçu du ticket"
        open={showPrintModal}
        onCancel={() => {
          setShowPrintModal(false);
          setSelectedBooking(null);
        }}
        footer={null}
      >
        {selectedBooking && (
          <div>
            <div id="print-ticket-content">
              <PrintTicket booking={selectedBooking} />
            </div>

            <div style={{ marginTop: '1rem', justifyContent:'space-between', display: 'flex'  , textAlign: 'right' }}>
              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding:'5px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Printer style={{ display: 'inline', marginRight: '0.3rem' }} />
                Imprimer
              </button> 

                <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
