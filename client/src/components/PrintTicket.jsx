import { Calendar, Clock, MapPin } from 'lucide-react';

export default function PrintTicket({ booking }) {
  if (!booking) return null;

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: 'white',
        color: 'black',
        width: 320,
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        lineHeight: 1.4,
        borderRadius: 8,
        boxShadow: '0 0 8px rgba(0,0,0,0.1)',
        margin: 'auto',
      }}
    >
      {/* En-tête */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1px solid #ccc',
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 38 }}>{booking.companyLogo}</div>
        <h3 style={{ fontWeight: '700', fontSize: 18, margin: '8px 0 0' }}>{booking.company}</h3>
      </div>

      {/* Infos principales */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#555' }}>Passager :</span>
          <span style={{ fontWeight: '600' }}>{booking.passengerName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#555' }}>Sièges :</span>
          <span style={{ fontWeight: '600' }}>{booking.seats.join(', ')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#555' }}>Prix total :</span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>
            {(booking.price * booking.seats.length).toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      {/* Départ / Arrivée */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          color: '#444',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: '600', marginBottom: 6 }}>
              <MapPin size={18} />
              <span>Départ</span>
            </div>
            <div style={{ fontWeight: '700', fontSize: 15 }}>{booking.departureCity}</div>
            {booking.departureStation && (
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#666' }}>{booking.departureStation}</div>
            )}
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, color: '#666' }}>
              <Clock size={14} />
              <span>{booking.departureTime}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontWeight: '700',
              fontSize: 20,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            →
          </div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: '600', marginBottom: 6 }}>
              <MapPin size={18} />
              <span>Arrivée</span>
            </div>
            <div style={{ fontWeight: '700', fontSize: 15 }}>{booking.arrivalCity}</div>
            {booking.arrivalStation && (
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#666' }}>{booking.arrivalStation}</div>
            )}
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, color: '#666' }}>
              <Clock size={14} />
              <span>{booking.arrivalTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date du voyage */}
      <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 12, color: '#555' }}>
        <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        <span style={{ fontWeight: '600' }}>
          {new Date(booking.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          fontSize: 10,
          color: '#888',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          paddingTop: 8,
          userSelect: 'none',
        }}
      >
        <div>Présentez ce ticket au chauffeur • Arrivez 15 minutes avant le départ</div>
        <div style={{ marginTop: 4 }}>
          Imprimé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
