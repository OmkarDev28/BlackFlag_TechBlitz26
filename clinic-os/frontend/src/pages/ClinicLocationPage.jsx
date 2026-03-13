export default function ClinicLocationPage() {
  const clinic = {
    name: 'Clinic OS Medical Centre',
    address: '123 Healthcare Avenue, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 22 1234 5678',
    email: 'info@clinicos.in',
    hours: [
      { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
      { day: 'Saturday', time: '9:00 AM – 2:00 PM' },
      { day: 'Sunday', time: 'Closed' },
    ],
    // Replace with your actual Google Maps embed URL
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.6!2d72.8297!3d19.0596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDAzJzM0LjYiTiA3MsKwNDknNDYuOSJF!5e0!3m2!1sen!2sin!4v1600000000000',
  };

  const fullAddress = `${clinic.address}, ${clinic.city}, ${clinic.state} – ${clinic.pincode}`;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Location</h1>
          <p className="page-subtitle">Find us and get directions</p>
        </div>
        <a href={directionsLink} target="_blank" rel="noreferrer" className="btn btn-primary">
          🧭 Get Directions
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Map */}
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <iframe
            title="Clinic Location"
            src={clinic.mapEmbedUrl}
            width="100%"
            height="440"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10, borderTop: '1px solid var(--border)' }}>
            <a href={googleMapsLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              🗺 Open in Google Maps
            </a>
            <a href={directionsLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              🧭 Directions
            </a>
          </div>
        </div>

        {/* Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Address */}
          <div className="card">
            <div className="card-header"><span className="card-title">📍 Address</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{clinic.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  {clinic.address}<br />
                  {clinic.city}, {clinic.state}<br />
                  PIN: {clinic.pincode}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                  <span>📞</span>
                  <a href={`tel:${clinic.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{clinic.phone}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                  <span>✉️</span>
                  <a href={`mailto:${clinic.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{clinic.email}</a>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="card">
            <div className="card-header"><span className="card-title">🕐 Working Hours</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {clinic.hours.map(({ day, time }) => {
                const isClosed = time === 'Closed';
                const isToday = (() => {
                  const d = new Date().getDay();
                  if (day.includes('Monday') && d >= 1 && d <= 5) return true;
                  if (day === 'Saturday' && d === 6) return true;
                  if (day === 'Sunday' && d === 0) return true;
                  return false;
                })();
                return (
                  <div key={day} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: '1px solid var(--border)',
                    background: isToday ? 'var(--accent-light)' : 'transparent',
                    margin: isToday ? '0 -24px' : undefined,
                    padding: isToday ? '9px 24px' : '9px 0',
                  }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--accent-dark)' : 'var(--text)' }}>
                      {isToday && '→ '}{day}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: isClosed ? 'var(--red)' : isToday ? 'var(--accent-dark)' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport */}
          <div className="card">
            <div className="card-header"><span className="card-title">🚌 How to Reach</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {[
                ['🚇', 'Metro', 'Bandra Station — 5 min walk (Western Line)'],
                ['🚌', 'Bus', 'Routes 201, 83, 221 stop at Healthcare Ave'],
                ['🚗', 'Car', 'Paid parking available in the basement'],
                ['🛺', 'Auto/Cab', 'Drop-off point at main gate on Healthcare Ave'],
              ].map(([icon, mode, detail]) => (
                <div key={mode} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{mode}: </span>
                    {detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}