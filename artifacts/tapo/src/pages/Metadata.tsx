import { FileText, Database, MapPin, Calendar, Users, Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MetadataVariable = { nama: string; deskripsi: string; tipe: string; nilaiValid: string | null };
type HousingMetadata = {
  namaDataset: string; periodeData: string; sumberData: string; unitObservasi: string;
  cakupanWilayah: string; jumlahObservasi: number; informasiKoordinat: string;
  keteranganIndikator: string; variabel: MetadataVariable[];
};

// Salinan data metadata dari endpoint lama /housing/boting/metadata.
// Sekarang dibuat statis agar halaman tidak bergantung pada API Replit.
const metadata: HousingMetadata = {
  namaDataset: "Pendataan Lengkap Perumahan Kelurahan Boting",
  periodeData: "2024",
  sumberData: "Pemerintah Kelurahan Boting, Kecamatan Wara Selatan, Kota Palopo",
  unitObservasi: "Bangunan/Rumah Tangga",
  cakupanWilayah: "Kelurahan Boting, Kecamatan Wara Selatan, Kota Palopo, Sulawesi Selatan",
  jumlahObservasi: 573,
  informasiKoordinat: "Koordinat GPS (WGS84 — Decimal Degrees). Lat ≈ -2.97 hingga -2.99, Lng ≈ 120.19. Catatan: koordinat saat ini adalah perkiraan representatif; koordinat GPS lapangan akan menggantikan setelah upload dataset asli.",
  keteranganIndikator: "Terdapat 7 indikator perubahan yang didata: Pagar, Luas Bangunan, Jumlah Lantai, Jenis Lantai, Jenis Dinding, Luas Lahan, dan Jenis Atap. Status perubahan (berubah/tidak berubah) diturunkan secara otomatis dari ketujuh indikator tersebut.",
  variabel: [
    ["ID Rumah","Kode unik setiap rumah","String","B-001 s/d B-050"],
    ["Nomor Urut","Nomor urut pendataan","Integer","1 s/d n"],
    ["Nama Kepala Keluarga","Nama KK sesuai dokumen pendataan","String",null],
    ["Alamat","Alamat lengkap bangunan","String",null],
    ["RT","Rukun Tetangga","String","RT 01 — RT 06"],
    ["RW","Rukun Warga","String","RW 01 — RW 03"],
    ["Luas Bangunan","Luas bangunan dalam meter persegi","Number (m²)",null],
    ["Luas Lahan","Luas lahan dalam meter persegi","Number (m²)",null],
    ["Jenis Lantai","Material lantai bangunan","Kategori","Semen, Keramik, Marmer/Granit, Kayu"],
    ["Jenis Dinding","Material dinding bangunan","Kategori","Tembok, Kayu, Bambu, Seng"],
    ["Jumlah Lantai","Jumlah lantai bangunan","Integer","1, 2"],
    ["Jenis Atap","Material atap bangunan","Kategori","Genteng, Seng, Asbes"],
    ["Pagar","Keberadaan dan jenis pagar","Kategori","Ada (Tembok), Ada (Kayu), Tidak Ada"],
    ["Kondisi Bangunan","Kondisi fisik bangunan secara umum","Kategori","Baik, Rusak Ringan, Rusak Berat"],
    ["Status Perubahan","Apakah bangunan mengalami perubahan dari kondisi awal","Biner","berubah, tidak_berubah"],
    ["Klaster","Pengelompokan berdasarkan jumlah jenis perubahan (K1=0, K2=1-2, K3≥3)","Kategori","K1, K2, K3"],
    ["Perubahan Pagar","Indikator perubahan pada pagar","Boolean","true, false"],
    ["Perubahan Luas Bangunan","Indikator perubahan pada luas bangunan","Boolean","true, false"],
    ["Perubahan Jumlah Lantai","Indikator perubahan pada jumlah lantai","Boolean","true, false"],
    ["Perubahan Jenis Lantai","Indikator perubahan pada jenis lantai","Boolean","true, false"],
    ["Perubahan Jenis Dinding","Indikator perubahan pada jenis dinding","Boolean","true, false"],
    ["Perubahan Luas Lahan","Indikator perubahan pada luas lahan","Boolean","true, false"],
    ["Perubahan Jenis Atap","Indikator perubahan pada jenis atap","Boolean","true, false"],
  ].map(([nama, deskripsi, tipe, nilaiValid]) => ({ nama, deskripsi, tipe, nilaiValid })) as MetadataVariable[],
};

export default function Metadata() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><FileText className="w-8 h-8 text-primary" /> Metadata Dataset</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Informasi &amp; Struktur Data Sistem</p>
      </div>
      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <div className="h-2 w-full bg-primary" />
        <CardHeader className="pb-4"><CardTitle className="text-xl">{metadata.namaDataset}</CardTitle><CardDescription>Detail teknis dan ruang lingkup dataset perumahan.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Periode Data</div><div className="font-medium">{metadata.periodeData}</div></div>
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Database className="w-3.5 h-3.5" /> Sumber Data</div><div className="font-medium">{metadata.sumberData}</div></div>
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5" /> Unit Observasi</div><div className="font-medium">{metadata.unitObservasi}</div></div>
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5" /> Cakupan Wilayah</div><div className="font-medium">{metadata.cakupanWilayah}</div></div>
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5" /> Jumlah Observasi</div><div className="font-medium text-lg font-mono text-primary">{metadata.jumlahObservasi.toLocaleString("id-ID")} <span className="text-sm text-foreground font-sans">rumah</span></div></div>
            <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1"><CheckCircle2 className="w-3.5 h-3.5" /> Info Koordinat</div><div className="font-medium">{metadata.informasiKoordinat}</div></div>
          </div>
          <div className="mt-6 p-4 bg-muted/30 rounded-md border border-muted-foreground/10 text-sm leading-relaxed"><span className="font-semibold block mb-1">Keterangan Indikator:</span>{metadata.keteranganIndikator}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-border">
        <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Struktur Variabel</CardTitle><CardDescription>Definisi dan format data yang tersedia dalam dataset.</CardDescription></CardHeader>
        <CardContent className="p-0"><Table><TableHeader className="bg-muted/30"><TableRow><TableHead className="w-[200px]">Nama Variabel</TableHead><TableHead>Deskripsi</TableHead><TableHead className="w-[120px]">Tipe</TableHead><TableHead className="w-[300px]">Nilai Valid</TableHead></TableRow></TableHeader><TableBody>
          {metadata.variabel.map((v, i) => <TableRow key={i}><TableCell className="font-mono text-xs font-semibold text-foreground">{v.nama}</TableCell><TableCell className="text-sm text-muted-foreground">{v.deskripsi}</TableCell><TableCell><Badge variant="outline" className="font-mono text-[10px] bg-muted/50">{v.tipe}</Badge></TableCell><TableCell className="text-xs">{v.nilaiValid ? <div className="text-muted-foreground">{v.nilaiValid}</div> : <span className="text-muted-foreground/50 italic">—</span>}</TableCell></TableRow>)}
        </TableBody></Table></CardContent>
      </Card>
    </div>
  );
}
