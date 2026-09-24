'use client'

import { useState } from 'react'

type PaperSize = '80' | '58' | 'A4'

interface PrinterState {
  connected: boolean
  paperSize: PaperSize
}

type PrinterKey = 'epson' | 'xprinter' | 'bluetooth' | 'standard'

const PRINTER_INFO: { key: PrinterKey; name: string; icon: string; standard?: boolean }[] = [
  { key: 'epson', name: 'EPSON TM-T20/T88', icon: 'Printer' },
  { key: 'xprinter', name: 'XPRINTER XP-58/80', icon: 'Printer' },
  { key: 'bluetooth', name: 'Bluetooth', icon: 'BT' },
  { key: 'standard', name: 'Imprimante standard', icon: 'A4', standard: true },
]

interface PrintersPageProps {
  printers: Record<PrinterKey, PrinterState>
  selectedPrinter: PrinterKey
  onToggleConnect: (key: PrinterKey) => void
  onSelectPrinter: (key: PrinterKey) => void
  onChangeSize: (key: PrinterKey, size: PaperSize) => void
}

export default function PrintersPage({
  printers,
  selectedPrinter,
  onToggleConnect,
  onSelectPrinter,
  onChangeSize,
}: PrintersPageProps) {
  const [copies, setCopies] = useState(2)

  function testPrint(name: string, connected: boolean, standard = false) {
    if (!connected) {
      alert('Imprimante non connectee')
      return
    }

    const win = window.open('', '_blank', 'width=780,height=900')
    if (!win) {
      alert("Impossible d'ouvrir la fenetre d'impression. Verifiez que votre navigateur autorise les popups.")
      return
    }

    if (standard) {
      win.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>Test facture A4</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; }
              h1 { margin: 0; font-size: 28px; }
              table { width: 100%; border-collapse: collapse; margin-top: 24px; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
              th { background: #f3f4f6; }
              .total { text-align: right; margin-top: 24px; font-size: 18px; font-weight: 700; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>ProTech Touch</h1>
                <p>Facture de test</p>
              </div>
              <strong>${name}</strong>
            </div>
            <table>
              <thead><tr><th>Article</th><th>Quantite</th><th>Prix</th><th>Total</th></tr></thead>
              <tbody><tr><td>Article test</td><td>1</td><td>10 000 CDF</td><td>10 000 CDF</td></tr></tbody>
            </table>
            <p class="total">Total : 10 000 CDF</p>
          </body>
        </html>`)
    } else {
      const printContent = `Test d'impression\nImprimante : ${name}\n\nProTech Touch\nTicket de test\nMerci !`
      win.document.write(`<!DOCTYPE html><html><head><title>Test d'impression</title></head><body><pre style="font-size:14px; line-height:1.4;">${printContent}</pre></body></html>`)
    }

    win.document.close()
    win.focus()
    win.print()
  }

  function openDrawer(name: string, connected: boolean) {
    if (!connected) {
      alert('Imprimante non connectee')
      return
    }
    alert(`Tiroir-caisse ouvert via ${name}`)
  }

  function renderPaperOptions(isStandard: boolean) {
    if (isStandard) {
      return <option value="A4">A4 - facture standard</option>
    }

    return (
      <>
        <option value="80">80mm</option>
        <option value="58">58mm</option>
      </>
    )
  }

  const selectedInfo = PRINTER_INFO.find((item) => item.key === selectedPrinter)

  return (
    <div className="text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-2">Configuration des imprimantes</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Branchez l'imprimante physiquement sur le PC avant de la declarer connectee. Utilisez les imprimantes ticket pour les tickets, et l'imprimante standard pour les factures A4.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PRINTER_INFO.map(({ key, name, icon, standard }) => {
          const state = printers[key]
          const isStandard = Boolean(standard)

          return (
            <div key={key} className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-[#1e2436] flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200" aria-hidden>
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
                    {state.connected ? 'Connectee' : 'Deconnectee'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 mb-3">
                <button
                  onClick={() => {
                    if (!state.connected) {
                      const confirmed = window.confirm("Assurez-vous que l'imprimante est bien branchee physiquement sur le PC. Continuer ?")
                      if (!confirmed) return
                    }
                    onToggleConnect(key)
                  }}
                  className="w-full py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all"
                  style={{ background: state.connected ? '#ef4444' : '#22c55e' }}
                >
                  {state.connected ? 'Deconnecter' : 'Brancher'}
                </button>
                <button
                  onClick={() => onSelectPrinter(key)}
                  disabled={!state.connected}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: selectedPrinter === key ? '#f59e0b' : '#3b82f6', color: 'white' }}
                >
                  {selectedPrinter === key ? 'Selectionnee' : 'Definir comme imprimante'}
                </button>
                <select
                  value={state.paperSize}
                  onChange={(e) => onChangeSize(key, e.target.value as PaperSize)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
                  disabled={!state.connected}
                >
                  {renderPaperOptions(isStandard)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => testPrint(name, state.connected, isStandard)}
                  className="py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all"
                  style={{ background: '#3b82f6' }}
                >
                  Tester
                </button>
                <button
                  onClick={() => openDrawer(name, state.connected)}
                  disabled={isStandard || !state.connected}
                  className="py-2.5 rounded-lg text-white text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={{ background: isStandard ? '#9ca3af' : '#f59e0b' }}
                >
                  Tiroir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm max-w-md">
        <h3 className="font-bold text-gray-700 dark:text-white mb-4">Parametres d'impression</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Imprimante active : <strong>{selectedInfo?.name || selectedPrinter}</strong>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Format de papier</label>
            <select
              value={printers[selectedPrinter].paperSize}
              onChange={(e) => onChangeSize(selectedPrinter, e.target.value as PaperSize)}
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
              disabled={!printers[selectedPrinter].connected}
            >
              {renderPaperOptions(selectedPrinter === 'standard')}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nombre de copies</label>
            <input
              type="number"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
              min="1"
              max="4"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
