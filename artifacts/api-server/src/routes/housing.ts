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
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── Helper: Apply filters ───────────────────────────────────────────────────

function applyFilters(
  data: House[],
  filters: {
    statusPerubahan?: string;
    jenisPerubahan?: string;
    kondisiBangunan?: string;
    rt?: string;
  },
): House[] {
  return data.filter((h) => {
    if (filters.statusPerubahan && h.statusPerubahan !== filters.statusPerubahan)
      return false;
    if (
      filters.jenisPerubahan &&
      h.jenisPerubahan !== filters.jenisPerubahan
    )
      return false;
    if (
      filters.kondisiBangunan &&
      h.kondisiBangunan !== filters.kondisiBangunan
    )
      return false;
    if (filters.rt && h.rt !== filters.rt) return false;
    return true;
  });
}

// ─── Helper: Smart insight ────────────────────────────────────────────────────

function generateInsight(
  filtered: House[],
  allData: House[],
  filters: { statusPerubahan?: string; jenisPerubahan?: string; rt?: string },
): { ringkasan: string; poin: string[] } {
  const total = filtered.length;
  const berubah = filtered.filter((h) => h.statusPerubahan === "berubah").length;
  const tidakBerubah = total - berubah;
  const persenBerubah = total > 0 ? Math.round((berubah / total) * 100) : 0;

  const rusak = filtered.filter(
    (h) => h.kondisiBangunan === "Rusak Ringan" || h.kondisiBangunan === "Rusak Berat",
  ).length;
  const rusakBerat = filtered.filter(
    (h) => h.kondisiBangunan === "Rusak Berat",
  ).length;

  const byJenis: Record<string, number> = {};
  filtered
    .filter((h) => h.jenisPerubahan)
    .forEach((h) => {
      byJenis[h.jenisPerubahan!] = (byJenis[h.jenisPerubahan!] ?? 0) + 1;
    });

  const dominantJenis = Object.entries(byJenis).sort(([, a], [, b]) => b - a)[0];

  // Context prefix for filters
  const konteks =
    filters.rt
      ? `Di ${filters.rt}`
      : filters.statusPerubahan === "berubah"
        ? "Pada rumah yang berubah"
        : "Di seluruh Kelurahan Boting";

  const poin: string[] = [];

  if (total === 0) {
    return {
      ringkasan: "Tidak ada data yang sesuai dengan filter yang dipilih.",
      poin: ["Coba ubah atau hapus filter untuk melihat data."],
    };
  }

  const ringkasan = `${konteks}, terdapat ${total} rumah terdata. Sebanyak ${berubah} rumah (${persenBerubah}%) mengalami perubahan.`;

  if (persenBerubah >= 50) {
    poin.push(
      `Tingkat perubahan tinggi: lebih dari separuh rumah (${persenBerubah}%) mengalami perubahan — perlu perhatian khusus dari pemerintah setempat.`,
    );
  } else if (persenBerubah >= 25) {
    poin.push(
      `Perubahan signifikan: ${persenBerubah}% rumah berubah, menunjukkan dinamika pemukiman yang aktif.`,
    );
  } else {
    poin.push(
      `Tingkat perubahan relatif rendah: hanya ${persenBerubah}% rumah yang mengalami perubahan.`,
    );
  }

  if (dominantJenis) {
    poin.push(
      `Jenis perubahan terbanyak adalah "${dominantJenis[0]}" dengan ${dominantJenis[1]} kasus.`,
    );
  }

  if (rusakBerat > 0) {
    poin.push(
      `Terdapat ${rusakBerat} rumah dengan kondisi Rusak Berat — memerlukan penanganan prioritas atau relokasi.`,
    );
  }

  if (rusak > 0 && rusakBerat === 0) {
    poin.push(
      `${rusak} rumah dalam kondisi Rusak Ringan — disarankan segera dilakukan perbaikan untuk mencegah kerusakan lebih lanjut.`,
    );
  }

  if (tidakBerubah > 0) {
    poin.push(
      `${tidakBerubah} rumah tidak mengalami perubahan — kondisi stabil dan tidak memerlukan intervensi mendesak.`,
    );
  }

  // Compare to total dataset
  if (filters.rt && allData.length !== filtered.length) {
    const rtBerubah = allData.filter(
      (h) => h.rt === filters.rt && h.statusPerubahan === "berubah",
    ).length;
    const allBerubah = allData.filter(
      (h) => h.statusPerubahan === "berubah",
    ).length;
    const avgPersen =
      allData.length > 0
        ? Math.round((allBerubah / allData.length) * 100)
        : 0;
    if (persenBerubah > avgPersen + 10) {
      poin.push(
        `${filters.rt} memiliki tingkat perubahan (${persenBerubah}%) di atas rata-rata kelurahan (${avgPersen}%).`,
      );
    }
  }

  return { ringkasan, poin };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /housing/boting — list with optional filters
router.get("/housing/boting", async (req, res): Promise<void> => {
  const parsed = ListHousesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filtered = applyFilters(botingData, parsed.data);
  res.json(ListHousesResponse.parse(filtered));
});

// GET /housing/boting/summary
router.get("/housing/boting/summary", async (_req, res): Promise<void> => {
  const total = botingData.length;
  const berubah = botingData.filter(
    (h) => h.statusPerubahan === "berubah",
  ).length;
  const tidakBerubah = total - berubah;

  const byJenisMap: Record<string, number> = {};
  botingData
    .filter((h) => h.jenisPerubahan)
    .forEach((h) => {
      byJenisMap[h.jenisPerubahan!] = (byJenisMap[h.jenisPerubahan!] ?? 0) + 1;
    });

  const byKondisiMap: Record<string, number> = {};
  botingData.forEach((h) => {
    byKondisiMap[h.kondisiBangunan] = (byKondisiMap[h.kondisiBangunan] ?? 0) + 1;
  });

  const byRtMap: Record<string, number> = {};
  botingData.forEach((h) => {
    byRtMap[h.rt] = (byRtMap[h.rt] ?? 0) + 1;
  });

  const summary = {
    totalRumah: total,
    rumahBerubah: berubah,
    rumahTidakBerubah: tidakBerubah,
    persenPerubahan: total > 0 ? Math.round((berubah / total) * 100) : 0,
    byJenisPerubahan: Object.entries(byJenisMap)
      .map(([label, jumlah]) => ({ label, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah),
    byKondisi: Object.entries(byKondisiMap)
      .map(([label, jumlah]) => ({ label, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah),
    byRt: Object.entries(byRtMap)
      .map(([label, jumlah]) => ({ label, jumlah }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };

  res.json(GetHousingSummaryResponse.parse(summary));
});

// GET /housing/boting/chart-data
router.get("/housing/boting/chart-data", async (_req, res): Promise<void> => {
  const jenisMap: Record<string, number> = {};
  botingData
    .filter((h) => h.jenisPerubahan)
    .forEach((h) => {
      jenisMap[h.jenisPerubahan!] = (jenisMap[h.jenisPerubahan!] ?? 0) + 1;
    });

  const kondisiMap: Record<string, number> = {};
  botingData.forEach((h) => {
    kondisiMap[h.kondisiBangunan] = (kondisiMap[h.kondisiBangunan] ?? 0) + 1;
  });

  // Per-RT breakdown
  const rtSet = [...new Set(botingData.map((h) => h.rt))].sort();
  const statusPerRt = rtSet.map((rt) => {
    const houses = botingData.filter((h) => h.rt === rt);
    const berubah = houses.filter((h) => h.statusPerubahan === "berubah").length;
    return {
      rt,
      berubah,
      tidakBerubah: houses.length - berubah,
      total: houses.length,
    };
  });

  const chartData = {
    jenisPerubahan: Object.entries(jenisMap)
      .map(([label, jumlah]) => ({ label, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah),
    kondisiBangunan: Object.entries(kondisiMap)
      .map(([label, jumlah]) => ({ label, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah),
    statusPerRt,
    perubahanPerRt: statusPerRt, // same data, frontend may use differently
  };

  res.json(GetHousingChartDataResponse.parse(chartData));
});

// GET /housing/boting/changes — only changed houses
router.get("/housing/boting/changes", async (_req, res): Promise<void> => {
  const changed = botingData.filter((h) => h.statusPerubahan === "berubah");
  res.json(ListChangedHousesResponse.parse(changed));
});

// GET /housing/boting/insight — smart insight with optional filters
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

export default router;
