"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Sidebar from "./Sidebar";

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      const mapInstance = new mapboxgl.Map({
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-118.2437, 34.0522], // Los Angeles coordinates
        zoom: 10,
      });

      setMap(mapInstance);
    };

    if (!map) initializeMap();

    return () => {
      if (map) map.remove();
    };
  }, [map]);
  //<Sidebar map={map} />

  return (
    <div className="w-full h-full flex">
      <div className="w-[80%] h-full" ref={mapContainerRef} />
      <Sidebar map={map} />
    </div>
  );
};

export default Map;
