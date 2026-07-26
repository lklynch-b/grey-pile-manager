import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createEvent } from '../../services/eventService';
import { Unit } from '../../types';

const EVENT_COLOURS = [
  { label: 'Tournament', value: '#b6553e' },
  { label: 'Game night', value: '#5d7c63' },
  { label: 'Personal', value: '#9a8cb8' },
];

type AddEventModalProps = {
  onClose: () => void;
};

export default function AddEventModal({ onClose }: AddEventModalProps) {
  const dispatch = useAppDispatch();
  const factions = useAppSelector(s => s.factions.items);

  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [scope, setScope] = useState('');
  const [color, setColor] = useState('#b6553e');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Units selected for this event
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);

  // Flat list of all units with their faction name attached
  const allUnits: (Unit & { factionName: string })[] = factions.flatMap(f =>
    f.units.map(u => ({ ...u, factionName: f.name }))
  );
  const selectedSet = new Set(selectedUnitIds.map(Number));
  const unselected = allUnits.filter(u => !selectedSet.has(Number(u.id)));
  const selected = selectedUnitIds.map(id => allUnits.find(u => Number(u.id) === Number(id))).filter(Boolean) as (Unit & { factionName: string })[];

  // Total derived from selected units' model counts
  const modelsNeeded = selected.reduce((sum, u) => sum + u.modelCount, 0);

  const addUnit = (id: number) => setSelectedUnitIds(ids => [...ids, id]);
  const removeUnit = (id: number) => setSelectedUnitIds(ids => ids.filter(i => i !== id));

  const shortName = name.trim().split(' ')[0].slice(0, 8);
  const canSave = name.trim() && eventDate;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await dispatch(createEvent({
        name: name.trim(),
        shortName,
        venue: venue.trim() || undefined,
        eventDate,
        scope: scope.trim(),
        modelsNeeded,
        color,
        unitIds: selectedUnitIds,
      }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong — try again');
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(59,47,35,0.45)' }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--card)',
        borderRadius: '12px 12px 0 0',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(59,47,35,0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)', flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
            New event
          </div>
          <span onClick={onClose} className="t-hand t-secondary" style={{ fontSize: 22, cursor: 'pointer', paddingLeft: 12 }}>
            ✕
          </span>
        </div>

        {/* Form */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          <ModalRow label="Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Tournament" style={inputStyle} autoFocus />
          </ModalRow>

          <ModalRow label="Date">
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontWeight: 600,
                color: eventDate ? 'var(--ink)' : 'var(--ink3)',
                colorScheme: 'light',
                cursor: 'pointer',
              }}
            />
          </ModalRow>

          <ModalRow label="Venue">
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="optional" style={inputStyle} />
          </ModalRow>

          <ModalRow label="Scope">
            <input value={scope} onChange={e => setScope(e.target.value)} placeholder="e.g. 2000pt fully painted" style={inputStyle} />
          </ModalRow>

          {/* Units roster ─────────────────────────────────────────── */}
          <div style={{ padding: '16px 16px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div className="t-section-label">units needed</div>
              {modelsNeeded > 0 && (
                <span className="t-micro">{modelsNeeded} models total</span>
              )}
            </div>

            {/* Selected units */}
            {selected.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {selected.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 4,
                    background: 'var(--bg2)', border: '1px solid var(--edge)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="t-list-title" style={{ fontSize: 13 }}>{u.name}</span>
                      <span className="t-micro" style={{ marginLeft: 6 }}>×{u.modelCount}</span>
                    </div>
                    <span className="t-hand--sm t-secondary" style={{ fontSize: 12 }}>{u.factionName}</span>
                    <button
                      onClick={() => removeUnit(u.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Unit picker */}
            {unselected.length > 0 && (
              <select
                value=""
                onChange={e => { if (e.target.value) addUnit(Number(e.target.value)); }}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px dashed var(--edge)', borderRadius: 4,
                  background: 'var(--card)', cursor: 'pointer',
                  fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink3)',
                  appearance: 'none',
                }}
              >
                <option value="">+ add a unit…</option>
                {factions.map(f => (
                  <optgroup key={f.id} label={f.name}>
                    {f.units
                      .filter(u => !selectedSet.has(Number(u.id)))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} (×{u.modelCount})
                        </option>
                      ))
                    }
                  </optgroup>
                ))}
              </select>
            )}

            {factions.length === 0 && (
              <p className="t-hand t-secondary" style={{ fontSize: 15 }}>add units to your roster first</p>
            )}
          </div>

          {/* Event type / colour */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div className="t-section-label" style={{ marginBottom: 12 }}>event type</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {EVENT_COLOURS.map(c => {
                const active = color === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    style={{
                      flex: 1, padding: '10px 6px',
                      background: active ? c.value : 'transparent',
                      border: `2px solid ${c.value}`,
                      borderRadius: 6, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: active ? '#fff' : c.value,
                      border: `2px solid ${active ? '#fff' : c.value}`,
                      opacity: active ? 1 : 0.7,
                    }} />
                    <span style={{ fontFamily: 'var(--font-hand)', fontSize: 13, fontWeight: 700, color: active ? '#fff' : c.value }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="t-hand" style={{ padding: '0 16px', fontSize: 14, color: 'var(--accent)', marginTop: 8 }}>{error}</p>
          )}
          <div style={{ height: 8 }} />
        </div>

        {/* Save bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)', flexShrink: 0 }}>
          <button onClick={handleSave} disabled={!canSave || saving} className="btn btn--primary">
            {saving ? 'saving…' : 'add event'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ModalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px dashed var(--rule)', padding: '14px 16px',
    }}>
      <div className="t-section-label" style={{ minWidth: 72 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink)',
};
