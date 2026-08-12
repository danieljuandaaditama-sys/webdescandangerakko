import { useState, useMemo } from "react";
import { useListHouses, useGetHousingInsight, type ListHousesParams } from "@workspace/api-client-react";
import { Layers, Map as MapIcon, Info, Search, Check, X, Building2 } from "lucide-react";

import { LeafletMapEngine } from "@/components/map/LeafletMapEngine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Map Color Configurations
const MAP_MODES = {
  statusPerubahan: {
    label: "Peta Perubahan Rumah",
    field: "statusPerubahan",
    colorFn: (v: string) => (v === "berubah" ? "#EF4444" : "#22C55E"),
    legend: [
      { label: "Berubah", color: "#EF4444" },
      { label: "Tidak Berubah", color: "#22C55E" },
    ]
  },
  klaster: {
    label: "Peta Klasterisasi",
    field: "klaster",
    colorFn: (v: string) => (v === "K1" ? "#22C55E" : v === "K2" ? "#F59E0B" : v === "K3" ? "#EF4444" : "#9CA3AF"),
    legend: [
      { label: "K1 (Sedikit/Tidak Ada)", color: "#22C55E" },
      { label: "K2 (Sedang)", color: "#F59E0B" },
      { label: "K3 (Signifikan)", color: "#EF4444" },
    ]
  },
  jeniLantai: {
    label: "Peta Jenis Lantai",
    field: "jeniLantai",
    colorFn: (v: string | null) => (v === "Keramik" ? "#3B82F6" : v === "Marmer/Granit" ? "#8B5CF6" : v === "Semen" ? "#F59E0B" : v === "Kayu" ? "#78716C" : "#9CA3AF"),
    legend: [
      { label: "Keramik", color: "#3B82F6" },
      { label: "Marmer/Granit", color: "#8B5CF6" },
      { label: "Semen", color: "#F59E0B" },
      { label: "Kayu", color: "#78716C" },
    ]
  },
  jenisDinding: {
    label: "Peta Jenis Dinding",
    field: "jenisDinding",
    colorFn: (v: string | null) => (v === "Tembok" ? "#64748B" : v === "Kayu" ? "#D97706" : v === "Bambu" ? "#84CC16" : v === "Seng" ? "#6B7280" : "#9CA3AF"),
    legend: [
      { label: "Tembok", color: "#64748B" },
      { label: "Kayu", color: "#D97706" },
      { label: "Bambu", color: "#84CC16" },
      { label: "Seng", color: "#6B7280" },
    ]
  },
  luasBangunan: {
    label: "Peta Luas Bangunan",
    field: "luasBangunan",
    colorFn: (v: number | null) => {
      if (!v) return "#9CA3AF";
      if (v < 80) return "#34D399";
      if (v <= 120) return "#3B82F6";
      return "#6366F1"; // > 120
    },
    legend: [
      { label: "< 80 m² (Kecil)", color: "#34D399" },
      { label: "80 - 120 m² (Sedang)", color: "#3B82F6" },
      { label: "> 120 m² (Besar)", color: "#6366F1" },
    ]
  },
  jumlahLantai: {
    label: "Peta Jumlah Lantai",
    field: "jumlahLantai",
    colorFn: (v: number | null) => (v === 1 ? "#A78BFA" : v === 2 ? "#8B5CF6" : v && v > 2 ? "#6D28D9" : "#9CA3AF"),
    legend: [
      { label: "1 Lantai", color: "#A78BFA" },
      { label: "2 Lantai", color: "#8B5CF6" },
      { label: "> 2 Lantai", color: "#6D28D9" },
    ]
  }
};

export default function SmartMap() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRT, setFilterRT] = useState<string>("all");
  const [filterRW, setFilterRW] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [mapMode, setMapMode] = useState<keyof typeof MAP_MODES>("statusPerubahan");

  const queryParams: ListHousesParams = {};
  
  if (filterType === "berubah") queryParams.statusPerubahan = "berubah";
  else if (filterType !== "all") queryParams.jenisPerubahan = filterType as any;
  
  if (filterRT !== "all") queryParams.rt = filterRT;
  if (filterRW !== "all") queryParams.rw = filterRW;

  const { data: houses, isLoading: isHousesLoading } = useListHouses(queryParams, {
    query: { queryKey: ["smartmap", "houses", queryParams] }
  });

  const { data: insight, isLoading: isInsightLoading } = useGetHousingInsight(queryParams, {
    query: { queryKey: ["smartmap", "insight", queryParams] }
  });

  const filteredHouses = useMemo(() => {
    if (!houses) return [];
    if (!search) return houses;
    const lower = search.toLowerCase();
    return houses.filter(h => 
      h.namaKepalaKeluarga?.toLowerCase().includes(lower) || 
      h.id.toLowerCase().includes(lower)
    );
  }, [houses, search]);

  const activeMapConfig = MAP_MODES[mapMode];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MapIcon className="w-8 h-8 text-primary" /> Smart Map
        </h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Analisis Spasial Interaktif
        </p>
      </div>

      {/* Controls Bar */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Filter Peta</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rumah</SelectItem>
                  <SelectItem value="berubah">Rumah Mengalami Perubahan</SelectItem>
                  <SelectItem value="perubahanPagar">Perubahan Pagar</SelectItem>
                  <SelectItem value="perubahanLuasBangunan">Perubahan Luas Bangunan</SelectItem>
                  <SelectItem value="perubahanJumlahLantai">Perubahan Jumlah Lantai</SelectItem>
                  <SelectItem value="perubahanLuasLahan">Perubahan Luas Lahan</SelectItem>
                  <SelectItem value="perubahanJenisLantai">Perubahan Jenis Lantai</SelectItem>
                  <SelectItem value="perubahanJenisDinding">Perubahan Jenis Dinding</SelectItem>
                  <SelectItem value="perubahanJenisAtap">Perubahan Jenis Atap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">RT</label>
              <Select value={filterRT} onValueChange={setFilterRT}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {["01", "02", "03", "04", "05", "06"].map(rt => (
                    <SelectItem key={rt} value={`RT ${rt}`}>RT {rt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">RW</label>
              <Select value={filterRW} onValueChange={setFilterRW}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua RW" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RW</SelectItem>
                  {["01", "02", "03"].map(rw => (
                    <SelectItem key={rw} value={`RW ${rw}`}>RW {rw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Pencarian</label>
              <div className="relative">
                <Input 
                  placeholder="Cari Nama / ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5 border-l pl-4">
              <label className="text-xs font-semibold uppercase text-primary">Switch Tampilan</label>
              <Select value={mapMode} onValueChange={(v: any) => setMapMode(v)}>
                <SelectTrigger className="border-primary/50 bg-primary/5">
                  <SelectValue placeholder="Pilih Tampilan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAP_MODES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* Left: Map */}
        <div className="lg:col-span-2 relative min-h-[500px] h-[calc(100vh-320px)] border rounded-md shadow-sm overflow-hidden bg-card">
          {isHousesLoading ? (
            <Skeleton className="w-full h-full rounded-md" />
          ) : (
            <LeafletMapEngine
              data={filteredHouses}
              height="100%"
              colorByField={activeMapConfig.field}
              colorMap={activeMapConfig.colorFn}
              legend={activeMapConfig.legend}
              popupContent={(h) => (
                <div className="space-y-3 w-[260px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm leading-tight text-foreground">{h.namaKepalaKeluarga}</div>
                      <div className="text-xs text-muted-foreground font-mono">{h.id} • {h.rt}/{h.rw}</div>
                    </div>
                    <Badge variant={h.statusPerubahan === "berubah" ? "destructive" : "success"} className="text-[10px] uppercase">
                      {h.statusPerubahan.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <Separator />

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                    <div className="text-muted-foreground">Luas Bgn:</div><div className="font-medium text-right">{h.luasBangunan || "—"} m²</div>
                    <div className="text-muted-foreground">Luas Lahan:</div><div className="font-medium text-right">{h.luasLahan || "—"} m²</div>
                    <div className="text-muted-foreground">Kondisi:</div><div className="font-medium text-right">{h.kondisiBangunan || "—"}</div>
                    <div className="text-muted-foreground">Lantai:</div><div className="font-medium text-right">{h.jeniLantai || "—"} ({h.jumlahLantai || "—"} Lt)</div>
                    <div className="text-muted-foreground">Dinding:</div><div className="font-medium text-right">{h.jenisDinding || "—"}</div>
                    <div className="text-muted-foreground">Atap:</div><div className="font-medium text-right">{h.jenisAtap || "—"}</div>
                    <div className="text-muted-foreground">Pagar:</div><div className="font-medium text-right">{h.pagar || "—"}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Status Perubahan Indikator</div>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: "Pagar", changed: h.perubahanPagar },
                        { label: "Luas Bangunan", changed: h.perubahanLuasBangunan },
                        { label: "Jumlah Lantai", changed: h.perubahanJumlahLantai },
                        { label: "Luas Lahan", changed: h.perubahanLuasLahan },
                        { label: "Jenis Lantai", changed: h.perubahanJenisLantai },
                        { label: "Jenis Dinding", changed: h.perubahanJenisDinding },
                        { label: "Jenis Atap", changed: h.perubahanJenisAtap }
                      ].map((ind, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className={ind.changed ? "text-destructive font-medium" : "text-muted-foreground"}>{ind.label}</span>
                          {ind.changed ? <Check className="w-3.5 h-3.5 text-destructive" /> : <X className="w-3.5 h-3.5 text-muted-foreground/50" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        {/* Right: Insight */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" /> Insight Filter Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-md p-3">
                <Building2 className="w-8 h-8 text-primary-foreground/80" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">Menampilkan</div>
                  <div className="text-2xl font-bold font-mono">
                    {isHousesLoading ? "..." : filteredHouses.length}
                    <span className="text-sm font-sans font-normal text-primary-foreground/80 ml-1">rumah</span>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-primary-foreground/20" />
              
              {isInsightLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-5/6 bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-4/6 bg-primary-foreground/20" />
                </div>
              ) : insight ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium leading-relaxed">
                    {insight.ringkasan}
                  </p>
                  <ul className="space-y-2">
                    {insight.poin.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-primary-foreground/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-primary-foreground/70">Tidak ada insight tersedia.</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
