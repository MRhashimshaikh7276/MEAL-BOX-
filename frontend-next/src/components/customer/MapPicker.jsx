import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from "leaflet";
import { MapPin, Navigation, Locate } from "lucide-react";
import "leaflet/dist/leaflet.css";

const nashikCenter = [19.9975, 73.7893]; // Nashik, Maharashtra

// Create icon function that handles SSR
const createGreenIcon = () => {
  if (typeof window === 'undefined') return null;
  
  // Fix Leaflet default marker icon issue
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  return new L.Icon({
    iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
        <path fill="#10b981" d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z"/>
        <circle fill="white" cx="20" cy="20" r="8"/>
      </svg>
    `),
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const address = data.display_name || "";

        let city = "", state = "", pincode = "";

        if (data.address) {
          city = data.address.city || data.address.town || data.address.village || data.address.county || "";
          state = data.address.state || "";
          pincode = data.address.postcode || "";
        }

        onSelect({
          lat,
          lng,
          address,
          city,
          state,
          pincode
        });
      } catch (error) {
        console.error("Geocoding error:", error);
        onSelect({ lat, lng, address: "" });
      }
    },
  });
  return null;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ onSelect, initialPosition }) {
  const [position, setPosition] = useState(
    initialPosition
      ? [initialPosition.lat, initialPosition.lng]
      : nashikCenter
  );
  const [locationStatus, setLocationStatus] = useState("loading"); // "loading" | "success" | "denied" | "error"
  const [userLocation, setUserLocation] = useState(null);

  // Create icon after component mounts
  const greenIcon = useMemo(() => createGreenIcon(), []);

  const getUserLocation = useCallback(() => {
    setLocationStatus("loading");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setPosition([latitude, longitude]);
        setLocationStatus("success");

        // Get address for user location
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          let city = "", state = "", pincode = "";
          if (data.address) {
            city = data.address.city || data.address.town || data.address.village || "";
            state = data.address.state || "";
            pincode = data.address.postcode || "";
          }

          onSelect({
            lat: latitude,
            lng: longitude,
            address: data.display_name || "",
            city,
            state,
            pincode
          });
        } catch (error) {
          onSelect({ lat: latitude, lng: longitude, address: "" });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
        } else {
          setLocationStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onSelect]);

  // Try to get user location on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      getUserLocation();
    }
  }, []);

  const handleSelect = (location) => {
    setPosition([location.lat, location.lng]);
    onSelect(location);
  };

  return (
    <div className="relative">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "350px", width: "100%", borderRadius: "16px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={handleSelect} />
        <MapUpdater center={position} />
        {greenIcon && <Marker position={position} icon={greenIcon} />}
      </MapContainer>

      {/* Location status banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
        {locationStatus === "loading" && (
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-xs font-medium text-gray-700">Getting your location...</span>
          </div>
        )}

        {locationStatus === "denied" && (
          <div className="bg-red-50/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <Locate size={14} className="text-red-500" />
            <span className="text-xs font-medium text-red-700">Location blocked</span>
            <button
              onClick={getUserLocation}
              className="text-xs font-semibold text-primary-500 hover:underline"
            >
              Enable
            </button>
          </div>
        )}

        {locationStatus === "error" && (
          <div className="bg-orange-50/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-xs font-medium text-orange-700">Couldn't get location</span>
            <button
              onClick={getUserLocation}
              className="text-xs font-semibold text-primary-500 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {locationStatus === "success" && (
          <div className="bg-green-50/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <MapPin size={14} className="text-green-500" />
            <span className="text-xs font-medium text-green-700">Your location</span>
          </div>
        )}
      </div>

      {/* My Location button */}
      <button
        onClick={getUserLocation}
        className="absolute bottom-4 right-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
        title="Get my location"
      >
        <Navigation size={20} className="text-primary-500" />
      </button>
    </div>
  );
}
