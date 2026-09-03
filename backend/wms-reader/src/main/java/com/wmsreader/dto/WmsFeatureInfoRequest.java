package com.wmsreader.dto;

import jakarta.validation.constraints.NotBlank;

public class WmsFeatureInfoRequest {

    @NotBlank(message = "Feature info URL tidak boleh kosong")
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
