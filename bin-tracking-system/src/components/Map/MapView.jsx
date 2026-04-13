import { useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getMarkerColor } from '../../utils/helpers';

const MapView = ({ bins }) => {
  const [selectedBin, setSelectedBin] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
  });

  const mapCenter = {
    lat: 12.9716,
    lng: 77.5946,
  };

  const mapOptions = {
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-soft border border-gray-200">
        <p className="text-gray-600 font-medium">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <GoogleMap
        center={mapCenter}
        zoom={12}
        mapContainerClassName="w-full h-[600px]"
        options={mapOptions}
      >
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={{ lat: bin.latitude, lng: bin.longitude }}
            onClick={() => setSelectedBin(bin)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: getMarkerColor(bin.status),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedBin && (
          <InfoWindow
            position={{ lat: selectedBin.latitude, lng: selectedBin.longitude }}
            onCloseClick={() => setSelectedBin(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2">{selectedBin.id}</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Location:</span> {selectedBin.location}
                </p>
                <p>
                  <span className="font-semibold">Fill Level:</span> {selectedBin.fillLevel}%
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      selectedBin.status === 'Full'
                        ? 'bg-red-100 text-red-800'
                        : selectedBin.status === 'Warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {selectedBin.status}
                  </span>
                </p>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;
