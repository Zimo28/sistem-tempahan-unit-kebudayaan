import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata = { title: 'SOP - Unit Kebudayaan' }

export default async function SopPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('id', 'sop_content').single()
  const content = data?.value ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #f3f4f6',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Link href="/"><img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} /></Link>
        <Link href="/guide" style={{
          fontSize: '13px', color: '#8B0000', textDecoration: 'none',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
          padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca',
          background: '#fef2f2', transition: 'all 0.15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </Link>
      </nav>

      <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>SOP / Operation Manual</h1>

        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {content ? (
            <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{content}</p>
          ) : (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>SOP content has not been set up yet.</p>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}