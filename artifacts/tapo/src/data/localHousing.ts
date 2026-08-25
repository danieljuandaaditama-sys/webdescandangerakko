import { dangerakkoData, type House } from "./dangerakko-data";

export const JENIS_PERUBAHAN_LABELS: Record<string, string> = {
  perubahanPagar: "Perubahan Pagar",
  perubahanLuasBangunan: "Perubahan Luas Bangunan",
  perubahanJumlahLantai: "Perubahan Jumlah Lantai",
  perubahanJenisLantai: "Perubahan Jenis Lantai",
  perubahanJenisDinding: "Perubahan Jenis Dinding",
  perubahanLuasLahan: "Perubahan Luas Lahan",
  perubahanJenisAtap: "Perubahan Jenis Atap",
};

export const JENIS_PERUBAHAN_KEYS = Object.keys(
  JENIS_PERUBAHAN_LABELS,
) as Array<keyof House>;

export type HouseFilters = {
  statusPerubahan?: string;
  jenisPerubahan?: string;
  kondisiBangunan?: string;
  rt?: string;
  rw?: string;
  klaster?: string;
  jeniLantai?: string;
  jenisDinding?: string;
};

export function listHouses(filters: HouseFilters = {}): House[] {
  return dangerakkoData.filter((h) => {
    if (
      filters.statusPerubahan &&
      h.statusPerubahan !== filters.statusPerubahan
    ) {
      return false;
    }

    if (filters.jenisPerubahan) {
      const key = filters.jenisPerubahan as keyof House;

      if (!h[key]) {
        return false;
      }
    }

    if (
      filters.kondisiBangunan &&
      h.kondisiBangunan !== filters.kondisiBangunan
    ) {
      return false;
    }

    if (filters.rt && h.rt !== filters.rt) {
      return false;
    }

    if (filters.rw && h.rw !== filters.rw) {
      return false;
    }

    if (filters.klaster && h.klaster !== filters.klaster) {
      return false;
    }

    if (
      filters.jeniLantai &&
      h.jeniLantai !== filters.jeniLantai
    ) {
      return false;
    }

    if (
      filters.jenisDinding &&
      h.jenisDinding !== filters.jenisDinding
    ) {
      return false;
    }

    return true;
  });
}

export function getHousingSummary() {
  const total = dangerakkoData.length;

  const berubah = dangerakkoData.filter(
    (h) => h.statusPerubahan === "berubah",
  ).length;

  const byJenisPerubahan = JENIS_PERUBAHAN_KEYS
    .map((key) => ({
      label: JENIS_PERUBAHAN_LABELS[key as string],
      jumlah: dangerakkoData.filter(
        (h) => h[key] === true,
      ).length,
    }))
    .filter((item) => item.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);

  const byKondisi = [
    "Baik",
    "Rusak Ringan",
    "Rusak Berat",
  ].map((label) => ({
    label,
    jumlah: dangerakkoData.filter(
      (h) => h.kondisiBangunan === label,
    ).length,
  }));

  const rtSet = [
    ...new Set(dangerakkoData.map((h) => h.rt)),
  ].sort();

  const byRt = rtSet.map((rt) => ({
    label: rt,
    jumlah: dangerakkoData.filter(
      (h) => h.rt === rt,
    ).length,
  }));

  const byKlaster = ["K1", "K2", "K3"].map(
    (label) => ({
      label,
      jumlah: dangerakkoData.filter(
        (h) => h.klaster === label,
      ).length,
    }),
  );

  const lantaiSet = [
    ...new Set(
      dangerakkoData
        .map((h) => h.jeniLantai)
        .filter(Boolean),
    ),
  ] as string[];

  const byJenisLantai = lantaiSet
    .map((label) => ({
      label,
      jumlah: dangerakkoData.filter(
        (h) => h.jeniLantai === label,
      ).length,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);

  const dindingSet = [
    ...new Set(
      dangerakkoData
        .map((h) => h.jenisDinding)
        .filter(Boolean),
    ),
  ] as string[];

  const byJenisDinding = dindingSet
    .map((label) => ({
      label,
      jumlah: dangerakkoData.filter(
        (h) => h.jenisDinding === label,
      ).length,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return {
    totalRumah: total,
    rumahBerubah: berubah,
    rumahTidakBerubah: total - berubah,

    persenPerubahan:
      total > 0
        ? Math.round((berubah / total) * 100)
        : 0,

    byJenisPerubahan,
    byKondisi,
    byRt,
    byKlaster,
    byJenisLantai,
    byJenisDinding,
  };
}

export function getHousingChartData() {
  const jenisPerubahan = JENIS_PERUBAHAN_KEYS
    .map((key) => ({
      label: JENIS_PERUBAHAN_LABELS[key as string],
      jumlah: dangerakkoData.filter(
        (h) => h[key] === true,
      ).length,
    }))
    .filter((item) => item.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);

  const kondisiBangunan = [
    "Baik",
    "Rusak Ringan",
    "Rusak Berat",
  ].map((label) => ({
    label,
    jumlah: dangerakkoData.filter(
      (h) => h.kondisiBangunan === label,
    ).length,
  }));

  const rtSet = [
    ...new Set(
      dangerakkoData.map((h) => h.rt),
    ),
  ].sort();

  const statusPerRt = rtSet.map((rt) => {
    const houses = dangerakkoData.filter(
      (h) => h.rt === rt,
    );

    const berubah = houses.filter(
      (h) => h.statusPerubahan === "berubah",
    ).length;

    return {
      rt,
      berubah,
      tidakBerubah:
        houses.length - berubah,
      total: houses.length,
    };
  });

  const klasterDistribution = [
    "K1",
    "K2",
    "K3",
  ].map((k) => ({
    label: `${k} — ${
      k === "K1"
        ? "Tidak/Sedikit Berubah"
        : k === "K2"
          ? "Perubahan Sedang"
          : "Perubahan Signifikan"
    }`,
    jumlah: dangerakkoData.filter(
      (h) => h.klaster === k,
    ).length,
  }));

  return {
    jenisPerubahan,
    kondisiBangunan,
    statusPerRt,
    klasterDistribution,
  };
}

export function listChangedHouses(): House[] {
  return dangerakkoData.filter(
    (h) => h.statusPerubahan === "berubah",
  );
}

export function getHousingInsight(
  filters: HouseFilters = {},
) {
  const filtered = listHouses(filters);
  const total = filtered.length;

  if (total === 0) {
    return {
      ringkasan:
        "Tidak ada data yang sesuai dengan filter yang dipilih.",
      poin: [
        "Coba ubah atau hapus filter untuk melihat data.",
      ],
    };
  }

  const berubah = filtered.filter(
    (h) => h.statusPerubahan === "berubah",
  ).length;

  const persenBerubah = Math.round(
    (berubah / total) * 100,
  );

  const rusak = filtered.filter(
    (h) => h.kondisiBangunan !== "Baik",
  ).length;

  const rusakBerat = filtered.filter(
    (h) => h.kondisiBangunan === "Rusak Berat",
  ).length;

  const jenisCounts: Record<string, number> = {};

  for (const key of JENIS_PERUBAHAN_KEYS) {
    jenisCounts[key as string] =
      filtered.filter(
        (h) => h[key] === true,
      ).length;
  }

  const dominanEntry = Object.entries(
    jenisCounts,
  ).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const dominanLabel =
    dominanEntry &&
    dominanEntry[1] > 0
      ? JENIS_PERUBAHAN_LABELS[
          dominanEntry[0]
        ]
      : null;

  const konteks = filters.rt
    ? `Di ${filters.rt}`
    : filters.rw
      ? `Di ${filters.rw}`
      : filters.klaster
        ? `Pada klaster ${filters.klaster}`
        : "Di seluruh Kelurahan Dangerakko";

  const ringkasan = filters.jenisPerubahan
    ? `${konteks}, terdapat ${filtered.filter(
        (h) =>
          h[
            filters.jenisPerubahan as keyof House
          ],
      ).length} rumah dengan ${
        JENIS_PERUBAHAN_LABELS[
          filters.jenisPerubahan
        ] ?? filters.jenisPerubahan
      } dari total ${total} rumah terdata.`
    : `${konteks}, terdapat ${total} rumah terdata. Sebanyak ${berubah} rumah (${persenBerubah}%) mengalami perubahan.`;

  const poin: string[] = [];

  if (dominanLabel) {
    poin.push(
      `Dari ${berubah} rumah yang mengalami perubahan, jenis yang paling dominan adalah "${dominanLabel}" dengan ${dominanEntry[1]} kasus.`,
    );
  }

  if (persenBerubah >= 50) {
    poin.push(
      `Tingkat perubahan tinggi (${persenBerubah}%) — lebih dari separuh rumah mengalami perubahan fisik.`,
    );
  } else if (persenBerubah >= 25) {
    poin.push(
      `Perubahan signifikan: ${persenBerubah}% rumah berubah, menunjukkan dinamika pemukiman yang aktif.`,
    );
  } else if (berubah > 0) {
    poin.push(
      `Tingkat perubahan relatif rendah: ${persenBerubah}% rumah mengalami perubahan.`,
    );
  }

  if (rusakBerat > 0) {
    poin.push(
      `${rusakBerat} rumah dalam kondisi Rusak Berat — memerlukan penanganan prioritas atau relokasi segera.`,
    );
  } else if (rusak > 0) {
    poin.push(
      `${rusak} rumah dalam kondisi Rusak Ringan — disarankan segera dilakukan perbaikan.`,
    );
  }

  const k3Count = filtered.filter(
    (h) => h.klaster === "K3",
  ).length;

  if (
    k3Count > 0 &&
    !filters.klaster
  ) {
    poin.push(
      `${k3Count} rumah termasuk klaster K3 (perubahan signifikan ≥3 jenis) — memerlukan perhatian khusus dalam perencanaan tata ruang.`,
    );
  }

  if (
    filters.rt &&
    total > 0 &&
    dangerakkoData.length !== total
  ) {
    const avgBerubah =
      Math.round(
        (dangerakkoData.filter(
          (h) =>
            h.statusPerubahan ===
            "berubah",
        ).length /
          dangerakkoData.length) *
          100,
      );

    if (
      Math.abs(
        persenBerubah -
          avgBerubah,
      ) >= 10
    ) {
      const lebih =
        persenBerubah >
        avgBerubah
          ? "di atas"
          : "di bawah";

      poin.push(
        `${filters.rt} memiliki tingkat perubahan (${persenBerubah}%) ${lebih} rata-rata kelurahan (${avgBerubah}%).`,
      );
    }
  }

  return {
    ringkasan,
    poin,
  };
}

export function getHousingMetadata() {
  return {
    namaDataset:
      "Pendataan Lengkap Perumahan Kelurahan Dangerakko",

    periodeData: "2024",

    sumberData:
      "Data Survei Kelurahan Dangerakko, Kota Palopo",

    unitObservasi:
      "Bangunan/Rumah Tangga",

    cakupanWilayah:
      "Kelurahan Dangerakko, Kota Palopo, Sulawesi Selatan",

    jumlahObservasi:
      dangerakkoData.length,
  };
}
