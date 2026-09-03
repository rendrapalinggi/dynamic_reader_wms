package com.wmsreader.dto;

public class WmsLayerCandidate {

    private String geoserverUrl;
    private String workspace;
    private String layerName;
    private String qualifiedLayerName;
    private String wmsUrl;
    private String title;
    private String abstractText;
    private String crs;
    private String boundingBox;

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAbstractText() {
        return abstractText;
    }

    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }

    public String getCrs() {
        return crs;
    }

    public void setCrs(String crs) {
        this.crs = crs;
    }

    public String getBoundingBox() {
        return boundingBox;
    }

    public void setBoundingBox(String boundingBox) {
        this.boundingBox = boundingBox;
    }
}
