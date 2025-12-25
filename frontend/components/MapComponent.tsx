"use client";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Auto-Zoom pour voir les deux points
function AutoZoom({ p1, p2 }: { p1: [number, number], p2: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([p1, p2]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [p1, p2, map]);
  return null;
}

export default function MapComponent({ homeCoords, txCoords, isMismatch }: any) {
  return (
    <MapContainer center={homeCoords} zoom={4} style={{ height: "100%", width: "100%", borderRadius: "1rem" }}>
      <AutoZoom p1={homeCoords} p2={txCoords} />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
      
      <Marker position={homeCoords}><Popup>🏠 Client (Maison)</Popup></Marker>
      <Marker position={txCoords}><Popup>💳 Marchand (Transaction)</Popup></Marker>
      
      {/* On trace toujours la ligne pour voir la distance */}
      <Polyline positions={[homeCoords, txCoords]} color={isMismatch ? "#ef4444" : "#3b82f6"} dashArray={isMismatch ? "10, 10" : ""} />
    </MapContainer>
  );
}