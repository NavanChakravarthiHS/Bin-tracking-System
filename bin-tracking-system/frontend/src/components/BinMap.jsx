import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { getMarkerColor } from '../utils/helpers';

// Premium dark-mode/light minimalist Google Maps theme styles
const mapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }, { lightness: 17 }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }, { lightness: 20 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }, { lightness: 17 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }, { lightness: 18 }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }, { lightness: 16 }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }, { lightness: 21 }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#dedede' }, { lightness: 21 }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { lightness: 16 }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ saturation: 36 }, { color: '#333333' }, { lightness: 40 }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#f2f2f2' }, { lightness: 19 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fefefe' }, { lightness: 20 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }],
  },
];

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Default Map Center (Requested Mosalehosahalli coordinates for BIN001)
const defaultCenter = {
  lat: 12.884826192901519,
  lng: 76.16705545090305,
};

const mapOptions = {
  styles: mapStyles,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const BinMap = ({ bins }) => {
  const [selectedBin, setSelectedBin] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerClick = (bin) => {
    setSelectedBin(bin);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: bin.latitude, lng: bin.longitude });
    }
  };

  if (loadError) {
    return (
      <div className="h-[550px] flex items-center justify-center bg-red-50 text-red-700 rounded-2xl border border-red-200 p-6">
        <p className="font-semibold text-lg">Error loading Google Maps. Please check your credentials.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[550px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-card border border-gray-200/80 h-[550px] relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={16}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={{ lat: bin.latitude, lng: bin.longitude }}
            onClick={() => handleMarkerClick(bin)}
            title={bin.id}
            icon={{
              // Premium vector SVG map-pin symbol
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: bin.markerColor || '#10b981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
              scale: 1.5,
              anchor: new window.google.maps.Point(12, 22),
            }}
          />
        ))}

        {selectedBin && (
          <InfoWindow
            position={{ lat: selectedBin.latitude, lng: selectedBin.longitude }}
            onCloseClick={() => setSelectedBin(null)}
          >
            <div className="p-3 min-w-[240px] max-w-[280px] font-sans">
              {/* Header */}
              <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-base text-gray-900 leading-tight">{selectedBin.id}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedBin.location}</p>
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    selectedBin.status === 'Full'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : selectedBin.status === 'Warning'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : selectedBin.status === 'Collected'
                      ? 'bg-gray-100 text-gray-800 border border-gray-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {selectedBin.status}
                </span>
              </div>

              {/* Progress & Fill info */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500">Fill Level:</span>
                  <span className="text-gray-900">{selectedBin.fillLevel}%</span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedBin.fillLevel}%`,
                      backgroundColor: selectedBin.markerColor || '#10b981',
                    }}
                  ></div>
                </div>

                {/* Collection Info - Only show when the bin is in Collected state */}
                {selectedBin.status === 'Collected' && selectedBin.lastCollected && (
                  <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-500 space-y-0.5">
                    <div>Collected: {new Date(selectedBin.lastCollected).toLocaleDateString()}</div>
                    {selectedBin.assignedCollector && (
                      <div className="font-medium text-gray-700 font-sans">By: {selectedBin.assignedCollector}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default BinMap;
