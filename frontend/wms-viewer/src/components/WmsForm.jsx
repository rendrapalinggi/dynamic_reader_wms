import { useState } from 'react';

export default function WmsForm({
  form,
  onChange,
  onCheck,
  loading,
  checkResult,
  onAddLayer,
  onDiscover,
  discoveryLoading,
  discoveredLayers,
  selectedLayerNames,
  onToggleDiscoveredLayer,
  onSelectAllDiscovered,
  onDeselectAllDiscovered,
  onAddSelectedLayers,
  savedConnections,
  onSaveConnection,
  onLoadConnection,
  onDeleteConnection
}) {
  const [search, setSearch] = useState('');
  const filteredLayers = discoveredLayers.filter((layer) => {
    const query = search.toLowerCase();
    return layer.layerName.toLowerCase().includes(query)
      || (layer.title || '').toLowerCase().includes(query);
  });

  return (
    <div className="wms-form">
      <div className="form-section-label">CONNECTION DETAILS</div>

      <div className="field-group">
        <label>GeoServer / WMS URL</label>
        <input
          type="text"
          name="geoserverUrl"
          value={form.geoserverUrl}
          onChange={onChange}
          placeholder="https://example.com/geoserver atau endpoint WMS"
        />
      </div>

      <div className="field-group">
        <label>Workspace</label>
        <input
          type="text"
          name="workspace"
          value={form.workspace}
          onChange={onChange}
          placeholder="Masukkan workspace"
        />
      </div>

      <div className="field-group">
        <label>Layer Name</label>
        <input
          type="text"
          name="layerName"
          value={form.layerName}
          onChange={onChange}
          placeholder="Masukkan nama layer"
        />
      </div>

      <div className="connection-actions">
        <button type="button" className="text-btn" onClick={onSaveConnection}>Simpan koneksi</button>
        {savedConnections.length > 0 && <span>{savedConnections.length} tersimpan</span>}
      </div>

      {savedConnections.length > 0 && (
        <div className="saved-connections">
          <div className="saved-heading"><span className="form-section-label">SAVED CONNECTIONS</span><small>Pilih untuk mengisi form</small></div>
          {savedConnections.map((connection) => (
            <div className="saved-connection" key={connection.id}>
              <button type="button" onClick={() => onLoadConnection(connection)}>
                <strong>{connection.workspace}</strong>
                <small>{connection.geoserverUrl}</small>
              </button>
              <button type="button" className="saved-delete" onClick={() => onDeleteConnection(connection.id)} aria-label={`Hapus koneksi ${connection.workspace}`}>x</button>
            </div>
          ))}
        </div>
      )}

      <button className="primary-btn" onClick={onCheck} disabled={loading}>
        {loading ? 'Memeriksa...' : 'CEK WMS'}
      </button>

      <button className="secondary-btn scan-btn" onClick={onDiscover} disabled={discoveryLoading}>
        {discoveryLoading ? 'Memindai...' : 'SCAN WORKSPACE'}
      </button>

      {discoveredLayers.length > 0 && (
        <div className="discovery-result">
          <div className="discovery-heading">
            <h3>Layer Tersedia ({discoveredLayers.length})</h3>
            <div className="selection-actions">
              <button type="button" onClick={onSelectAllDiscovered}>Pilih semua</button>
              <button type="button" onClick={onDeselectAllDiscovered}>Kosongkan</button>
            </div>
          </div>
          <input
            className="layer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari layer..."
          />
          <div className="discovered-list">
            {filteredLayers.map((layer) => (
              <label key={layer.layerName} className="discovered-item">
                <input
                  type="checkbox"
                  checked={selectedLayerNames.includes(layer.layerName)}
                  onChange={() => onToggleDiscoveredLayer(layer.layerName)}
                />
                <span>
                  <strong>{layer.layerName}</strong>
                  <small>{layer.title || 'Tanpa judul'}</small>
                </span>
              </label>
            ))}
          </div>
          {filteredLayers.length === 0 && <p>Tidak ada layer yang cocok.</p>}
          <button className="secondary-btn" onClick={onAddSelectedLayers}>
            TAMBAHKAN TERPILIH ({selectedLayerNames.length})
          </button>
        </div>
      )}

      {checkResult && (
        <div className="check-result">
          <h3>Hasil Pemeriksaan</h3>
          {checkResult.success ? (
            <>
              <p>✓ GeoServer dapat diakses</p>
              <p>✓ Workspace ditemukan</p>
              <p>✓ WMS service tersedia</p>
              <p>✓ Layer ditemukan</p>
            </>
          ) : (
            <p>✕ {checkResult.message}</p>
          )}

          {checkResult.success && (
            <>
              <div className="metadata-box">
                <p><strong>Layer Name:</strong> {checkResult.data?.qualifiedLayerName || 'N/A'}</p>
                <p><strong>Title:</strong> {checkResult.data?.metadata?.title || 'N/A'}</p>
                <p><strong>CRS:</strong> {checkResult.data?.metadata?.crs || 'N/A'}</p>
                <p><strong>Abstract:</strong> {checkResult.data?.metadata?.abstractText || 'N/A'}</p>
              </div>
              <button className="secondary-btn" onClick={onAddLayer}>TAMBAH LAYER</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
