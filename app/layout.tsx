import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Photo Vote',
  description: 'Vote for your favourite photo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
