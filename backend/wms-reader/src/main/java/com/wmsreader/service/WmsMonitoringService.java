package com.wmsreader.service;

import com.wmsreader.dto.WmsMonitoringProbe;
import com.wmsreader.model.WmsLayer;
import com.wmsreader.model.WmsMonitoring;
import com.wmsreader.repository.WmsLayerRepository;
import com.wmsreader.repository.WmsMonitoringRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.OptionalDouble;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WmsMonitoringService {

    private final WmsLayerRepository wmsLayerRepository;
    private final WmsMonitoringRepository monitoringRepository;
    private final WmsService wmsService;

    public WmsMonitoringService(
        WmsLayerRepository wmsLayerRepository,
        WmsMonitoringRepository monitoringRepository,
        WmsService wmsService
    ) {
        this.wmsLayerRepository = wmsLayerRepository;
        this.monitoringRepository = monitoringRepository;
        this.wmsService = wmsService;
    }

    @Transactional
    public List<WmsMonitoring> refreshAll() {
        Map<String, List<WmsLayer>> groupedLayers = wmsLayerRepository.findAll().stream()
            .filter(layer -> layer.getWmsUrl() != null && !layer.getWmsUrl().isBlank())
            .collect(Collectors.groupingBy(WmsLayer::getWmsUrl, LinkedHashMap::new, Collectors.toList()));
        List<WmsMonitoring> refreshed = new ArrayList<>();

        groupedLayers.forEach((wmsUrl, registeredLayers) -> {
            WmsLayer representative = registeredLayers.get(0);
            WmsMonitoringProbe probe = wmsService.probeCapabilities(wmsUrl);
            WmsMonitoring monitoring = monitoringRepository.findByWmsUrl(wmsUrl).orElseGet(WmsMonitoring::new);
            monitoring.setWmsId(representative.getId());
            monitoring.setWmsName(representative.getTitle() == null || representative.getTitle().isBlank()
                ? representative.getQualifiedLayerName()
                : representative.getTitle());
            monitoring.setGeoserverUrl(representative.getGeoserverUrl());
            monitoring.setWorkspace(representative.getWorkspace());
            monitoring.setWmsUrl(wmsUrl);
            monitoring.setStatus(probe.getStatus());
            monitoring.setResponseTimeMs(probe.getResponseTimeMs());
            monitoring.setHttpStatus(probe.getHttpStatus());
            monitoring.setWmsVersion(probe.getWmsVersion());
            monitoring.setLayerCount(probe.getLayerCount() == null ? registeredLayers.size() : probe.getLayerCount());
            monitoring.setCheckedAt(LocalDateTime.now());
            monitoring.setErrorMessage(probe.getErrorMessage());
            refreshed.add(monitoringRepository.save(monitoring));
        });
        return refreshed;
    }

    public List<WmsMonitoring> getAll() {
        return monitoringRepository.findAllByOrderByCheckedAtDesc();
    }

    public Map<String, Object> getSummary() {
        List<WmsMonitoring> monitoring = getAll();
        long healthy = monitoring.stream().filter(item -> "HEALTHY".equals(item.getStatus())).count();
        long warning = monitoring.stream().filter(item -> "WARNING".equals(item.getStatus())).count();
        long down = monitoring.stream().filter(item -> "DOWN".equals(item.getStatus())).count();
        OptionalDouble average = monitoring.stream()
            .map(WmsMonitoring::getResponseTimeMs)
            .filter(Objects::nonNull)
            .mapToLong(Long::longValue)
            .average();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", monitoring.size());
        summary.put("healthy", healthy);
        summary.put("warning", warning);
        summary.put("down", down);
        summary.put("averageResponseTimeMs", average.isPresent() ? Math.round(average.getAsDouble()) : 0);
        summary.put("lastCheck", monitoring.stream().map(WmsMonitoring::getCheckedAt).filter(Objects::nonNull).max(LocalDateTime::compareTo).orElse(null));
        return summary;
    }
}
