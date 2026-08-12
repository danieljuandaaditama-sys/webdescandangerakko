import React, { useState, useMemo } from "react"
import { 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Map as MapIcon, 
  AlertCircle,
  Loader2,
  FileSpreadsheet
} from "lucide-react"

import {
  useListHouses,
  useGetHousingSummary,
  useGetHousingChartData,
  useGetHousingInsight,
  useListChangedHouses,
  ListHousesStatusPerubahan
} from "@workspace/api-client-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { NativeSelect } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"

import { MapView } from "@/components/map-view"
import { DashboardCharts } from "@/components/charts"

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [jenisFilter, setJenisFilter] = useState<string>("all")
  const [kondisiFilter, setKondisiFilter] = useState<string>("all")
  const [rtFilter, setRtFilter] = useState<string>("all")

  // Map local state to API parameters
  const apiParams = useMemo(() => {
    const params: any = {}
    if (statusFilter !== "all") params.statusPerubahan = statusFilter as ListHousesStatusPerubahan
    if (jenisFilter !== "all") params.jenisPerubahan = jenisFilter
    if (kondisiFilter !== "all") params.kondisiBangunan = kondisiFilter
    if (rtFilter !== "all") params.rt = rtFilter
    return params
  }, [statusFilter, jenisFilter, kondisiFilter, rtFilter])

  // Insight API takes subset of params
  const insightParams = useMemo(() => {
    const params: any = {}
    if (statusFilter !== "all") params.statusPerubahan = statusFilter
    if (jenisFilter !== "all") params.jenisPerubahan = jenisFilter
    if (rtFilter !== "all") params.rt = rtFilter
    return params
  }, [statusFilter, jenisFilter, rtFilter])

  // Queries
  const { data: houses, isLoading: loadingHouses, error: errorHouses } = useListHouses(apiParams, { query: { enabled: true } })
  const { data: summary, isLoading: loadingSummary } = useGetHousingSummary({ query: { enabled: true } })
  const { data: chartData, isLoading: loadingChartData } = useGetHousingChartData({ query: { enabled: true } })
  const { data: insight, isLoading: loadingInsight } = useGetHousingInsight(insightParams, { query: { enabled: true } })
  const { data: changedHouses, isLoading: loadingChangedHouses } = useListChangedHouses({ query: { enabled: true } })

  const resetFilters = () => {
    setStatusFilter("all")
    setJenisFilter("all")
    setKondisiFilter("all")
    setRtFilter("all")
  }

  // Calculate dynamic stats from filtered data (since summary endpoint might be global, though often summary endpoints take params too. The generated hook for summary doesn't take params! So we calculate from 'houses' for accurate filtered stats if needed, or rely on global summary for top cards. The prompt says "StatCards row... Filters must drive all API calls reactively." Wait, `useGetHousingSummary` doesn't accept params according to schema. I will show global summary in top cards or calculate from local filtered list. Let's calculate from local list if filters are active, or just display global summary. Actually, let's use the `houses` array to calculate filtered stats so they reflect the map).
  // Wait, if I calculate from `houses`, it's perfectly reactive.
  const filteredStats = useMemo(() => {
    if (!houses) return { total: 0, berubah: 0, tidakBerubah: 0, persen: 0 }
    const total = houses.length
    const berubah = houses.filter(h => h.statusPerubahan === "berubah").length
    const tidakBerubah = houses.filter(h => h.statusPerubahan === "tidak_berubah").length
    const persen = total > 0 ? ((berubah / total) * 100).toFixed(1) : "0.0"
    return { total, berubah, tidakBerubah, persen }
  }, [houses])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
          <MapIcon className="h-5 w-5" />
          <span>TAPO <span className="font-medium text-muted-foreground">| Kelurahan Boting</span></span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground font-mono">
          SYSTEM_STATUS: ONLINE
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* Filter Bar */}
        <div className="bg-card border rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Perubahan</label>
              <NativeSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="berubah">Berubah</option>
                <option value="tidak_berubah">Tidak Berubah</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jenis Perubahan</label>
              <NativeSelect value={jenisFilter} onChange={e => setJenisFilter(e.target.value)}>
                <option value="all">Semua Jenis</option>
                <option value="Renovasi">Renovasi</option>
                <option value="Pembongkaran">Pembongkaran</option>
                <option value="Pembangunan Baru">Pembangunan Baru</option>
                <option value="Alih Fungsi">Alih Fungsi</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kondisi Bangunan</label>
              <NativeSelect value={kondisiFilter} onChange={e => setKondisiFilter(e.target.value)}>
                <option value="all">Semua Kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wilayah RT</label>
              <NativeSelect value={rtFilter} onChange={e => setRtFilter(e.target.value)}>
                <option value="all">Semua RT</option>
                <option value="RT 01">RT 01</option>
                <option value="RT 02">RT 02</option>
                <option value="RT 03">RT 03</option>
                <option value="RT 04">RT 04</option>
                <option value="RT 05">RT 05</option>
              </NativeSelect>
            </div>
          </div>
          <div className="flex items-end h-full mt-1 sm:mt-5">
            <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider">
              Reset
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Terdata</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold">{loadingHouses ? <Skeleton className="h-9 w-20" /> : filteredStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Objek perumahan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rumah Berubah</CardTitle>
              <RefreshCw className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-destructive">{loadingHouses ? <Skeleton className="h-9 w-20" /> : filteredStats.berubah}</div>
              <p className="text-xs text-muted-foreground mt-1">Mengalami perubahan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tidak Berubah</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-success">{loadingHouses ? <Skeleton className="h-9 w-20" /> : filteredStats.tidakBerubah}</div>
              <p className="text-xs text-muted-foreground mt-1">Tetap sesuai data awal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tingkat Perubahan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold">{loadingHouses ? <Skeleton className="h-9 w-20" /> : `${filteredStats.persen}%`}</div>
              <p className="text-xs text-muted-foreground mt-1">Dari total area filter</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
          
          {/* Left Col: Insights */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full">
            <Card className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-50 border-slate-800">
              <CardHeader className="bg-slate-950 pb-4 border-b border-slate-800">
                <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400" /> 
                  Analisis Sistem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="p-6">
                  {loadingInsight ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full bg-slate-800" />
                      <Skeleton className="h-4 w-5/6 bg-slate-800" />
                      <Skeleton className="h-4 w-4/6 bg-slate-800" />
                    </div>
                  ) : insight ? (
                    <div className="space-y-6">
                      <p className="text-sm leading-relaxed text-slate-300">{insight.ringkasan}</p>
                      <ul className="space-y-3">
                        {insight.poin.map((p, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="text-blue-400 shrink-0">→</span>
                            <span className="text-slate-400 leading-snug">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">Insight belum tersedia untuk filter ini.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Col: Map */}
          <div className="lg:col-span-6 h-full relative border rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
            {loadingHouses ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium tracking-widest uppercase">Memuat Peta Spatial...</span>
              </div>
            ) : errorHouses ? (
              <div className="text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Gagal memuat data spasial
              </div>
            ) : houses && houses.length > 0 ? (
              <MapView houses={houses} />
            ) : (
              <div className="text-sm text-muted-foreground">Tidak ada koordinat terdata</div>
            )}
          </div>

          {/* Right Col: Analytics & Global Data */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2 bg-slate-50 border-b">
                <CardTitle className="text-sm">Analisis & Data Global</CardTitle>
                <CardDescription className="text-xs">Keseluruhan Kelurahan Boting</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {/* Global Summary */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ringkasan Global</h4>
                    {loadingSummary ? (
                      <Skeleton className="h-16 w-full" />
                    ) : summary ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-100 p-2 rounded">
                          <div className="text-muted-foreground text-xs">Total</div>
                          <div className="font-mono font-medium">{summary.totalRumah}</div>
                        </div>
                        <div className="bg-destructive/10 text-destructive p-2 rounded">
                          <div className="text-destructive/70 text-xs">Berubah</div>
                          <div className="font-mono font-medium">{summary.rumahBerubah}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Charts */}
                  <div className="h-[400px]">
                    {loadingChartData ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : chartData ? (
                      <DashboardCharts jenisData={chartData.jenisPerubahan} kondisiData={chartData.kondisiBangunan} />
                    ) : null}
                  </div>

                  {/* Recent Changes Log */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Log Perubahan Terbaru</h4>
                    {loadingChangedHouses ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : changedHouses && changedHouses.length > 0 ? (
                      <div className="space-y-2">
                        {changedHouses.slice(0, 5).map(house => (
                          <div key={house.id} className="text-xs border rounded p-2 bg-white flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{house.namaKepalaKeluarga}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{house.rt}</span>
                            </div>
                            <div className="text-muted-foreground">{house.jenisPerubahan}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Tidak ada riwayat perubahan.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Data Table */}
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm">Direktori Objek</CardTitle>
              <CardDescription className="text-xs">Daftar objek perumahan berdasarkan filter aktif</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-16 font-mono text-xs">NO</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Nama KK</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Alamat</TableHead>
                    <TableHead className="w-24 text-xs uppercase tracking-wider">RT/RW</TableHead>
                    <TableHead className="w-32 text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Jenis Perubahan</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHouses ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : houses && houses.length > 0 ? (
                    houses.map((house, idx) => (
                      <TableRow key={house.id}>
                        <TableCell className="font-mono text-muted-foreground text-xs">{house.nomorUrut || idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{house.namaKepalaKeluarga}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{house.alamat}</TableCell>
                        <TableCell className="text-xs font-mono">{house.rt}/{house.rw}</TableCell>
                        <TableCell>
                          <Badge variant={house.statusPerubahan === "berubah" ? "destructive" : "success"}>
                            {house.statusPerubahan === "berubah" ? "Berubah" : "Tetap"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{house.jenisPerubahan || "-"}</TableCell>
                        <TableCell className="text-sm">{house.kondisiBangunan}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                        Tidak ada data yang sesuai dengan filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
