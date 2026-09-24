'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import type { Product, Currency } from '@/lib/types'
import { formatPrice } from '@/lib/store'
import { LayoutGrid, List, Search, Plus, Download, RefreshCw, Trash2, Pencil, AlertTriangle } from 'lucide-react'

interface Props {
  products: Product[]
  onSave: (product: Omit<Product, 'id'>, id?: number) => void
  onDelete: (id: number) => void
  onReset: () => void
  onClearAll: () => void
  onExport: () => void
  currency: Currency
  usdRate: number
  canEdit: boolean
}

const CATEGORY_MAP: Record<string, string> = {
  cartouches: 'Cartouches & encres',
  papier: 'Papier & supports',
  stockage: 'Stockage & mémoire',
  cables: 'Câbles & accessoires',
  accessoires: 'Accessoires',
  impression: 'Impression & maintenance',
  divers: 'Divers',
}

const EMPTY_FORM = {
  name: '',
  price: '',
  stock: '10',
  alert_threshold: '5',
  category: 'cartouches',
  barcode: '',
  image: '',
}

// Fallback image per category
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  cartouches: 'https://placehold.co/80x80?text=Cartouche',
  papier: 'https://placehold.co/80x80?text=Papier',
  stockage: 'https://placehold.co/80x80?text=Stockage',
  cables: 'https://placehold.co/80x80?text=Cable',
  accessoires: 'https://placehold.co/80x80?text=Accessoire',
  impression: 'https://placehold.co/80x80?text=Impression',
  divers: 'https://placehold.co/80x80?text=Produit',
}

function ProductImage({ product, size = 40 }: { product: Product; size?: number }) {
  const placeholder = CATEGORY_PLACEHOLDERS[product.category] ?? 'https://placehold.co/80x80?text=Produit'
  if (!product.image) {
    return (
      <img
        src={placeholder}
        alt={product.name}
        width={size}
        height={size}
        className="rounded-lg object-cover flex-shrink-0 bg-gray-100"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <img
      src={product.image}
      alt={product.name}
      width={size}
      height={size}
      className="rounded-lg object-cover flex-shrink-0 bg-gray-100"
      style={{ width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholder }}
    />
  )
}

export default function ProductsPage({
  products,
  onSave,
  onDelete,
  onReset,
  onClearAll,
  onExport,
  currency,
  usdRate,
  canEdit,
}: Props) {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const fmt = (n: number) => formatPrice(n, currency, usdRate)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search)) ||
      p.id.toString().includes(search)
  )

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      price: p.price.toString(),
      stock: p.stock.toString(),
      alert_threshold: p.alert_threshold.toString(),
      category: p.category,
      barcode: p.barcode || '',
      image: p.image || '',
    })
    setEditingId(p.id)
    setFormError('')
    setShowModal(true)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) setForm((f) => ({ ...f, image: ev.target!.result as string }))
    }
    reader.readAsDataURL(file)
  }

  function stopScanner() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  async function scanLoop() {
    if (!detectorRef.current || !videoRef.current || !isScanning) return
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current)
      if (barcodes.length) {
        const code = barcodes[0].rawValue
        setForm((f) => ({ ...f, barcode: code }))
        stopScanner()
        return
      }
    } catch (err) {
      console.debug('Barcode scan error:', err)
    }
    window.setTimeout(scanLoop, 700)
  }

  async function startScanner() {
    if (typeof window === 'undefined') return
    if (!('BarcodeDetector' in window)) {
      setScanError('Scanner non supporté par votre navigateur.')
      return
    }

    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      })
      detectorRef.current = detector
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanError('')
      setIsScanning(true)
      scanLoop()
    } catch (err) {
      console.error(err)
      setScanError('Impossible d’utiliser la caméra pour le scanner.')
    }
  }

  useEffect(() => {
    return () => stopScanner()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      setFormError('Nom et prix sont requis.')
      return
    }
    onSave(
      {
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        alert_threshold: parseInt(form.alert_threshold) || 5,
        category: form.category,
        category_name: CATEGORY_MAP[form.category] || form.category,
        barcode: form.barcode || undefined,
        image: form.image || undefined,
      },
      editingId ?? undefined
    )
    setShowModal(false)
  }

  const lowCount = products.filter((p) => p.stock <= p.alert_threshold).length

  return (
    <div className="text-black dark:text-white">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white">Gestion des produits</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600">
            Retour au tableau de bord
          </Link>
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-[#2b344d]">
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={viewMode === 'list' ? { background: '#1f2937', color: 'white' } : { background: 'white', color: '#6b7280' }}
              title="Vue liste"
            >
              <List size={15} /> Liste
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={viewMode === 'grid' ? { background: '#1f2937', color: 'white' } : { background: 'white', color: '#6b7280' }}
              title="Vue grille"
            >
              <LayoutGrid size={15} /> Grille
            </button>
          </div>

          {canEdit && (
            <>
              <ActionBtn color="#22c55e" onClick={openAdd} label="Nouveau" Icon={Plus} />
              <ActionBtn color="#3b82f6" onClick={onExport} label="Exporter" Icon={Download} />
              <ActionBtn color="#8b5cf6" onClick={onReset} label="Défaut" Icon={RefreshCw} />
              <ActionBtn
                color="#ef4444"
                onClick={() => confirm('Supprimer TOUS les produits ?') && onClearAll()}
                label="Tout effacer"
                Icon={Trash2}
              />
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, code-barres ou ID..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
          aria-label="Rechercher un produit"
        />
      </div>

      {/* ── LIST VIEW ────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2b344d] shadow-sm">
          <div className="overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  {['', 'ID', 'Nom', 'Prix', 'Stock', 'Catégorie', 'Seuil', 'Code', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0f1117] divide-y divide-gray-100 dark:divide-[#2b344d]">
                {filtered.map((p) => {
                  const isLow = p.stock <= p.alert_threshold
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#1e2436] transition-colors">
                      <td className="pl-3 py-2">
                        <ProductImage product={p} size={40} />
                      </td>
                      <td className="px-3 py-2 text-gray-400 dark:text-[#8b949e] font-mono text-xs">{p.id}</td>
                      <td className="px-3 py-2 font-semibold text-gray-800 dark:text-white">{p.name}</td>
                      <td className="px-3 py-2 font-semibold text-blue-500 dark:text-blue-400">{fmt(p.price)}</td>
                      <td className={`px-3 py-2 font-semibold ${isLow ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        <span className="flex items-center gap-1">
                          {p.stock}
                          {isLow && <AlertTriangle size={13} className="text-amber-500" />}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.category_name || p.category}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-500">{p.alert_threshold}</td>
                      <td className="px-3 py-2 text-gray-400 dark:text-[#8b949e] font-mono text-xs">{p.barcode || '—'}</td>
                      <td className="px-3 py-2">
                        {canEdit ? (
                          <div className="flex gap-1.5">
                            <IconBtn bg="#3b82f6" onClick={() => openEdit(p)} label="Modifier">
                              <Pencil size={13} />
                            </IconBtn>
                            <IconBtn bg="#ef4444" onClick={() => confirm('Supprimer ce produit ?') && onDelete(p.id)} label="Supprimer">
                              <Trash2 size={13} />
                            </IconBtn>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">lecture seule</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-400 dark:text-gray-500">Aucun produit trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRID VIEW ────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="max-h-[calc(100vh-230px)] overflow-y-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {filtered.map((p) => {
              const isLow = p.stock <= p.alert_threshold
              const isOut = p.stock <= 0
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#0f1117] rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderColor: isOut ? '#fecaca' : isLow ? '#fde68a' : '#e5e7eb' }}
                >
                  {/* Product image */}
                  <div className="w-full h-36 bg-gray-50 dark:bg-[#1e2436] flex items-center justify-center overflow-hidden">
                    <ProductImage product={p} size={120} />
                  </div>

                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 dark:text-[#6b7280] uppercase tracking-wide mb-0.5">{p.category_name || p.category}</p>
                    <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight mb-2 line-clamp-2">{p.name}</p>
                    <p className="font-extrabold text-blue-500 dark:text-blue-400 text-base mb-1">{fmt(p.price)}</p>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium flex items-center gap-1 ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isLow && <AlertTriangle size={11} />}
                        Stock: {p.stock}
                      </span>
                      {p.barcode && (
                        <span className="text-[10px] text-gray-300 dark:text-[#6b7280] font-mono">{p.barcode}</span>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex gap-1.5 mt-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:brightness-110 transition-all flex items-center justify-center gap-1"
                          style={{ background: '#3b82f6' }}
                        >
                          <Pencil size={11} /> Modifier
                        </button>
                        <button
                          onClick={() => confirm('Supprimer ce produit ?') && onDelete(p.id)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:brightness-110 transition-all flex items-center justify-center gap-1"
                          style={{ background: '#ef4444' }}
                        >
                          <Trash2 size={11} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500">Aucun produit trouvé</div>
            )}
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400 items-center">
        <span>Total produits: <strong>{products.length}</strong></span>
        {lowCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}>
            <AlertTriangle size={12} />
            {lowCount} produit{lowCount > 1 ? 's' : ''} en stock faible
          </span>
        )}
        <span>Résultats: <strong>{filtered.length}</strong></span>
      </div>

      {/* ── Modal ajouter / modifier ─────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl rounded-[20px] p-3 w-full max-w-[420px] shadow-[0_18px_60px_rgba(15,23,42,0.22)] border border-slate-200/80 dark:border-[#2b344d] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-[#2b344d]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-sky-600 font-bold">Produit</p>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1e2436] hover:bg-slate-200 dark:hover:bg-[#2a3448] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Photo */}
              <div className="mb-4 rounded-2xl border border-slate-200 dark:border-[#2b344d] bg-slate-50 dark:bg-[#121a2b] p-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2">Photo du produit</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-[#2b344d] overflow-hidden flex items-center justify-center bg-white dark:bg-[#1e2436] cursor-pointer hover:border-sky-400 transition-colors shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    aria-label="Choisir une image"
                  >
                    {form.image ? (
                      <img src={form.image} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-3xl select-none">+</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#2b344d] text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                    >
                      Choisir une image
                    </button>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        className="mt-1.5 text-[11px] text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Supprimer l&apos;image
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel>Nom du produit *</FieldLabel>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={INPUT}
                    placeholder="ex: Cartouche d'encre noir 67A"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Prix (FC) *</FieldLabel>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={INPUT}
                    placeholder="15000"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Stock initial</FieldLabel>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className={INPUT}
                    min="0"
                  />
                </div>
                <div>
                  <FieldLabel>Seuil d&apos;alerte</FieldLabel>
                  <input
                    type="number"
                    value={form.alert_threshold}
                    onChange={(e) => setForm({ ...form, alert_threshold: e.target.value })}
                    className={INPUT}
                    min="1"
                  />
                </div>
                <div>
                  <FieldLabel>Catégorie</FieldLabel>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={INPUT}
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <FieldLabel>Code-barres</FieldLabel>
                  <div className="flex flex-col gap-3">
                    <input
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      className={INPUT}
                      placeholder="Scanner ou saisir"
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                      <button
                        type="button"
                        onClick={isScanning ? stopScanner : startScanner}
                        className="px-4 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                        style={{ background: isScanning ? '#ef4444' : '#3b82f6' }}
                      >
                        {isScanning ? 'Arrêter le scanner' : 'Scanner le code-barres'}
                      </button>
                      {scanError && <span className="text-sm text-red-500">{scanError}</span>}
                    </div>
                    {isScanning && (
                      <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-900">
                        <video ref={videoRef} className="w-full h-48 bg-black object-cover" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 p-2">Maintenez le code-barres devant la caméra.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formError && <p className="text-red-500 dark:text-red-400 text-xs mt-2">{formError}</p>}

              <div className="flex gap-2.5 mt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-white hover:brightness-110 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1d2438] transition-all border border-slate-200 dark:border-[#2b344d]"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] text-black dark:text-white'
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{children}</label>
}

function ActionBtn({
  color,
  onClick,
  label,
  Icon,
}: {
  color: string
  onClick: () => void
  label: string
  Icon: React.ElementType
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-white text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-1.5"
      style={{ background: color }}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

function IconBtn({
  bg,
  onClick,
  label,
  children,
}: {
  bg: string
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:brightness-110 transition-all"
      style={{ background: bg }}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  )
}
