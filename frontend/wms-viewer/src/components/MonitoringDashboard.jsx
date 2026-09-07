import { useEffect, useState } from 'react';
import { fetchMonitoring, fetchMonitoringSummary, refreshMonitoring } from '../services/WmsService';

const emptySummary = {
  total: 0,
  healthy: 0,
  warning: 0,
  down: 0,
  averageResponseTimeMs: 0,
  lastCheck: null
};

export default function MonitoringDashboard() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMonitoring = async () => {
    try {
      const [monitoringResponse, summaryResponse] = await Promise.all([
        fetchMonitoring(),
        fetchMonitoringSummary()
      ]);
      setItems(monitoringResponse.data?.data || []);
      setSummary({ ...emptySummary, ...(summaryResponse.data?.data || {}) });
      setError('');
    } catch {
      setError('Data monitoring belum dapat dimuat. Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await refreshMonitoring();
      setItems(response.data?.data || []);
      setSummary({ ...emptySummary, ...(response.data?.summary || {}) });
      setError('');
    } catch {
      setError('Pemeriksaan WMS gagal dijalankan.');
    } finally {
      setRefreshing(false);
    }
  };

  const maxResponse = Math.max(...items.map((item) => item.responseTimeMs || 0), 1);
  const chartTotal = summary.healthy + summary.warning + summary.down;
  const healthyAngle = chartTotal ? (summary.healthy / chartTotal) * 360 : 0;
  const warningAngle = chartTotal ? ((summary.healthy + summary.warning) / chartTotal) * 360 : 0;

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">WMS MONITORING</span>
          <h2>System health overview</h2>
          <p>Ringkasan kondisi endpoint WMS yang tersimpan di aplikasi.</p>
        </div>
        <button className="monitor-refresh-btn" type="button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Memeriksa...' : 'Periksa semua WMS'}
        </button>
      </div>

      {error && <div className="monitor-error">{error}</div>}

      <div className="monitor-kpis">
        <Kpi label="Total WMS" value={summary.total} tone="blue" />
        <Kpi label="Healthy" value={summary.healthy} tone="green" />
        <Kpi label="Warning" value={summary.warning} tone="amber" />
        <Kpi label="Down / Error" value={summary.down} tone="red" />
        <Kpi label="Rata-rata response" value={`${(summary.averageResponseTimeMs / 1000).toFixed(2)} s`} tone="slate" />
        <Kpi label="Pemeriksaan terakhir" value={formatDate(summary.lastCheck)} tone="slate" />
      </div>

      <div className="monitor-overview-grid">
        <section className="monitor-card status-card">
          <div className="monitor-card-heading"><div><span className="eyebrow">STATUS DISTRIBUTION</span><h3>Kondisi WMS</h3></div><span className="monitor-card-caption">{chartTotal} endpoint</span></div>
          <div className="donut-layout">
            <div className="status-donut" style={{ background: `conic-gradient(#35a878 0deg ${healthyAngle}deg, #e5a63a ${healthyAngle}deg ${warningAngle}deg, #d65b5b ${warningAngle}deg 360deg)` }}><div><strong>{summary.total}</strong><span>WMS</span></div></div>
            <div className="status-legend"><Legend color="green" label="Healthy" value={summary.healthy} /><Legend color="amber" label="Warning" value={summary.warning} /><Legend color="red" label="Down / Error" value={summary.down} /></div>
          </div>
        </section>

        <section className="monitor-card problem-card">
          <div className="monitor-card-heading"><div><span className="eyebrow">ATTENTION REQUIRED</span><h3>WMS bermasalah</h3></div></div>
          {items.filter((item) => item.status !== 'HEALTHY').length > 0 ? items.filter((item) => item.status !== 'HEALTHY').slice(0, 4).map((item) => <ProblemItem key={item.id || item.wmsUrl} item={item} />) : <div className="monitor-empty">Belum ada WMS bermasalah.</div>}
        </section>
      </div>

      <section className="monitor-card response-card">
        <div className="monitor-card-heading"><div><span className="eyebrow">PERFORMANCE</span><h3>Response time setiap WMS</h3></div></div>
        {items.length > 0 ? <div className="response-bars">{items.slice(0, 8).map((item) => <div className="response-bar-row" key={item.id || item.wmsUrl}><span title={item.wmsName}>{item.wmsName}</span><div><i style={{ width: `${Math.max((item.responseTimeMs || 0) / maxResponse * 100, 2)}%` }} className={`bar-${item.status.toLowerCase()}`} /></div><strong>{((item.responseTimeMs || 0) / 1000).toFixed(2)} s</strong></div>)}</div> : <div className="monitor-empty">Jalankan pemeriksaan untuk mengisi grafik.</div>}
      </section>

      <section className="monitor-card table-card">
        <div className="monitor-card-heading"><div><span className="eyebrow">REGISTERED ENDPOINTS</span><h3>Daftar monitoring</h3></div><span className="monitor-card-caption">{items.length} hasil</span></div>
        {loading ? <div className="monitor-empty">Memuat data monitoring...</div> : items.length === 0 ? <div className="monitor-empty">Belum ada hasil monitoring. Tekan “Periksa semua WMS” untuk memulai.</div> : <div className="monitor-table-wrap"><table><thead><tr><th>WMS</th><th>Status</th><th>Response</th><th>Last check</th><th>Version</th><th>Layers</th></tr></thead><tbody>{items.map((item) => <tr key={item.id || item.wmsUrl}><td><strong>{item.wmsName}</strong><small>{item.wmsUrl}</small></td><td><StatusBadge status={item.status} /></td><td>{((item.responseTimeMs || 0) / 1000).toFixed(2)} s</td><td>{formatDate(item.checkedAt)}</td><td>{item.wmsVersion || 'N/A'}</td><td>{item.layerCount ?? 'N/A'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  return <div className={`monitor-kpi kpi-${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Legend({ color, label, value }) {
  return <div className="legend-item"><i className={`legend-dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${(status || 'DOWN').toLowerCase()}`}><i />{status || 'DOWN'}</span>;
}

function ProblemItem({ item }) {
  return <div className="problem-item"><StatusBadge status={item.status} /><div><strong>{item.wmsName}</strong><small>{item.errorMessage || 'Response time tinggi'}</small></div></div>;
}

function formatDate(value) {
  if (!value) return 'Belum ada';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
