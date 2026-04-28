import dynamic from 'next/dynamic';
import { Navigation, MapPin, Clock, MapPinned } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

// 🚴 Calculate distance using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ⏱️ Calculate ETA based on distance (25 km/h city speed)
const calculateETA = (distanceKm) => {
  const speedKmH = 25;
  const etaMinutes = Math.round((distanceKm / speedKmH) * 60);
  
  if (etaMinutes <= 2) return { text: 'Arriving now!', urgent: true };
  if (etaMinutes <= 5) return { text: `${etaMinutes} min`, urgent: true };
  if (etaMinutes <= 15) return { text: `${etaMinutes} min`, urgent: false };
  if (etaMinutes <= 30) return { text: `~${etaMinutes} min`, urgent: false };
  if (etaMinutes <= 60) return { text: `~${etaMinutes} min`, urgent: false };
  
  const hours = Math.floor(etaMinutes / 60);
  const mins = etaMinutes % 60;
  return hours >= 1 ? { text: `${hours}h ${mins}m`, urgent: false } : { text: `${etaMinutes} min`, urgent: false };
};

// Fix Leaflet default marker icon issue
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Custom delivery marker icon (orange - for rider)
const deliveryIcon = new L.Icon({
    iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path fill="#f97316" d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z"/>
      <path fill="white" d="M20 8c-1.1 0-2 .9-2 2v6h4v-6c0-1.1-.9-2-2-2zm-8 10c-1.1 0-2 .9-2 2s.9 2 2 2h2v2h4v-2h2c1.1 0 2-.9 2-2s-.9-2-2-2h-8z"/>
    </svg>
  `),
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
});

// Destination icon (red)
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

function MapCenter({ center }) {
    const map = useMap();
    if (center) {
        map.setView(center, 16);
    }
    return null;
}

export default function DeliveryMap({ deliveryLocation, address, myLocation }) {
    const [etaInfo, setEtaInfo] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);

    // Calculate distance and ETA when locations change
    useEffect(() => {
        if (deliveryLocation?.lat && deliveryLocation?.lng && myLocation?.lat && myLocation?.lng) {
            const dist = calculateDistance(
                myLocation.lat, myLocation.lng,
                deliveryLocation.lat, deliveryLocation.lng
            );
            setDistanceKm(dist);
            setEtaInfo(calculateETA(dist));
        }
    }, [deliveryLocation?.lat, deliveryLocation?.lng, myLocation?.lat, myLocation?.lng]);

    if (!deliveryLocation?.lat || !deliveryLocation?.lng) {
        return (
            <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={18} />
                    <span className="text-sm">{address?.fullAddress}, {address?.city}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Location not available on map</p>
            </div>
        );
    }

    const position = [deliveryLocation.lat, deliveryLocation.lng];
    
    // Route line positions
    const routePositions = [
        [myLocation?.lat, myLocation?.lng],
        [deliveryLocation.lat, deliveryLocation.lng]
    ].filter(p => p[0] != null);

    // Calculate center between my location and customer
    const getCenter = () => {
        if (!myLocation?.lat || !myLocation?.lng) return position;
        return [
            (myLocation.lat + deliveryLocation.lat) / 2,
            (myLocation.lng + deliveryLocation.lng) / 2
        ];
    };
    const center = getCenter();

    const openDirections = () => {
        if (myLocation?.lat && myLocation?.lng) {
            const url = `https://www.google.com/maps/dir/${myLocation.lat},${myLocation.lng}/${deliveryLocation.lat},${deliveryLocation.lng}`;
            window.open(url, '_blank');
        } else {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="card overflow-hidden">
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossOrigin=""
            />
            
            {/* ETA Banner for Delivery Boy */}
            {etaInfo && (
                <div className={`p-3 flex items-center justify-between ${
                    etaInfo.urgent 
                        ? 'bg-green-50 dark:bg-green-500/10 border-b border-green-200 dark:border-green-500/20' 
                        : 'bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/20'
                }`}>
                    <div className="flex items-center gap-2">
                        <Clock size={18} className={etaInfo.urgent ? 'text-green-600' : 'text-orange-600'} />
                        <div>
                            <p className={`text-lg font-bold ${etaInfo.urgent ? 'text-green-600' : 'text-orange-600'}`}>
                                {etaInfo.text}
                            </p>
                            {distanceKm && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPinned size={12} /> {distanceKm.toFixed(1)} km to destination
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} />
                            <span>Customer</span>
                        </div>
                    </div>
                </div>
            )}

            <MapContainer
                center={center}
                zoom={16}
                style={{ height: "200px", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={center} />
                
                {/* Route Line from Delivery Boy to Customer */}
                {routePositions.length === 2 && (
                    <Polyline 
                        positions={routePositions}
                        pathOptions={{
                            color: '#f97316',
                            weight: 4,
                            opacity: 0.8,
                            dashArray: '10, 10'
                        }}
                    />
                )}
                
                {/* Delivery Boy Current Location */}
                {myLocation?.lat && myLocation?.lng && (
                    <Marker position={[myLocation.lat, myLocation.lng]} icon={deliveryIcon}>
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold flex items-center gap-1">
                                    📍 Your Location
                                </p>
                                <p className="text-xs text-gray-500">Live tracking</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
                
                {/* Customer Destination */}
                <Marker position={position} icon={destinationIcon}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold flex items-center gap-1">
                                <MapPin size={14} className="text-red-500" />
                                Delivery Address
                            </p>
                            <p className="text-gray-600">{address?.fullName}</p>
                            <p className="text-gray-600">{address?.fullAddress}</p>
                            <p className="text-gray-600">{address?.city} - {address?.pincode}</p>
                            <p className="text-gray-500">{address?.phone}</p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>

            <div className="p-3 border-t dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {address?.fullAddress}
                        </p>
                        <p className="text-xs text-gray-500">{address?.city} - {address?.pincode}</p>
                        {etaInfo && (
                            <p className={`text-xs mt-1 ${etaInfo.urgent ? 'text-green-600' : 'text-orange-600'}`}>
                                🎯 {etaInfo.text} • {distanceKm?.toFixed(1)} km away
                            </p>
                        )}
                    </div>
                    <button
                        onClick={openDirections}
                        className="ml-3 btn-primary py-1.5 px-3 flex items-center gap-1.5 text-sm"
                    >
                        <Navigation size={14} />
                        Navigate
                    </button>
                </div>
            </div>
        </div>
    );
}