'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

type Venue = { id: string; name: string; code: string }
type Option = { id: string; venue_id: string; label: string; max_quantity: number; position: number }

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', color: '#111827', background: 'white',
}

export default function EquipmentOptionsClient({ venues, options: initialOptions }: { venues: Venue[]; options: Option[] }) {
  const [options, setOptions] = useState(initialOptions)
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id ?? '')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState({ label: '', max_quantity: '1' })
  const [newOption, setNewOption] = useState({ label: '', max_quantity: '1' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const venueOptions = options
    .filter(o => o.venue_id === selectedVenueId)
    .sort((a, b) => a.position - b.position)

  const addOption = async () => {
    if (!newOption.label.trim()) {
      showToast('Sila isi nama equipment.', 'error'); return
    }
    const { data, error } = await supabase
      .from('venue_equipment_options')
      .insert([{
        venue_id: selectedVenueId,
        label: newOption.label.trim(),
        max_quantity: Math.max(0, parseInt(newOption.max_quantity, 10) || 0),
        position: venueOptions.length,
      }])
      .select()
      .single()
    if (!error && data) {
      setOptions(prev => [...prev, data])
      setNewOption({ label: '', max_quantity: '10' })
      showToast('Equipment option ditambah!', 'success')
    } else {
      showToast('Ralat semasa menambah.', 'error')
    }
  }

  const startEdit = (opt: Option) => {
    setEditingId(opt.id)
    setEditValue({ label: opt.label, max_quantity: opt.max_quantity.toString() })
  }

  const saveEdit = async (id: string) => {
    const label = editValue.label.trim()
    if (!label) { setEditingId(null); return }
    const max_quantity = Math.max(0, parseInt(editValue.max_quantity, 10) || 0)
    const { error } = await supabase.from('venue_equipment_options').update({ label, max_quantity }).eq('id', id)
    if (!error) {
      setOptions(prev => prev.map(o => o.id === id ? { ...o, label, max_quantity } : o))
      showToast('Dikemaskini!', 'success')
    } else {
      showToast('Ralat semasa mengemaskini.', 'error')
    }
    setEditingId(null)
  }

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      deleteOption(id)
      setConfirmDeleteId(null)
      return
    }
    setConfirmDeleteId(id)
    setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
  }

  const deleteOption = async (id: string) => {
    const { error } = await supabase.from('venue_equipment_options').delete().eq('id', id)
    if (!error) {
      setOptions(prev => prev.filter(o => o.id !== id))
      showToast('Dipadam.', 'success')
    } else {
      showToast('Ralat semasa memadam.', 'error')
    }
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const reordered = [...venueOptions]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(index, 0, moved)
    // Update position field terus supaya render seterusnya (yang sort ikut position)
    // tak automatik batalkan susunan baru ni.
    const withNewPositions = reordered.map((o, i) => ({ ...o, position: i }))
    setDraggedIndex(index)
    setOptions(prev => [...prev.filter(o => o.venue_id !== selectedVenueId), ...withNewPositions])
  }
  const handleDragEnd = async () => {
    setDraggedIndex(null)
    const updates = venueOptions.map((o, index) => ({ id: o.id, venue_id: o.venue_id, label: o.label, position: index }))
    const { error } = await supabase.from('venue_equipment_options').upsert(updates)
    if (error) showToast('Ralat semasa kemaskini susunan.', 'error')
    else showToast('Susunan dikemaskini!', 'success')
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Equipment Options per Venue</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Tentukan senarai equipment (dan max quantity) yang boleh diminta dalam borang tempahan, ikut venue.
        </p>
      </div>

      {/* Venue selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {venues.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVenueId(v.id)}
            style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              border: selectedVenueId === v.id ? '1.5px solid #8B0000' : '1.5px solid #e5e7eb',
              background: selectedVenueId === v.id ? '#8B0000' : 'white',
              color: selectedVenueId === v.id ? 'white' : '#374151',
            }}
          >
            {v.name}
          </button>
        ))}
      </div>

      {venues.length === 0 && (
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>Tiada venue lagi -- tambah venue dulu dalam Settings.</p>
      )}

      {/* Options list */}
      <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
        {venueOptions.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Tiada equipment option untuk venue ni lagi.
          </div>
        ) : (
          venueOptions.map((opt, index) => {
            const isEditing = editingId === opt.id
            return (
              <div
                key={opt.id}
                draggable={!isEditing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
                  display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                  background: draggedIndex === index ? '#fef2f2' : 'white',
                  opacity: draggedIndex === index ? 0.6 : 1,
                  cursor: isEditing ? 'default' : 'grab',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                </svg>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                    <input value={editValue.label} onChange={(e) => setEditValue(p => ({ ...p, label: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: '140px' }} placeholder="Nama equipment" />
                    <input type="number" min="0" value={editValue.max_quantity} onChange={(e) => setEditValue(p => ({ ...p, max_quantity: e.target.value }))} style={{ ...inputStyle, width: '100px' }} placeholder="Max qty" />
                    <button onClick={() => saveEdit(opt.id)} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{opt.label}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>Max: {opt.max_quantity}</span>
                    <button onClick={() => startEdit(opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#8B0000'} onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(opt.id)}
                      style={{
                        background: confirmDeleteId === opt.id ? '#fef2f2' : 'none',
                        border: confirmDeleteId === opt.id ? '1px solid #fecaca' : 'none',
                        cursor: 'pointer', color: confirmDeleteId === opt.id ? '#dc2626' : '#d1d5db',
                        padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      {confirmDeleteId === opt.id && 'Confirm?'}
                    </button>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add new option */}
      {selectedVenueId && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={labelStyle}>Nama Equipment</label>
            <input
              type="text" placeholder="cth: Yoga Mat"
              value={newOption.label}
              onChange={(e) => setNewOption(p => ({ ...p, label: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ width: '110px' }}>
            <label style={labelStyle}>Max Qty</label>
            <input
              type="number" min="0"
              value={newOption.max_quantity}
              onChange={(e) => setNewOption(p => ({ ...p, max_quantity: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <button
            onClick={addOption}
            style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', height: '38px' }}
          >
            Tambah
          </button>
        </div>
      )}
    </div>
  )
}