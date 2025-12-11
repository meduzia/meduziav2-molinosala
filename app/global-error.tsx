'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error a servicio de monitoreo
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#f5f5f5'
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '40px',
            borderRadius: '12px',
            backgroundColor: '#171717',
            border: '1px solid #262626'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>⚠️</div>
            <h1 style={{
              fontSize: '24px',
              marginBottom: '10px',
              fontWeight: '600'
            }}>
              Error Crítico
            </h1>
            <p style={{
              color: '#a3a3a3',
              marginBottom: '20px'
            }}>
              Se produjo un error crítico en la aplicación. Por favor, recarga la página.
            </p>
            {error.message && (
              <div style={{
                backgroundColor: '#262626',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '12px',
                wordBreak: 'break-all',
                color: '#ef4444'
              }}>
                {error.message}
              </div>
            )}
            <button
              onClick={reset}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                width: '100%'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
