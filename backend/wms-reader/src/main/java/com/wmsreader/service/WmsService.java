package com.wmsreader.service;

import com.wmsreader.dto.WmsCheckData;
import com.wmsreader.dto.WmsCheckRequest;
import com.wmsreader.dto.WmsDiscoveryRequest;
import com.wmsreader.dto.WmsFeatureInfoRequest;
import com.wmsreader.dto.WmsLayerCandidate;
import com.wmsreader.dto.WmsMetadata;
import com.wmsreader.model.WmsLayer;
import java.io.StringReader;
import com.wmsreader.repository.WmsLayerRepository;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class WmsService {

    private static final Logger log = LoggerFactory.getLogger(WmsService.class);
    private final WmsLayerRepository wmsLayerRepository;
    private final HttpClient httpClient;

    public WmsService(WmsLayerRepository wmsLayerRepository) {
        this.wmsLayerRepository = wmsLayerRepository;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    }

    public WmsCheckData checkWms(WmsCheckRequest request) {
        String geoserverUrl = normalizeUrl(request.getGeoserverUrl());
        String workspace = normalizeText(request.getWorkspace());
        String layerName = normalizeText(request.getLayerName());

        if (geoserverUrl == null || geoserverUrl.isBlank()) {
            throw new IllegalArgumentException("URL GeoServer tidak boleh kosong.");
        }
        if (workspace == null || workspace.isBlank()) {
            throw new IllegalArgumentException("Workspace tidak boleh kosong.");
        }
        if (layerName == null || layerName.isBlank()) {
            throw new IllegalArgumentException("Layer Name tidak boleh kosong.");
        }
        if (!isValidUrl(geoserverUrl)) {
            throw new IllegalArgumentException("URL GeoServer tidak valid.");
        }

        boolean directWmsEndpoint = isDirectWmsEndpoint(geoserverUrl);
        String qualifiedLayerName = directWmsEndpoint ? layerName : workspace + ":" + layerName;
        String wmsUrl = directWmsEndpoint ? geoserverUrl : resolveWmsUrl(geoserverUrl, workspace);

        WmsCheckData result = new WmsCheckData();
        result.setGeoserverUrl(geoserverUrl);
        result.setWorkspace(workspace);
        result.setLayerName(layerName);
        result.setQualifiedLayerName(qualifiedLayerName);
        result.setWmsUrl(wmsUrl);
        result.setChecks(new ArrayList<>());

        boolean geoserverAccessible = canAccess(geoserverUrl);
        result.setGeoserverAccessible(geoserverAccessible);
        result.getChecks().add(geoserverAccessible ? "✓ GeoServer dapat diakses" : "✕ GeoServer tidak dapat diakses");

        if (!geoserverAccessible) {
            result.setMetadataReadable(false);
            return result;
        }

        boolean workspaceFound = directWmsEndpoint || workspaceExists(geoserverUrl, workspace);
        result.setWorkspaceFound(workspaceFound);
        result.getChecks().add(workspaceFound ? "✓ Workspace ditemukan" : "✕ Workspace tidak ditemukan");

        if (!workspaceFound) {
            result.setMetadataReadable(false);
            return result;
        }

        boolean wmsAvailable = wmsServiceAvailable(wmsUrl);
        result.setWmsServiceAvailable(wmsAvailable);
        result.getChecks().add(wmsAvailable ? "✓ WMS service tersedia" : "✕ WMS service tidak tersedia");

        if (!wmsAvailable) {
            result.setMetadataReadable(false);
            return result;
        }

        WmsMetadata metadata = fetchLayerMetadata(wmsUrl, qualifiedLayerName);
        result.setMetadata(metadata);
        boolean layerFound = metadata != null && metadata.getStatus() != null && !metadata.getStatus().equalsIgnoreCase("NOT_FOUND");
        result.setLayerFound(layerFound);

        if (layerFound) {
            result.getChecks().add("✓ Layer ditemukan");
            result.setMetadataReadable(true);
        } else {
            result.getChecks().add("✕ Layer tidak ditemukan");
            result.setMetadataReadable(false);
        }

        return result;
    }

    public String fetchFeatureInfo(WmsFeatureInfoRequest request) {
        String url = normalizeUrl(request.getUrl());
        if (url == null || !isValidUrl(url)) {
            throw new IllegalArgumentException("Feature info URL tidak valid.");
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .GET()
                .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || response.body() == null || response.body().isBlank()) {
                return "";
            }
            return response.body();
        } catch (Exception e) {
            log.warn("GetFeatureInfo gagal diakses: {}", url, e);
            throw new IllegalArgumentException("Data pada lokasi yang dipilih tidak dapat dibaca.");
        }
    }

    @Transactional
    public WmsLayer addLayer(WmsLayer layer) {
        Objects.requireNonNull(layer, "Layer tidak boleh null");

        String geoserverUrl = normalizeUrl(layer.getGeoserverUrl());
        String workspace = normalizeText(layer.getWorkspace());
        String layerName = normalizeText(layer.getLayerName());
        String qualifiedLayerName = normalizeText(layer.getQualifiedLayerName());

        if (geoserverUrl == null || geoserverUrl.isBlank()) {
            throw new IllegalArgumentException("GeoServer URL wajib diisi.");
        }
        if (workspace == null || workspace.isBlank()) {
            throw new IllegalArgumentException("Workspace wajib diisi.");
        }
        if (layerName == null || layerName.isBlank()) {
            throw new IllegalArgumentException("Layer Name wajib diisi.");
        }
        if (qualifiedLayerName == null || qualifiedLayerName.isBlank()) {
            qualifiedLayerName = workspace + ":" + layerName;
        }

        Optional<WmsLayer> existing = wmsLayerRepository.findByQualifiedLayerNameAndGeoserverUrl(qualifiedLayerName, geoserverUrl);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Layer sudah ada di database.");
        }

        if (layer.getVisible() == null) {
            layer.setVisible(true);
        }
        if (layer.getStatus() == null || layer.getStatus().isBlank()) {
            layer.setStatus("ACTIVE");
        }

        layer.setGeoserverUrl(geoserverUrl);
        layer.setWorkspace(workspace);
        layer.setLayerName(layerName);
        layer.setQualifiedLayerName(qualifiedLayerName);
        layer.setWmsUrl(isDirectWmsEndpoint(geoserverUrl) ? geoserverUrl : resolveWmsUrl(geoserverUrl, workspace));

        return wmsLayerRepository.save(layer);
    }

    public List<WmsLayer> getAllLayers() {
        return wmsLayerRepository.findAll();
    }

    public Optional<WmsLayer> getLayerById(Long id) {
        return wmsLayerRepository.findById(id);
    }

    public WmsLayer updateVisibility(Long id, boolean visible) {
        WmsLayer layer = wmsLayerRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Layer tidak ditemukan."));
        layer.setVisible(visible);
        return wmsLayerRepository.save(layer);
    }

    public void deleteLayer(Long id) {
        if (!wmsLayerRepository.existsById(id)) {
            throw new IllegalArgumentException("Layer tidak ditemukan.");
        }
        wmsLayerRepository.deleteById(id);
    }

    private boolean canAccess(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 500;
        } catch (Exception e) {
            log.warn("GeoServer tidak dapat diakses: {}", url, e);
            return false;
        }
    }

    public List<WmsLayerCandidate> discoverLayers(WmsDiscoveryRequest request) {
        String geoserverUrl = normalizeUrl(request.getGeoserverUrl());
        String workspace = normalizeText(request.getWorkspace());

        if (geoserverUrl == null || geoserverUrl.isBlank() || !isValidUrl(geoserverUrl)) {
            throw new IllegalArgumentException("URL GeoServer/WMS tidak valid.");
        }
        if (workspace == null || workspace.isBlank()) {
            throw new IllegalArgumentException("Workspace tidak boleh kosong.");
        }

        String wmsUrl = isDirectWmsEndpoint(geoserverUrl)
            ? geoserverUrl
            : resolveWmsUrl(geoserverUrl, workspace);
        String capabilitiesUrl = appendCapabilitiesParameters(wmsUrl);

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(capabilitiesUrl))
                .timeout(Duration.ofSeconds(12))
                .GET()
                .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 || response.body() == null || response.body().isBlank()) {
                throw new IllegalArgumentException("GetCapabilities gagal. HTTP status: " + response.statusCode() + ".");
            }

            return parseLayerCandidates(response.body(), geoserverUrl, workspace, wmsUrl);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Discovery layer gagal: {}", capabilitiesUrl, e);
            throw new IllegalArgumentException("GetCapabilities gagal diakses. Periksa URL, workspace, dan koneksi GeoServer.");
        }
    }

    private List<WmsLayerCandidate> parseLayerCandidates(String xml, String geoserverUrl, String workspace, String wmsUrl) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");

            var builder = factory.newDocumentBuilder();
            builder.setEntityResolver((publicId, systemId) -> new InputSource(new StringReader("")));
            String xmlWithoutDoctype = xml.replaceFirst("(?is)<!DOCTYPE\\s+[^>]*>", "");
            Element documentElement = builder
                .parse(new InputSource(new StringReader(xmlWithoutDoctype)))
                .getDocumentElement();
            NodeList layerNodes = documentElement.getElementsByTagNameNS("*", "Layer");
            List<WmsLayerCandidate> candidates = new ArrayList<>();
            Set<String> discoveredNames = new HashSet<>();
            for (int index = 0; index < layerNodes.getLength(); index++) {
                Element layerElement = (Element) layerNodes.item(index);
                String layerName = firstChildText(layerElement, "Name");
                if (layerName == null || layerName.isBlank()) {
                    continue;
                }

                WmsLayerCandidate candidate = new WmsLayerCandidate();
                candidate.setGeoserverUrl(geoserverUrl);
                candidate.setWorkspace(workspace);
                candidate.setLayerName(layerName);
                candidate.setQualifiedLayerName(isDirectWmsEndpoint(geoserverUrl) ? layerName : workspace + ":" + layerName);
                if (!discoveredNames.add(candidate.getQualifiedLayerName())) {
                    continue;
                }
                candidate.setWmsUrl(wmsUrl);
                candidate.setTitle(firstChildText(layerElement, "Title"));
                candidate.setAbstractText(firstChildText(layerElement, "Abstract"));
                candidate.setCrs(firstChildText(layerElement, "CRS"));
                candidate.setBoundingBox(firstChildText(layerElement, "EX_GeographicBoundingBox"));
                candidates.add(candidate);
            }

            if (candidates.isEmpty()) {
                throw new IllegalArgumentException("GetCapabilities berhasil, tetapi tidak ada layer yang tersedia.");
            }
            return candidates;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("GetCapabilities mengandung XML yang tidak valid", e);
            throw new IllegalArgumentException("Response GetCapabilities tidak valid.");
        }
    }

    private String firstChildText(Element parent, String localName) {
        NodeList children = parent.getElementsByTagNameNS("*", localName);
        if (children.getLength() == 0) {
            return null;
        }
        String value = children.item(0).getTextContent();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean workspaceExists(String geoserverUrl, String workspace) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(geoserverUrl)
                .pathSegment(workspace)
                .path("/wms")
                .queryParam("service", "WMS")
                .queryParam("request", "GetCapabilities")
                .queryParam("version", "1.1.1")
                .toUriString();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body() != null && !response.body().isBlank();
        } catch (Exception e) {
            log.warn("Workspace cek gagal: {} / {}", geoserverUrl, workspace, e);
            return false;
        }
    }

    private boolean wmsServiceAvailable(String wmsUrl) {
        try {
            String capabilitiesUrl = appendCapabilitiesParameters(wmsUrl);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(capabilitiesUrl))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body() != null && !response.body().isBlank();
        } catch (Exception e) {
            log.warn("WMS service tidak tersedia: {}", wmsUrl, e);
            return false;
        }
    }

    private WmsMetadata fetchLayerMetadata(String wmsUrl, String qualifiedLayerName) {
        try {
            String url = appendCapabilitiesParameters(wmsUrl);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || response.body() == null || response.body().isBlank()) {
                return null;
            }

            String xml = response.body();
            WmsMetadata metadata = new WmsMetadata();
            metadata.setTitle(extractTagValue(xml, "Title"));
            metadata.setAbstractText(extractTagValue(xml, "Abstract"));
            metadata.setCrs(extractTagValue(xml, "SRS"));
            metadata.setBoundingBox(extractTagValue(xml, "LatLonBoundingBox"));
            metadata.setAvailableFormats(List.of("image/png", "image/jpeg", "image/png8"));
            metadata.setStatus("ACTIVE");

            if (qualifiedLayerName != null && !qualifiedLayerName.isBlank() && xml.contains(qualifiedLayerName)) {
                return metadata;
            }

            if (xml.contains("<Name>") || xml.contains("<Title>")) {
                return metadata;
            }

            return null;
        } catch (Exception e) {
            log.warn("Metadata layer gagal dibaca dari WMS", e);
            return null;
        }
    }

    private String extractTagValue(String xml, String tagName) {
        try {
            Pattern pattern = Pattern.compile("<" + tagName + ">(.+?)</" + tagName + ">", Pattern.DOTALL);
            var matcher = pattern.matcher(xml);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
            if ("SRS".equals(tagName)) {
                Pattern srsPattern = Pattern.compile("<SRS>(.*?)</SRS>", Pattern.DOTALL);
                var srsMatcher = srsPattern.matcher(xml);
                if (srsMatcher.find()) {
                    return srsMatcher.group(1).trim();
                }
            }
            if ("LatLonBoundingBox".equals(tagName)) {
                Pattern bboxPattern = Pattern.compile("<LatLonBoundingBox[^>]*minx=\"([^\"]+)\"[^>]*miny=\"([^\"]+)\"[^>]*maxx=\"([^\"]+)\"[^>]*maxy=\"([^\"]+)\".*?/>", Pattern.DOTALL);
                var bboxMatcher = bboxPattern.matcher(xml);
                if (bboxMatcher.find()) {
                    return bboxMatcher.group(1) + ", " + bboxMatcher.group(2) + ", " + bboxMatcher.group(3) + ", " + bboxMatcher.group(4);
                }
            }
            return "N/A";
        } catch (Exception e) {
            return "N/A";
        }
    }

    private String resolveWmsUrl(String geoserverUrl, String workspace) {
        String cleanedUrl = normalizeUrl(geoserverUrl);
        if (cleanedUrl == null || cleanedUrl.isBlank()) {
            return "";
        }
        try {
            URI uri = new URI(cleanedUrl);
            String prefix = uri.getScheme() + "://" + uri.getHost();
            String path = uri.getPath() == null ? "" : uri.getPath();

            if (path != null && path.endsWith("/")) {
                path = path.substring(0, path.length() - 1);
            }

            if (!path.isBlank() && path.contains("/")) {
                String base = path.replaceAll("/+$", "");
                return prefix + base + "/" + workspace + "/wms";
            }

            return cleanedUrl.replaceAll("/+$", "") + "/" + workspace + "/wms";
        } catch (URISyntaxException e) {
            log.warn("Gagal resolving WMS URL untuk {}", cleanedUrl, e);
            return cleanedUrl.replaceAll("/+$", "") + "/" + workspace + "/wms";
        }
    }

    private boolean isDirectWmsEndpoint(String url) {
        try {
            URI uri = new URI(url);
            String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase();
            String query = uri.getQuery() == null ? "" : uri.getQuery().toLowerCase();
            return path.endsWith("/wms") || path.contains("service-wms") || query.contains("service=wms");
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private String appendCapabilitiesParameters(String wmsUrl) {
        String separator = wmsUrl.contains("?") ? "&" : "?";
        return wmsUrl + separator + "service=WMS&request=GetCapabilities&version=1.1.1";
    }

    private boolean isValidUrl(String url) {
        try {
            new URL(url);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String normalizeUrl(String url) {
        if (url == null) {
            return null;
        }
        String cleaned = url.trim();
        if (cleaned.isEmpty()) {
            return "";
        }
        return cleaned.replaceAll("/+$", "");
    }

    private String normalizeText(String input) {
        if (input == null) {
            return null;
        }
        return input.trim();
    }
}
