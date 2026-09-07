# Arsitektur Final

## Diagram arsitektur

```text
React (Frontend)
        |
        v
REST API (Spring Boot)
        |
        v
WMS Service / Validation Layer / Monitoring Service
        |
        v
GeoServer
        |
        v
PostgreSQL (WMS Layer Configuration)
```

## Penjelasan

- Frontend dibuat dengan React untuk UI input, layer manager, dan map viewer.
- Backend menyediakan REST API untuk validasi GeoServer, insert, update visibility, ambil daftar layer, dan hapus layer.
- Service WMS memeriksa ketersediaan GeoServer, workspace, WMS, layer, dan metadata.
- Monitoring service memakai jalur GetCapabilities dan HTTP client yang sama untuk menyimpan status, response time, versi, jumlah layer, dan error terakhir.
- Database PostgreSQL menyimpan konfigurasi layer yang di input user.
- Map viewer menggunakan OpenLayers untuk menampilkan layer WMS dinamis dari backend.

## Prinsip desain

- Separation of concerns: controller, service, repository, dan model dipisahkan.
- Dynamic layer handling: tidak ada hard-code untuk nama layer tertentu.
- UI sederhana dan internal use friendly.
- Error handling user-friendly dan logging detail di backend.
- Validasi request pada backend agar aman dan konsisten.

## Layer data model

Setiap layer WMS menyimpan informasi berikut:

- id
- geoserver_url
- workspace
- layer_name
- qualified_layer_name
- wms_url
- title
- abstract
- crs
- visible
- status
- created_at
- updated_at

Data monitoring disimpan di tabel `wms_monitoring` sebagai snapshot terakhir per endpoint
WMS. Pemeriksaan dijalankan manual dari dashboard melalui backend agar request eksternal
tidak dilakukan berulang dari browser. Struktur ini siap dikembangkan menjadi scheduler.

## File penting

- backend/wms-reader/src/main/java/com/wmsreader/controller
- backend/wms-reader/src/main/java/com/wmsreader/service
- backend/wms-reader/src/main/java/com/wmsreader/model
- backend/wms-reader/src/main/java/com/wmsreader/repository
- frontend/wms-viewer/src/components
- frontend/wms-viewer/src/services

## Catatan implementasi

Pada tahap awal, sistem fokus pada validasi WMS, CRUD layer, toggling visibility, dan peta OpenLayers. Trigger layer insert dan update map dilakukan berdasarkan konfigurasi yang disimpan di database.
