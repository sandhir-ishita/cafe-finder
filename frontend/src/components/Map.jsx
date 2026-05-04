import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function Map({ cafes, selectedCafeId, routePolyline, travelModeLabel }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setStatus("geolocation-error")
    );
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus("missing-key");
      return;
    }

    if (!window.google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = () => setStatus("ready");
      script.onerror = () => setStatus("script-error");
      document.body.appendChild(script);
      return;
    }

    setStatus("ready");
  }, []);

  useEffect(() => {
    if (status !== "ready" || !window.google?.maps || !mapRef.current) {
      return;
    }

    const fallbackCenter = { lat: 20.5937, lng: 78.9629 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: userLocation || cafes[0]?.location || fallbackCenter,
      zoom: cafes.length <= 1 ? 12 : 5,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const bounds = new window.google.maps.LatLngBounds();

    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map,
        title: "Your location",
      });
      bounds.extend(userLocation);
    }

    cafes.forEach((cafe, index) => {
      const lat = cafe.location?.lat ?? fallbackCenter.lat + index * 0.2;
      const lng = cafe.location?.lng ?? fallbackCenter.lng + index * 0.2;
      const markerPosition = { lat, lng };

      new window.google.maps.Marker({
        position: markerPosition,
        map,
        title: cafe.name,
        animation: selectedCafeId === cafe.id ? window.google.maps.Animation.DROP : undefined,
      });

      bounds.extend(markerPosition);
    });

    if (routePolyline && window.google.maps.geometry?.encoding) {
      const path = window.google.maps.geometry.encoding.decodePath(routePolyline);
      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#9a3412",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      });
      polyline.setMap(map);
      path.forEach((point) => bounds.extend(point));
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 60);
    }
  }, [cafes, selectedCafeId, status, userLocation, routePolyline]);

  if (status === "missing-key") {
    return <div className="map-placeholder">Add `VITE_GOOGLE_MAPS_API_KEY` to enable the live map.</div>;
  }

  if (status === "script-error") {
    return <div className="map-placeholder">Google Maps could not be loaded right now.</div>;
  }

  if (status === "unsupported") {
    return <div className="map-placeholder">Your browser does not support location detection.</div>;
  }

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-canvas" />
      {travelModeLabel && <p className="map-caption">Current route mode: {travelModeLabel}</p>}
    </div>
  );
}

export default Map;
