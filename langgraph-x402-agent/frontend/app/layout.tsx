import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LangGraph x402 Agent',
  description: 'AI Agent with x402 micropayments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
