# TAPO – Tagging dan Analisis Perubahan Objek Perumahan

Platform WebGIS dashboard untuk memvisualisasikan dan menganalisis data Pendataan Lengkap Perumahan Kelurahan Boting, Kota Palopo, Sulawesi Selatan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/tapo run dev` — jalankan frontend TAPO (dikelola via workflow)
- `pnpm run typecheck` — full typecheck semua package
- `pnpm --filter @workspace/api-spec run codegen` — regenerasi API hooks dan Zod schemas dari OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (artifacts/tapo)
- API: Express 5 (artifacts/api-server)
- Peta: Leaflet + React Leaflet
- Grafik: Recharts
- Validation: Zod v3, Orval codegen
- **Tidak ada database** di Fase 1 — data tersimpan di `artifacts/api-server/src/data/boting.ts`

## Where things live

- `lib/api-spec/openapi.yaml` — sumber kebenaran kontrak API
- `artifacts/api-server/src/data/boting.ts` — dataset perumahan Kelurahan Boting (sampel, akan diganti data Excel asli)
- `artifacts/api-server/src/routes/housing.ts` — semua endpoint housing
- `artifacts/tapo/src/` — seluruh frontend dashboard

## Architecture decisions

- **Fase 1: data statis** — data disimpan sebagai TypeScript file di server, bukan database. Ini memudahkan penggantian dengan data Excel asli tanpa mengubah arsitektur.
- **Satu kelurahan dulu** — hanya Kelurahan Boting. Lagaligo dan Dangerakko akan ditambahkan di fase berikutnya.
- **No auth** — prototype tidak memerlukan autentikasi di tahap pertama.
- **OpenAPI-first** — semua kontrak API didefinisikan di openapi.yaml, lalu di-generate ke hooks React dan Zod schemas.
- **Zod v3** — workspace menggunakan Zod v3; hindari `zod.int()` di spec OpenAPI, gunakan `type: number` dengan `format: int32`.

## Product

Dashboard tunggal dengan:
1. FilterPanel reaktif (status perubahan, jenis perubahan, kondisi bangunan, RT)
2. Stat cards (total rumah, berubah, tidak berubah, persentase)
3. Peta Leaflet dengan marker warna-warni (merah = berubah, hijau = tidak berubah)
4. Grafik perubahan dan kondisi bangunan (Recharts)
5. Tabel data lengkap
6. Smart insight panel yang berubah sesuai filter aktif

## User preferences

- Prototype bertahap — jangan langsung buat semua fitur sekaligus
- Data asli dari Excel belum di-upload; gunakan sampel representatif
- Tidak perlu authentication, user management, atau deployment di tahap pertama
- Hanya Kelurahan Boting untuk sekarang (tidak ada Lagaligo/Dangerakko)
- Koordinat sekitar Kota Palopo: lat ≈ -2.98 to -2.99, lng ≈ 120.19

## Gotchas

- Jangan gunakan `type: integer` di OpenAPI spec — akan generate `zod.int()` yang tidak ada di Zod v3. Gunakan `type: number` + `format: int32`.
- Setelah mengubah `openapi.yaml`, selalu jalankan: `pnpm --filter @workspace/api-spec run codegen`
- API server tidak menggunakan database di Fase 1; data ada di `src/data/boting.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
