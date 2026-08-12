import { useState, useMemo } from "react";
import { 
  useGetHousingSummary, 
  useGetHousingChartData, 
  useGetHousingInsight, 
  useListHouses, 
  useListChangedHouses 
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Home, Activity, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, 
  BarChart3, Settings2, Info, Map 
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

const COLOR_PALETTE = [
  "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#059669", "#EAB308", "#06B6D4"
];

function KLASTER_COLOR(klaster: string) {
  if (klaster === "K1") return "#22C55E";
  if (klaster === "K2") return "#F59E0B";
  if (klaster === "K3") return "#EF4444";
  return "#9CA3AF";
}

function STATUS_COLOR(status: string) {
  if (status === "berubah") return "#EF4444";
  return "#22C55E";
}

function LANTAI_COLOR(lantai: string | null | undefined) {
  if (lantai === "Keramik") return "#3B82F6";
  if (lantai === "Marmer/Granit") return "#8B5CF6";
  if (lantai === "Semen") return "#F59E0B";
  if (lantai === "Kayu") return "#78716C";
  return "#9CA3AF";
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetHousingSummary({
    query: { queryKey: ["dashboard", "summary"] }
  });
  
  const { data: chartData, isLoading: isLoadingChart } = useGetHousingChartData({
    query: { queryKey: ["dashboard", "chart"] }
  });
  
  const { data: insight, isLoading: isLoadingInsight } = useGetHousingInsight(undefined, {
    query: { queryKey: ["dashboard", "insight"] }
  });
  
  const { data: allHouses, isLoading: isLoadingAll } = useListHouses(undefined, {
    query: { queryKey: ["dashboard", "allHouses"] }
  });
  
  const { data: changedHouses, isLoading: isLoadingChanged } = useListChangedHouses({
    query: { queryKey: ["dashboard", "changedHouses"] }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const [currentPageChanged, setCurrentPageChanged] = useState(1);
  const itemsPerPage = 10;

  // Helpers for filtering and pagination
  const filterHouses = (houses: any[] = []) => {
    if (!searchQuery) return houses;
    const lower = searchQuery.toLowerCase();
    return houses.filter((h) => 
      h.namaKepalaKeluarga?.toLowerCase().includes(lower) || 
      h.alamat?.toLowerCase().includes(lower)
    );
  };

  const paginatedAll = useMemo(() => {
    const filtered = filterHouses(allHouses);
    return filtered.slice((currentPageAll - 1) * itemsPerPage, currentPageAll * itemsPerPage);
  }, [allHouses, searchQuery, currentPageAll]);

  const paginatedChanged = useMemo(() => {
    const filtered = filterHouses(changedHouses);
    return filtered.slice((currentPageChanged - 1) * itemsPerPage, currentPageChanged * itemsPerPage);
  }, [changedHouses, searchQuery, currentPageChanged]);

  const totalAllPages = allHouses ? Math.ceil(filterHouses(allHouses).length / itemsPerPage) : 1;
  const totalChangedPages = changedHouses ? Math.ceil(filterHouses(changedHouses).length / itemsPerPage) : 1;

  if (isLoadingSummary || isLoadingChart || isLoadingInsight || isLoadingAll || isLoadingChanged) {
    return <DashboardSkeleton />;
  }

  const validJenisPerubahan = summary?.byJenisPerubahan.filter(j => j.jumlah > 0) || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* SECTION A: Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">TAPO</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Kelurahan Boting · Dashboard Perubahan Rumah
        </p>
      </div>

      {/* SECTION B: Summary Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Home className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary uppercase">Total Rumah Terdata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary font-mono tracking-tighter">
                {summary?.totalRumah.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-destructive/5 border-destructive/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-destructive" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-destructive uppercase">Rumah Mengalami Perubahan</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="text-5xl font-bold text-destructive font-mono tracking-tighter">
                {summary?.rumahBerubah.toLocaleString('id-ID')}
              </div>
              <div className="mb-1.5 flex items-center gap-1.5 text-destructive/80 font-medium">
                <Badge variant="destructive" className="font-mono text-xs">
                  {summary?.persenPerubahan.toFixed(1)}%
                </Badge>
                dari total
              </div>
            </CardContent>
          </Card>
        </div>

        {validJenisPerubahan.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {validJenisPerubahan.map((jenis, idx) => (
              <Card key={idx} className="shadow-sm border-border">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase leading-tight line-clamp-2 h-7">
                    {jenis.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="text-xl font-bold font-mono text-foreground">
                    {jenis.jumlah.toLocaleString('id-ID')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION C: Distribusi Perubahan Rumah */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Proporsi Jenis Perubahan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData?.jenisPerubahan}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="jumlah"
                    nameKey="label"
                    stroke="none"
                  >
                    {chartData?.jenisPerubahan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} Rumah`, "Jumlah"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-foreground leading-none">{summary?.rumahBerubah}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Total</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-2 mt-4 px-2">
              {chartData?.jenisPerubahan.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length] }} />
                  <span className="truncate flex-1 text-muted-foreground" title={entry.label}>{entry.label}</span>
                  <span className="font-mono font-medium">{entry.jumlah}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 bg-foreground text-background border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary-foreground">
              <Settings2 className="w-4 h-4 text-primary-foreground/80" />
              Smart Insight
            </CardTitle>
            <CardDescription className="text-primary-foreground/60">
              Analisis otomatis berdasarkan data terkini
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            <p className="text-lg font-medium leading-relaxed">
              {insight?.ringkasan}
            </p>
            <div className="space-y-3">
              {insight?.poin.map((p, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <span className="text-sm text-primary-foreground/90 leading-relaxed">{p}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION E: Analisis Spasial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Analisis Spasial</h2>
          <Link href="/smart-map" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
            Buka Smart Map <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Peta Klasterisasi Spasial</CardTitle>
              <CardDescription className="text-xs">Pengelompokan rumah berdasarkan tingkat perubahan</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="300px"
                colorByField="klaster"
                colorMap={KLASTER_COLOR}
                legend={[
                  { label: "K1 - Tidak/Sedikit Berubah", color: "#22C55E" },
                  { label: "K2 - Perubahan Sedang", color: "#F59E0B" },
                  { label: "K3 - Perubahan Signifikan", color: "#EF4444" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <Badge className="text-[10px]" style={{ backgroundColor: KLASTER_COLOR(h.klaster) }}>
                      {h.klaster}
                    </Badge>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1">
                <Map className="w-4 h-4 text-primary" /> Smart Map
              </CardTitle>
              <CardDescription className="text-xs">Persebaran rumah berubah vs tidak berubah</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="300px"
                colorByField="statusPerubahan"
                colorMap={STATUS_COLOR}
                legend={[
                  { label: "Berubah", color: "#EF4444" },
                  { label: "Tidak Berubah", color: "#22C55E" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <Badge variant={h.statusPerubahan === "berubah" ? "destructive" : "success"} className="text-[10px]">
                      {h.statusPerubahan.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Peta Tagging Location</CardTitle>
              <CardDescription className="text-xs">Distribusi berdasarkan jenis lantai</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LeafletMapEngine
                data={allHouses || []}
                height="300px"
                colorByField="jeniLantai"
                colorMap={LANTAI_COLOR}
                legend={[
                  { label: "Keramik", color: "#3B82F6" },
                  { label: "Marmer/Granit", color: "#8B5CF6" },
                  { label: "Semen", color: "#F59E0B" },
                  { label: "Kayu", color: "#78716C" },
                  { label: "Tidak Diketahui", color: "#9CA3AF" },
                ]}
                popupContent={(h) => (
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm">{h.id}</div>
                    <div className="text-xs">{h.namaKepalaKeluarga}</div>
                    <div className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded inline-block">
                      Lantai: {h.jeniLantai || "—"}
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION D: Tabel Data Terstruktur */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-lg font-bold tracking-tight">Data Terstruktur</h2>
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
          
          <TabsContent value="changed" className="m-0 border rounded-md shadow-sm bg-card overflow-hidden">
            <HouseTable 
              data={paginatedChanged} 
              page={currentPageChanged}
              totalPages={totalChangedPages}
              onPageChange={setCurrentPageChanged}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

function HouseTable({ 
  data, 
  page, 
  totalPages, 
  onPageChange 
}: { 
  data: any[]; 
  page: number; 
  totalPages: number; 
  onPageChange: (p: number) => void; 
}) {
  const getJenisPerubahanList = (h: any) => {
    const list = [];
    if (h.perubahanPagar) list.push("Pagar");
    if (h.perubahanLuasBangunan) list.push("Luas Bangunan");
    if (h.perubahanJumlahLantai) list.push("Jumlah Lantai");
    if (h.perubahanJenisLantai) list.push("Jenis Lantai");
    if (h.perubahanJenisDinding) list.push("Jenis Dinding");
    if (h.perubahanLuasLahan) list.push("Luas Lahan");
    if (h.perubahanJenisAtap) list.push("Jenis Atap");
    return list.length > 0 ? list.join(", ") : "—";
  };

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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((h, i) => (
                <TableRow key={h.id}>
                  <TableCell className="text-center font-mono text-muted-foreground text-xs">
                    {(page - 1) * 10 + i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{h.namaKepalaKeluarga}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground" title={h.alamat}>
                    {h.alamat}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.rt}</TableCell>
                  <TableCell className="font-mono text-xs">{h.rw}</TableCell>
                  <TableCell>
                    <Badge variant={h.statusPerubahan === "berubah" ? "destructive" : "success"} className="text-[10px]">
                      {h.statusPerubahan.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs" title={getJenisPerubahanList(h)}>
                    {getJenisPerubahanList(h)}
                  </TableCell>
                  <TableCell className="text-xs">{h.kondisiBangunan}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]" style={{ color: KLASTER_COLOR(h.klaster), borderColor: KLASTER_COLOR(h.klaster) }}>
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

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full col-span-1 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[350px] w-full" />)}
      </div>
    </div>
  );
}
