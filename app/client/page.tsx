'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ClientOrder, ClientServiceRequest } from '@/lib/types'
import {
  loadProductsFromLS,
  loadClientOrdersFromLS,
  saveClientOrdersToLS,
  loadServiceRequestsFromLS,
  saveServiceRequestsToLS,
} from '@/lib/store'

const DEFAULT_MACHINES = [
  { id: 1, name: 'Imprimante UV / DTG', type: 'impression', description: 'Impression directe sur textile et objets.', price: 'À partir de 35 000 FC' },
  { id: 2, name: 'Machine à découpe', type: 'maintenance', description: 'Découpe et finition sur supports variés.', price: 'À partir de 50 000 FC' },
  { id: 3, name: 'Sublimation textile', type: 'impression', description: 'Design sur t-shirt, mugs et sacs.', price: 'À partir de 40 000 FC' },
  { id: 4, name: 'Maintenance imprimante', type: 'maintenance', description: 'Entretien, calibration et nettoyage.', price: 'À partir de 25 000 FC' },
]

const SHIRT_BRANDS = ['Gildan', 'Next Level', 'Anvil', 'Bella+Canvas', 'Hanes']
const SHIRT_COLORS = ['Noir', 'Blanc', 'Gris', 'Bleu marine', 'Rouge', 'Vert', 'Jaune', 'Orange']

const PRODUCT_CATEGORY_IMAGES: Record<string, string> = {
  cartouches: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=900&q=80',
  papier: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
  stockage: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80',
  cables: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
  accessoires: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  impression: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
}

const getProductImage = (product: any) => {
  const rawImage = typeof product?.image === 'string' ? product.image.trim() : ''
  if (rawImage && rawImage.startsWith('data:image/') || rawImage.startsWith('blob:') || rawImage.startsWith('http')) {
    return rawImage
  }

  const categoryKey = (product?.category_name || product?.category || 'default').toLowerCase()
  const matchKey = Object.keys(PRODUCT_CATEGORY_IMAGES).find((key) => categoryKey.includes(key)) || 'default'
  return PRODUCT_CATEGORY_IMAGES[matchKey]
}

const SERVICE_OPTIONS = [
  'Impression numérique',
  'Impression grand format',
  'DTF',
  'UV',
  'Bâche',
  'Vinyle',
  'Roll-up',
  'Flyers',
  'Affiches',
  'Cartes de visite',
  'Personnalisation textile',
  'Vente de consommables',
  'Vente de pièces et accessoires pour machines',
  'Installation de machines',
  'Réparation et maintenance de machines d’impression',
]

const PRINT_TYPES = [
  'Impression numérique',
  'Impression grand format',
  'Sublimation',
  'DTF',
  'UV',
  'Flex / Vinyle',
  'Bâche',
  'Affiche / Poster',
  'Carte de visite',
  'Packaging',
  'Personnalisation textile',
]

const MACHINE_TYPES = [
  'Imprimante UV / DTG',
  'Machine à découpe',
  'Sublimation textile',
  'Machine grand format',
  'Machine de découpe laser',
  'Autre machine / besoin spécifique',
]

export default function ClientOrderPage() {
  const [products, setProducts] = useState<any[]>([])
  const [machines, setMachines] = useState(DEFAULT_MACHINES)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedMachine, setSelectedMachine] = useState(DEFAULT_MACHINES[0].name)
  const [imagePreview, setImagePreview] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState<'catalog' | 'product' | 'request'>('catalog')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous')
  const [requestType, setRequestType] = useState<'impression' | 'maintenance'>('impression')
  const [requestForm, setRequestForm] = useState({
    name: '',
    phone: '',
    email: '',
    printType: PRINT_TYPES[0],
    machineType: MACHINE_TYPES[0],
    availabilityDate: '',
    message: '',
  })
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    serviceType: 'impression',
    shirtBrand: SHIRT_BRANDS[0],
    shirtColor: SHIRT_COLORS[0],
    quantity: 1,
    notes: '',
  })

  useEffect(() => {
    try {
      const savedProducts = loadProductsFromLS()
      setProducts(savedProducts)
      if (savedProducts[0]) {
        setSelectedProduct(savedProducts[0].name)
      }
    } catch {
      setProducts([])
    }

    try {
      const savedMachines = JSON.parse(localStorage.getItem('protech_client_machines') || 'null')
      if (Array.isArray(savedMachines) && savedMachines.length > 0) {
        setMachines(savedMachines)
        setSelectedMachine(savedMachines[0].name)
      }
    } catch {
      setMachines(DEFAULT_MACHINES)
    }
  }, [])

  const productOptions = useMemo(() => {
    if (products.length > 0) return products
    return [
      { id: 1, name: 'Cartouche d\'encre noir 67A', price: 28000, size: 'Noir / 67A', category: 'cartouches', category_name: 'Cartouches & encres', image: PRODUCT_CATEGORY_IMAGES.cartouches },
      { id: 2, name: 'Clé USB 32 Go', price: 22000, size: '32 Go', category: 'stockage', category_name: 'Stockage & mémoire', image: PRODUCT_CATEGORY_IMAGES.stockage },
      { id: 3, name: 'Disque SSD 1 To', price: 44000, size: '1 To', category: 'stockage', category_name: 'Stockage & mémoire', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80' },
      { id: 4, name: 'Câble USB-C vers USB-A', price: 9500, size: '1.5 m', category: 'cables', category_name: 'Câbles & accessoires', image: PRODUCT_CATEGORY_IMAGES.cables },
      { id: 5, name: 'Batterie portable 20 000 mAh', price: 36000, size: 'Portable', category: 'accessoires', category_name: 'Accessoires', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80' },
      { id: 6, name: 'Papier A4 80g premium', price: 6500, size: 'A4 / 80g', category: 'papier', category_name: 'Papier & supports', image: PRODUCT_CATEGORY_IMAGES.papier },
    ]
  }, [products])

  const selectedProductData = useMemo(() => {
    return productOptions.find((product: any) => product.name === selectedProduct) || productOptions[0]
  }, [productOptions, selectedProduct])

  const productGallery = useMemo(() => {
    const base = getProductImage(selectedProductData)
    return [
      base,
      PRODUCT_CATEGORY_IMAGES.stockage,
      PRODUCT_CATEGORY_IMAGES.cables,
      PRODUCT_CATEGORY_IMAGES.impression,
    ]
  }, [selectedProductData])

  const productCategories = useMemo(() => {
    const labels = productOptions
      .map((product: any) => product.category_name || product.category || 'Produit')
      .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
    return ['Tous', ...labels.slice(0, 6)]
  }, [productOptions])

  const filteredProductOptions = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Tous') return productOptions
    return productOptions.filter((product: any) => (product.category_name || product.category || 'Produit') === selectedCategory)
  }, [productOptions, selectedCategory])

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('L’image est trop volumineuse. Maximum 2 Mo.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result || ''))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.customerName.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Veuillez remplir votre nom, téléphone et email.')
      return
    }

    if (!selectedProductData) {
      setError('Veuillez sélectionner un produit avant de passer la commande.')
      return
    }

    const order = {
      id: `client-order-${Date.now()}`,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      serviceType: form.serviceType,
      productName: selectedProductData.name,
      machineName: selectedMachine,
      shirtBrand: form.shirtBrand,
      shirtColor: form.shirtColor,
      quantity: Number(form.quantity) || 1,
      notes: form.notes.trim(),
      image: imagePreview,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const existing = loadClientOrdersFromLS()
    const nextOrders: ClientOrder[] = [
      {
        ...order,
        serviceType: form.serviceType as ClientOrder['serviceType'],
        status: 'pending',
      },
      ...existing,
    ]
    saveClientOrdersToLS(nextOrders)
    window.dispatchEvent(new CustomEvent('protech-orders-updated', { detail: nextOrders }))

    setSuccess('Votre commande a bien été envoyée. Nous vous répondrons rapidement.')
    setForm({
      customerName: '',
      phone: '',
      email: '',
      serviceType: 'impression',
      shirtBrand: SHIRT_BRANDS[0],
      shirtColor: SHIRT_COLORS[0],
      quantity: 1,
      notes: '',
    })
    setSelectedProduct(productOptions[0]?.name || '')
    setSelectedMachine(machines[0]?.name || '')
    setImagePreview('')
  }

  function handleRequestSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!requestForm.name.trim() || !requestForm.phone.trim() || !requestForm.email.trim()) {
      setError('Veuillez remplir votre nom, téléphone et email pour la demande de service.')
      return
    }

    const serviceRequest = {
      id: `service-request-${Date.now()}`,
      type: requestType,
      name: requestForm.name.trim(),
      phone: requestForm.phone.trim(),
      email: requestForm.email.trim(),
      printType: requestForm.printType,
      machineType: requestForm.machineType,
      availabilityDate: requestForm.availabilityDate,
      message: requestForm.message.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    const existingRequests = loadServiceRequestsFromLS()
    const nextRequests: ClientServiceRequest[] = [
      {
        ...serviceRequest,
        status: 'pending',
        type: requestType,
      },
      ...existingRequests,
    ]
    saveServiceRequestsToLS(nextRequests)
    window.dispatchEvent(new CustomEvent('protech-service-requests-updated', { detail: nextRequests }))

    setSuccess(`Votre demande de ${requestType === 'impression' ? 'service d’impression' : 'maintenance'} a bien été enregistrée.`)
    setRequestForm({
      name: '',
      phone: '',
      email: '',
      printType: PRINT_TYPES[0],
      machineType: MACHINE_TYPES[0],
      availabilityDate: '',
      message: '',
    })
    setCurrentView('catalog')
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f1117] text-black dark:text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500 font-semibold">Commande client</p>
            <h1 className="text-2xl font-bold font-serif sm:text-3xl">
              {currentView === 'request' ? 'Demande de service' : currentView === 'product' ? 'Détails du produit' : 'Produits'}
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setCurrentView('request')}
              className="w-full rounded-lg border border-sky-500 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-300 sm:w-auto"
            >
              Demander un service
            </button>
            <Link href="/" className="w-full rounded-lg bg-sky-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-sky-600 sm:w-auto">Retour au tableau de bord</Link>
          </div>
        </div>

        {currentView === 'request' ? (
          <div className="bg-white dark:bg-[#0f1117] rounded-3xl border border-gray-200 dark:border-[#2b344d] p-5 shadow-sm max-w-3xl mx-auto">
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRequestType('impression')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ${requestType === 'impression' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-[#141c2e] dark:text-gray-200'}`}
              >
                <span aria-hidden="true" className="text-lg">🖨️</span>
                <span>Demande d’impression</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestType('maintenance')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ${requestType === 'maintenance' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-[#141c2e] dark:text-gray-200'}`}
              >
                <span aria-hidden="true" className="text-lg">🔧</span>
                <span>Demande de maintenance</span>
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Nom complet</span>
                  <input
                    value={requestForm.name}
                    onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                    placeholder="Votre nom"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Téléphone</span>
                  <input
                    value={requestForm.phone}
                    onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                    placeholder="+243 ..."
                    required
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="block mb-1 font-medium">Email</span>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                  placeholder="vous@email.com"
                  required
                />
              </label>

              {requestType === 'impression' && (
                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Type d’impression</span>
                  <select
                    value={requestForm.printType}
                    onChange={(e) => setRequestForm({ ...requestForm, printType: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                  >
                    {PRINT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
              )}

              {requestType === 'maintenance' && (
                <>
                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Type de machine</span>
                    <select
                      value={requestForm.machineType}
                      onChange={(e) => setRequestForm({ ...requestForm, machineType: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                    >
                      {MACHINE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Date de disponibilité</span>
                    <input
                      type="date"
                      value={requestForm.availabilityDate}
                      onChange={(e) => setRequestForm({ ...requestForm, availabilityDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                    />
                  </label>
                </>
              )}

              <label className="block text-sm">
                <span className="block mb-1 font-medium">Description du besoin</span>
                <textarea
                  rows={5}
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5"
                  placeholder={requestType === 'impression' ? 'Description du projet d’impression, dimensions, quantité, date souhaitée...' : 'Description du problème, machine concernée, symptôme, urgence...' }
                />
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold hover:brightness-110">
                  Envoyer la demande
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('catalog')}
                  className="px-5 py-3 rounded-xl border border-gray-300 dark:border-[#2b344d] bg-white dark:bg-[#141c2e] text-gray-700 dark:text-gray-200"
                >
                  Retour catalogue
                </button>
              </div>
            </form>
          </div>
        ) : currentView === 'product' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-[#2b344d] dark:bg-[#0f1117] md:p-5">
              <button
                type="button"
                onClick={() => setCurrentView('catalog')}
                className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-[#141c2e] dark:text-sky-300"
              >
                ← Retour aux produits
              </button>

              <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100 dark:border-[#2b344d] dark:bg-[#141c2e]">
                <div className="relative h-[300px] overflow-hidden sm:h-[360px] md:h-[440px] xl:h-[520px]">
                  <img
                    src={getProductImage(selectedProductData)}
                    alt={selectedProductData?.name || 'Produit'}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700 backdrop-blur-sm">
                      {selectedProductData?.category_name || 'Consommable'}
                    </span>
                    <span className="rounded-full bg-sky-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg">
                      En stock
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {productGallery.map((image, index) => (
                  <div key={`${selectedProductData?.name || 'produit'}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-[#2b344d] dark:bg-[#141c2e]">
                    <img src={image} alt={`${selectedProductData?.name || 'Produit'} ${index + 1}`} className="h-20 w-full object-cover md:h-24" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_22px_45px_rgba(15,23,42,0.08)] dark:border-[#2b344d] dark:bg-[#0f1117] md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">Produit premium</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{selectedProductData?.name || 'Produit'}</h2>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2 text-right dark:bg-sky-950/30">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-sky-600">Prix</div>
                  <div className="mt-1 text-xl font-black text-sky-600">
                    {selectedProductData?.price ? `${Number(selectedProductData.price).toLocaleString('fr-CD')} FC` : 'Sur devis'}
                  </div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {['Livraison rapide', 'Garantie qualité', 'Support technique', 'Paiement sécurisé'].map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-[#141c2e] dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mb-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {selectedProductData?.size || 'Produit compatible avec les équipements de bureau'} • solution fiable pour les entreprises, la bureautique et les besoins technologiques quotidiens.
              </p>

              <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-950 via-sky-950 to-blue-900 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200">Expédition</p>
                    <p className="mt-1 text-lg font-bold">Délai: 24 à 48h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200">Disponibilité</p>
                    <p className="mt-1 text-lg font-bold">Très bonne</p>
                  </div>
                </div>
              </div>

              <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Détails de la commande</h3>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Nom complet</span>
                    <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5" placeholder="Votre nom" required />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Téléphone</span>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5" placeholder="+243 ..." required />
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Email</span>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5" placeholder="vous@email.com" required />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Quantité</span>
                    <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 1 })} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5" />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Type de service</span>
                    <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value as any })} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5">
                      {SERVICE_OPTIONS.map((service) => (
                        <option key={service} value={service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{service}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Machine concernée</span>
                  <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5">
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.name}>{machine.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Image à imprimer / document</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-3" />
                </label>

                {imagePreview && (
                  <div className="flex justify-center rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-[#2b344d] dark:bg-[#141c2e]">
                    <div className="h-[220px] w-[180px] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-[#2b344d]">
                      <img src={imagePreview} alt="Aperçu de l’image" className="h-full w-full object-cover object-center" />
                    </div>
                  </div>
                )}

                <label className="block text-sm">
                  <span className="block mb-1 font-medium">Commentaires / détails</span>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="w-full rounded-xl border border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] px-3 py-2.5" placeholder="Décrivez votre besoin, taille, pose, ou précision d’impression" />
                </label>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110">
                  Passer la commande
                </button>
              </form>
            </section>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0f1117] rounded-[28px] border border-gray-200 dark:border-[#2b344d] p-5 md:p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-sky-600 font-bold">Boutique tech</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Consommables informatiques</h2>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                {productOptions.length} références
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.35),_transparent_30%),linear-gradient(135deg,#020817,#0f172a_30%,#082f49_100%)] p-4 text-white shadow-[0_30px_60px_rgba(2,6,23,0.45)] ring-1 ring-white/10 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-sky-200 sm:text-[11px]">ProTech Touch</p>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl lg:text-4xl">La boutique qui équipe votre bureau</h3>
                  <p className="mt-3 text-sm text-sky-100 sm:text-base">Cartouches, câbles, mémoires, accessoires et solutions de maintenance pour entreprises et particuliers.</p>
                </div>
                <div className="-mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-2">
                    {productCategories.map((category) => {
                      const active = selectedCategory === category
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-white bg-white text-slate-900 shadow-lg' : 'border-white/20 bg-white/5 text-sky-100 hover:bg-white/10'}`}
                        >
                          {category}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {selectedCategory === 'Tous' ? 'Tous les produits' : `Catégorie : ${selectedCategory}`}
              </div>
              {selectedCategory !== 'Tous' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Tous')}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#141c2e] dark:text-slate-200"
                >
                  Tout afficher
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProductOptions.map((product: any) => {
                const isSelected = selectedProduct === product.name
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product.name)
                      setCurrentView('product')
                      setForm((prev) => ({ ...prev, quantity: Number(prev.quantity) || 1 }))
                    }}
                    className={`group relative text-left overflow-hidden rounded-[24px] border bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-[#141c2e] dark:text-white ${isSelected ? 'border-sky-500 ring-2 ring-sky-200 dark:ring-sky-800' : 'border-slate-200 dark:border-[#2b344d]'}`}
                  >
                    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
                      <span className="rounded-full border border-white/60 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-700 backdrop-blur-sm">
                        {product.category_name || 'Consommable'}
                      </span>
                      <span className="rounded-full bg-sky-500 px-2 py-1 text-[10px] font-bold text-white shadow-md">
                        {product.stock ?? 12} en stock
                      </span>
                    </div>

                    <div className="h-[240px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-600 font-semibold">Produit</p>
                          <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900 dark:text-white line-clamp-2">
                            {product.name}
                          </h3>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-right dark:bg-[#1d2438]">
                          <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Prix</div>
                          <div className="mt-1 text-sm font-extrabold text-sky-600">
                            {product.price ? `${Number(product.price).toLocaleString('fr-CD')} FC` : 'Sur devis'}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#1d2438] dark:text-slate-300">
                          {product.size || 'Standard'}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Livraison rapide</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                        <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-sky-600">Voir détails</span>
                        <span className="inline-flex items-center rounded-full bg-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-sky-600">
                          Commander
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
