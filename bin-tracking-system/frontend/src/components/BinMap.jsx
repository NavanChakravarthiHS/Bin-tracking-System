import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerColor } from '../utils/helpers';

// Default Map Center (Mosalehosahalli coordinates for BIN001)
const defaultCenter = [12.884826192901519, 76.16705545090305];

// Create a colored SVG marker icon
function createBinIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.9"/>
      <circle cx="12" cy="12" r="3" fill="${color}"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'bin-marker-icon',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
}

// Auto-fit map to bin markers
function FitBounds({ bins }) {
  const map = useMap();

  useEffect(() => {
    if (bins.length > 0) {
      const validBins = bins.filter(b => b.latitude && b.longitude);
      if (validBins.length > 0) {
        const bounds = L.latLngBounds(validBins.map(b => [b.latitude, b.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [bins, map]);

  return null;
}

const BinMap = ({ bins }) => {
  const [selectedBin, setSelectedBin] = useState(null);

  useEffect(() => {
    console.log("🗺️ Map component initialized with", bins.length, "bins");
  }, [bins.length]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200/80 h-[550px] relative">
      {/* Custom CSS for marker icons */}
      <style>{`
        .bin-marker-icon { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { display: none !important; }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={16}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds bins={bins} />

        {bins.map((bin) => {
          if (!bin.latitude || !bin.longitude) return null;
          const color = bin.markerColor || getMarkerColor(bin.status);
          return (
            <Marker
              key={bin.id}
              position={[bin.latitude, bin.longitude]}
              icon={createBinIcon(color)}
              eventHandlers={{
                click: () => setSelectedBin(bin),
              }}
            >
              <Popup>
                <div style={{ padding: '14px', minWidth: '240px', maxWidth: '280px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#111827', margin: 0, lineHeight: 1.3 }}>{bin.id}</h4>
                      <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, margin: '2px 0 0 0' }}>{bin.location}</p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      backgroundColor:
                        bin.status === 'Full' ? '#fef2f2' :
                        bin.status === 'Warning' ? '#fffbeb' :
                        bin.status === 'Collected' ? '#f9fafb' : '#ecfdf5',
                      color:
                        bin.status === 'Full' ? '#991b1b' :
                        bin.status === 'Warning' ? '#92400e' :
                        bin.status === 'Collected' ? '#374151' : '#065f46',
                      border: `1px solid ${
                        bin.status === 'Full' ? '#fecaca' :
                        bin.status === 'Warning' ? '#fde68a' :
                        bin.status === 'Collected' ? '#e5e7eb' : '#a7f3d0'
                      }`,
                    }}>
                      {bin.status}
                    </span>
                  </div>

                  {/* Fill Level */}
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Fill Level:</span>
                      <span style={{ color: '#111827' }}>{Number(bin.fillLevel) || 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${bin.fillLevel}%`,
                        height: '100%',
                        borderRadius: '9999px',
                        backgroundColor: color,
                        transition: 'width 0.5s ease',
                      }}></div>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', lineHeight: 1.6 }}>
                    <div>Device: {bin.deviceStatus || 'Inactive'}</div>
                    <div>Sensor: {bin.sensorStatus || (bin.sensorConnected ? 'Connected' : 'Disconnected')}</div>
                    <div>Last sensor: {bin.lastSensorUpdate ? new Date(bin.lastSensorUpdate).toLocaleString() : 'Never'}</div>
                  </div>

                  {/* Collection Info */}
                  {bin.status === 'Collected' && bin.lastCollected && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', fontSize: '10px', color: '#6b7280' }}>
                      <div>Collected: {new Date(bin.lastCollected).toLocaleDateString()}</div>
                      {bin.assignedCollector && (
                        <div style={{ fontWeight: 600, color: '#374151' }}>By: {bin.assignedCollector}</div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default BinMap;
