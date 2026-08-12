import React from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { House } from "@workspace/api-client-react"
import { Badge } from "@/components/ui/badge"

// Fix for React Leaflet sizing
import L from "leaflet"
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapViewProps {
  houses: House[]
}

export function MapView({ houses }: MapViewProps) {
  // Center on Kelurahan Boting approx
  const center: [number, number] = [-4.0, 120.0];

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border">
      <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {houses.map((house) => {
          const isBerubah = house.statusPerubahan === "berubah";
          const color = isBerubah ? "#ef4444" : "#10b981"; // tailwind red-500 and emerald-500
          
          return (
            <CircleMarker
              key={house.id}
              center={[house.lat, house.lng]}
              radius={6}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup className="font-sans">
                <div className="p-1 space-y-2 min-w-[200px]">
                  <div>
                    <h4 className="font-semibold text-sm">{house.namaKepalaKeluarga}</h4>
                    <p className="text-xs text-muted-foreground">{house.alamat}, {house.rt}/{house.rw}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={isBerubah ? "destructive" : "success"}>
                      {isBerubah ? "Berubah" : "Tidak Berubah"}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1">
                    {house.jenisPerubahan && (
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Jenis:</span>
                        <span className="font-medium">{house.jenisPerubahan}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Kondisi:</span>
                      <span className="font-medium">{house.kondisiBangunan}</span>
                    </div>
                    {house.tahunDatang && (
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Tahun:</span>
                        <span className="font-medium">{house.tahunDatang}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
