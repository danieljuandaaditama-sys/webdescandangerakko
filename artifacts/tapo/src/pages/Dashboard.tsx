import { useState, useMemo } from "react";
import {
  useGetHousingSummary,
  useGetHousingChartData,
  useGetHousingInsight,
  useListHouses,
  useListChangedHouses,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Home, Activity, CheckCircle2, ArrowRight, ChevronRight,
  BarChart3, Settings2, Info, Map, Layers, MapPin, Tag,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { LeafletMapEngine } from "@/components/map/LeafletMapEngine";

// ─── Color helpers ──────────────────────────────────────────────────────────

const CHART_PALETTE = [
  "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669", "#EAB308", "#06B6D4",
];

function klasterColor(klaster: string) {
  if (klaster === "K1") return "#22C55E";
  if (klaster === "K2") return "#F59E0B";
  if (klaster === "K3") return "#EF4444";
  return "#9CA3AF";
}

function statusColor(status: string) {
  return status === "berubah" ? "#EF4444" : "#22C55E";
}

function lantaiColor(lantai: string | null | undefined) {
  if (lantai === "Keramik") return "#3B82F6";
  if (lantai === "Marmer/Granit") return "#8B5CF6";
  if (lantai === "Semen") return "#F59E0B";
  if (lantai === "Kayu") return "#78716C";
  return "#9CA3AF";
}

// ─── Jenis perubahan label builder ─────────────────────────────────────────

function getJenisPerubahanList(h: any) {
  const list: string[] = [];
  if (h.perubahanPagar) list.push("Pagar");
  if (h.perubahanLuasBangunan) list.push("Luas Bangunan");
  if (h.perubahanJumlahLantai) list.push("Jumlah Lantai");
  if (h.perubahanJenisLantai) list.push("Jenis Lantai");
  if (h.perubahanJenisDinding) list.push("Jenis Dinding");
  if (h.perubahanLuasLahan) list.push("Luas Lahan");
  if (h.perubahanJenisAtap) list.push("Jenis Atap");
  return list.length > 0 ? list.join(", ") : "—";
}

// ─── Spatial analysis options ───────────────────────────────────────────────

type SpatialMode = "klaster" | "smartmap" | "tagging" | null;

const SPATIAL_OPTIONS: { id: SpatialMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "klaster",
    label: "Peta Klasterisasi",
    desc: "Pengelompokan rumah berdasarkan tingkat perubahan (K1/K2/K3)",
    icon: <Layers className="w-5 h-5" />,
  },
  {
    id: "smartmap",
    label: "Smart Map",
    desc: "Persebaran rumah berubah vs tidak berubah secara spasial",
    icon: <Map className="w-5 h-5" />,
  },
  {
    id: "tagging",
    label: "Tagging Location",
    desc: "Distribusi lokasi berdasarkan jenis lantai bangunan",
    icon: <Tag className="w-5 h-5" />,
  },
];

// ─── Main component ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetHousingSummary({
    query: { queryKey: ["dashboard", "summary"] },
  });

  const { data: chartData, isLoading: isLoadingChart } = useGetHousingChartData({
    query: { queryKey: ["dashboard", "chart"] },
  });

  const { data: insight, isLoading: isLoadingInsight } = useGetHousingInsight(undefined, {
    query: { queryKey: ["dashboard", "insight"] },
  });

  const { data: allHouses, isLoading: isLoadingAll } = useListHouses(undefined, {
    query: { queryKey: ["dashboard", "allHouses"] },
  });

  const { data: changedHouses, isLoading: isLoadingChanged } = useListChangedHouses({
    query: { queryKey: ["dashboard", "changedHouses"] },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const [currentPageChanged, setCurrentPageChanged] = useState(1);
  const [spatialMode, setSpatialMode] = useState<SpatialMode>(null);
  const ITEMS_PER_PAGE = 10;

  const filterHouses = (houses: any[] = []) => {
    if (!searchQuery.trim()) return houses;
    const lower = searchQuery.toLowerCase();
    return houses.filter(
      (h) =>
        h.namaKepalaKeluarga?.toLowerCase().includes(lower) ||
        h.alamat?.toLowerCase().includes(lower),
    );
  };

  const paginatedAll = useMemo(() => {
    const filtered = filterHouses(allHouses);
    return filtered.slice((currentPageAll - 1) * ITEMS_PER_PAGE, currentPageAll * ITEMS_PER_PAGE);
  }, [allHouses, searchQuery, currentPageAll]);

  const paginatedChanged = useMemo(() => {
    const filtered = filterHouses(changedHouses);
    return filtered.slice(
      (currentPageChanged - 1) * ITEMS_PER_PAGE,
      currentPageChanged * ITEMS_PER_PAGE,
    );
  }, [changedHouses, searchQuery, currentPageChanged]);

  const totalAllPages = allHouses
    ? Math.ceil(filterHouses(allHouses).length / ITEMS_PER_PAGE)
    : 1;
  const totalChangedPages = changedHouses
    ? Math.ceil(filterHouses(changedHouses).length / ITEMS_PER_PAGE)
    : 1;

  if (
    isLoadingSummary ||
    isLoadingChart ||
    isLoadingInsight ||
    isLoadingAll ||
    isLoadingChanged
  ) {
    return <DashboardSkeleton />;
  }

  const validJenisPerubahan = summary?.byJenisPerubahan.filter((j) => j.jumlah > 0) || [];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 animate-in fade-in zoom-in-95 duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">TAPO</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Kelurahan Boting · Dashboard Perubahan Rumah
        </p>
      </div>

      {/* ── SECTION 1 — Dashboard Ringkasan ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel label="SECTION 1" title="Dashboard Ringkasan" />

        {/* Row 1: 3 primary metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Home className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
                Total Rumah Terdata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary font-mono tracking-tighter">
                {summary?.totalRumah.toLocaleString("id-ID")}
              </div>
            </CardContent>
          </Card>

          {/* Berubah */}
          <Card className="bg-destructive/5 border-destructive/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-destructive" />
            </div>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-destructive uppercase tracking-wider">
                Rumah Mengalami Perubahan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="text-5xl font-bold text-destructive font-mono tracking-tighter">
                {summary?.rumahBerubah.toLocaleString("id-ID")}
              </div>
              <div className="mb-1 flex items-center gap-1.5 text-destructive/80 font-medium">
                <Badge variant="destructive" className="font-mono text-xs">
                  {summary?.persenPerubahan.toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">dari total</span>
              </div>
            </CardContent>
          </Card>

          {/* Tidak berubah */}
          <Card className="bg-emerald-50 border-emerald-200 shadow-sm relative overflow-hidden dark:bg-emerald-950/20 dark:border-emerald-900">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-24 h-24 text-emerald-600" />
            </div>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wider dark:text-emerald-400">
                Rumah Tidak Berubah
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="text-5xl font-bold text-emerald-700 font-mono tracking-tighter dark:text-emerald-400">
                {summary?.rumahTidakBerubah.toLocaleString("id-ID")}
              </div>
              <div className="mb-1">
                <Badge
                  className="font-mono text-xs bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300"
                  variant="outline"
                >
                  {summary && summary.totalRumah > 0
                    ? (100 - summary.persenPerubahan).toFixed(1)
                    : "0"}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: 7 jenis perubahan mini cards */}
        {validJenisPerubahan.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {validJenisPerubahan.map((jenis, idx) => (
              <Card key={idx} className="shadow-sm border-border">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase leading-tight line-clamp-2 h-7">
                    {jenis.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="text-xl font-bold font-mono text-foreground">
                    {jenis.jumlah.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 2 — Smart Insight ────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel label="SECTION 2" title="Smart Insight" />

        <Card className="bg-foreground text-background border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary-foreground">
              <Settings2 className="w-4 h-4 text-primary-foreground/70" />
              Smart Insight — Kelurahan Boting
            </CardTitle>
            <CardDescription className="text-primary-foreground/60">
              Analisis otomatis berdasarkan seluruh data terkini
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
              {/* Ringkasan */}
              <div className="lg:col-span-2">
                <p className="text-lg font-medium leading-relaxed">
                  {insight?.ringkasan}
                </p>
              </div>
              {/* Poin */}
              <div className="lg:col-span-3 space-y-3">
                {insight?.poin.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-primary-foreground/90 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION 2B — Distribusi Perubahan ───────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel label="DISTRIBUSI" title="Distribusi Jenis Perubahan" />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Proporsi Jenis Perubahan Rumah
            </CardTitle>
            <CardDescription>
              Donut chart menampilkan proporsi dari{" "}
              {chartData?.jenisPerubahan.reduce((s, x) => s + x.jumlah, 0) ?? 0} kejadian
              perubahan pada {summary?.rumahBerubah ?? 0} rumah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Chart */}
              <div className="h-[260px] w-full max-w-xs flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData?.jenisPerubahan}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="jumlah"
                      nameKey="label"
                      stroke="none"
                    >
                      {chartData?.jenisPerubahan.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} Rumah`, "Jumlah"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold font-mono text-foreground leading-none">
                    {summary?.rumahBerubah}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                    Rumah Berubah
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {chartData?.jenisPerubahan.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground leading-tight truncate">
                        {entry.label}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm text-foreground shrink-0">
                      {entry.jumlah}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION 3 — Tabel Data Terstruktur ──────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel label="SECTION 3" title="Tabel Data Terstruktur" />

        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="all">Seluruh Rumah</TabsTrigger>
              <TabsTrigger value="changed">Mengalami Perubahan</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Cari Nama KK atau Alamat..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPageAll(1);
                  setCurrentPageChanged(1);
                }}
                className="pl-8"
              />
              <Info className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
          </div>

          <TabsContent value="all" className="m-0 border rounded-md shadow-sm bg-card overflow-hidden">
            <HouseTable
              data={paginatedAll}
              page={currentPageAll}
              totalPages={totalAllPages}
              onPageChange={setCurrentPageAll}
            />
          </TabsContent>

          <TabsContent
            value="changed"
            className="m-0 border rounded-md shadow-sm bg-card overflow-hidden"
          >
            <HouseTable
              data={paginatedChanged}
              page={currentPageChanged}
              totalPages={totalChangedPages}
              onPageChange={setCurrentPageChanged}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* ── SECTION 4 — Analisis Spasial (Interactive) ──────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel label="SECTION 4" title="Analisis Spasial" noMargin />
          <Link
            href="/smart-map"
            className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            Buka Smart Map <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SPATIAL_OPTIONS.map((opt) => {
            const isActive = spatialMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSpatialMode(isActive ? null : opt.id)}
                className={[
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150 w-full",
                  isActive
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 rounded-md p-1.5 shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {opt.icon}
                </div>
                <div>
                  <div
                    className={[
                      "text-sm font-semibold leading-tight",
                      isActive ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    {opt.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Map panel — empty state or selected map */}
        {spatialMode === null ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1 max-w-sm">
                <p className="text-base font-semibold text-foreground">
                  Pilih Jenis Analisis Spasial
                </p>
                <p className="text-sm text-muted-foreground">
                  Silakan pilih salah satu jenis analisis di atas untuk menampilkan visualisasi peta.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : spatialMode === "klaster" ? (
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Peta Klasterisasi Spasial
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Pengelompokan rumah berdasarkan jumlah jenis perubahan (K1=0, K2=1–2, K3≥3)
                  </CardDescription>
                </div>
                <button
                  onClick={() => setSpatialMode(null)}
                  className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="450px"
                colorByField="klaster"
                colorMap={klasterColor}
                legend={[
                  { label: "K1 — Tidak/Sedikit Berubah", color: "#22C55E" },
                  { label: "K2 — Perubahan Sedang", color: "#F59E0B" },
                  { label: "K3 — Perubahan Signifikan", color: "#EF4444" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <div className="text-xs text-muted-foreground">{h.alamat}</div>
                    <Badge
                      className="text-[10px] mt-1"
                      style={{ backgroundColor: klasterColor(h.klaster) }}
                    >
                      {h.klaster} · {h.jumlahJenisPerubahan} perubahan
                    </Badge>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        ) : spatialMode === "smartmap" ? (
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary" />
                    Smart Map
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Persebaran spasial rumah berubah vs tidak berubah
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/smart-map"
                    className="text-xs text-primary font-semibold border border-primary/30 rounded px-2 py-1 hover:bg-primary/5 transition-colors"
                  >
                    Buka Smart Map Lengkap →
                  </Link>
                  <button
                    onClick={() => setSpatialMode(null)}
                    className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="450px"
                colorByField="statusPerubahan"
                colorMap={statusColor}
                legend={[
                  { label: "Berubah", color: "#EF4444" },
                  { label: "Tidak Berubah", color: "#22C55E" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <div className="text-xs text-muted-foreground">{h.alamat}</div>
                    <Badge
                      variant={h.statusPerubahan === "berubah" ? "destructive" : "outline"}
                      className="text-[10px] mt-1"
                    >
                      {h.statusPerubahan === "berubah" ? "BERUBAH" : "TIDAK BERUBAH"}
                    </Badge>
                    {h.statusPerubahan === "berubah" && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {getJenisPerubahanList(h)}
                      </div>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        ) : (
          /* tagging */
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Peta Tagging Location
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Distribusi spasial berdasarkan jenis lantai bangunan
                  </CardDescription>
                </div>
                <button
                  onClick={() => setSpatialMode(null)}
                  className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="450px"
                colorByField="jeniLantai"
                colorMap={lantaiColor}
                legend={[
                  { label: "Keramik", color: "#3B82F6" },
                  { label: "Marmer/Granit", color: "#8B5CF6" },
                  { label: "Semen", color: "#F59E0B" },
                  { label: "Kayu", color: "#78716C" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <div className="text-xs text-muted-foreground">{h.alamat}</div>
                    <div
                      className="text-[10px] font-semibold rounded px-1.5 py-0.5 inline-block mt-1 text-white"
                      style={{ backgroundColor: lantaiColor(h.jeniLantai) }}
                    >
                      Lantai: {h.jeniLantai || "—"}
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────

function SectionLabel({
  label,
  title,
  noMargin,
}: {
  label: string;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? "" : ""}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <h2 className="text-lg font-bold tracking-tight mt-2">{title}</h2>
    </div>
  );
}

// ─── House table ────────────────────────────────────────────────────────────

function HouseTable({
  data,
  page,
  totalPages,
  onPageChange,
}: {
  data: any[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Nama KK</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="w-16">RT</TableHead>
              <TableHead className="w-16">RW</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jenis Perubahan</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Klaster</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                    <span>Tidak ada data yang ditemukan.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((h, i) => (
                <TableRow
                  key={h.id}
                  className={
                    h.statusPerubahan === "berubah" ? "bg-destructive/[0.03]" : ""
                  }
                >
                  <TableCell className="text-center font-mono text-muted-foreground text-xs">
                    {(page - 1) * 10 + i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{h.namaKepalaKeluarga}</TableCell>
                  <TableCell
                    className="max-w-[180px] truncate text-muted-foreground text-xs"
                    title={h.alamat}
                  >
                    {h.alamat}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.rt}</TableCell>
                  <TableCell className="font-mono text-xs">{h.rw}</TableCell>
                  <TableCell>
                    <Badge
                      variant={h.statusPerubahan === "berubah" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {h.statusPerubahan === "berubah" ? "BERUBAH" : "TIDAK BERUBAH"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] truncate text-xs"
                    title={getJenisPerubahanList(h)}
                  >
                    {getJenisPerubahanList(h)}
                  </TableCell>
                  <TableCell className="text-xs">{h.kondisiBangunan}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px]"
                      style={{
                        color: klasterColor(h.klaster),
                        borderColor: klasterColor(h.klaster),
                      }}
                    >
                      {h.klaster}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground font-medium">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
      </div>
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[280px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
