package com.wmsreader.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "wms_layers",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"geoserver_url", "qualified_layer_name"})
    }
)
public class WmsLayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "geoserver_url", nullable = false, length = 500)
    private String geoserverUrl;

    @Column(nullable = false, length = 255)
    private String workspace;

    @Column(name = "layer_name", nullable = false, length = 255)
    private String layerName;

    @Column(name = "qualified_layer_name", nullable = false, length = 255)
    private String qualifiedLayerName;

    @Column(name = "wms_url", nullable = false, length = 500)
    private String wmsUrl;

    @Column(length = 255)
    private String title;

    @Column(name = "abstract", columnDefinition = "TEXT")
    private String abstractText;

    @Column(length = 100)
    private String crs;

    @Column(nullable = false)
    private Boolean visible = true;

    @Column(nullable = false, length = 100)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public WmsLayer() {
    }

    public WmsLayer(String geoserverUrl, String workspace, String layerName, String qualifiedLayerName,
                    String wmsUrl, String title, String abstractText, String crs, Boolean visible,
                    String status) {
        this.geoserverUrl = geoserverUrl;
        this.workspace = workspace;
        this.layerName = layerName;
        this.qualifiedLayerName = qualifiedLayerName;
        this.wmsUrl = wmsUrl;
        this.title = title;
        this.abstractText = abstractText;
        this.crs = crs;
        this.visible = visible != null ? visible : true;
        this.status = status != null ? status : "ACTIVE";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible != null ? visible : true;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
