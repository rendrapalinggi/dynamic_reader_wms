import { useState } from 'react';

export default function LayerManager({ layers, onToggleVisibility, onDelete, onInfo, onClose, clickedFeatures, clickedFeatureMessage, onFeatureClear }) {
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const filteredLayers = layers.filter((layer) => {
    const matchesSearch = (layer.qualifiedLayerName || '').toLowerCase().includes(search.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all'
      || (visibilityFilter === 'visible' && layer.visible)
      || (visibilityFilter === 'hidden' && !layer.visible);
    return matchesSearch && matchesVisibility;
  });
  const visibleCount = layers.filter((layer) => layer.visible).length;

  return (
    <div className="layer-panel-content">
      <div className="layer-panel-heading"><div><span className="eyebrow">MAP CONTENT</span><h2>Layers <span>{layers.length}</span></h2></div><button className="panel-close-btn" onClick={onClose} title="Tutup Layer Manager" aria-label="Tutup Layer Manager">x</button></div>
      <div className="layer-search-wrap"><span>/</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search layers..." /></div>
      <div className="layer-summary"><span>{visibleCount} tampil</span><span>{layers.length - visibleCount} tersembunyi</span></div>
      <div className="visibility-filters" role="group" aria-label="Filter visibility layer">
        {['all', 'visible', 'hidden'].map((filter) => (
          <button key={filter} className={visibilityFilter === filter ? 'active' : ''} onClick={() => setVisibilityFilter(filter)}>
            {filter === 'all' ? 'Semua' : filter === 'visible' ? 'Tampil' : 'Tersembunyi'}
          </button>
        ))}
      </div>

      {layers.length === 0 ? (
        <div className="empty-layer-state"><div className="empty-icon">+</div><strong>No WMS layers yet</strong><span>Add a connection to begin mapping.</span></div>
      ) : (
        <ul className="layer-list">
          {filteredLayers.map((layer) => (
            <li key={layer.id} className="layer-item">
              <button className="visibility-btn" onClick={() => onToggleVisibility(layer.id, !layer.visible)} aria-label="Ubah visibility">{layer.visible ? '●' : '○'}</button>
              <button className="layer-toggle" onClick={() => onInfo(layer)}>
                <span><strong>{layer.qualifiedLayerName}</strong><small>{layer.workspace || 'Workspace N/A'}</small></span>
              </button>

              <div className="actions">
                <button className="small-btn info-btn" onClick={() => onInfo(layer)} aria-label="Informasi layer">i</button>
                <button className="small-btn danger" onClick={() => onDelete(layer.id, layer.qualifiedLayerName)} aria-label={`Hapus layer ${layer.qualifiedLayerName}`} title="Hapus layer">x</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(clickedFeatures?.length > 0 || clickedFeatureMessage) && (
        <section className="clicked-feature-panel">
          <div className="clicked-feature-heading">
            <div><span className="eyebrow">SELECTED ON MAP</span><h3>{clickedFeatures?.length || 0} feature ditemukan</h3></div>
            <button className="panel-close-btn" onClick={onFeatureClear} title="Tutup informasi">x</button>
          </div>
          {clickedFeatureMessage && <p className="feature-message">{clickedFeatureMessage}</p>}
          {(clickedFeatures || []).map((feature, index) => (
            <div className="clicked-feature-record" key={`${feature.layerName}-${index}`}>
              <span className="feature-layer-label">{feature.layerName}</span>
              <dl className="clicked-feature-properties">
                {Object.entries(feature.properties || {}).map(([key, value]) => (
                  <div key={key}><dt>{key}</dt><dd>{String(value ?? 'N/A')}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </section>
      )}
      {layers.length > 0 && filteredLayers.length === 0 && <p className="no-results">No matching layers.</p>}
    </div>
  );
}
