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
  const [timeframe, setTimeframe] = useState<string>("all_month");
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [minMagnitude, setMinMagnitude] = useState<number>(0);

  useEffect(() => {
    if (!map) return;

    const fetchEarthquakes = async () => {
      const response = await fetch(
        `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${timeframe}.geojson`
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

      console.log(data);
      const featureCollection = turf.featureCollection(data.features);

      const combinedBbox = turf.bbox(featureCollection);

      map.fitBounds(combinedBbox as any, {
        padding: 20,
      });
    };

    fetchEarthquakes();
  }, [map, timeframe]);

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
      source.setData(filteredData as any);
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
          onClick={() => setTimeframe("all_day")}
          className={`py-2 px-4 rounded ${
            timeframe === "all_day" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past Day
        </button>
        <button
          onClick={() => setTimeframe("all_week")}
          className={`py-2 px-4 rounded ${
            timeframe === "all_week" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past 7 Days
        </button>
        <button
          onClick={() => setTimeframe("all_month")}
          className={`py-2 px-4 rounded ${
            timeframe === "all_month" ? "bg-green-500" : "bg-blue-500"
          } text-white`}
        >
          Past 30 Days
        </button>
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
