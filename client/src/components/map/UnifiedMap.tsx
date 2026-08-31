import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker, Polyline as GooglePolyline } from '@react-google-maps/api';
import { LocationCoords } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Locate } from 'lucide-react';

// Custom Leaflet Icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface UnifiedMapProps {
  pickupCoords?: LocationCoords | null;
  destinationCoords?: LocationCoords | null;
  driverCoords?: LocationCoords | null;
  otherDrivers?: { id: string; name: string; coords: LocationCoords; isOnline?: boolean }[];
  activeMode?: 'pickup' | 'destination' | 'view';
  onPickupChange?: (coords: LocationCoords) => void;
  onDestinationChange?: (coords: LocationCoords) => void;
  height?: string;
  zoom?: number;
  center?: LocationCoords;
}

// Helper to recenter map when points change
const MapController: React.FC<{ center: LocationCoords; zoom: number; bounds?: LocationCoords[] }> = ({
  center,
  zoom,
  bounds,
}) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length >= 2 && bounds[0] && bounds[1]) {
      const latLngBounds = L.latLngBounds(
        bounds.map((b) => [b.lat, b.lng] as [number, number])
      );
      map.fitBounds(latLngBounds, { padding: [50, 50] });
    } else {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, bounds, map]);

  return null;
};

// Leaflet Click Event Handler
const ClickHandler: React.FC<{
  activeMode?: 'pickup' | 'destination' | 'view';
  onPickupChange?: (coords: LocationCoords) => void;
  onDestinationChange?: (coords: LocationCoords) => void;
}> = ({ activeMode, onPickupChange, onDestinationChange }) => {
  useMapEvents({
    click(e) {
      if (activeMode === 'pickup' && onPickupChange) {
        onPickupChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (activeMode === 'destination' && onDestinationChange) {
        onDestinationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

export const UnifiedMap: React.FC<UnifiedMapProps> = ({
  pickupCoords,
  destinationCoords,
  driverCoords,
  otherDrivers = [],
  activeMode = 'view',
  onPickupChange,
  onDestinationChange,
  height = '420px',
  zoom = 13,
  center = { lat: 30.0444, lng: 31.2357 },
}) => {
  const { settings } = useAuth();
  const apiKey = settings?.googleMapsApiKey || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script',
  });

  const mapCenter = pickupCoords || driverCoords || center;

  const validBounds: LocationCoords[] = [];
  if (pickupCoords) validBounds.push(pickupCoords);
  if (destinationCoords) validBounds.push(destinationCoords);
  if (driverCoords) validBounds.push(driverCoords);

  if (apiKey && isLoaded && !loadError) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={zoom}
          onClick={(e) => {
            if (e.latLng) {
              const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
              if (activeMode === 'pickup' && onPickupChange) onPickupChange(coords);
              if (activeMode === 'destination' && onDestinationChange) onDestinationChange(coords);
            }
          }}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
            ],
          }}
        >
          {pickupCoords && (
            <GoogleMarker
              position={pickupCoords}
              title="Pickup Location"
              icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />
          )}
          {destinationCoords && (
            <GoogleMarker
              position={destinationCoords}
              title="Destination"
              icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            />
          )}
          {driverCoords && (
            <GoogleMarker
              position={driverCoords}
              title="Driver Location"
              icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            />
          )}
          {pickupCoords && destinationCoords && (
            <GooglePolyline
              path={[pickupCoords, destinationCoords]}
              options={{ strokeColor: '#10b981', strokeOpacity: 0.8, strokeWeight: 4 }}
            />
          )}
        </GoogleMap>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60" style={{ height }}>
      {activeMode !== 'view' && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <MapPin
            className={`w-4 h-4 ${
              activeMode === 'pickup' ? 'text-emerald-400 animate-bounce' : 'text-rose-400 animate-bounce'
            }`}
          />
          <span>
            {activeMode === 'pickup'
              ? 'Click anywhere on map to set Pickup Location'
              : 'Click anywhere on map to set Destination'}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (navigator.geolocation && onPickupChange) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                onPickupChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              },
              (err) => console.log('Geolocation error:', err)
            );
          }
        }}
        className="absolute bottom-4 right-4 z-[1000] bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 p-2.5 rounded-xl border border-slate-600 shadow-xl transition-all flex items-center justify-center"
        title="Locate my position"
      >
        <Locate className="w-5 h-5" />
      </button>

      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={zoom} bounds={validBounds.length >= 2 ? validBounds : undefined} />
        <ClickHandler
          activeMode={activeMode}
          onPickupChange={onPickupChange}
          onDestinationChange={onDestinationChange}
        />

        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup className="custom-popup">
              <div className="font-semibold text-slate-800 text-xs">
                📍 Pickup Point
                <div className="text-[10px] text-slate-500">{`${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}`}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={dropoffIcon}>
            <Popup className="custom-popup">
              <div className="font-semibold text-slate-800 text-xs">
                🏁 Destination
                <div className="text-[10px] text-slate-500">{`${destinationCoords.lat.toFixed(4)}, ${destinationCoords.lng.toFixed(4)}`}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {driverCoords && (
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon}>
            <Popup className="custom-popup">
              <div className="font-semibold text-slate-800 text-xs">
                🚗 Driver Location (Live)
              </div>
            </Popup>
          </Marker>
        )}

        {otherDrivers.map((driver) => (
          <Marker key={driver.id} position={[driver.coords.lat, driver.coords.lng]} icon={driverIcon}>
            <Popup className="custom-popup">
              <div className="font-semibold text-slate-800 text-xs">
                🚗 {driver.name}
                <div className="text-[10px] text-emerald-600 font-bold">
                  {driver.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {pickupCoords && destinationCoords && (
          <Polyline
            positions={[
              [pickupCoords.lat, pickupCoords.lng],
              [destinationCoords.lat, destinationCoords.lng],
            ]}
            color="#10b981"
            weight={4}
            dashArray="6, 8"
            opacity={0.85}
          />
        )}
      </MapContainer>
    </div>
  );
};
