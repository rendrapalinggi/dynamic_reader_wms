import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WmsForm from './components/WmsForm';
import LayerManager from './components/LayerManager';
import MapViewer from './components/MapViewer';
import { checkWms, discoverLayers, fetchLayers, updateLayerVisibility, deleteLayer, addLayer } from './services/WmsService';

export default function App() {
  const [form, setForm] = useState({
    geoserverUrl: '',
    workspace: '',
    layerName: ''
  });
  const [checkResult, setCheckResult] = useState(null);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveredLayers, setDiscoveredLayers] = useState([]);
  const [selectedLayerNames, setSelectedLayerNames] = useState([]);
  const [mapKey, setMapKey] = useState(0);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [infoLayer, setInfoLayer] = useState(null);
  const [clickedFeature, setClickedFeature] = useState(null);

  const loadLayers = async () => {
    try {
      const response = await fetchLayers();
      setLayers(response.data?.data || []);
    } catch (error) {
      toast.error('Gagal memuat layer dari server.');
    }
  };

  useEffect(() => {
    loadLayers();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiscoverLayers = async () => {
    setDiscoveryLoading(true);
    try {
      const response = await discoverLayers({
        geoserverUrl: form.geoserverUrl,
        workspace: form.workspace
      });
      const candidates = response.data?.data || [];
      setDiscoveredLayers(candidates);
      setSelectedLayerNames(candidates.map((layer) => layer.layerName));
      toast.success(`${candidates.length} layer ditemukan.`);
    } catch (error) {
      const message = error?.response?.data?.message || 'GetCapabilities gagal dibaca.';
      setDiscoveredLayers([]);
      setSelectedLayerNames([]);
      toast.error(message);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleToggleDiscoveredLayer = (layerName) => {
    setSelectedLayerNames((current) => current.includes(layerName)
      ? current.filter((name) => name !== layerName)
      : [...current, layerName]);
  };

  const handleSelectAllDiscovered = () => {
    setSelectedLayerNames(discoveredLayers.map((layer) => layer.layerName));
  };

  const handleDeselectAllDiscovered = () => {
    setSelectedLayerNames([]);
  };

  const handleAddSelectedLayers = async () => {
    const selectedLayers = discoveredLayers.filter((layer) => selectedLayerNames.includes(layer.layerName));
    if (selectedLayers.length === 0) {
      toast.error('Pilih minimal satu layer.');
      return;
    }

    const results = await Promise.allSettled(selectedLayers.map((layer) => addLayer({
      geoserverUrl: layer.geoserverUrl,
      workspace: layer.workspace,
      layerName: layer.layerName,
      qualifiedLayerName: layer.qualifiedLayerName,
      wmsUrl: layer.wmsUrl,
      title: layer.title || null,
      abstractText: layer.abstractText || null,
      crs: layer.crs || null,
      visible: true,
      status: 'ACTIVE'
    })));
    const addedCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.length - addedCount;
    if (addedCount > 0) {
      toast.success(`${addedCount} layer berhasil ditambahkan${failedCount ? `, ${failedCount} dilewati.` : '.'}`);
      await loadLayers();
      setMapKey((key) => key + 1);
      setIsAddPanelOpen(false);
    }
    if (addedCount === 0) {
      toast.error('Tidak ada layer baru yang ditambahkan. Layer mungkin sudah terdaftar.');
    }
  };

  const handleCheckWms = async () => {
    setLoading(true);
    try {
      const response = await checkWms(form);
      setCheckResult(response.data);
      toast.success('Pengecekan WMS selesai.');
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal memeriksa WMS.';
      setCheckResult({
        success: false,
        message,
        errors: [{ message }]
      });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLayer = async () => {
    if (!checkResult?.success) {
      toast.error('Layer belum valid untuk ditambahkan.');
      return;
    }

    try {
      const payload = {
        geoserverUrl: checkResult.data.geoserverUrl,
        workspace: checkResult.data.workspace,
        layerName: checkResult.data.layerName,
        qualifiedLayerName: checkResult.data.qualifiedLayerName,
        wmsUrl: checkResult.data.wmsUrl,
        title: checkResult.data.metadata?.title || null,
        abstractText: checkResult.data.metadata?.abstractText || null,
        crs: checkResult.data.metadata?.crs || null,
        visible: true,
        status: 'ACTIVE'
      };

      const response = await addLayer(payload);
      toast.success('Layer berhasil ditambahkan.');
      setCheckResult(null);
      setForm({ geoserverUrl: '', workspace: '', layerName: '' });
      await loadLayers();
      setMapKey((k) => k + 1);
      setIsAddPanelOpen(false);
    } catch (error) {
      const message = error?.response?.data?.message || 'Layer gagal ditambahkan.';
      toast.error(message);
    }
  };

  const handleToggleVisibility = async (id, visible) => {
    try {
      await updateLayerVisibility(id, { visible });
      toast.success('Visibility layer berhasil diperbarui.');
      await loadLayers();
      setMapKey((k) => k + 1);
    } catch (error) {
      toast.error('Gagal mengubah visibility layer.');
    }
  };

  const handleDeleteLayer = async (id, qualifiedLayerName) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus layer ${qualifiedLayerName}?`);
    if (!confirmDelete) return;

    try {
      await deleteLayer(id);
      toast.success('Layer berhasil dihapus.');
      await loadLayers();
      setMapKey((k) => k + 1);
    } catch (error) {
      toast.error('Gagal menghapus layer.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">W</div>
          <div>
            <h1>WMS Reader</h1>
          </div>
        </div>
        <div className="view-label">Map View</div>
      </header>

      <main className="workspace-shell">
        <aside className={`navigation-sidebar ${isLayerPanelOpen ? '' : 'sidebar-collapsed'}`}>
          <div className="sidebar-heading"><span className="eyebrow">LAYER MANAGER</span><small>Active operations</small></div>
          <button className="new-connection-btn" onClick={() => setIsAddPanelOpen(true)}>+ New Connection</button>
          <nav className="sidebar-nav" aria-label="Layer tools">
            <button className="active"><span>◇</span>Layers</button>
          </nav>
          {isLayerPanelOpen ? (
            <LayerManager
              layers={layers}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDeleteLayer}
              onInfo={setInfoLayer}
              clickedFeatures={clickedFeature}
              onFeatureClear={() => setClickedFeature(null)}
              onClose={() => setIsLayerPanelOpen(false)}
            />
          ) : <button className="reopen-layers-btn" onClick={() => setIsLayerPanelOpen(true)} title="Buka Layer Manager">Layers</button>}
        </aside>
        <section className="map-workspace">
          <MapViewer key={mapKey} layers={layers} onFeatureSelect={setClickedFeature} />
        </section>
      </main>

      {isAddPanelOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsAddPanelOpen(false)}>
          <section className="modal-panel add-modal">
            <button className="close-btn" onClick={() => setIsAddPanelOpen(false)} aria-label="Tutup">x</button>
            <div className="modal-heading">
              <span className="modal-icon">+</span>
              <div><span className="eyebrow">LAYER CONNECTION</span><h2>Add WMS layer</h2><p>Connect a GeoServer endpoint and discover available layers.</p></div>
            </div>
          <WmsForm
            form={form}
            onChange={handleFormChange}
            onCheck={handleCheckWms}
            loading={loading}
            checkResult={checkResult}
            onAddLayer={handleAddLayer}
            onDiscover={handleDiscoverLayers}
            discoveryLoading={discoveryLoading}
            discoveredLayers={discoveredLayers}
            selectedLayerNames={selectedLayerNames}
            onToggleDiscoveredLayer={handleToggleDiscoveredLayer}
            onSelectAllDiscovered={handleSelectAllDiscovered}
            onDeselectAllDiscovered={handleDeselectAllDiscovered}
            onAddSelectedLayers={handleAddSelectedLayers}
          />
          </section>
        </div>
      )}

      {infoLayer && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setInfoLayer(null)}>
          <section className="modal-panel info-modal">
            <button className="close-btn" onClick={() => setInfoLayer(null)} aria-label="Tutup">x</button>
            <span className="eyebrow">LAYER INFORMATION</span>
            <h2>{infoLayer.qualifiedLayerName || 'Unnamed layer'}</h2>
            <div className="info-status"><span className="status-dot healthy" /> {infoLayer.status || 'N/A'} <span>{infoLayer.visible ? 'Visible' : 'Hidden'}</span></div>
            <dl className="info-grid">
              <div><dt>Workspace</dt><dd>{infoLayer.workspace || 'N/A'}</dd></div>
              <div><dt>Layer name</dt><dd>{infoLayer.layerName || 'N/A'}</dd></div>
              <div><dt>Title</dt><dd>{infoLayer.title || 'N/A'}</dd></div>
              <div><dt>CRS</dt><dd>{infoLayer.crs || 'N/A'}</dd></div>
              <div className="wide"><dt>Abstract</dt><dd>{infoLayer.abstractText || 'N/A'}</dd></div>
              <div className="wide"><dt>WMS URL</dt><dd className="url-value">{infoLayer.wmsUrl || 'N/A'}</dd></div>
            </dl>
          </section>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
