# Dynamic WMS Reader

Dynamic WMS Reader adalah internal tool web untuk mengecek, menambahkan, mengelola, dan menampilkan layer WMS dari GeoServer secara dinamis tanpa perlu mengubah source code setiap kali layer baru ditambahkan.

## Arsitektur utama

- Frontend: React + Vite + OpenLayers
- Backend: Spring Boot + Java + Maven + REST API
- Database: PostgreSQL (schema siap, data layer akan diisi oleh pengguna melalui aplikasi)
- Integrasi: backend memvalidasi GeoServer/WMS, frontend menampilkan hasil, layer manager, dan map viewer

## Struktur project

```text
apps_wms/
├── backend/
│   └── wms-reader/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/wmsreader/
│       │   │   └── resources/application.properties
│       │   └── test/
│       ├── pom.xml
│       └── .mvn/
├── frontend/
│   └── wms-viewer/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       └── index.html
├── database/
│   └── schema.sql
├── docs/
│   ├── architecture.md
│   └── api-documentation.md
├── README.md
└── .gitignore
```

## Dependency yang diperlukan

### Backend
- spring-boot-starter-web: REST API
- spring-boot-starter-data-jpa: ORM & persistence
- spring-boot-starter-validation: validasi request
- org.postgresql:postgresql: koneksi ke PostgreSQL
- spring-boot-starter-test: unit/integration testing
- geotools: digunakan bila kebutuhan WMS metadata dan parsing geospasial meningkat

### Frontend
- react, react-dom
- vite
- openlayers
- axios
- react-toastify

## Alasan pemilihan dependency

- Spring Boot dipilih karena cepat dibangun, stabil, dan cocok untuk REST API internal tools.
- PostgreSQL dipilih karena sesuai kebutuhan data relational yang sederhana dan siap dikembangkan.
- OpenLayers dipilih karena paling umum untuk visualisasi WMS di web.
- React dipilih karena cocok untuk UI interaktif dan state management yang sederhana.
- GeoTools diberi sebagai dependency opsional, bukan kebutuhan utama pada tahap awal, agar project tetap ringan.

## Tahap saat ini

Tahap 1: setup project Spring Boot + React dan struktur awal. Langkah berikutnya adalah implementasi entity, checker WMS, dan API layer manager.

## Jalankan project

### Backend
1. Pastikan JDK 17+ terinstal.
2. Masuk ke folder backend/wms-reader.
3. Jalankan: `mvn spring-boot:run`

### Frontend
1. Masuk ke folder frontend/wms-viewer.
2. Jalankan: `npm install`
3. Jalankan: `npm run dev`

> Catatan: saat ini environment ini belum memiliki JDK/Maven terpasang, sehingga compile backend belum bisa diverifikasi di mesin ini. File scaffold sudah dibuat agar siap dipakai saat Java tersedia.
