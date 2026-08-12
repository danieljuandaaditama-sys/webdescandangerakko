import { useState, useMemo } from "react";
import { useListHouses, useGetHousingInsight, type ListHousesParams } from "@workspace/api-client-react";
import { Map as MapIcon, Info, Search, Check, X, Building2 } from "lucide-react";

import { LeafletMapEngine } from "@/components/map/LeafletMapEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Color helpers (same as Dashboard) ──────────────────────────────────────

function klasterColor(v: string) {
  if (v === "K1") return "#22C55E";
  if (v === "K2") return "#F59E0B";
  if (v === "K3") return "#EF4444";
  return "#9CA3AF";
}

function dindingColor(v: string | null | undefined) {
  if (!v) return "#9CA3AF";
  const lv = v.toLowerCase();
  if (lv.includes("tembok")) return "#64748B";
  if (lv.includes("kayu")) return "#D97706";
  if (lv.includes("bambu")) return "#84CC16";
  if (lv.includes("seng")) return "#6B7280";
  return "#9CA3AF";
}

function lantaiColor(v: string | null | undefined) {
  if (!v) return "#9CA3AF";
  const lv = v.toLowerCase();
  if (lv === "keramik") return "#3B82F6";
  if (lv.includes("marmer") || lv.includes("granit")) return "#8B5CF6";
  if (lv === "semen") return "#F59E0B";
  return "#78716C";
}

// ─── Filter/Mode configs ─────────────────────────────────────────────────────

type Tampilan = "klaster" | "smartmap" | "tagging";

const JENIS_LABEL: Record<string, string> = {
  perubahanJenisLantai: "Perubahan Jenis Lantai",
  perubahanJenisDinding: "Perubahan Jenis Dinding",
  perubahanLuasBangunan: "Perubahan Luas Bangunan",
  perubahanLuasLahan: "Perubahan Luas Lahan",
  perubahanJenisAtap: "Perubahan Jenis Atap",
  perubahanJumlahLantai: "Perubahan Jumlah Lantai",
  perubahanPagar: "Perubahan Pagar",
};

const TAGGING_MODES: Record<string, {
  label: string;
  colorFn: (h: any) => string;
  legend: { label: string; color: string }[];
}> = {
  luasBangunan: {
    label: "Luas Bangunan",
    colorFn: (h) => {
      const v = h.luasBangunan;
      if (!v) return "#9CA3AF";
      if (v > 100) return "#EF4444";
      if (v >= 50) return "#F59E0B";
      return "#22C55E";
    },
    legend: [
      { label: "> 100 m²", color: "#EF4444" },
      { label: "50 – 100 m²", color: "#F59E0B" },
      { label: "< 50 m²", color: "#22C55E" },
    ],
  },
  luasLahan: {
    label: "Luas Lahan",
    colorFn: (h) => {
      const v = h.luasLahan;
      if (!v) return "#9CA3AF";
      if (v > 100) return "#EF4444";
      if (v >= 50) return "#F59E0B";
      return "#22C55E";
    },
    legend: [
      { label: "> 100 m²", color: "#EF4444" },
      { label: "50 – 100 m²", color: "#F59E0B" },
      { label: "< 50 m²", color: "#22C55E" },
    ],
  },
  jumlahLantai: {
    label: "Tingkatan Rumah",
    colorFn: (h) => {
      const v = h.jumlahLantai;
      if (!v) return "#9CA3AF";
      if (v === 1) return "#A78BFA";
      if (v === 2) return "#7C3AED";
      return "#4C1D95";
    },
    legend: [
      { label: "Lantai 1", color: "#A78BFA" },
      { label: "Lantai 2", color: "#7C3AED" },
      { label: "Lantai 3+", color: "#4C1D95" },
    ],
  },
  jenisDinding: {
    label: "Jenis Dinding",
    colorFn: (h) => dindingColor(h.jenisDinding),
    legend: [
      { label: "Tembok", color: "#64748B" },
      { label: "Kayu", color: "#D97706" },
      { label: "Bambu/Seng", color: "#84CC16" },
    ],
  },
  jenisPlafon: {
    label: "Jenis Plafon",
    colorFn: (h) => {
      const v: string = (h.jenisPlafon ?? "").toLowerCase();
      if (v.includes("triplek") || v.includes("asbes") || v.includes("bambu")) return "#3B82F6";
      if (v.includes("pvc")) return "#10B981";
      if (v.includes("beton") || v.includes("plat")) return "#6B7280";
      if (v.includes("kayu") || v.includes("akustik") || v.includes("gypsum") || v.includes("kalsibor")) return "#F59E0B";
      return "#9CA3AF";
    },
    legend: [
      { label: "Triplek/Asbes/Bambu", color: "#3B82F6" },
      { label: "PVC", color: "#10B981" },
      { label: "Beton/Plat", color: "#6B7280" },
      { label: "Kayu/Gypsum/Kalsibor", color: "#F59E0B" },
      { label: "Tidak Ada/Lainnya", color: "#9CA3AF" },
    ],
  },
  jeniLantai: {
    label: "Jenis Lantai",
    colorFn: (h) => lantaiColor(h.jeniLantai),
    legend: [
      { label: "Keramik", color: "#3B82F6" },
      { label: "Marmer/Granit", color: "#8B5CF6" },
      { label: "Semen", color: "#F59E0B" },
      { label: "Kayu/Papan", color: "#78716C" },
    ],
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SmartMap() {
  const [tampilan, setTampilan] = useState<Tampilan>("smartmap");

  // Filter states — each tampilan uses its own
  const [klasterFilter, setKlasterFilter] = useState<string>("all");
  const [smartJenis, setSmartJenis] = useState<string>("perubahanJenisLantai");
  const [taggingMode, setTaggingMode] = useState<string>("luasBangunan");

  // Global filters (apply to all tampilan)
  const [filterRT, setFilterRT] = useState<string>("all");
  const [filterRW, setFilterRW] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Build API query params
  const queryParams: ListHousesParams = {};
  if (filterRT !== "all") queryParams.rt = filterRT;
  if (filterRW !== "all") queryParams.rw = filterRW;
  if (tampilan === "klaster" && klasterFilter !== "all") queryParams.klaster = klasterFilter as any;

  const { data: houses, isLoading: isHousesLoading } = useListHouses(queryParams, {
    query: { queryKey: ["smartmap", "houses", queryParams] },
  });

  const { data: insight, isLoading: isInsightLoading } = useGetHousingInsight(queryParams, {
    query: { queryKey: ["smartmap", "insight", queryParams] },
  });

  const filteredHouses = useMemo(() => {
    if (!houses) return [];
    if (!search) return houses;
    const lower = search.toLowerCase();
    return houses.filter(
      (h) =>
        h.namaKepalaKeluarga?.toLowerCase().includes(lower) ||
        h.id.toLowerCase().includes(lower),
    );
  }, [houses, search]);

  // Active color function and legend based on tampilan
  const { colorFn, colorByField, legend } = useMemo(() => {
    if (tampilan === "klaster") {
      return {
        colorByField: "klaster",
        colorFn: (v: string) => klasterColor(v),
        legend: [
          { label: "K1 — Tidak ada perubahan", color: "#22C55E" },
          { label: "K2 — Perubahan sedang (1–2)", color: "#F59E0B" },
          { label: "K3 — Perubahan signifikan (≥3)", color: "#EF4444" },
        ],
      };
    }
    if (tampilan === "smartmap") {
      return {
        colorByField: smartJenis,
        colorFn: (v: boolean) => (v ? "#EF4444" : "#9CA3AF"),
        legend: [
          { label: JENIS_LABEL[smartJenis] ?? smartJenis, color: "#EF4444" },
          { label: "Tidak Ada Perubahan", color: "#9CA3AF" },
        ],
      };
    }
    // tagging
    const mode = TAGGING_MODES[taggingMode];
    return {
      colorByField: undefined,
      colorFn: (h: any) => mode?.colorFn(h) ?? "#9CA3AF",
      legend: mode?.legend ?? [],
    };
  }, [tampilan, klasterFilter, smartJenis, taggingMode]);

  const tampilanLabel = tampilan === "klaster" ? "Peta Klasterisasi" : tampilan === "smartmap" ? "SMART MAP" : "Peta Tagging Location";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MapIcon className="w-8 h-8 text-primary" /> Smart Map
        </h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Analisis Spasial Interaktif — {tampilanLabel}
        </p>
      </div>

      {/* Controls Bar */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Filter utama — berubah per tampilan */}
            <div className="space-y-1.5">
              {tampilan === "klaster" && (
                <>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Filter Klaster</label>
                  <Select value={klasterFilter} onValueChange={setKlasterFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Klaster</SelectItem>
                      <SelectItem value="K1">K1 — Tidak ada perubahan</SelectItem>
                      <SelectItem value="K2">K2 — Perubahan sedang</SelectItem>
                      <SelectItem value="K3">K3 — Perubahan signifikan</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {tampilan === "smartmap" && (
                <>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Filter</label>
                  <Select value={smartJenis} onValueChange={setSmartJenis}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(JENIS_LABEL).map(([key, lbl]) => (
                        <SelectItem key={key} value={key}>{lbl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {tampilan === "tagging" && (
                <>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Filter Warna Marker</label>
                  <Select value={taggingMode} onValueChange={setTaggingMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luasBangunan">Luas Bangunan</SelectItem>
                      <SelectItem value="luasLahan">Luas Lahan</SelectItem>
                      <SelectItem value="jumlahLantai">Tingkatan Rumah</SelectItem>
                      <SelectItem value="jenisDinding">Jenis Dinding</SelectItem>
                      <SelectItem value="jenisPlafon">Jenis Plafon</SelectItem>
                      <SelectItem value="jeniLantai">Jenis Lantai</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* RT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">RT</label>
              <Select value={filterRT} onValueChange={setFilterRT}>
                <SelectTrigger><SelectValue placeholder="Semua RT" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {["01", "02", "03", "04", "05", "06"].map((rt) => (
                    <SelectItem key={rt} value={`RT ${rt}`}>RT {rt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* RW */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">RW</label>
              <Select value={filterRW} onValueChange={setFilterRW}>
                <SelectTrigger><SelectValue placeholder="Semua RW" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RW</SelectItem>
                  {["01", "02", "03"].map((rw) => (
                    <SelectItem key={rw} value={`RW ${rw}`}>RW {rw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pencarian */}
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

            {/* Switch Tampilan — hanya 3 opsi */}
            <div className="space-y-1.5 border-l pl-4">
              <label className="text-xs font-semibold uppercase text-primary">Switch Tampilan</label>
              <Select value={tampilan} onValueChange={(v: Tampilan) => setTampilan(v)}>
                <SelectTrigger className="border-primary/50 bg-primary/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="klaster">Peta Klasterisasi</SelectItem>
                  <SelectItem value="smartmap">SMART MAP</SelectItem>
                  <SelectItem value="tagging">Peta Tagging Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Map */}
        <div className="lg:col-span-2 relative min-h-[500px] h-[calc(100vh-320px)] border rounded-md shadow-sm overflow-hidden bg-card">
          {isHousesLoading ? (
            <Skeleton className="w-full h-full rounded-md" />
          ) : (
            <LeafletMapEngine
              data={filteredHouses}
              height="100%"
              colorByField={colorByField}
              colorMap={tampilan === "tagging" ? (colorFn as any) : (colorFn as any)}
              legend={legend}
              popupContent={(h) => (
                <div className="space-y-3 w-[260px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm leading-tight text-foreground">{h.namaKepalaKeluarga}</div>
                      <div className="text-xs text-muted-foreground font-mono">{h.id} • {h.rt}/{h.rw}</div>
                    </div>
                    <Badge
                      variant={h.statusPerubahan === "berubah" ? "destructive" : "outline"}
                      className="text-[10px] uppercase"
                    >
                      {h.statusPerubahan.replace("_", " ")}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                    <div className="text-muted-foreground">Luas Bgn:</div>
                    <div className="font-medium text-right">{h.luasBangunan || "—"} m²</div>
                    <div className="text-muted-foreground">Luas Lahan:</div>
                    <div className="font-medium text-right">{h.luasLahan || "—"} m²</div>
                    <div className="text-muted-foreground">Kondisi:</div>
                    <div className="font-medium text-right">{h.kondisiBangunan || "—"}</div>
                    <div className="text-muted-foreground">Lantai:</div>
                    <div className="font-medium text-right">{h.jeniLantai || "—"} ({h.jumlahLantai || "—"} Lt)</div>
                    <div className="text-muted-foreground">Dinding:</div>
                    <div className="font-medium text-right">{h.jenisDinding || "—"}</div>
                    <div className="text-muted-foreground">Atap:</div>
                    <div className="font-medium text-right">{h.jenisAtap || "—"}</div>
                    <div className="text-muted-foreground">Pagar:</div>
                    <div className="font-medium text-right">{h.pagar || "—"}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Status Perubahan Indikator
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: "Pagar", changed: h.perubahanPagar },
                        { label: "Luas Bangunan", changed: h.perubahanLuasBangunan },
                        { label: "Jumlah Lantai", changed: h.perubahanJumlahLantai },
                        { label: "Luas Lahan", changed: h.perubahanLuasLahan },
                        { label: "Jenis Lantai", changed: h.perubahanJenisLantai },
                        { label: "Jenis Dinding", changed: h.perubahanJenisDinding },
                        { label: "Jenis Atap", changed: h.perubahanJenisAtap },
                      ].map((ind, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className={ind.changed ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {ind.label}
                          </span>
                          {ind.changed ? (
                            <Check className="w-3.5 h-3.5 text-destructive" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground/50" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        {/* Sidebar: Insight */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" /> Insight — {tampilanLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-md p-3">
                <Building2 className="w-8 h-8 text-primary-foreground/80" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                    Menampilkan
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {isHousesLoading ? "..." : filteredHouses.length}
                    <span className="text-sm font-sans font-normal text-primary-foreground/80 ml-1">rumah</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              {legend.length > 0 && (
                <>
                  <Separator className="bg-primary-foreground/20" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">Legenda</p>
                    {legend.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs text-primary-foreground/90">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator className="bg-primary-foreground/20" />

              {isInsightLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-5/6 bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-4/6 bg-primary-foreground/20" />
                </div>
              ) : insight ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium leading-relaxed">{insight.ringkasan}</p>
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
