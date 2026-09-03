package com.wmsreader.dto;

import jakarta.validation.constraints.NotBlank;

public class WmsDiscoveryRequest {

    @NotBlank(message = "GeoServer URL tidak boleh kosong")
    private String geoserverUrl;

    @NotBlank(message = "Workspace tidak boleh kosong")
    private String workspace;

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
}
