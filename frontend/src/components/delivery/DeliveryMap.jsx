import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Navigation, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom delivery marker icon
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

function MapCenter({ center }) {
    const map = useMap();
    if (center) {
        map.setView(center, 16);
    }
    return null;
}

export default function DeliveryMap({ deliveryLocation, address }) {
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

    const openDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;
        window.open(url, '_blank');
    };

    return (
        <div className="card overflow-hidden">
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossOrigin=""
            />
            <MapContainer
                center={position}
                zoom={16}
                style={{ height: "200px", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={position} />
                <Marker position={position} icon={deliveryIcon}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{address?.fullName}</p>
                            <p className="text-gray-600">{address?.fullAddress}</p>
                            <p className="text-gray-600">{address?.city} - {address?.pincode}</p>
                            <p className="text-gray-500 mt-1">{address?.phone}</p>
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
