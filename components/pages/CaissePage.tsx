'use client'

import { useState, useCallback } from 'react'
import type { Product, CartItem, Currency } from '@/lib/types'
import { formatPrice } from '@/lib/store'

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  parfums: 'https://placehold.co/60x60?text=Parfum',
  laits: 'https://placehold.co/60x60?text=Lait',
  rouges: 'https://placehold.co/60x60?text=Rouge',
  maquillage: 'https://placehold.co/60x60?text=Makeup',
  soins: 'https://placehold.co/60x60?text=Soin',
  cheveux: 'https://placehold.co/60x60?text=Cheveux',
  divers: 'https://placehold.co/60x60?text=Produit',
}

function ProductThumb({ product }: { product: Product }) {
  const placeholder = CATEGORY_PLACEHOLDERS[product.category] ?? 'https://placehold.co/80x80?text=Produit'
  return (
    <img
      src={product.image || placeholder}
      alt={product.name}
      width={80}
      height={80}
      className="rounded-lg object-cover w-full h-24 bg-gray-100"
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholder }}
    />
  )
}

interface Props {
  products: Product[]
  cart: CartItem[]
  onAddToCart: (productId: number) => void
  onUpdateQuantity: (index: number, delta: number) => void
  onRemoveFromCart: (index: number) => void
  onCheckout: () => void
  onOpenInvoice: () => void
  currency: Currency
  usdRate: number
}

const CATEGORIES = ['Tous', 'Parfums', 'Laits & Crèmes', 'Rouges à Lèvres', 'Maquillage', 'Soins', 'Cheveux', 'Divers']

export default function CaissePage({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  onOpenInvoice,
  currency,
  usdRate,
}: Props) {
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [barcode, setBarcode] = useState('')
  const [search, setSearch] = useState('')
  const fmt = (n: number) => formatPrice(n, currency, usdRate)

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'Tous' || (p.category_name || p.category) === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode === search
    return matchCat && matchSearch
  })

  const cartTotal = cart.reduce((s, i) => s + i.total, 0)
  const cartQty = cart.reduce((s, i) => s + i.quantity, 0)

  const handleScan = useCallback(() => {
    if (!barcode.trim()) return
    const prod = products.find(
      (p) => p.barcode === barcode.trim() || p.id.toString() === barcode.trim()
    )
    if (prod) {
      onAddToCart(prod.id)
      setBarcode('')
    }
  }, [barcode, products, onAddToCart])

  return (
    <div className="grid gap-4 text-black dark:text-white" style={{ gridTemplateColumns: '1.8fr 0.8fr', height: 'calc(100vh - 140px)' }}>
      {/* Products panel */}
      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm flex flex-col overflow-hidden">
        {/* Scanner */}
        <div className="rounded-xl p-3 mb-4 border-2 border-dashed border-blue-200 bg-blue-50 dark:bg-[#071126] dark:border-blue-900 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Scanner code-barres ou ID produit..."
              className="flex-1 px-3 py-4 rounded-lg border border-blue-200 text-sm bg-white dark:bg-[#1e2436] dark:border-blue-900 dark:text-white focus:outline-none focus:border-blue-400"
              aria-label="Code-barres"
            />
            <button
              onClick={handleScan}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: '#3b82f6' }}
            >
              Scanner
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2b344d] text-sm mb-3 focus:outline-none focus:border-yellow-400 bg-white dark:bg-[#1e2436] text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 flex-shrink-0"
          aria-label="Rechercher un produit"
        />

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-[#ffd700] text-[#1a1a1a] border-[#ffd700]'
                  : 'bg-white dark:bg-[#1e2436] text-[#666] dark:text-gray-300 border-[#e5e7eb] dark:border-[#2b344d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {filtered.map((p) => {
              const isOut = p.stock <= 0
              const isLow = !isOut && p.stock <= p.alert_threshold
              return (
                <button
                  key={p.id}
                  onClick={() => !isOut && onAddToCart(p.id)}
                  disabled={isOut}
                  className={`text-left rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0f1117] overflow-hidden ${
                    isOut
                      ? 'border-red-200 dark:border-red-600'
                      : isLow
                      ? 'border-amber-200 dark:border-amber-700'
                      : 'border-gray-200 dark:border-[#2b344d]'
                  }`}
                >
                  {/* Image */}
                  <div className="w-full bg-gray-50 dark:bg-[#1e2436] overflow-hidden">
                    <ProductThumb product={p} />
                  </div>
                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-400 mb-0.5 uppercase tracking-wide truncate">{p.category_name || p.category}</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-xs leading-tight mb-1.5 line-clamp-2">{p.name}</p>
                    <p className="font-extrabold text-sm text-blue-500 dark:text-blue-400">{fmt(p.price)}</p>
                    <p className={`text-[10px] mt-1 ${isLow ? 'text-amber-500 font-medium' : isOut ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-400'}`}>
                      Stock: {p.stock}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Aucun produit trouvé</p>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🛒 Panier
          </h3>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold text-white"
            style={{ background: '#3b82f6' }}
          >
            {cartQty}
          </span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Panier vide</div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-[#0f1117] border border-gray-100 dark:border-[#2b344d]">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400">{fmt(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onUpdateQuantity(idx, -1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border transition-all hover:bg-red-500 hover:text-white hover:border-red-500"
                    style={{ borderColor: '#e5e7eb' }}
                    aria-label="Diminuer la quantité"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-700">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(idx, 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border transition-all hover:bg-green-500 hover:text-white hover:border-green-500"
                    style={{ borderColor: '#e5e7eb' }}
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveFromCart(idx)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ml-1 hover:brightness-110"
                    style={{ background: '#ef4444' }}
                    aria-label="Supprimer l'article"
                  >
                    🗑
                  </button>
                </div>
                <p className="font-bold text-sm text-gray-800 dark:text-white min-w-[60px] text-right">{fmt(item.total)}</p>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="rounded-xl p-3 mb-3 flex-shrink-0 bg-gray-50 dark:bg-[#081226] border border-gray-200 dark:border-[#2b344d]">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Sous-total</span>
            <span>{fmt(cartTotal)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base border-t border-gray-200 dark:border-[#2b344d] pt-2 text-blue-600 dark:text-blue-400">
            <span>TOTAL</span>
            <span>{fmt(cartTotal)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)' }}
          >
            ✓ VALIDER
          </button>
          <button
            onClick={onOpenInvoice}
            disabled={cart.length === 0}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 disabled:opacity-40"
            style={{ background: '#3b82f6' }}
          >
            📑 FACTURER
          </button>
        </div>
      </div>
    </div>
  )
}
