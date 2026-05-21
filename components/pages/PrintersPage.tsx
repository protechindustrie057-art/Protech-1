'use client'

import { useState } from 'react'

interface PrinterState {
  connected: boolean
  paperSize: '80' | '58'
}

type PrinterKey = 'epson' | 'xprinter' | 'bluetooth'

const PRINTER_INFO: { key: PrinterKey; name: string; icon: string }[] = [
  { key: 'epson', name: 'EPSON TM-T20/T88', icon: '🖨️' },
  { key: 'xprinter', name: 'XPRINTER XP-58/80', icon: '🖨️' },
  { key: 'bluetooth', name: 'Bluetooth', icon: '🔵' },
]

interface PrintersPageProps {
  printers: Record<PrinterKey, PrinterState>
  selectedPrinter: PrinterKey
  onToggleConnect: (key: PrinterKey) => void
  onSelectPrinter: (key: PrinterKey) => void
  onChangeSize: (key: PrinterKey, size: '58' | '80') => void
}

export default function PrintersPage({
  printers,
  selectedPrinter,
  onToggleConnect,
  onSelectPrinter,
  onChangeSize,
}: PrintersPageProps) {
  const [copies, setCopies] = useState(2)

  function testPrint(name: string, connected: boolean) {
    if (!connected) { alert('Imprimante non connectée'); return }
    const printContent = `Test d'impression\nImprimante : ${name}\n\nSK Parfumerie & Cosmétiques\nTicket de test\nMerci !`
    const win = window.open('', '_blank', 'width=480,height=640')
    if (!win) {
      alert('Impossible d’ouvrir la fenêtre d’impression. Vérifiez que votre navigateur autorise les popups.')
      return
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Test d'impression</title></head><body><pre style="font-size:14px; line-height:1.4;">${printContent}</pre></body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  function openDrawer(name: string, connected: boolean) {
    if (!connected) { alert('Imprimante non connectée'); return }
    alert(`Tiroir-caisse ouvert via ${name}`)
  }

  return (
    <div className="text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-2">Configuration des imprimantes</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Branchez l’imprimante physiquement sur le PC avant de la déclarer connectée. Une fois branchée, utilisez le bouton « Tester » pour vérifier l’impression réelle depuis le navigateur.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PRINTER_INFO.map(({ key, name, icon }) => {
          const state = printers[key]
          return (
            <div key={key} className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-[#1e2436] flex items-center justify-center text-3xl" aria-hidden>
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{name}</p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={
                      state.connected
                        ? { background: '#dcfce7', color: '#15803d' }
                        : { background: '#fee2e2', color: '#b91c1c' }
                    }
                  >
                    {state.connected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 mb-3">
                <button
                  onClick={() => {
                    if (!state.connected) {
                      const confirmed = window.confirm('Assurez-vous que l’imprimante est bien branchée physiquement sur le PC. Continuer ?')
                      if (!confirmed) return
                    }
                    onToggleConnect(key)
                  }}
                  className="w-full py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all"
                  style={{ background: state.connected ? '#ef4444' : '#22c55e' }}
                >
                  {state.connected ? 'Déconnecter' : 'Brancher'}
                </button>
                <button
                  onClick={() => onSelectPrinter(key)}
                  disabled={!state.connected}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: selectedPrinter === key ? '#f59e0b' : '#3b82f6', color: 'white' }}
                >
                  {selectedPrinter === key ? 'Sélectionnée' : 'Définir comme imprimante'}
                </button>
                <select
                  value={state.paperSize}
                  onChange={(e) => onChangeSize(key, e.target.value as '58' | '80')}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
                  disabled={!state.connected}
                >
                  <option value="80">80mm</option>
                  <option value="58">58mm</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => testPrint(name, state.connected)}
                  className="py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all"
                  style={{ background: '#3b82f6' }}
                >
                  Tester
                </button>
                <button
                  onClick={() => openDrawer(name, state.connected)}
                  className="py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all"
                  style={{ background: '#f59e0b' }}
                >
                  Tiroir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Print settings */}
      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm max-w-md">
        <h3 className="font-bold text-gray-700 dark:text-white mb-4">Paramètres d'impression</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Imprimante active : <strong>{selectedPrinter.toUpperCase()}</strong>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Format de papier</label>
            <select
              value={printers[selectedPrinter].paperSize}
              onChange={(e) => onChangeSize(selectedPrinter, e.target.value as '58' | '80')}
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
              disabled={!printers[selectedPrinter].connected}
            >
              <option value="80">80mm (standard)</option>
              <option value="58">58mm (petit ticket)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nombre de copies</label>
            <input
              type="number"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
              min="1" max="4"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
