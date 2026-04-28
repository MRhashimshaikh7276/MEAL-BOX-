import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Navigation, MapPin, Truck, RefreshCw, PhoneCall } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { deliveryAPI } from '../../services/api';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom delivery boy marker icon
const deliveryIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path fill="#3b82f6" d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z"/>
      <path fill="white" d="M20 8c-1.1 0-2 .9-2 2v6h4v-6c0-1.1-.9-2-2-2zm-8 10c-1.1 0-2 .9-2 2s.9 2 2 2h2v2h4v-2h2c1.1 0 2-.9 2-2s-.9-2-2-2h-8z"/>
    </svg>
  `),
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

// Destination marker icon
const destinationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path fill="#ef4444" d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z"/>
      <circle fill="white" cx="20" cy="20" r="8"/>
    </svg>
  `),
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function DeliveryTrackingMap({ orderId, deliveryAddress, refreshInterval = 10000 }) {
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLocation = async () => {
    try {
      const response = await deliveryAPI.getDeliveryLocation(orderId);
      if (response.data?.deliveryBoy?.location) {
        setDeliveryLocation({
          lat: response.data.deliveryBoy.location.lat,
          lng: response.data.deliveryBoy.location.lng,
          name: response.data.deliveryBoy.name,
          phone: response.data.deliveryBoy.phone
        });
        setLastUpdated(new Date(response.data.deliveryBoy.location.updatedAt));
        setError(null);
      } else {
        setError('Delivery boy location not available');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, refreshInterval);
    return () => clearInterval(interval);
  }, [orderId, refreshInterval]);

  // Calculate center between delivery boy and destination
  const getMapCenter = () => {
    if (!deliveryAddress?.lat || !deliveryAddress?.lng) {
      return null;
    }
    if (!deliveryLocation?.lat || !deliveryLocation?.lng) {
      return [deliveryAddress.lat, deliveryAddress.lng];
    }
    return [
      (deliveryAddress.lat + deliveryLocation.lat) / 2,
      (deliveryAddress.lng + deliveryLocation.lng) / 2
    ];
  };

  const center = getMapCenter();

  const openDirections = () => {
    if (!deliveryLocation?.lat || !deliveryLocation?.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary-500" />
        <p className="text-sm text-gray-500">Loading delivery tracking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 ">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin size={18} />
          <span className="text-sm">{deliveryAddress?.fullAddress}, {deliveryAddress?.city}</span>
        </div>
        <p className="text-xs text-red-500 mt-2">{error}</p>
        <button onClick={fetchLocation} className="mt-2 text-xs text-primary-500 flex items-center gap-1">
          <RefreshCw size={12} /> Try again
        </button>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin size={18} />
          <span className="text-sm">{deliveryAddress?.fullAddress}, {deliveryAddress?.city}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Waiting for delivery boy to start...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden  relative z-0">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "250px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />

        {/* Delivery Boy Marker */}
        {deliveryLocation?.lat && deliveryLocation?.lng && (
          <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold flex items-center gap-1">
                  <Truck size={14} className="text-blue-500" />
                  Delivery Boy
                </p>
                <p className="text-gray-600">{deliveryLocation.name}</p>
                <p className="text-gray-500">{deliveryLocation.phone}</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {deliveryAddress?.lat && deliveryAddress?.lng && (
          <Marker position={[deliveryAddress.lat, deliveryAddress.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold flex items-center gap-1">
                  <MapPin size={14} className="text-red-500" />
                  Delivery Address
                </p>
                <p className="text-gray-600">{deliveryAddress.fullName}</p>
                <p className="text-gray-600">{deliveryAddress.fullAddress}</p>
                <p className="text-gray-500">{deliveryAddress.city} - {deliveryAddress.pincode}</p>
                <p className="text-gray-500">{deliveryAddress.phone}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="p-3 border-t dark:border-gray-700">
        {/* Mobile-first: Stack vertically on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {deliveryLocation?.name}
              </p>
              {deliveryLocation?.phone && (
                <a
                  href={`tel:${deliveryLocation.phone}`}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
                >
                  <PhoneCall size={12} />
                  {deliveryLocation.phone}
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {deliveryAddress?.fullAddress}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          {/* Buttons: Stack vertically on mobile, horizontal on sm+ */}
          <div className="flex flex-row sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
            {deliveryLocation?.phone && (
              <a
                href={`tel:${deliveryLocation.phone}`}
                className="btn-secondary py-2 px-3 sm:py-1.5 sm:px-3 flex items-center justify-center gap-1 text-sm flex-1 sm:flex-none"
              >
                <PhoneCall size={14} />
                <span className="sm:hidden">Call</span>
              </a>
            )}
            <button
              onClick={fetchLocation}
              className="btn-secondary py-2 px-3 sm:py-1.5 sm:px-2 flex items-center justify-center gap-1 text-sm flex-1 sm:flex-none"
              title="Refresh location"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={openDirections}
              className="btn-primary py-2 px-3 sm:py-1.5 sm:px-3 flex items-center justify-center gap-1.5 text-sm flex-1 sm:flex-none"
            >
              <Navigation size={14} />
              Navigate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
