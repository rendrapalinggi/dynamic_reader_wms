package com.wmsreader.dto;

import jakarta.validation.constraints.NotBlank;

public class WmsCheckRequest {

    @NotBlank(message = "GeoServer URL tidak boleh kosong")
    private String geoserverUrl;

    @NotBlank(message = "Workspace tidak boleh kosong")
    private String workspace;

    @NotBlank(message = "Layer tidak boleh kosong")
    private String layerName;

    public WmsCheckRequest() {
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
}
