import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sync',
  description: 'Your clipboard, organized across every device.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sync',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0891b2" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="h-full bg-white text-[#111111]">{children}</body>
    </html>
  )
}
