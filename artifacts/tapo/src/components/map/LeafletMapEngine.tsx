import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type ReactNode } from "react";
import type { House } from "@workspace/api-client-react";

interface LegendItem {
  label: string;
  color: string;
}

interface LeafletMapEngineProps {
  data: House[];
  colorByField?: string;
  colorMap: Record<string, string> | ((value: any) => string);
  legend?: LegendItem[];
  height?: string;
  onMarkerClick?: (house: House) => void;
  popupContent?: (house: House) => ReactNode;
}

// Center of Kelurahan Boting roughly based on prompt: -2.985, 120.192
const DEFAULT_CENTER: [number, number] = [-2.985, 120.192];
const DEFAULT_ZOOM = 15;

export function LeafletMapEngine({
  data,
  colorByField,
  colorMap,
  legend,
  height = "400px",
  onMarkerClick,
  popupContent,
}: LeafletMapEngineProps) {
  
  const getColor = (house: House) => {
    let value: any;
    if (!colorByField) {
      value = house;
    } else {
      value = house[colorByField as keyof House];
    }
    
    if (typeof colorMap === "function") {
      return colorMap(value);
    }
    return colorMap[value] || "#9CA3AF"; // default gray
  };

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border z-0 shadow-sm" style={{ height }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((house) => (
          <CircleMarker
            key={house.id}
            center={[house.lat, house.lng]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 1.5,
              fillColor: getColor(house),
              fillOpacity: 0.8,
            }}
            eventHandlers={{
              click: () => onMarkerClick?.(house),
            }}
          >
            {popupContent && (
              <Popup className="tapo-popup">
                <div className="min-w-[200px] text-sm font-sans">
                  {popupContent(house)}
                </div>
              </Popup>
            )}
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend Overlay */}
      {legend && legend.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[400] bg-card/95 backdrop-blur-sm p-3 rounded-md shadow-md border border-border text-sm">
          <div className="font-semibold mb-2">Legenda</div>
          <div className="space-y-1.5">
            {legend.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-card-foreground text-xs font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
