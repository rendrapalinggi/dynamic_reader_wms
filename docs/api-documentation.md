# API Documentation

## Endpoint utama

### POST /api/wms/check

Mengecek konektivitas dan validitas GeoServer, workspace, dan layer.

Request body:

```json
{
  "geoserverUrl": "https://example.com/geoserver",
  "workspace": "prov22",
  "layerName": "prov22"
}
```

Response contoh:

```json
{
  "success": true,
  "message": "Layer valid dan siap ditambahkan",
  "data": {
    "geoserverUrl": "https://example.com/geoserver",
    "workspace": "prov22",
    "layerName": "prov22",
    "qualifiedLayerName": "prov22:prov22",
    "wmsUrl": "https://example.com/geoserver/prov22/wms",
    "layerFound": true,
    "workspaceFound": true,
    "metadata": {
      "title": "Provinsi",
      "abstract": "Layer data provinsi",
      "crs": "EPSG:4326",
      "boundingBox": "N/A",
      "formats": ["image/png", "image/jpeg"]
    }
  }
}
```

### POST /api/layers

Menambahkan layer baru ke database.

### GET /api/layers

Mengambil semua layer yang tersimpan.

### GET /api/layers/{id}

Mengambil detail layer berdasarkan ID.

### PUT /api/layers/{id}/visibility

Mengubah visibility layer.

Request body:

```json
{
  "visible": true
}
```

### DELETE /api/layers/{id}

Menghapus layer dari database dan map.

## Response conventions

- success: boolean
- message: human readable message
- data: payload utama
- errors: array bila ada error validasi

## Status umum

- 200 OK
- 201 Created
- 400 Bad Request
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error
