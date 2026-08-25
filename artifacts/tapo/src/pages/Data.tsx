import { useState, useMemo } from "react";
import { botingData } from "@/data/boting-data";
import { Database, Search, Download, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type SortField = "id" | "namaKepalaKeluarga" | "rt" | "luasBangunan" | "luasLahan" | "kondisiBangunan" | "klaster";
type SortOrder = "asc" | "desc";

export default function DataPerumahan() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [filterKondisi, setFilterKondisi] = useState<string>("all");
  const [filterRT, setFilterRT] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Data is fixed and bundled locally; no API request is needed.
  const houses = useMemo(() => {
    return botingData.filter((h) => {
      if (filterStatus !== "all" && h.statusPerubahan !== filterStatus) return false;
      if (filterKondisi !== "all" && h.kondisiBangunan !== filterKondisi) return false;
      if (filterRT !== "all" && h.rt !== filterRT) return false;

      if (filterJenis !== "all") {
        const jenisField = filterJenis as keyof typeof h;
        if (h[jenisField] !== true) return false;
      }

      return true;
    });
  }, [filterStatus, filterJenis, filterKondisi, filterRT]);

  const isLoading = false;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortOrder === "asc" ? <ChevronUp className="w-3 h-3 ml-1 text-primary" /> : <ChevronDown className="w-3 h-3 ml-1 text-primary" />;
  };

  // Local filtering & sorting
  const processedData = useMemo(() => {
    if (!houses) return [];
    
    let result = [...houses];

    // Text search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(h => 
        h.namaKepalaKeluarga?.toLowerCase().includes(lower) || 
        h.id.toLowerCase().includes(lower) ||
        h.alamat?.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [houses, search, sortField, sortOrder]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;
  const paginatedData = processedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const resetPage = () => setPage(1);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" /> Data Perumahan
        </h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Kelurahan Boting · Database Master
        </p>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Status Perubahan</label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="berubah">Berubah</SelectItem>
                  <SelectItem value="tidak_berubah">Tidak Berubah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Jenis Perubahan</label>
              <Select value={filterJenis} onValueChange={(v) => { setFilterJenis(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="perubahanPagar">Pagar</SelectItem>
                  <SelectItem value="perubahanLuasBangunan">Luas Bangunan</SelectItem>
                  <SelectItem value="perubahanJumlahLantai">Jumlah Lantai</SelectItem>
                  <SelectItem value="perubahanLuasLahan">Luas Lahan</SelectItem>
                  <SelectItem value="perubahanJenisLantai">Jenis Lantai</SelectItem>
                  <SelectItem value="perubahanJenisDinding">Jenis Dinding</SelectItem>
                  <SelectItem value="perubahanJenisAtap">Jenis Atap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Kondisi Bangunan</label>
              <Select value={filterKondisi} onValueChange={(v) => { setFilterKondisi(v); resetPage(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kondisi</SelectItem>
                  <SelectItem value="Baik">Baik</SelectItem>
                  <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                  <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Wilayah (RT)</label>
              <Select value={filterRT} onValueChange={(v) => { setFilterRT(v); resetPage(); }}>
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
              <label className="text-xs font-semibold uppercase text-muted-foreground">Pencarian Bebas</label>
              <div className="relative">
                <Input 
                  placeholder="Cari Nama, ID, Alamat..." 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                  className="pl-8"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="overflow-x-auto flex-1 border-b">
          <Table className="w-[1800px] max-w-none">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="w-24 cursor-pointer hover:bg-muted" onClick={() => toggleSort("id")}>
                  <div className="flex items-center">ID <SortIcon field="id" /></div>
                </TableHead>
                <TableHead className="w-48 cursor-pointer hover:bg-muted" onClick={() => toggleSort("namaKepalaKeluarga")}>
                  <div className="flex items-center">Nama KK <SortIcon field="namaKepalaKeluarga" /></div>
                </TableHead>
                <TableHead className="w-64">Alamat</TableHead>
                <TableHead className="w-20 cursor-pointer hover:bg-muted" onClick={() => toggleSort("rt")}>
                  <div className="flex items-center">RT/RW <SortIcon field="rt" /></div>
                </TableHead>
                <TableHead className="w-24 text-right cursor-pointer hover:bg-muted" onClick={() => toggleSort("luasBangunan")}>
                  <div className="flex items-center justify-end">L.Bgn (m²) <SortIcon field="luasBangunan" /></div>
                </TableHead>
                <TableHead className="w-24 text-right cursor-pointer hover:bg-muted" onClick={() => toggleSort("luasLahan")}>
                  <div className="flex items-center justify-end">L.Lahan (m²) <SortIcon field="luasLahan" /></div>
                </TableHead>
                <TableHead className="w-28">Lantai</TableHead>
                <TableHead className="w-24">Dinding</TableHead>
                <TableHead className="w-24">Atap</TableHead>
                <TableHead className="w-24">Pagar</TableHead>
                <TableHead className="w-28 cursor-pointer hover:bg-muted" onClick={() => toggleSort("kondisiBangunan")}>
                  <div className="flex items-center">Kondisi <SortIcon field="kondisiBangunan" /></div>
                </TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-20 text-center cursor-pointer hover:bg-muted" onClick={() => toggleSort("klaster")}>
                  <div className="flex items-center justify-center">Klaster <SortIcon field="klaster" /></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(14).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Database className="w-8 h-8 text-muted-foreground/30" />
                      <div>Tidak ada data yang sesuai dengan filter.</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((h, i) => (
                  <TableRow key={h.id} className={h.statusPerubahan === "berubah" ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                    <TableCell className="text-center font-mono text-muted-foreground text-xs">
                      {(page - 1) * itemsPerPage + i + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.id}</TableCell>
                    <TableCell className="font-medium text-sm">{h.namaKepalaKeluarga}</TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]" title={h.alamat}>{h.alamat}</TableCell>
                    <TableCell className="font-mono text-xs">{h.rt}/{h.rw.replace("RW ", "")}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{h.luasBangunan || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{h.luasLahan || "—"}</TableCell>
                    <TableCell className="text-xs">{h.jeniLantai || "—"} ({h.jumlahLantai || "—"}Lt)</TableCell>
                    <TableCell className="text-xs">{h.jenisDinding || "—"}</TableCell>
                    <TableCell className="text-xs">{h.jenisAtap || "—"}</TableCell>
                    <TableCell className="text-xs">{h.pagar || "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{h.kondisiBangunan}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={h.statusPerubahan === "berubah" ? "destructive" : "success"} className="text-[10px] px-1.5 uppercase">
                        {h.statusPerubahan === "berubah" ? "Berubah" : "Tdk Berubah"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 border-muted-foreground/30">
                        {h.klaster}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-card mt-auto shrink-0">
          <div className="text-xs text-muted-foreground font-medium">
            Menampilkan <span className="text-foreground">{paginatedData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-foreground">{Math.min(page * itemsPerPage, processedData.length)}</span> dari <span className="text-foreground">{processedData.length}</span> rumah
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading || processedData.length === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
