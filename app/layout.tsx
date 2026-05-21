// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SK Parfumerie & Cosmétiques - Gestion Professionnelle',
  description: 'Système de gestion professionnelle pour SK Parfumerie & Cosmétiques, Kinshasa RDC',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}