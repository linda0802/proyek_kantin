import { useRef } from 'react'
import Button from '../../components/ui/Button'
import { formatRupiah } from '../../utils/currency'
import { formatTanggalWaktu } from '../../utils/date'

/**
 * ReceiptModal — Modal struk transaksi
 * Ditampilkan setelah transaksi berhasil.
 */
export default function ReceiptModal({ transaksi, onClose, onTransaksiBaru }) {
  const receiptRef = useRef(null)

  if (!transaksi) return null

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank', 'width=320,height=600')
    win.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Struk — ${transaksi.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 12px; }
          .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; }
          .receipt-center { text-align: center; }
          .receipt-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .receipt-brand { font-size: 18px; font-weight: bold; }
          .receipt-total { font-size: 14px; font-weight: bold; }
          .receipt-item-name { flex: 1; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.print()
    win.close()
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      id="receipt-modal"
    >
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="receipt-title">✅ Transaksi Berhasil</h2>
          <button
            className="btn btn-ghost btn-icon"
            id="receipt-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >✕</button>
        </div>

        {/* Receipt Body */}
        <div className="modal-body" style={{ padding: 'var(--space-4)' }}>
          {/* Struk yang akan diprint */}
          <div ref={receiptRef} className="receipt" id="receipt-content">
            <div className="receipt-center receipt-brand">KantinKu</div>
            <div className="receipt-center" style={{ fontSize: '11px', marginTop: '4px' }}>
              Sistem Informasi Kantin
            </div>
            <div className="receipt-divider" />
            <div className="receipt-row">
              <span>No:</span>
              <span style={{ fontWeight: 'bold' }}>{transaksi.id}</span>
            </div>
            <div className="receipt-row">
              <span>Tanggal:</span>
              <span>{formatTanggalWaktu(transaksi.tanggal)}</span>
            </div>
            <div className="receipt-row">
              <span>Kasir:</span>
              <span>{transaksi.kasir}</span>
            </div>
            <div className="receipt-divider" />

            {/* Items */}
            {transaksi.items.map((item, i) => (
              <div key={i}>
                <div style={{ fontWeight: '600' }}>{item.nama}</div>
                <div className="receipt-row">
                  <span className="receipt-item-name">
                    {item.jumlah} × Rp {item.hargaJual.toLocaleString('id-ID')}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="receipt-divider" />
            <div className="receipt-row receipt-total">
              <span>TOTAL</span>
              <span>{formatRupiah(transaksi.total)}</span>
            </div>
            <div className="receipt-row">
              <span>Pembayaran</span>
              <span style={{ textTransform: 'capitalize', fontWeight: transaksi.metodePembayaran === 'kasbon' ? 'bold' : 'normal', color: transaksi.metodePembayaran === 'kasbon' ? '#b45309' : 'inherit' }}>
                {transaksi.metodePembayaran === 'kasbon' ? 'Kasbon / Hutang' : transaksi.metodePembayaran}
              </span>
            </div>
            {transaksi.metodePembayaran === 'kasbon' && transaksi.pelanggan && (
              <div className="receipt-row">
                <span>Pelanggan</span>
                <span style={{ fontWeight: 'bold' }}>{transaksi.pelanggan}</span>
              </div>
            )}
            {transaksi.metodePembayaran === 'tunai' && (
              <>
                <div className="receipt-row">
                  <span>Diterima</span>
                  <span>{formatRupiah(transaksi.uangDiterima)}</span>
                </div>
                <div className="receipt-row">
                  <span>Kembalian</span>
                  <span style={{ fontWeight: 'bold' }}>{formatRupiah(transaksi.kembalian)}</span>
                </div>
              </>
            )}
            <div className="receipt-divider" />
            <div className="receipt-center" style={{ fontSize: '11px' }}>
              {transaksi.metodePembayaran === 'kasbon' ? (
                <>
                  BUKTI TRANSAKSI KASBON<br />
                  Harap segera melakukan pelunasan di kantin.
                </>
              ) : (
                <>
                  Terima kasih sudah berbelanja!<br />
                  Simpan struk ini sebagai bukti pembayaran.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button
            variant="secondary"
            id="receipt-print-btn"
            onClick={handlePrint}
          >
            🖨️ Cetak Struk
          </Button>
          <Button
            variant="primary"
            id="receipt-transaksi-baru-btn"
            onClick={onTransaksiBaru}
          >
            ✨ Transaksi Baru
          </Button>
        </div>
      </div>

      <style>{`
        .receipt {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          background: #fff;
          border: 1px dashed var(--color-border-input);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          line-height: 1.6;
        }
        .receipt-divider {
          border-top: 1px dashed #ccc;
          margin: var(--space-2) 0;
        }
        .receipt-center { text-align: center; }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          gap: var(--space-2);
          margin: 2px 0;
        }
        .receipt-brand {
          font-size: 18px;
          font-weight: bold;
          color: var(--color-primary);
        }
        .receipt-total {
          font-size: 14px;
          font-weight: bold;
          color: var(--color-text-primary);
        }
        .receipt-item-name { flex: 1; }
      `}</style>
    </div>
  )
}
