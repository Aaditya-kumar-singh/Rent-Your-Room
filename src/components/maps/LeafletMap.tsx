"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Room } from "@/types/room";

// Fix for default marker icon in Leaflet with Next.js
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LeafletMapProps {
    rooms: Room[];
    onRoomClick: (room: Room) => void;
    className?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 12);
    }, [center, map]);
    return null;
}

export default function LeafletMap({ rooms, onRoomClick, className }: LeafletMapProps) {
    // Default center (India functionality)
    const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
    const INDIA_BOUNDS: L.LatLngBoundsExpression = [
        [6.0, 68.0], // South West
        [37.0, 98.0], // North East
    ];

    const [center, setCenter] = useState<[number, number]>(INDIA_CENTER);

    useEffect(() => {
        if (
            rooms.length > 0 &&
            rooms[0]?.location?.coordinates?.coordinates
        ) {
            // GeoJSON describes coordinates as [longitude, latitude]
            const [lng, lat] = rooms[0].location.coordinates.coordinates;
            setCenter([lat, lng]);
        }
    }, [rooms]);

    // Limit visible rooms for performance
    const visibleRooms = rooms.slice(0, 1000);

    return (
        <div className={className}>
            <MapContainer
                center={center}
                zoom={5}
                minZoom={4}
                maxBounds={INDIA_BOUNDS}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapUpdater center={center} />
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={80}
                    spiderfyOnMaxZoom={true}
                >
                    {visibleRooms.map((room) => {
                        if (!room.location?.coordinates?.coordinates) return null;
                        // coordinates is [longitude, latitude]
                        const [lng, lat] = room.location.coordinates.coordinates;

                        return (
                            <Marker
                                key={room._id}
                                position={[lat, lng]}
                                icon={customIcon}
                                eventHandlers={{
                                    click: () => onRoomClick(room),
                                }}
                            >
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <h3 className="font-semibold text-sm mb-1">{room.title}</h3>
                                        <p className="text-xs text-gray-600 mb-2">{room.location.address}</p>
                                        <p className="font-bold text-green-600">
                                            ₹{room.monthlyRent.toLocaleString()}/mo
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}
