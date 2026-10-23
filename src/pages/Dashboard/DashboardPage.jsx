import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { formatRupiah } from '../../utils/currency'
import { formatTanggalPanjang, formatWaktu } from '../../utils/date'
import {
  SUMMARY_HARI_INI,
  PRODUK_TERLARIS,
  STOK_MENIPIS,
  STOK_HABIS,
  TRANSAKSI_HARI_INI,
  GRAFIK_PER_JAM,
} from '../../data/mockData'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

// Hitung lebar bar berdasarkan nilai max
function getBarWidth(value, maxValue) {
  if (!maxValue) return 0
  return Math.round((value / maxValue) * 100)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const now = new Date()
  const tanggal = formatTanggalPanjang(now)
  const firstName = user?.name?.split(' ')[0] ?? 'Pengguna'

  const maxPenjualan = Math.max(...GRAFIK_PER_JAM.map(g => g.penjualan), 1)

  // Transaksi terakhir (5 paling baru, sudah selesai)
  const transaksiTerbaru = [...TRANSAKSI_HARI_INI]
    .filter(t => t.status === 'selesai')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 5)

  return (
    <div id="dashboard-page">
      {/* ── Greeting ── */}
      <div className="dashboard-greeting">
        <div>
          <h2 className="page-title">
            {getGreeting()}, {firstName} 👋
          </h2>
          <p className="page-subtitle">{tanggal}</p>
        </div>
        <div className="dashboard-greeting-badge">
          <span>🟢</span>
          <span>Sistem aktif</span>
        </div>
      </div>

      {/* ── Statistic Cards ── */}
      <div className="stats-grid" id="dashboard-stats-grid">
        <StatCard
          icon="💰"
          label="Total Penjualan Hari Ini"
          value={formatRupiah(SUMMARY_HARI_INI.totalPenjualan)}
          sub={`${SUMMARY_HARI_INI.jumlahTransaksi} transaksi selesai`}
          id="stat-card-penjualan"
        />
        <StatCard
          icon="🛒"
          label="Jumlah Transaksi"
          value={String(SUMMARY_HARI_INI.jumlahTransaksi)}
          sub="Hari ini"
          accentColor="var(--color-info)"
          iconBg="var(--color-info-bg)"
          id="stat-card-transaksi"
        />
        <StatCard
          icon="📈"
          label="Estimasi Laba Kotor"
          value={formatRupiah(SUMMARY_HARI_INI.estimasiLaba)}
          sub="Dari transaksi selesai"
          accentColor="var(--color-warning)"
          iconBg="var(--color-warning-bg)"
          id="stat-card-laba"
        />
        <StatCard
          icon="⚠️"
          label="Stok Hampir Habis"
          value={`${SUMMARY_HARI_INI.stokMenipis} produk`}
          sub={`${SUMMARY_HARI_INI.stokHabis} produk habis`}
          accentColor="var(--color-danger)"
          iconBg="var(--color-danger-bg)"
          id="stat-card-stok"
        />
      </div>

      {/* ── Baris 2: Grafik + Produk Terlaris ── */}
      <div className="content-grid" id="dashboard-main-grid">

        {/* Grafik Penjualan Per Jam */}
        <div className="card" id="dashboard-grafik-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">📊 Penjualan Per Jam</h3>
            <Badge variant="primary">Hari ini</Badge>
          </div>
          <div className="grafik-container" id="dashboard-grafik-perjam" role="img" aria-label="Grafik penjualan per jam">
            {GRAFIK_PER_JAM.map((item) => (
              <div key={item.jam} className="grafik-bar-group">
                <div className="grafik-bar-label-top">
                  {item.penjualan > 0 && (
                    <span className="grafik-bar-value">
                      {formatRupiah(item.penjualan / 1000)}rb
                    </span>
                  )}
                </div>
                <div className="grafik-bar-track">
                  <div
                    className={`grafik-bar ${item.penjualan === 0 ? 'grafik-bar-empty' : ''}`}
                    style={{ height: `${getBarWidth(item.penjualan, maxPenjualan)}%` }}
                    aria-valuenow={item.penjualan}
                    aria-valuemax={maxPenjualan}
                    aria-label={`${item.jam}: ${formatRupiah(item.penjualan)}`}
                  />
                </div>
                <div className="grafik-bar-label">{item.jam}</div>
              </div>
            ))}
          </div>
          <div className="grafik-summary">
            <span>Total: <strong>{formatRupiah(SUMMARY_HARI_INI.totalPenjualan)}</strong></span>
            <span>Transaksi: <strong>{SUMMARY_HARI_INI.jumlahTransaksi}</strong></span>
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="card" id="dashboard-terlaris-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">🏆 Produk Terlaris</h3>
            <Badge variant="success">Hari ini</Badge>
          </div>
          <div className="terlaris-list" id="dashboard-terlaris-list">
            {PRODUK_TERLARIS.map((item, index) => (
              <div key={item.produkId} className="terlaris-item" id={`terlaris-item-${item.produkId}`}>
                <div className="terlaris-rank">{index + 1}</div>
                <div className="terlaris-info">
                  <div className="terlaris-nama">{item.nama}</div>
                  <div className="terlaris-kategori">{item.kategori}</div>
                </div>
                <div className="terlaris-stats">
                  <div className="terlaris-terjual">{item.terjual} terjual</div>
                  <div className="terlaris-omzet">{formatRupiah(item.omzet)}</div>
                </div>
              </div>
            ))}
            {PRODUK_TERLARIS.length === 0 && (
              <p className="dashboard-empty">Belum ada penjualan hari ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Baris 3: Stok Menipis + Transaksi Terbaru ── */}
      <div className="content-grid" id="dashboard-bottom-grid" style={{ marginTop: 'var(--space-4)' }}>

        {/* Stok Hampir Habis */}
        <div className="card" id="dashboard-stok-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">⚠️ Stok Perlu Perhatian</h3>
            <Badge variant="warning">{STOK_MENIPIS.length + STOK_HABIS.length} produk</Badge>
          </div>
          <div className="stok-list" id="dashboard-stok-list">
            {STOK_HABIS.map(p => (
              <div key={p.id} className="stok-item" id={`stok-item-habis-${p.id}`}>
                <span className="stok-nama">{p.nama}</span>
                <Badge variant="danger" dot>Habis</Badge>
              </div>
            ))}
            {STOK_MENIPIS.map(p => (
              <div key={p.id} className="stok-item" id={`stok-item-menipis-${p.id}`}>
                <span className="stok-nama">{p.nama}</span>
                <Badge variant="warning" dot>{p.stok} tersisa</Badge>
              </div>
            ))}
            {STOK_MENIPIS.length === 0 && STOK_HABIS.length === 0 && (
              <p className="dashboard-empty">Semua stok aman. ✅</p>
            )}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="card" id="dashboard-transaksi-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">🕐 Transaksi Terbaru</h3>
            <Badge variant="neutral">{TRANSAKSI_HARI_INI.filter(t => t.status === 'selesai').length} selesai</Badge>
          </div>
          <div className="transaksi-list" id="dashboard-transaksi-list">
            {transaksiTerbaru.map(t => (
              <div key={t.id} className="transaksi-item" id={`transaksi-item-${t.id}`}>
                <div className="transaksi-id">{t.id}</div>
                <div className="transaksi-detail">
                  <span className="transaksi-kasir">{t.kasir}</span>
                  <span className="transaksi-waktu">{formatWaktu(t.tanggal)}</span>
                </div>
                <div className="transaksi-total">{formatRupiah(t.total)}</div>
              </div>
            ))}
            {transaksiTerbaru.length === 0 && (
              <p className="dashboard-empty">Belum ada transaksi hari ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Widget Opsional: Rekap Jam Istirahat ── */}
      {settings?.optionalFeatures?.rekapIstirahat && (
        <div className="card" id="dashboard-istirahat-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">⏰ Rekap Jam Istirahat</h3>
            <Badge variant="info">Fitur Opsional</Badge>
          </div>
          <div className="istirahat-grid" id="dashboard-istirahat-grid">
            {[
              { label: 'Istirahat 1 (09:30–10:00)', penjualan: 25000, transaksi: 1 },
              { label: 'Istirahat 2 (12:00–12:30)', penjualan: 0, transaksi: 0 },
            ].map(item => (
              <div key={item.label} className="istirahat-item">
                <div className="istirahat-label">{item.label}</div>
                <div className="istirahat-nilai">{formatRupiah(item.penjualan)}</div>
                <div className="istirahat-trans">{item.transaksi} transaksi</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS lokal Dashboard */}
      <style>{`
        /* Greeting */
        .dashboard-greeting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }
        .dashboard-greeting-badge {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--color-success-bg);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-success);
        }

        /* Card header */
        .dashboard-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .dashboard-card-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        /* Empty state lokal */
        .dashboard-empty {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--space-6) var(--space-4);
        }

        /* ── Grafik Bar ── */
        .grafik-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: var(--space-2);
          height: 160px;
          padding: 0 var(--space-1);
          margin-bottom: var(--space-3);
        }
        .grafik-bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .grafik-bar-label-top {
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .grafik-bar-value {
          font-size: 9px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
          white-space: nowrap;
        }
        .grafik-bar-track {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          padding: 0 2px;
        }
        .grafik-bar {
          width: 100%;
          background: linear-gradient(to top, var(--color-primary), #4ade80);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          min-height: 4px;
          transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
        }
        .grafik-bar-empty {
          background: var(--color-border);
          box-shadow: none;
          min-height: 2px;
        }
        .grafik-bar-label {
          font-size: 9px;
          color: var(--color-text-muted);
          margin-top: var(--space-1);
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
        }
        .grafik-summary {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-border);
        }
        .grafik-summary strong { color: var(--color-text-primary); }

        /* ── Produk Terlaris ── */
        .terlaris-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .terlaris-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-lg);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          transition: background var(--transition-fast);
        }
        .terlaris-item:hover { background: var(--color-primary-subtle); }
        .terlaris-rank {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--color-primary-light);
          color: var(--color-primary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-extrabold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .terlaris-item:first-child .terlaris-rank {
          background: #fef3c7;
          color: #d97706;
        }
        .terlaris-item:nth-child(2) .terlaris-rank {
          background: #f3f4f6;
          color: #6b7280;
        }
        .terlaris-item:nth-child(3) .terlaris-rank {
          background: #fde8d8;
          color: #c2610c;
        }
        .terlaris-info { flex: 1; min-width: 0; }
        .terlaris-nama {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .terlaris-kategori {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .terlaris-stats { text-align: right; flex-shrink: 0; }
        .terlaris-terjual {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .terlaris-omzet {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        /* ── Stok List ── */
        .stok-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .stok-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-lg);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          gap: var(--space-2);
        }
        .stok-nama {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Transaksi List ── */
        .transaksi-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .transaksi-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-lg);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          transition: background var(--transition-fast);
        }
        .transaksi-item:hover { background: var(--color-primary-subtle); }
        .transaksi-id {
          font-size: 10px;
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          font-family: monospace;
          flex-shrink: 0;
          background: var(--color-primary-light);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
        .transaksi-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .transaksi-kasir {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .transaksi-waktu {
          font-size: 10px;
          color: var(--color-text-muted);
        }
        .transaksi-total {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          flex-shrink: 0;
        }

        /* ── Istirahat Widget ── */
        .istirahat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }
        .istirahat-item {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }
        .istirahat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
          font-weight: var(--font-weight-medium);
        }
        .istirahat-nilai {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          font-family: 'Plus Jakarta Sans', var(--font-family);
        }
        .istirahat-trans {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .grafik-bar-value { display: none; }
          .grafik-container { height: 120px; }
        }
      `}</style>
    </div>
  )
}
