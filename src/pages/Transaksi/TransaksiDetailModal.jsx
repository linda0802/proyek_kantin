import { useRef } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatRupiah } from '../../utils/currency'
import { formatTanggalWaktu } from '../../utils/date'

export default function TransaksiDetailModal({
  isOpen,
  onClose,
  transaksi,
  onOpenBatal,
}) {
  const receiptRef = useRef(null)

  if (!transaksi) return null

  const isBatal = transaksi.status === 'batal'
  const isTunai = transaksi.metodePembayaran === 'tunai'
  const totalItemCount = transaksi.items?.reduce((sum, item) => sum + (item.jumlah || 1), 0) || 0

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML
    if (!printContent) return

    const win = window.open('', '_blank', 'width=360,height=620')
    if (!win) {
      window.print()
      return
    }

    win.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Struk — ${transaksi.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 16px; color: #111; line-height: 1.5; }
          .receipt-divider { border-top: 1px dashed #777; margin: 8px 0; }
          .receipt-center { text-align: center; }
          .receipt-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .receipt-brand { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .receipt-total { font-size: 14px; font-weight: bold; }
          .receipt-canceled { font-weight: bold; color: #dc2626; text-align: center; margin: 6px 0; font-size: 13px; }
          .receipt-item-title { font-weight: bold; margin-top: 4px; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
      win.close()
    }, 250)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🧾 Struk Transaksi: ${transaksi.id}`}
      size="md"
      id="modal-transaksi-detail"
      footer={
        <div className="transaksi-detail-footer">
          <div>
            {!isBatal && (
              <Button
                variant="ghost"
                className="btn-batal-transaksi"
                onClick={() => {
                  onClose()
                  onOpenBatal(transaksi)
                }}
                id="btn-open-batal-modal"
              >
                ⚠️ Batalkan Transaksi
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={onClose} id="btn-close-detail">
              Tutup
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              id="btn-print-struk-detail"
            >
              🖨️ Cetak Struk
            </Button>
          </div>
        </div>
      }
    >
      <div className="transaksi-detail-body">
        {/* Banner Pembatalan Jika Transaksi Batal */}
        {isBatal && (
          <div className="batal-alert-banner">
            <div className="batal-alert-icon">⚠️</div>
            <div>
              <div className="batal-alert-title">Transaksi Ini Telah Dibatalkan</div>
              <div className="batal-alert-desc">
                Alasan: <strong>{transaksi.alasanBatal || 'Tanpa keterangan'}</strong>
                {transaksi.dibatalkanPada && (
                  <span> • Waktu: {formatTanggalWaktu(transaksi.dibatalkanPada)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tampilan Fisik Struk Belanja Kasir */}
        <div className="struk-paper-wrapper">
          <div ref={receiptRef} className="receipt" id="receipt-content">
            <div className="receipt-center receipt-brand">KantinKu SMAN 8</div>
            <div className="receipt-center" style={{ fontSize: '11px', color: '#555' }}>
              Kantin Sehat, Bergizi & Higienis
            </div>
            <div className="receipt-center" style={{ fontSize: '11px', color: '#777' }}>
              Telp: 0812-3456-7890
            </div>

            <div className="receipt-divider" />

            <div className="receipt-row">
              <span>No. Transaksi:</span>
              <strong style={{ fontFamily: 'monospace' }}>{transaksi.id}</strong>
            </div>
            <div className="receipt-row">
              <span>Waktu:</span>
              <span>{formatTanggalWaktu(transaksi.tanggal)}</span>
            </div>
            <div className="receipt-row">
              <span>Kasir:</span>
              <span>{transaksi.kasir || 'Kasir'}</span>
            </div>
            <div className="receipt-row">
              <span>Status:</span>
              <span>
                {isBatal ? (
                  <strong style={{ color: '#dc2626' }}>DIBATALKAN</strong>
                ) : (
                  <strong style={{ color: '#059669' }}>LUNAS / BERHASIL</strong>
                )}
              </span>
            </div>

            {isBatal && (
              <div className="receipt-canceled">
                *** TRANSAKSI DIBATALKAN ***
              </div>
            )}

            <div className="receipt-divider" />

            {/* Daftar Produk */}
            <div className="receipt-items-list">
              {transaksi.items?.map((item, idx) => {
                const sub = item.subtotal || item.hargaJual * item.jumlah
                return (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <div className="receipt-item-title">{item.nama}</div>
                    <div className="receipt-row">
                      <span style={{ color: '#555' }}>
                        {item.jumlah} × Rp {item.hargaJual?.toLocaleString('id-ID')}
                      </span>
                      <span style={{ fontWeight: '600' }}>{formatRupiah(sub)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="receipt-divider" />

            {/* Total Pembayaran */}
            <div className="receipt-row" style={{ color: '#555' }}>
              <span>Total Qty:</span>
              <span>{totalItemCount} item</span>
            </div>
            <div className="receipt-row receipt-total">
              <span>TOTAL BELANJA</span>
              <span>{formatRupiah(transaksi.total)}</span>
            </div>

            <div className="receipt-row" style={{ marginTop: '4px' }}>
              <span>Metode Pembayaran:</span>
              <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                {isTunai ? '💵 Uang Tunai' : '📱 Non-Tunai (QRIS)'}
              </span>
            </div>

            {isTunai && (
              <>
                <div className="receipt-row">
                  <span>Uang Diterima:</span>
                  <span>{formatRupiah(transaksi.uangDiterima || transaksi.total)}</span>
                </div>
                <div className="receipt-row">
                  <span>Kembalian:</span>
                  <span style={{ fontWeight: 'bold' }}>{formatRupiah(transaksi.kembalian || 0)}</span>
                </div>
              </>
            )}

            <div className="receipt-divider" />

            <div className="receipt-center" style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Makanan sehat, belajar semangat.</p>
              <p style={{ marginTop: '4px', fontSize: '10px', color: '#888' }}>
                Simpan struk ini sebagai bukti transaksi resmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .transaksi-detail-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .transaksi-detail-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .btn-batal-transaksi {
          color: var(--color-danger) !important;
        }
        .btn-batal-transaksi:hover {
          background: #fee2e2 !important;
        }

        .batal-alert-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
        }
        .batal-alert-icon { font-size: 1.5rem; }
        .batal-alert-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); }
        .batal-alert-desc { font-size: var(--font-size-xs); color: #b91c1c; margin-top: 2px; }

        /* Struk Paper Preview */
        .struk-paper-wrapper {
          display: flex;
          justify-content: center;
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }
        .receipt {
          width: 100%;
          max-width: 360px;
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: var(--radius-md);
          padding: var(--space-5);
          font-family: 'Courier New', Courier, monospace;
          font-size: 12.5px;
          line-height: 1.5;
          color: #0f172a;
          box-shadow: var(--shadow-sm);
        }
        .receipt-center { text-align: center; }
        .receipt-brand {
          font-size: 16px;
          font-weight: bold;
          color: var(--color-primary);
        }
        .receipt-divider {
          border-top: 1px dashed #cbd5e1;
          margin: var(--space-3) 0;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-2);
          margin: 3px 0;
        }
        .receipt-item-title {
          font-weight: 600;
          color: #0f172a;
        }
        .receipt-total {
          font-size: 14px;
          font-weight: bold;
          color: var(--color-text-primary);
          padding: 2px 0;
        }
        .receipt-canceled {
          font-weight: bold;
          color: #dc2626;
          text-align: center;
          margin: var(--space-2) 0;
          font-size: 12px;
          letter-spacing: 0.05em;
        }
      `}</style>
    </Modal>
  )
}
