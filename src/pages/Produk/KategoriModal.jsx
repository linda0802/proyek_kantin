import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

/**
 * KategoriModal — Manajemen kategori produk
 */
export default function KategoriModal({ isOpen, onClose, kategoriList, onTambah, onEdit, onHapus }) {
  const { addToast } = useToast()
  const [namaBar, setNamaBar] = useState('')
  const [editId, setEditId] = useState(null)
  const [editNama, setEditNama] = useState('')
  const [hapusId, setHapusId] = useState(null)
  const [errBaru, setErrBaru] = useState('')
  const [errEdit, setErrEdit] = useState('')

  const handleTambah = () => {
    const trimmed = namaBar.trim()
    if (!trimmed) { setErrBaru('Nama kategori tidak boleh kosong.'); return }
    if (trimmed.length < 2) { setErrBaru('Minimal 2 karakter.'); return }
    const duplikat = kategoriList.some(k => k.nama.toLowerCase() === trimmed.toLowerCase())
    if (duplikat) { setErrBaru('Kategori sudah ada.'); return }
    onTambah(trimmed)
    setNamaBar('')
    setErrBaru('')
    addToast({ type: 'success', title: 'Kategori ditambahkan', message: trimmed })
  }

  const handleStartEdit = (k) => {
    setEditId(k.id)
    setEditNama(k.nama)
    setErrEdit('')
  }

  const handleSaveEdit = () => {
    const trimmed = editNama.trim()
    if (!trimmed) { setErrEdit('Nama tidak boleh kosong.'); return }
    onEdit(editId, trimmed)
    setEditId(null)
    addToast({ type: 'success', title: 'Kategori diperbarui' })
  }

  const handleHapus = () => {
    const result = onHapus(hapusId)
    setHapusId(null)
    if (result?.error) {
      addToast({ type: 'error', title: 'Tidak dapat dihapus', message: result.error })
    } else {
      addToast({ type: 'success', title: 'Kategori dihapus' })
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="🏷️ Kelola Kategori"
        size="sm"
        id="kategori-modal"
        footer={
          <Button variant="secondary" id="kategori-modal-close-btn" onClick={onClose}>Tutup</Button>
        }
      >
        {/* Tambah kategori baru */}
        <div className="kategori-form" id="kategori-add-form">
          <Input
            label="Kategori Baru"
            id="kategori-input-baru"
            placeholder="Nama kategori..."
            value={namaBar}
            onChange={e => { setNamaBar(e.target.value); setErrBaru('') }}
            error={errBaru}
            onKeyDown={e => e.key === 'Enter' && handleTambah()}
          />
          <Button
            variant="primary"
            id="kategori-tambah-btn"
            onClick={handleTambah}
            style={{ marginTop: 'var(--space-2)', alignSelf: 'flex-start' }}
          >
            + Tambah
          </Button>
        </div>

        <hr className="divider" />

        {/* Daftar kategori */}
        <div className="kategori-list" id="kategori-list" role="list">
          {kategoriList.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Belum ada kategori.
            </p>
          )}
          {kategoriList.map(k => (
            <div key={k.id} className="kategori-item" id={`kategori-item-${k.id}`} role="listitem">
              {editId === k.id ? (
                <div className="kategori-edit-row">
                  <input
                    className="form-input"
                    id={`kategori-edit-input-${k.id}`}
                    value={editNama}
                    onChange={e => { setEditNama(e.target.value); setErrEdit('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <Button variant="primary" size="sm" id={`kategori-save-${k.id}`} onClick={handleSaveEdit}>✓</Button>
                  <Button variant="ghost" size="sm" id={`kategori-cancel-${k.id}`} onClick={() => setEditId(null)}>✕</Button>
                </div>
              ) : (
                <div className="kategori-view-row">
                  <span className="kategori-nama">{k.nama}</span>
                  <div className="kategori-actions">
                    <Button variant="ghost" size="sm" id={`kategori-edit-${k.id}`} onClick={() => handleStartEdit(k)} aria-label={`Edit ${k.nama}`}>✏️</Button>
                    <Button variant="ghost" size="sm" id={`kategori-hapus-${k.id}`} onClick={() => setHapusId(k.id)} aria-label={`Hapus ${k.nama}`} style={{ color: 'var(--color-danger)' }}>🗑️</Button>
                  </div>
                </div>
              )}
              {editId === k.id && errEdit && (
                <p className="form-error" role="alert">{errEdit}</p>
              )}
            </div>
          ))}
        </div>

        <style>{`
          .kategori-form { display: flex; flex-direction: column; gap: var(--space-2); }
          .kategori-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
          .kategori-item { display: flex; flex-direction: column; gap: var(--space-1); }
          .kategori-view-row, .kategori-edit-row {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-2) var(--space-3);
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
          }
          .kategori-nama {
            flex: 1;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--color-text-primary);
          }
          .kategori-actions { display: flex; gap: 4px; }
        `}</style>
      </Modal>

      <ConfirmDialog
        isOpen={!!hapusId}
        onClose={() => setHapusId(null)}
        onConfirm={handleHapus}
        title="Hapus Kategori"
        message="Kategori ini akan dihapus. Kategori tidak dapat dihapus jika masih memiliki produk."
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
      />
    </>
  )
}
