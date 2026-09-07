import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { getArea, getLength } from 'ol/sphere';
import { toLonLat, transform } from 'ol/proj';
import { fetchFeatureInfo } from '../services/WmsService';

const DEFAULT_CENTER = transform([118.0149, -2.5489], 'EPSG:4326', 'EPSG:3857');

export default function MapViewer({ layers, onFeatureSelect, onFeatureMessage }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const markerOverlay = useRef(null);
  const measurementSource = useRef(null);
  const measurementLayer = useRef(null);
  const drawInteraction = useRef(null);
  const measurementModeRef = useRef('');
  const [hasClickedPoint, setHasClickedPoint] = useState(false);
  const [measurementMode, setMeasurementMode] = useState('');
  const [measurementResult, setMeasurementResult] = useState(null);
  const [coordinate, setCoordinate] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        controls: [],
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: DEFAULT_CENTER,
          zoom: 5
        })
      });

      markerOverlay.current = new Overlay({
        element: markerRef.current,
        positioning: 'center-center',
        stopEvent: false
      });
      mapInstance.current.addOverlay(markerOverlay.current);
      measurementSource.current = new VectorSource();
      measurementLayer.current = new VectorLayer({
        source: measurementSource.current,
        style: new Style({
          fill: new Fill({ color: 'rgba(23, 105, 209, 0.16)' }),
          stroke: new Stroke({ color: '#1769d1', width: 3, lineDash: [8, 6] }),
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: '#1769d1' }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          })
        })
      });
    }

    const baseLayer = mapInstance.current.getLayers().item(0);
    const dynamicLayers = layers
      .filter((layer) => layer.visible)
      .map((layer) => {
        const source = new TileWMS({
          url: layer.wmsUrl,
          params: {
            LAYERS: layer.qualifiedLayerName,
            TILED: true,
            FORMAT: 'image/png'
          },
          serverType: 'geoserver',
          crossOrigin: 'anonymous'
        });

        const mapLayer = new TileLayer({ source });
        mapLayer.set('wmsLayer', layer);
        return mapLayer;
      });

    const allLayers = [baseLayer, ...dynamicLayers];
    if (measurementLayer.current) allLayers.push(measurementLayer.current);
    mapInstance.current.setLayers(allLayers);

    const handleMapClick = async (event) => {
      // Overlay memakai koordinat peta, sehingga penanda tetap menempel pada
      // lokasi yang dipilih ketika peta digeser atau diperbesar.
      markerOverlay.current?.setPosition(event.coordinate);
      setHasClickedPoint(true);
      const activeMeasurementMode = measurementModeRef.current;
      if (activeMeasurementMode === 'coordinate') {
        const [longitude, latitude] = toLonLat(event.coordinate);
        setCoordinate({ longitude, latitude });
        return;
      }
      if (activeMeasurementMode === 'distance' || activeMeasurementMode === 'area') return;
      const activeLayers = mapInstance.current.getLayers().getArray()
        .filter((mapLayer) => mapLayer.get('wmsLayer'));
      if (activeLayers.length === 0) {
        onFeatureSelect(null);
        onFeatureMessage('Belum ada layer aktif untuk dibaca. Aktifkan layer terlebih dahulu.');
        return;
      }

      const view = mapInstance.current.getView();
      const resolution = view.getResolution();
      const projection = view.getProjection();
      const requests = activeLayers.map(async (mapLayer) => {
        const layer = mapLayer.get('wmsLayer');
        const source = mapLayer.getSource();
        const url = source.getFeatureInfoUrl(event.coordinate, resolution, projection, {
          INFO_FORMAT: 'application/json',
          FEATURE_COUNT: 1,
          QUERY_LAYERS: layer.qualifiedLayerName,
          EXCEPTIONS: 'application/json'
        });
        if (!url) return null;

        try {
          const response = await fetchFeatureInfo({ url });
          const rawData = response.data?.data;
          if (!response.data?.success || !rawData) return null;

          let data;
          try {
            data = JSON.parse(rawData);
          } catch {
            return { layer, data: { features: [{ properties: parseTextFeature(rawData) }] } };
          }

          // Beberapa gateway WMS membungkus respons GeoServer di field
          // `data`: { status_code: 200, data: { type, features } }.
          // Gunakan FeatureCollection di dalamnya agar atribut tidak keliru
          // dianggap kosong.
          if (data?.data && typeof data.data === 'object') {
            data = data.data;
          } else if (typeof data?.data === 'string') {
            try {
              data = JSON.parse(data.data);
            } catch {
              return { layer, data: { features: [{ properties: parseTextFeature(data.data) }] } };
            }
          }

          if (!data.features?.length) return null;
          return { layer, data };
        } catch {
          // Endpoint GetFeatureInfo suatu layer dapat tidak tersedia. Layer lain
          // tetap perlu diperiksa supaya klik peta tidak terlihat "tidak berfungsi".
          return null;
        }
      });

      const results = (await Promise.all(requests))
        .filter(Boolean)
        .map(({ layer, data }) => ({
          layer,
          data: {
            ...data,
            features: data.features.filter((feature, index, features) => {
              const featureKey = JSON.stringify(feature.properties || {});
              return index === features.findIndex((candidate) => JSON.stringify(candidate.properties || {}) === featureKey);
            })
          }
        }))
        .filter(({ data }) => data.features.length > 0);
      if (results.length > 0) {
        const features = results.flatMap(({ layer, data }) => data.features.map((feature) => ({
          layerName: layer.qualifiedLayerName,
          properties: feature.properties || {}
        })));
        onFeatureSelect(features);
        onFeatureMessage(null);
      } else {
        onFeatureSelect(null);
        onFeatureMessage('Tidak ada data pada lokasi yang dipilih. Silakan klik tepat pada area layer yang tampil di peta.');
      }
    };

    mapInstance.current.un('singleclick', handleMapClick);
    mapInstance.current.on('singleclick', handleMapClick);
    return () => mapInstance.current?.un('singleclick', handleMapClick);
  }, [layers]);

  const clearMeasurementInteraction = () => {
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }
  };

  const clearMeasurement = () => {
    clearMeasurementInteraction();
    measurementSource.current?.clear();
    markerOverlay.current?.setPosition(undefined);
    setHasClickedPoint(false);
    measurementModeRef.current = '';
    setMeasurementMode('');
    setMeasurementResult(null);
    setCoordinate(null);
  };

  const updateMeasurementResult = (geometry, mode) => {
    if (mode === 'distance') {
      const length = getLength(geometry);
      setMeasurementResult({
        type: 'distance',
        label: 'Total jarak',
        value: length >= 1000 ? `${(length / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km` : `${length.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m`
      });
    } else {
      const area = getArea(geometry);
      const perimeter = getLength(geometry.getLinearRing(0));
      setMeasurementResult({
        type: 'area',
        label: 'Luas',
        value: area >= 1000000 ? `${(area / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km²` : `${area.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m²`,
        perimeter: `${perimeter.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m`
      });
    }
  };

  const startMeasurement = (mode) => {
    clearMeasurementInteraction();
    measurementSource.current?.clear();
    setMeasurementResult(null);
    setCoordinate(null);
    measurementModeRef.current = mode;
    setMeasurementMode(mode);
    if (mode === 'coordinate') return;

    const type = mode === 'distance' ? 'LineString' : 'Polygon';
    drawInteraction.current = new Draw({ source: measurementSource.current, type });
    drawInteraction.current.on('drawstart', (event) => {
      event.feature.getGeometry().on('change', (geometryEvent) => updateMeasurementResult(geometryEvent.target, mode));
    });
    drawInteraction.current.on('drawend', (event) => {
      updateMeasurementResult(event.feature.getGeometry(), mode);
      mapInstance.current?.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
      measurementModeRef.current = '';
      setMeasurementMode('');
    });
    mapInstance.current?.addInteraction(drawInteraction.current);
  };

  return (
    <div ref={mapRef} className="map-canvas">
      <div className="map-tools" role="group" aria-label="Kontrol peta">
        <button type="button" onClick={() => mapInstance.current?.getView().setZoom((mapInstance.current.getView().getZoom() || 5) + 1)} title="Perbesar peta" aria-label="Perbesar peta">+</button>
        <button type="button" onClick={() => mapInstance.current?.getView().setZoom((mapInstance.current.getView().getZoom() || 5) - 1)} title="Perkecil peta" aria-label="Perkecil peta">−</button>
        <button type="button" onClick={() => {
          const view = mapInstance.current?.getView();
          view?.setCenter(DEFAULT_CENTER);
          view?.setZoom(5);
        }} title="Kembali ke tampilan Indonesia" aria-label="Kembali ke tampilan awal">⌂</button>
      </div>
      <div className="measurement-panel">
        <div className="measurement-heading"><strong>Pengukuran</strong><span>{measurementMode ? 'Aktif' : 'Pilih alat'}</span></div>
        <div className="measurement-actions">
          <button type="button" className={measurementMode === 'distance' ? 'active' : ''} onClick={() => startMeasurement('distance')}>↗ <span>Jarak</span></button>
          <button type="button" className={measurementMode === 'area' ? 'active' : ''} onClick={() => startMeasurement('area')}>◇ <span>Luas</span></button>
          <button type="button" className={measurementMode === 'coordinate' ? 'active' : ''} onClick={() => startMeasurement('coordinate')}>⌖ <span>Koordinat</span></button>
          <button type="button" onClick={clearMeasurement} title="Hapus pengukuran">× <span>Reset</span></button>
        </div>
        {measurementMode === 'distance' && <p className="measurement-hint">Klik beberapa titik, lalu klik ganda untuk selesai.</p>}
        {measurementMode === 'area' && <p className="measurement-hint">Klik titik polygon, lalu klik ganda untuk selesai.</p>}
        {measurementResult && (
          <div className="measurement-result"><span>{measurementResult.label}</span><strong>{measurementResult.value}</strong>{measurementResult.perimeter && <small>Keliling: {measurementResult.perimeter}</small>}</div>
        )}
        {coordinate && (
          <div className="coordinate-result"><span>KOORDINAT</span><strong>Lon {coordinate.longitude.toFixed(6)}</strong><strong>Lat {coordinate.latitude.toFixed(6)}</strong><small>CRS: EPSG:4326</small></div>
        )}
      </div>
      <span ref={markerRef} className={`map-click-marker ${hasClickedPoint ? 'is-visible' : ''}`} aria-label="Titik yang dipilih" />
    </div>
  );
}

function parseTextFeature(rawData) {
  const document = new DOMParser().parseFromString(rawData, 'text/html');
  const rows = [...document.querySelectorAll('tr')];
  const properties = {};
  rows.forEach((row) => {
    const cells = [...row.querySelectorAll('th, td')].map((cell) => cell.textContent.trim());
    if (cells.length >= 2) properties[cells[0]] = cells.slice(1).join(' | ');
  });
  if (Object.keys(properties).length > 0) return properties;
  return { response: rawData };
}
