package com.wmsreader.controller;

import com.wmsreader.dto.WmsCheckData;
import com.wmsreader.dto.WmsCheckRequest;
import com.wmsreader.dto.WmsDiscoveryRequest;
import com.wmsreader.dto.WmsFeatureInfoRequest;
import com.wmsreader.dto.WmsLayerCandidate;
import com.wmsreader.model.WmsLayer;
import com.wmsreader.service.WmsService;
import com.wmsreader.service.WmsMonitoringService;
import com.wmsreader.model.WmsMonitoring;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class WmsController {

    private final WmsService wmsService;
    private final WmsMonitoringService monitoringService;

    public WmsController(WmsService wmsService, WmsMonitoringService monitoringService) {
        this.wmsService = wmsService;
        this.monitoringService = monitoringService;
    }

    @PostMapping("/wms/check")
    public ResponseEntity<Map<String, Object>> checkWms(@Valid @RequestBody WmsCheckRequest request) {
        WmsCheckData data = wmsService.checkWms(request);
        boolean success = data.isGeoserverAccessible() && data.isWorkspaceFound() && data.isWmsServiceAvailable() && data.isLayerFound();

        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Layer valid dan siap ditambahkan." : "Layer gagal divalidasi.");
        response.put("data", data);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/wms/discover")
    public ResponseEntity<Map<String, Object>> discoverLayers(@Valid @RequestBody WmsDiscoveryRequest request) {
        List<WmsLayerCandidate> layers = wmsService.discoverLayers(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", layers.size() + " layer ditemukan.");
        response.put("data", layers);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/wms/feature-info")
    public ResponseEntity<Map<String, Object>> featureInfo(@Valid @RequestBody WmsFeatureInfoRequest request) {
        String data = wmsService.fetchFeatureInfo(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", !data.isBlank());
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/wms/monitoring")
    public ResponseEntity<Map<String, Object>> getMonitoring() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", monitoringService.getAll());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/wms/monitoring/summary")
    public ResponseEntity<Map<String, Object>> getMonitoringSummary() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", monitoringService.getSummary());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/wms/monitoring/refresh")
    public ResponseEntity<Map<String, Object>> refreshMonitoring() {
        List<WmsMonitoring> monitoring = monitoringService.refreshAll();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", monitoring.size() + " WMS selesai diperiksa.");
        response.put("data", monitoring);
        response.put("summary", monitoringService.getSummary());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/layers")
    public ResponseEntity<Map<String, Object>> createLayer(@RequestBody WmsLayer layer) {
        WmsLayer saved = wmsService.addLayer(layer);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Layer berhasil ditambahkan.");
        response.put("data", saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/layers")
    public ResponseEntity<Map<String, Object>> getAllLayers() {
        List<WmsLayer> layers = wmsService.getAllLayers();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", layers);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/layers/{id}")
    public ResponseEntity<Map<String, Object>> getLayerById(@PathVariable Long id) {
        Optional<WmsLayer> layer = wmsService.getLayerById(id);
        Map<String, Object> response = new HashMap<>();
        if (layer.isEmpty()) {
            response.put("success", false);
            response.put("message", "Layer tidak ditemukan.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        response.put("success", true);
        response.put("data", layer.get());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/layers/{id}/visibility")
    public ResponseEntity<Map<String, Object>> updateVisibility(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean visible = body.get("visible");
        if (visible == null) {
            throw new IllegalArgumentException("Field visible wajib diisi.");
        }

        WmsLayer updated = wmsService.updateVisibility(id, visible);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Visibility layer berhasil diubah.");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/layers/{id}")
    public ResponseEntity<Map<String, Object>> deleteLayer(@PathVariable Long id) {
        wmsService.deleteLayer(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Layer berhasil dihapus.");
        return ResponseEntity.ok(response);
    }
}
