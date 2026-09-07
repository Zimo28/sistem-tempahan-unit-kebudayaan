'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { showToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { syncToGoogleSheet } from '@/lib/googleSheet'
import BlackoutCalendar from '@/components/BlackoutCalendar'

type Venue = {
  id: string
  name: string
  code: string
  description: string | null
  capacity: number | null
}

type EquipmentOption = {
  id: string
  label: string
  max_quantity: number
}

type Slot = {
  booking_date: string
  start_time: string
  end_time: string
  equipment: Record<string, number> // option_id -> quantity
}

const emptySlot = (): Slot => ({
  booking_date: '', start_time: '', end_time: '', equipment: {},
})

const genericEquipmentIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)

function EquipmentSelect({ label, max, value, onChange }: {
  label: string
  max: number
  value: number
  onChange: (val: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ border: '1.5px solid #f3f4f6', borderRadius: '10px', padding: '12px', background: '#fafafa', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {genericEquipmentIcon} {label}
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af', background: '#e5e7eb', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
          MAX {max}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'white', border: `1.5px solid ${open ? '#8B0000' : '#e5e7eb'}`,
          borderRadius: '6px', padding: '8px 12px', fontSize: '14px', fontWeight: '600',
          color: '#111827', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{
        position: 'absolute', left: 0, right: 0, zIndex: 50,
        background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '8px',
        marginTop: '4px', overflow: 'hidden',
        maxHeight: open ? '200px' : '0px',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        pointerEvents: open ? 'auto' : 'none',
        overflowY: 'auto',
      }}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { onChange(i); setOpen(false) }}
            style={{
              width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: '500',
              background: value === i ? '#fef2f2' : 'transparent',
              color: value === i ? '#8B0000' : '#374151',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < max ? '1px solid #f9fafb' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (value !== i) e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { if (value !== i) e.currentTarget.style.background = 'transparent' }}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BookingPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [conflictIndexes, setConflictIndexes] = useState<number[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([])

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const [form, setForm] = useState({
    full_name: '', phone_number: '', organization: '', event_name: '', venue_id: '',
  })

  const [slots, setSlots] = useState<Slot[]>([emptySlot()])
  const [expandedSlotIndex, setExpandedSlotIndex] = useState<number | null>(0)

  const searchParams = useSearchParams()
  const venueCodeFromUrl = searchParams.get('venue')

  useEffect(() => {
    supabase
      .from('venues')
      .select('id, name, code, description, capacity')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .then(({ data }) => {
        if (data) setVenues(data)
      })
  }, [])

  useEffect(() => {
    if (venues.length === 0) return
    const matched = venueCodeFromUrl
      ? venues.find(v => v.code.toLowerCase() === venueCodeFromUrl.toLowerCase())
      : null
    setForm(prev => ({ ...prev, venue_id: (matched ?? venues[0])?.id ?? prev.venue_id }))
  }, [venueCodeFromUrl, venues])

  useEffect(() => {
    if (!form.venue_id) { setEquipmentOptions([]); return }
    supabase
      .from('venue_equipment_options')
      .select('id, label, max_quantity')
      .eq('venue_id', form.venue_id)
      .order('position', { ascending: true })
      .then(({ data }) => setEquipmentOptions(data ?? []))
  }, [form.venue_id])

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateSlot = (index: number, field: 'booking_date' | 'start_time' | 'end_time', value: string) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    setConflictIndexes(prev => prev.filter(i => i !== index))
  }

  const updateSlotEquipment = (index: number, optionId: string, value: number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, equipment: { ...s.equipment, [optionId]: value } } : s))
  }

  const addSlot = () => {
    setSlots(prev => {
      const next = [...prev, emptySlot()]
      setExpandedSlotIndex(next.length - 1)
      return next
    })
  }

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index))
    setConflictIndexes(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i))
    setExpandedSlotIndex(prev => {
      if (prev === null) return null
      if (prev === index) return null
      return prev > index ? prev - 1 : prev
    })
  }

  const getMinDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 5)
    return date.toISOString().split('T')[0]
  }

  const uploadFile = async (bookingId: string) => {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}.${fileExt}`
    const { error } = await supabase.storage.from('approval-docs').upload(fileName, file)
    if (error) return null
    const { data: urlData } = supabase.storage.from('approval-docs').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const checkAllSlotsForConflict = async (): Promise<{ index: number; reason: string }[]> => {
    const problems: { index: number; reason: string }[] = []

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]

      const { data } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('booking_date', slot.booking_date)
        .eq('venue_id', form.venue_id)
        .in('status', ['approved', 'pending'])

      const hasDbConflict = data?.some(b =>
        slot.start_time < b.end_time && slot.end_time > b.start_time
      )
      if (hasDbConflict) {
        problems.push({ index: i, reason: 'Bertindih dengan tempahan lain yang sedia ada' })
        continue
      }

      const clashesWithOwnSlot = slots.some((other, j) =>
        j !== i &&
        other.booking_date === slot.booking_date &&
        slot.start_time < other.end_time && slot.end_time > other.start_time
      )
      if (clashesWithOwnSlot) {
        problems.push({ index: i, reason: 'Bertindih dengan slot lain dalam tempahan ini' })
        continue
      }

      const { data: blackout } = await supabase
        .from('blackout_dates')
        .select('reason')
        .eq('date', slot.booking_date)
        .single()

      if (blackout) {
        problems.push({ index: i, reason: `Tarikh blackout${blackout.reason ? ` — ${blackout.reason}` : ''}` })
      }
    }

    return problems
  }

  const handleSubmit = async () => {
    if (!form.venue_id) {
      showToast('Sila pilih tempat/venue.', 'error'); return
    }
    if (!form.full_name || !form.phone_number || !form.organization || !form.event_name) {
      showToast('Sila isi semua maklumat peribadi.', 'error'); return
    }
    const phoneRegex = /^(\+?60|0)[0-9]{8,10}$/
    if (!phoneRegex.test(form.phone_number.replace(/[-\s]/g, ''))) {
      showToast('Format nombor telefon tidak sah. Contoh: 012-3456789', 'error'); return
    }

    for (const slot of slots) {
      if (!slot.booking_date || !slot.start_time || !slot.end_time) {
        showToast('Sila isi tarikh dan masa untuk semua slot.', 'error'); return
      }
      if (slot.start_time >= slot.end_time) {
        showToast('Masa tamat mesti lebih lewat dari masa mula untuk setiap slot.', 'error'); return
      }
    }

    if (!file) {
      showToast('Sila muat naik dokumen kelulusan (PDF) sebelum menghantar.', 'error'); return
    }

    setLoading(true)

    const problems = await checkAllSlotsForConflict()
    if (problems.length > 0) {
      setConflictIndexes(problems.map(p => p.index))
      setExpandedSlotIndex(problems[0].index)
      const firstProblem = problems[0]
      const slotDate = slots[firstProblem.index].booking_date
      showToast(
        `Slot ${firstProblem.index + 1} (${slotDate}): ${firstProblem.reason}. Sila semak slot yang ditanda merah.`,
        'error'
      )
      setLoading(false)
      return
    }

    const groupId = crypto.randomUUID()
    const rowsToInsert = slots.map(slot => ({
      full_name: form.full_name,
      phone_number: form.phone_number,
      organization: form.organization,
      event_name: form.event_name,
      venue_id: form.venue_id,
      booking_date: slot.booking_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      microphone: 0,
      aircond: 0,
      pa_system: 0,
      lcd_projector: 0,
      status: 'pending',
      booking_group_id: groupId,
    }))

    const { data: inserted, error } = await supabase
      .from('bookings').insert(rowsToInsert).select()

    if (error) {
      showToast('Ralat semasa menghantar. Sila cuba lagi.', 'error')
      setLoading(false)
      return
    }

    if (inserted) {
      const equipmentRows: { booking_id: string; option_id: string; quantity: number }[] = []
      slots.forEach((slot, i) => {
        const bookingId = inserted[i]?.id
        if (!bookingId) return
        Object.entries(slot.equipment).forEach(([optionId, qty]) => {
          if (qty > 0) equipmentRows.push({ booking_id: bookingId, option_id: optionId, quantity: qty })
        })
      })
      if (equipmentRows.length > 0) {
        await supabase.from('booking_equipment_requests').insert(equipmentRows)
      }
    }

    if (inserted?.[0]) {
      const attachmentUrl = await uploadFile(inserted[0].id)
      if (attachmentUrl) {
        await supabase.from('bookings').update({ attachment_url: attachmentUrl }).eq('booking_group_id', groupId)
      }
    }

    for (const row of inserted ?? []) {
      await syncToGoogleSheet({ ...row })
    }

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_booking', booking: { ...form, slots, groupId } }),
    })

    setLoading(false)
    setSuccess(true)
  }

  const inputStyle = {
    width: '100%',
    background: 'white',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#111827',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: '6px',
  }

  const cardStyle = {
    background: 'white',
    border: '1px solid #f3f4f6',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    height: '100%',
    boxSizing: 'border-box' as const,
  }

  const sectionBadge = (num: string) => ({
    width: '26px', height: '26px',
    background: 'linear-gradient(135deg, #8B0000, #a50000)',
    borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: '12px', fontWeight: '700' as const, flexShrink: 0,
  })

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f5f5 0%, #fef2f2 100%)', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <nav style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <a href="/"><img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} /></a>
          <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali ke Laman Utama
          </a>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '56px 48px', textAlign: 'center', maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
            <div style={{ width: '72px', height: '72px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>Tempahan Dihantar!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7' }}>
              Tempahan anda ({slots.length} slot) sedang menunggu kelulusan admin. Anda akan dihubungi sekiranya ada pertanyaan.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setSuccess(false); setFile(null); setConflictIndexes([])
                  setForm({ full_name: '', phone_number: '', organization: '', event_name: '', venue_id: venues[0]?.id ?? '' })
                  setSlots([emptySlot()])
                  setExpandedSlotIndex(0)
                }}
                style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 32px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,0,0,0.25)' }}
              >Buat Tempahan Baru</button>
              <a href="/" style={{ display: 'block', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '500', color: '#6b7280', textDecoration: 'none', textAlign: 'center' }}>
                ← Kembali ke Laman Utama
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f5f5 0%, #fef2f2 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827' }}>

      <nav style={{
        background: 'white', borderBottom: '1px solid #f3f4f6',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <a href="/"><img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{
            fontSize: '13px', color: '#8B0000', textDecoration: 'none',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca',
            background: '#fef2f2', transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali
          </a>
        </div>
      </nav>

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
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '6px' }}>Borang Tempahan</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Sila isi semua maklumat yang diperlukan dengan lengkap dan tepat</p>
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '12px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: 'max-content', margin: '0 auto' }}>
          {[
            { num: '1', label: 'Maklumat Peribadi' },
            { num: '2', label: 'Jadual & Peralatan' },
            { num: '3', label: 'Dokumen Kelulusan' },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>{step.num}</div>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>{step.label}</span>
              </div>
              {i < 2 && <div style={{ width: '24px', height: '1px', background: '#e5e7eb', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 16px 48px' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.1s',
        }}>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }} className="top-grid">

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={sectionBadge('1')}>1</div>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>Personal & Organization Details</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Tempat / Venue <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {venues.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, venue_id: v.id }))}
                        style={{
                          padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: form.venue_id === v.id ? '1.5px solid #8B0000' : '1.5px solid #e5e7eb',
                          background: form.venue_id === v.id ? '#fef2f2' : 'white',
                          color: form.venue_id === v.id ? '#8B0000' : '#374151',
                        }}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                  {venues.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>Memuatkan senarai tempat...</p>
                  )}
                </div>
                {[
                  { label: 'Full Name', field: 'full_name', placeholder: 'Enter your full name', type: 'text' },
                  { label: 'Phone Number', field: 'phone_number', placeholder: 'e.g. 012-3456789', type: 'tel' },
                  { label: 'Organization', field: 'organization', placeholder: 'Club or organization name', type: 'text' },
                  { label: 'Event Name', field: 'event_name', placeholder: 'Enter the name of your event', type: 'text' },
                ].map(item => (
                  <div key={item.field}>
                    <label style={labelStyle}>{item.label} <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type={item.type} placeholder={item.placeholder}
                      onChange={(e) => updateForm(item.field, e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={sectionBadge('2')}>2</div>
                  <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>Schedule & Equipment</h2>
                </div>
                {slots.length > 1 && (
                  <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                    {slots.length} slot
                  </span>
                )}
              </div>

              {slots.map((slot, index) => {
                const hasConflict = conflictIndexes.includes(index)
                const isExpanded = expandedSlotIndex === index

                const equipmentSummary = equipmentOptions
                  .filter(opt => (slot.equipment[opt.id] ?? 0) > 0)
                  .map(opt => `${slot.equipment[opt.id]} ${opt.label}`)
                  .join(', ')

                const summaryText = [
                  slot.booking_date || null,
                  (slot.start_time && slot.end_time) ? `${slot.start_time}-${slot.end_time}` : null,
                  equipmentSummary || null,
                ].filter(Boolean).join(' · ') || 'Belum diisi'

                return (
                  <div
                    key={index}
                    style={{
                      border: hasConflict ? '1.5px solid #fca5a5' : '1.5px solid #f3f4f6',
                      borderRadius: '10px', padding: isExpanded ? '14px' : '12px 14px', marginBottom: '10px',
                      background: hasConflict ? '#fef2f2' : '#fafafa',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      onClick={() => setExpandedSlotIndex(isExpanded ? null : index)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '10px' : 0, cursor: 'pointer', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hasConflict ? '#dc2626' : '#8B0000'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: hasConflict ? '#dc2626' : '#8B0000', flexShrink: 0 }}>
                          Slot {index + 1} {hasConflict && '⚠️ Bertindih'}
                        </span>
                        {!isExpanded && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {summaryText}
                          </span>
                        )}
                      </div>
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSlot(index) }}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}
                        >
                          Buang Slot
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={labelStyle}>
                            Booking Date <span style={{ color: '#dc2626' }}>*</span>{' '}
                            <span style={{ fontWeight: '400', color: '#9ca3af', fontSize: '12px' }}>(Min. 5 days)</span>
                          </label>
                          <BlackoutCalendar
                            value={slot.booking_date}
                            onChange={(date) => updateSlot(index, 'booking_date', date)}
                            minDate={getMinDate()}
                            placeholder="Pilih tarikh tempahan"
                            isAdmin={false}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={labelStyle}>Start Time <span style={{ color: '#dc2626' }}>*</span></label>
                            <input type="time" min="07:00" max="22:30" value={slot.start_time}
                              onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                              style={inputStyle}
                              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                          </div>
                          <div>
                            <label style={labelStyle}>End Time <span style={{ color: '#dc2626' }}>*</span></label>
                            <input type="time" min="07:00" max="22:30" value={slot.end_time}
                              onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                              style={inputStyle}
                              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                          </div>
                        </div>

                        <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>Additional Equipment</label>
                        {equipmentOptions.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {equipmentOptions.map((opt) => (
                              <EquipmentSelect
                                key={opt.id}
                                label={opt.label}
                                max={opt.max_quantity}
                                value={slot.equipment[opt.id] ?? 0}
                                onChange={(val) => updateSlotEquipment(index, opt.id, val)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {form.venue_id ? 'Tiada equipment tersedia untuk venue ini.' : 'Pilih venue dahulu untuk lihat equipment.'}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              <button
                type="button"
                onClick={addSlot}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px',
                  border: '1.5px dashed #d1d5db', background: 'transparent',
                  color: '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                + Tambah Hari / Slot Lain
              </button>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#92400e', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span><strong>Warning:</strong> Other equipment (rostrum, sofa, etc.) must be applied via "emajlis" web.</span>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={sectionBadge('3')}>3</div>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Upload Approval Paperwork <span style={{ color: '#dc2626' }}>*</span>
              </h2>
            </div>

            {file ? (
              <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '38px', height: '38px', flexShrink: 0, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} style={{ flexShrink: 0, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Buang</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false)
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped?.type === 'application/pdf') setFile(dropped)
                  else showToast('Hanya fail PDF dibenarkan.', 'error')
                }}
                style={{
                  border: `2px dashed ${dragOver ? '#8B0000' : '#e5e7eb'}`,
                  borderRadius: '12px', padding: '40px 24px', textAlign: 'center',
                  background: dragOver ? '#fef2f2' : '#fafafa',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ width: '44px', height: '44px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Only PDF files (Approval Documents) are allowed</p>
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => {
                    const selected = e.target.files?.[0]
                    if (selected?.type === 'application/pdf') setFile(selected)
                    else showToast('Hanya fail PDF dibenarkan.', 'error')
                  }} />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white', border: 'none', borderRadius: '12px', padding: '16px',
              fontSize: '16px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(139,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s', letterSpacing: '0.2px',
            }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Menghantar...
              </>
            ) : `Hantar Tempahan${slots.length > 1 ? ` (${slots.length} slot)` : ''} →`}
          </button>
        </div>
      </div>

      <footer style={{ background: '#111827', padding: '28px 24px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 12px', filter: 'brightness(0) invert(1)', opacity: 0.6 }} />
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
          © {new Date().getFullYear()} Sistem Tempahan Unit Kebudayaan. All rights reserved.
        </p>
      </footer>

      <style>{`
        .top-grid { grid-template-columns: 1fr 1fr; align-items: stretch; }
        @media (max-width: 768px) {
          .top-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  )
}