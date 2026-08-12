import { Router, type IRouter } from "express";
import { botingData, type House } from "../data/boting";
import {
  ListHousesQueryParams,
  ListHousesResponse,
  GetHousingSummaryResponse,
  GetHousingChartDataResponse,
  ListChangedHousesResponse,
  GetHousingInsightQueryParams,
  GetHousingInsightResponse,
  GetHousingMetadataResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── Mapping label ────────────────────────────────────────────────────────────

const JENIS_PERUBAHAN_LABELS: Record<string, string> = {
  perubahanPagar: "Perubahan Pagar",
  perubahanLuasBangunan: "Perubahan Luas Bangunan",
  perubahanJumlahLantai: "Perubahan Jumlah Lantai",
  perubahanJenisLantai: "Perubahan Jenis Lantai",
  perubahanJenisDinding: "Perubahan Jenis Dinding",
  perubahanLuasLahan: "Perubahan Luas Lahan",
  perubahanJenisAtap: "Perubahan Jenis Atap",
};

const JENIS_PERUBAHAN_KEYS = Object.keys(JENIS_PERUBAHAN_LABELS) as Array<keyof House>;

// ─── Filter helper ────────────────────────────────────────────────────────────

function applyFilters(
  data: House[],
  filters: {
    statusPerubahan?: string;
    jenisPerubahan?: string;
    kondisiBangunan?: string;
    rt?: string;
    rw?: string;
    klaster?: string;
    jeniLantai?: string;
    jenisDinding?: string;
  },
): House[] {
  return data.filter((h) => {
    if (filters.statusPerubahan && h.statusPerubahan !== filters.statusPerubahan) return false;
    if (filters.jenisPerubahan) {
      const key = filters.jenisPerubahan as keyof House;
      if (!h[key]) return false;
    }
    if (filters.kondisiBangunan && h.kondisiBangunan !== filters.kondisiBangunan) return false;
    if (filters.rt && h.rt !== filters.rt) return false;
    if (filters.rw && h.rw !== filters.rw) return false;
    if (filters.klaster && h.klaster !== filters.klaster) return false;
    if (filters.jeniLantai && h.jeniLantai !== filters.jeniLantai) return false;
    if (filters.jenisDinding && h.jenisDinding !== filters.jenisDinding) return false;
    return true;
  });
}

// ─── Smart insight generator ──────────────────────────────────────────────────

function generateInsight(
  filtered: House[],
  allData: House[],
  filters: { statusPerubahan?: string; jenisPerubahan?: string; rt?: string; rw?: string; klaster?: string },
): { ringkasan: string; poin: string[] } {
  const total = filtered.length;

  if (total === 0) {
    return {
      ringkasan: "Tidak ada data yang sesuai dengan filter yang dipilih.",
      poin: ["Coba ubah atau hapus filter untuk melihat data."],
    };
  }

  const berubah = filtered.filter((h) => h.statusPerubahan === "berubah").length;
  const persenBerubah = Math.round((berubah / total) * 100);
  const rusak = filtered.filter((h) => h.kondisiBangunan !== "Baik").length;
  const rusakBerat = filtered.filter((h) => h.kondisiBangunan === "Rusak Berat").length;

  // Dominan jenis perubahan
  const jenisCounts: Record<string, number> = {};
  for (const key of JENIS_PERUBAHAN_KEYS) {
    jenisCounts[key as string] = filtered.filter((h) => h[key] === true).length;
  }
  const dominanEntry = Object.entries(jenisCounts).sort(([, a], [, b]) => b - a)[0];
  const dominanLabel = dominanEntry && dominanEntry[1] > 0
    ? JENIS_PERUBAHAN_LABELS[dominanEntry[0]]
    : null;

  // Konteks
  const konteks = filters.rt
    ? `Di ${filters.rt}`
    : filters.rw
      ? `Di ${filters.rw}`
      : filters.klaster
        ? `Pada klaster ${filters.klaster}`
        : "Di seluruh Kelurahan Boting";

  const ringkasan = filters.jenisPerubahan
    ? `${konteks}, terdapat ${filtered.filter((h) => h[filters.jenisPerubahan as keyof House]).length} rumah dengan ${JENIS_PERUBAHAN_LABELS[filters.jenisPerubahan] ?? filters.jenisPerubahan} dari total ${total} rumah terdata.`
    : `${konteks}, terdapat ${total} rumah terdata. Sebanyak ${berubah} rumah (${persenBerubah}%) mengalami perubahan.`;

  const poin: string[] = [];

  if (dominanLabel) {
    poin.push(
      `Dari ${berubah} rumah yang mengalami perubahan, jenis yang paling dominan adalah "${dominanLabel}" dengan ${dominanEntry[1]} kasus.`,
    );
  }

  if (persenBerubah >= 50) {
    poin.push(`Tingkat perubahan tinggi (${persenBerubah}%) — lebih dari separuh rumah mengalami perubahan fisik.`);
  } else if (persenBerubah >= 25) {
    poin.push(`Perubahan signifikan: ${persenBerubah}% rumah berubah, menunjukkan dinamika pemukiman yang aktif.`);
  } else if (berubah > 0) {
    poin.push(`Tingkat perubahan relatif rendah: ${persenBerubah}% rumah mengalami perubahan.`);
  }

  if (rusakBerat > 0) {
    poin.push(`${rusakBerat} rumah dalam kondisi Rusak Berat — memerlukan penanganan prioritas atau relokasi segera.`);
  } else if (rusak > 0) {
    poin.push(`${rusak} rumah dalam kondisi Rusak Ringan — disarankan segera dilakukan perbaikan.`);
  }

  // Distribusi klaster
  const k3Count = filtered.filter((h) => h.klaster === "K3").length;
  if (k3Count > 0 && !filters.klaster) {
    poin.push(`${k3Count} rumah termasuk klaster K3 (perubahan signifikan ≥3 jenis) — memerlukan perhatian khusus dalam perencanaan tata ruang.`);
  }

  // Perbandingan RT jika ada filter RT
  if (filters.rt && total > 0 && allData.length !== total) {
    const avgBerubah = Math.round((allData.filter((h) => h.statusPerubahan === "berubah").length / allData.length) * 100);
    if (Math.abs(persenBerubah - avgBerubah) >= 10) {
      const lebih = persenBerubah > avgBerubah ? "di atas" : "di bawah";
      poin.push(`${filters.rt} memiliki tingkat perubahan (${persenBerubah}%) ${lebih} rata-rata kelurahan (${avgBerubah}%).`);
    }
  }

  return { ringkasan, poin };
}

// ─── GET /housing/boting ──────────────────────────────────────────────────────

router.get("/housing/boting", async (req, res): Promise<void> => {
  const parsed = ListHousesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filtered = applyFilters(botingData, parsed.data);
  res.json(ListHousesResponse.parse(filtered));
});

// ─── GET /housing/boting/summary ─────────────────────────────────────────────

router.get("/housing/boting/summary", async (_req, res): Promise<void> => {
  const total = botingData.length;
  const berubah = botingData.filter((h) => h.statusPerubahan === "berubah").length;

  // By 7 jenis perubahan
  const byJenisPerubahan = JENIS_PERUBAHAN_KEYS.map((key) => ({
    label: JENIS_PERUBAHAN_LABELS[key as string],
    jumlah: botingData.filter((h) => h[key] === true).length,
  })).filter((item) => item.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);

  const byKondisi = ["Baik", "Rusak Ringan", "Rusak Berat"].map((k) => ({
    label: k,
    jumlah: botingData.filter((h) => h.kondisiBangunan === k).length,
  }));

  const rtSet = [...new Set(botingData.map((h) => h.rt))].sort();
  const byRt = rtSet.map((rt) => ({
    label: rt,
    jumlah: botingData.filter((h) => h.rt === rt).length,
  }));

  const byKlaster = ["K1", "K2", "K3"].map((k) => ({
    label: k,
    jumlah: botingData.filter((h) => h.klaster === k).length,
  }));

  const lantaiSet = [...new Set(botingData.map((h) => h.jeniLantai).filter(Boolean))] as string[];
  const byJenisLantai = lantaiSet.map((l) => ({
    label: l,
    jumlah: botingData.filter((h) => h.jeniLantai === l).length,
  })).sort((a, b) => b.jumlah - a.jumlah);

  const dindingSet = [...new Set(botingData.map((h) => h.jenisDinding).filter(Boolean))] as string[];
  const byJenisDinding = dindingSet.map((d) => ({
    label: d,
    jumlah: botingData.filter((h) => h.jenisDinding === d).length,
  })).sort((a, b) => b.jumlah - a.jumlah);

  res.json(
    GetHousingSummaryResponse.parse({
      totalRumah: total,
      rumahBerubah: berubah,
      rumahTidakBerubah: total - berubah,
      persenPerubahan: total > 0 ? Math.round((berubah / total) * 100) : 0,
      byJenisPerubahan,
      byKondisi,
      byRt,
      byKlaster,
      byJenisLantai,
      byJenisDinding,
    }),
  );
});

// ─── GET /housing/boting/chart-data ──────────────────────────────────────────

router.get("/housing/boting/chart-data", async (_req, res): Promise<void> => {
  const jenisPerubahan = JENIS_PERUBAHAN_KEYS.map((key) => ({
    label: JENIS_PERUBAHAN_LABELS[key as string],
    jumlah: botingData.filter((h) => h[key] === true).length,
  })).filter((item) => item.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);

  const kondisiBangunan = ["Baik", "Rusak Ringan", "Rusak Berat"].map((k) => ({
    label: k,
    jumlah: botingData.filter((h) => h.kondisiBangunan === k).length,
  }));

  const rtSet = [...new Set(botingData.map((h) => h.rt))].sort();
  const statusPerRt = rtSet.map((rt) => {
    const houses = botingData.filter((h) => h.rt === rt);
    const berubah = houses.filter((h) => h.statusPerubahan === "berubah").length;
    return { rt, berubah, tidakBerubah: houses.length - berubah, total: houses.length };
  });

  const klasterDistribution = ["K1", "K2", "K3"].map((k) => ({
    label: `${k} — ${k === "K1" ? "Tidak/Sedikit Berubah" : k === "K2" ? "Perubahan Sedang" : "Perubahan Signifikan"}`,
    jumlah: botingData.filter((h) => h.klaster === k).length,
  }));

  res.json(
    GetHousingChartDataResponse.parse({
      jenisPerubahan,
      kondisiBangunan,
      statusPerRt,
      klasterDistribution,
    }),
  );
});

// ─── GET /housing/boting/changes ─────────────────────────────────────────────

router.get("/housing/boting/changes", async (_req, res): Promise<void> => {
  const changed = botingData.filter((h) => h.statusPerubahan === "berubah");
  res.json(ListChangedHousesResponse.parse(changed));
});

// ─── GET /housing/boting/insight ─────────────────────────────────────────────

router.get("/housing/boting/insight", async (req, res): Promise<void> => {
  const parsed = GetHousingInsightQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filtered = applyFilters(botingData, parsed.data);
  const insight = generateInsight(filtered, botingData, parsed.data);
  res.json(GetHousingInsightResponse.parse(insight));
});

// ─── GET /housing/boting/metadata ────────────────────────────────────────────

router.get("/housing/boting/metadata", async (_req, res): Promise<void> => {
  const metadata = {
    namaDataset: "Pendataan Lengkap Perumahan Kelurahan Boting",
    periodeData: "2024",
    sumberData: "Pemerintah Kelurahan Boting, Kecamatan Wara Selatan, Kota Palopo",
    unitObservasi: "Bangunan/Rumah Tangga",
    cakupanWilayah: "Kelurahan Boting, Kecamatan Wara Selatan, Kota Palopo, Sulawesi Selatan",
    jumlahObservasi: botingData.length,
    informasiKoordinat: "Koordinat GPS (WGS84 — Decimal Degrees). Lat ≈ -2.97 hingga -2.99, Lng ≈ 120.19. Catatan: koordinat saat ini adalah perkiraan representatif; koordinat GPS lapangan akan menggantikan setelah upload dataset asli.",
    keteranganIndikator: "Terdapat 7 indikator perubahan yang didata: Pagar, Luas Bangunan, Jumlah Lantai, Jenis Lantai, Jenis Dinding, Luas Lahan, dan Jenis Atap. Status perubahan (berubah/tidak berubah) diturunkan secara otomatis dari ketujuh indikator tersebut.",
    variabel: [
      { nama: "ID Rumah", deskripsi: "Kode unik setiap rumah", tipe: "String", nilaiValid: "B-001 s/d B-050" },
      { nama: "Nomor Urut", deskripsi: "Nomor urut pendataan", tipe: "Integer", nilaiValid: "1 s/d n" },
      { nama: "Nama Kepala Keluarga", deskripsi: "Nama KK sesuai dokumen pendataan", tipe: "String", nilaiValid: null },
      { nama: "Alamat", deskripsi: "Alamat lengkap bangunan", tipe: "String", nilaiValid: null },
      { nama: "RT", deskripsi: "Rukun Tetangga", tipe: "String", nilaiValid: "RT 01 — RT 06" },
      { nama: "RW", deskripsi: "Rukun Warga", tipe: "String", nilaiValid: "RW 01 — RW 03" },
      { nama: "Luas Bangunan", deskripsi: "Luas bangunan dalam meter persegi", tipe: "Number (m²)", nilaiValid: null },
      { nama: "Luas Lahan", deskripsi: "Luas lahan dalam meter persegi", tipe: "Number (m²)", nilaiValid: null },
      { nama: "Jenis Lantai", deskripsi: "Material lantai bangunan", tipe: "Kategori", nilaiValid: "Semen, Keramik, Marmer/Granit, Kayu" },
      { nama: "Jenis Dinding", deskripsi: "Material dinding bangunan", tipe: "Kategori", nilaiValid: "Tembok, Kayu, Bambu, Seng" },
      { nama: "Jumlah Lantai", deskripsi: "Jumlah lantai bangunan", tipe: "Integer", nilaiValid: "1, 2" },
      { nama: "Jenis Atap", deskripsi: "Material atap bangunan", tipe: "Kategori", nilaiValid: "Genteng, Seng, Asbes" },
      { nama: "Pagar", deskripsi: "Keberadaan dan jenis pagar", tipe: "Kategori", nilaiValid: "Ada (Tembok), Ada (Kayu), Tidak Ada" },
      { nama: "Kondisi Bangunan", deskripsi: "Kondisi fisik bangunan secara umum", tipe: "Kategori", nilaiValid: "Baik, Rusak Ringan, Rusak Berat" },
      { nama: "Status Perubahan", deskripsi: "Apakah bangunan mengalami perubahan dari kondisi awal", tipe: "Biner", nilaiValid: "berubah, tidak_berubah" },
      { nama: "Klaster", deskripsi: "Pengelompokan berdasarkan jumlah jenis perubahan (K1=0, K2=1-2, K3≥3)", tipe: "Kategori", nilaiValid: "K1, K2, K3" },
      { nama: "Perubahan Pagar", deskripsi: "Indikator perubahan pada pagar", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Luas Bangunan", deskripsi: "Indikator perubahan pada luas bangunan", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Jumlah Lantai", deskripsi: "Indikator perubahan pada jumlah lantai", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Jenis Lantai", deskripsi: "Indikator perubahan pada jenis lantai", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Jenis Dinding", deskripsi: "Indikator perubahan pada jenis dinding", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Luas Lahan", deskripsi: "Indikator perubahan pada luas lahan", tipe: "Boolean", nilaiValid: "true, false" },
      { nama: "Perubahan Jenis Atap", deskripsi: "Indikator perubahan pada jenis atap", tipe: "Boolean", nilaiValid: "true, false" },
    ],
  };
  res.json(GetHousingMetadataResponse.parse(metadata));
});

export default router;
