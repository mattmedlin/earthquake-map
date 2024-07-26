// Sidebar.tsx
import React, { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

interface SidebarProps {
  map: mapboxgl.Map | null;
}

interface EarthquakeFeature {
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
  id: string;
}

const Sidebar: React.FC<SidebarProps> = ({ map }) => {
  const [timeframe, setTimeframe] = useState<string>("month");
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [minMagnitude, setMinMagnitude] = useState<number>(0);
  const [isSignificant, setIsSignificant] = useState<boolean>(false);

  const fetchEarthquakes = async () => {
    if (!map) return;
    const response = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${
        isSignificant ? "significant" : "all"
      }_${timeframe}.geojson`
    );
    const data = await response.json();

    setEarthquakes(data.features);

    if (map.getLayer("earthquake-circle")) {
      map.removeLayer("earthquake-circle");
    }
    if (map.getSource("earthquakes")) {
      map.removeSource("earthquakes");
    }

    map.addSource("earthquakes", {
      type: "geojson",
      data: data,
    });

    map.addLayer({
      id: "earthquake-circle",
      type: "circle",
      source: "earthquakes",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          1,
          4,
          6,
          24,
        ],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          1,
          "#2DC4B2",
          3,
          "#3BB3C3",
          5,
          "#669EC4",
          7,
          "#8B88B6",
          10,
          "#A2719B",
        ],
        "circle-opacity": 0.6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    const featureCollection = turf.featureCollection(data.features);

    const combinedBbox = turf.bbox(featureCollection);

    map.fitBounds(combinedBbox as any, {
      padding: 20,
    });
  };
  useEffect(() => {
    fetchEarthquakes();
  }, [map, timeframe, isSignificant]);

  const handleMagnitudeChange = (value: number) => {
    setMinMagnitude(value);

    const filteredData = {
      type: "FeatureCollection",
      features: earthquakes.filter(
        (earthquake) => earthquake.properties.mag >= value
      ),
    };

    const source = map?.getSource("earthquakes") as mapboxgl.GeoJSONSource;
    if (source) {
      if (!map) return;
      source.setData(filteredData as any);

      const featureCollection = turf.featureCollection(
        filteredData.features as any
      );

      const combinedBbox = turf.bbox(featureCollection);

      map.fitBounds(combinedBbox as any, {
        padding: 20,
      });
    }
  };

  const handleZoomToFeature = (coordinates: [number, number, number]) => {
    if (map) {
      map.flyTo({
        center: [coordinates[0], coordinates[1]],
        zoom: 10,
      });
    }
  };

  const toggleSignificance = () => {
    setIsSignificant((prev) => !prev);
  };

  const filteredEarthquakes = earthquakes.filter(
    (earthquake) => earthquake.properties.mag >= minMagnitude
  );

  return (
    <div className="w-[20%] h-full bg-gray-500 p-4">
      <h2>Earthquakes</h2>
      <div className="mb-4">
        <label htmlFor="magnitude-slider" className="block text-white">
          Minimum Magnitude: {minMagnitude}
        </label>
        <input
          id="magnitude-slider"
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={minMagnitude}
          onChange={(e) => handleMagnitudeChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => setTimeframe("day")}
          className={`py-2 px-4 rounded ${
            timeframe === "day" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past Day
        </button>
        <button
          onClick={() => setTimeframe("week")}
          className={`py-2 px-4 rounded ${
            timeframe === "week" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past 7 Days
        </button>
        <button
          onClick={() => setTimeframe("month")}
          className={`py-2 px-4 rounded ${
            timeframe === "month" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past 30 Days
        </button>
        <div className="flex gap-2">
          <span className={`${!isSignificant ? "" : "opacity-50 "}`}>All</span>
          <button
            onClick={toggleSignificance}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out ring-2 ring-offset-2 focus:ring-blue-500"
          >
            <span
              className={`${
                isSignificant
                  ? "translate-x-5 bg-green-500"
                  : "translate-x-0 bg-blue-500"
              } inline-block w-5 h-5 transform rounded-full transition-transform duration-200 ease-in-out`}
            />
            <span className="sr-only">
              {isSignificant ? "Significant" : "All"}
            </span>
          </button>
          <span className={`${isSignificant ? "" : "opacity-50 "}`}>
            Signficant
          </span>
        </div>
      </div>
      <div className="mt-2 h-[75%] overflow-y-scroll scrollbar-hide">
        {filteredEarthquakes.map((earthquake) => (
          <button
            key={earthquake.id}
            onClick={() => handleZoomToFeature(earthquake.geometry.coordinates)}
            className="mb-2 p-2 bg-gray-700 rounded text-left w-full"
          >
            <a
              href={earthquake.properties.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300"
            >
              <div className="font-bold">{earthquake.properties.place}</div>
            </a>
            <div>Magnitude: {earthquake.properties.mag}</div>
            <div>
              Time: {new Date(earthquake.properties.time).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
