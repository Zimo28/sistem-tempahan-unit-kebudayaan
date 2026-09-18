import Link from 'next/link'

export const metadata = { title: 'Unit Kebudayaan Guide' }

const tiles = [
  {
    href: '/guide/category/audio', label: 'Audio', desc: 'Mic, mixer, speaker',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/video', label: 'Video', desc: 'Projector, HDMI, camera',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/lighting', label: 'Lighting', desc: 'DMX, controller',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.75.75 1.22 1.5 1.41 2.5"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/power', label: 'Power', desc: 'Extension, adapter',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5"/><path d="M6 6v6"/><path d="M10 6v6"/><path d="M6 2v2"/><path d="M10 2v2"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/tools', label: 'Tools', desc: 'Cable tie, spare parts',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/guide/sop', label: 'SOP', desc: 'Operation manual',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
]

export default function QrHubPage() {
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
        <Link href="/" style={{
          fontSize: '13px', color: '#8B0000', textDecoration: 'none',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
          padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca',
          background: '#fef2f2', transition: 'all 0.15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </Link>
      </nav>

      {/* Hero Strip */}
      <div style={{
        position: 'relative', padding: '40px 24px', textAlign: 'center', overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 40%, #8B0000 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px', padding: '4px 14px',
            fontSize: '11px', fontWeight: '600', color: '#fecaca',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fca5a5' }} />
            Unit Kebudayaan — UiTM Cawangan Kelantan
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '6px' }}>Equipment Guide</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Find the information you need about our equipment</p>
        </div>
      </div>

      <div style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {tiles.map(tile => (
            <Link
              key={tile.href}
              href={tile.href}
              style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px',
                padding: '20px 16px', textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#fef2f2', color: '#8B0000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tile.icon}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{tile.label}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{tile.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}