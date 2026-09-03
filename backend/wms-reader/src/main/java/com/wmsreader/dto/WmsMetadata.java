package com.wmsreader.dto;

import java.util.List;

public class WmsMetadata {

    private String title;
    private String abstractText;
    private String crs;
    private String boundingBox;
    private List<String> availableFormats;
    private String status;

    public WmsMetadata() {
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

    public List<String> getAvailableFormats() {
        return availableFormats;
    }

    public void setAvailableFormats(List<String> availableFormats) {
        this.availableFormats = availableFormats;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
