import { useGetHousingMetadata } from "@workspace/api-client-react";
import { FileText, Database, MapPin, Calendar, Users, Target, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Metadata() {
  const { data: metadata, isLoading } = useGetHousingMetadata({
    query: { queryKey: ["metadata"] }
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" /> Metadata Dataset
        </h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Informasi & Struktur Data Sistem
        </p>
      </div>

      {isLoading || !metadata ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{metadata.namaDataset}</CardTitle>
              <CardDescription>Detail teknis dan ruang lingkup dataset perumahan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Periode Data</div>
                  <div className="font-medium">{metadata.periodeData}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Database className="w-3.5 h-3.5" /> Sumber Data</div>
                  <div className="font-medium">{metadata.sumberData}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5" /> Unit Observasi</div>
                  <div className="font-medium">{metadata.unitObservasi}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5" /> Cakupan Wilayah</div>
                  <div className="font-medium">{metadata.cakupanWilayah}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5" /> Jumlah Observasi</div>
                  <div className="font-medium text-lg font-mono text-primary">{metadata.jumlahObservasi.toLocaleString('id-ID')} <span className="text-sm text-foreground font-sans">rumah</span></div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><CheckCircle2 className="w-3.5 h-3.5" /> Info Koordinat</div>
                  <div className="font-medium">{metadata.informasiKoordinat}</div>
                </div>
              </div>
              
              {metadata.keteranganIndikator && (
                <div className="mt-6 p-4 bg-muted/30 rounded-md border border-muted-foreground/10 text-sm leading-relaxed">
                  <span className="font-semibold block mb-1">Keterangan Indikator:</span>
                  {metadata.keteranganIndikator}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg">Struktur Variabel</CardTitle>
              <CardDescription>Definisi dan format data yang tersedia dalam dataset.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[200px]">Nama Variabel</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="w-[120px]">Tipe</TableHead>
                    <TableHead className="w-[300px]">Nilai Valid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadata.variabel.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {v.nama}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.deskripsi}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-muted/50">
                          {v.tipe}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.nilaiValid ? (
                          <div className="text-muted-foreground">{v.nilaiValid}</div>
                        ) : (
                          <span className="text-muted-foreground/50 italic">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
