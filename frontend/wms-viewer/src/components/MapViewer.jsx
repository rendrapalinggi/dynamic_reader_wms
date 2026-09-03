import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import Overlay from 'ol/Overlay';
import { transform } from 'ol/proj';
import { fetchFeatureInfo } from '../services/WmsService';

export default function MapViewer({ layers, onFeatureSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const markerOverlay = useRef(null);
  const [featurePopup, setFeaturePopup] = useState(null);
  const [hasClickedPoint, setHasClickedPoint] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: transform([118.0149, -2.5489], 'EPSG:4326', 'EPSG:3857'),
          zoom: 5
        })
      });

      markerOverlay.current = new Overlay({
        element: markerRef.current,
        positioning: 'center-center',
        stopEvent: false
      });
      mapInstance.current.addOverlay(markerOverlay.current);
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
    mapInstance.current.setLayers(allLayers);

    const handleMapClick = async (event) => {
      // Overlay memakai koordinat peta, sehingga penanda tetap menempel pada
      // lokasi yang dipilih ketika peta digeser atau diperbesar.
      markerOverlay.current?.setPosition(event.coordinate);
      setHasClickedPoint(true);
      const activeLayers = mapInstance.current.getLayers().getArray()
        .filter((mapLayer) => mapLayer.get('wmsLayer'));
      if (activeLayers.length === 0) {
        onFeatureSelect(null);
        setFeaturePopup(null);
        return;
      }

      // Beri umpan balik langsung saat pengguna memilih titik lain pada peta.
      setFeaturePopup(null);

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
        setFeaturePopup({ pixel: event.pixel, results });
      } else {
        onFeatureSelect(null);
        setFeaturePopup({
          pixel: event.pixel,
          results: [],
          message: 'Tidak ada objek yang dapat dibaca pada titik ini. Perbesar peta lalu klik tepat pada objek layer.'
        });
      }
    };

    mapInstance.current.un('singleclick', handleMapClick);
    mapInstance.current.on('singleclick', handleMapClick);
    return () => mapInstance.current?.un('singleclick', handleMapClick);
  }, [layers]);

  return (
    <div ref={mapRef} className="map-canvas">
      <span ref={markerRef} className={`map-click-marker ${hasClickedPoint ? 'is-visible' : ''}`} aria-label="Titik yang dipilih" />
      {featurePopup && (
        <div
          className="feature-popup"
          style={{ left: featurePopup.pixel[0], top: featurePopup.pixel[1] }}
        >
          <button className="feature-popup-close" onClick={() => setFeaturePopup(null)} aria-label="Tutup informasi">x</button>
          {featurePopup.message && <p className="feature-popup-message">{featurePopup.message}</p>}
          {featurePopup.results.map(({ layer, data }) => (
            <section key={layer.id} className="feature-group">
              <span className="eyebrow">{layer.qualifiedLayerName}</span>
              {data.features.slice(0, 10).map((feature, index) => (
                <dl key={`${layer.id}-${index}`} className="feature-properties">
                  {Object.entries(feature.properties || {}).map(([key, value]) => (
                    <div key={key}><dt>{key}</dt><dd>{String(value ?? 'N/A')}</dd></div>
                  ))}
                </dl>
              ))}
            </section>
          ))}
        </div>
      )}
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
