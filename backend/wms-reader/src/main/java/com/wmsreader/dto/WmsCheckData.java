package com.wmsreader.dto;

import java.util.List;

public class WmsCheckData {

    private String geoserverUrl;
    private String workspace;
    private String layerName;
    private String qualifiedLayerName;
    private String wmsUrl;
    private boolean geoserverAccessible;
    private boolean workspaceFound;
    private boolean wmsServiceAvailable;
    private boolean layerFound;
    private boolean metadataReadable;
    private WmsMetadata metadata;
    private List<String> checks;

    public WmsCheckData() {
    }

    public String getGeoserverUrl() {
        return geoserverUrl;
    }

    public void setGeoserverUrl(String geoserverUrl) {
        this.geoserverUrl = geoserverUrl;
    }

    public String getWorkspace() {
        return workspace;
    }

    public void setWorkspace(String workspace) {
        this.workspace = workspace;
    }

    public String getLayerName() {
        return layerName;
    }

    public void setLayerName(String layerName) {
        this.layerName = layerName;
    }

    public String getQualifiedLayerName() {
        return qualifiedLayerName;
    }

    public void setQualifiedLayerName(String qualifiedLayerName) {
        this.qualifiedLayerName = qualifiedLayerName;
    }

    public String getWmsUrl() {
        return wmsUrl;
    }

    public void setWmsUrl(String wmsUrl) {
        this.wmsUrl = wmsUrl;
    }

    public boolean isGeoserverAccessible() {
        return geoserverAccessible;
    }

    public void setGeoserverAccessible(boolean geoserverAccessible) {
        this.geoserverAccessible = geoserverAccessible;
    }

    public boolean isWorkspaceFound() {
        return workspaceFound;
    }

    public void setWorkspaceFound(boolean workspaceFound) {
        this.workspaceFound = workspaceFound;
    }

    public boolean isWmsServiceAvailable() {
        return wmsServiceAvailable;
    }

    public void setWmsServiceAvailable(boolean wmsServiceAvailable) {
        this.wmsServiceAvailable = wmsServiceAvailable;
    }

    public boolean isLayerFound() {
        return layerFound;
    }

    public void setLayerFound(boolean layerFound) {
        this.layerFound = layerFound;
    }

    public boolean isMetadataReadable() {
        return metadataReadable;
    }

    public void setMetadataReadable(boolean metadataReadable) {
        this.metadataReadable = metadataReadable;
    }

    public WmsMetadata getMetadata() {
        return metadata;
    }

    public void setMetadata(WmsMetadata metadata) {
        this.metadata = metadata;
    }

    public List<String> getChecks() {
        return checks;
    }

    public void setChecks(List<String> checks) {
        this.checks = checks;
    }
}
