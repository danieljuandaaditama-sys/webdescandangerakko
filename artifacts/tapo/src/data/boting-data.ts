/**
 * DATA LOKAL TAPO
 *
 * Sumber data:
 * artifacts/api-server/src/data/boting.ts
 *
 * Dataset ini adalah data final 573 rumah hasil pengolahan
 * BOTING_Data_Survei_Bersih.xlsx.
 *
 * Tujuan file ini:
 * - Membuat frontend Tapo bisa membaca data tanpa API Replit.
 * - Mempertahankan struktur House yang sudah dipakai UI.
 * - Tidak mengubah komponen/UI Tapo.
 *
 * Untuk tahap awal kita re-export dataset yang sudah terbukti benar.
 * Setelah semua halaman sudah berjalan tanpa API, kita bisa
 * menghapus ketergantungan api-server secara bertahap.
 */

export {
  botingData,
} from "../../../api-server/src/data/boting";

export type {
  House,
} from "../../../api-server/src/data/boting";

