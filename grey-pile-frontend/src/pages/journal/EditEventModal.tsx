import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addEventUnit, removeEventUnit } from '../../services/eventService';
import { Event } from '../../types';

type EditEventModalProps = {
  event: Event;
  onClose: () => void;
};

export default function EditEventModal({ event: ev, onClose }: EditEventModalProps) {
  const dispatch = useAppDispatch();
  const factions = useAppSelector(s => s.factions.items);

  const [pendingAdd,    setPendingAdd]    = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const allUnits = factions.flatMap(f => f.units.map(u => ({ ...u, factionName: f.name })));

  // Live event from store (unitIds update immediately after add/remove)
  const eventFromStore = useAppSelector(s => s.events.items.find(e => e.id === ev.id)) ?? ev;

  // Normalise to number — HotChocolate's Long scalar can deserialise as string or number
  const attachedSet    = new Set(eventFromStore.unitIds.map(Number));
  const attachedUnits  = allUnits.filter(u => attachedSet.has(Number(u.id)));
  const availableUnits = allUnits.filter(u => !attachedSet.has(Number(u.id)));

  const handleAdd = async (unitId: number) => {
    setPendingAdd(unitId);
    try {
      await dispatch(addEventUnit(ev.id, unitId));
    } finally {
      setPendingAdd(null);
    }
  };

  const handleRemove = async (unitId: number) => {
    setPendingRemove(unitId);
    try {
      await dispatch(removeEventUnit(ev.id, unitId));
    } finally {
      setPendingRemove(null);
    }
  };

  // Per-unit progress from roster store
  const progress = (unitId: number) => {
    const u = allUnits.find(u => u.id === unitId);
    if (!u) return { painted: 0, total: 0 };
    return { painted: u.stageCounts.painted ?? 0, total: u.modelCount };
  };

  const totalPainted  = attachedUnits.reduce((s, u) => s + (u.stageCounts.painted ?? 0), 0);
  const totalModels   = attachedUnits.reduce((s, u) => s + u.modelCount, 0);

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
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(59,47,35,0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
              {ev.name}
            </div>
            <div className="t-micro" style={{ marginTop: 3 }}>
              {new Date(ev.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              {totalModels > 0 && ` · ${totalPainted}/${totalModels} painted`}
            </div>
          </div>
          <span
            onClick={onClose}
            className="t-hand t-secondary"
            style={{ fontSize: 22, cursor: 'pointer', paddingLeft: 12 }}
          >
            ✕
          </span>
        </div>

        {/* Unit list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div className="t-section-label">units for this event</div>
            </div>

            {/* Attached units */}
            {attachedUnits.length === 0 && (
              <p className="t-hand t-secondary" style={{ fontSize: 15, marginBottom: 10 }}>
                no units added yet
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {attachedUnits.map(u => {
                const { painted, total } = progress(u.id);
                const pct = total > 0 ? Math.round((painted / total) * 100) : 0;
                const removing = pendingRemove === u.id;

                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 4,
                    background: 'var(--bg2)', border: '1px solid var(--edge)',
                    opacity: removing ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span className="t-list-title" style={{ fontSize: 13 }}>{u.name}</span>
                        <span className="t-micro">×{u.modelCount}</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 2, background: 'var(--card)', border: '1px solid var(--edge)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: ev.color, transition: 'width 0.3s' }} />
                        </div>
                        <span className="t-micro">{painted}/{total}</span>
                      </div>
                    </div>
                    <span className="t-micro t-secondary" style={{ marginRight: 4 }}>{u.factionName}</span>
                    <button
                      onClick={() => handleRemove(u.id)}
                      disabled={removing}
                      style={{
                        background: 'none', border: 'none', cursor: removing ? 'not-allowed' : 'pointer',
                        color: 'var(--ink3)', fontSize: 18, lineHeight: 1, padding: '2px 4px',
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add unit picker */}
            {availableUnits.length > 0 && (
              <select
                value=""
                onChange={e => { if (e.target.value) handleAdd(Number(e.target.value)); }}
                disabled={pendingAdd !== null}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px dashed var(--edge)', borderRadius: 4,
                  background: 'var(--card)', cursor: 'pointer',
                  fontFamily: 'var(--font-hand)', fontSize: 16,
                  color: pendingAdd !== null ? 'var(--ink3)' : 'var(--ink3)',
                  appearance: 'none',
                  opacity: pendingAdd !== null ? 0.5 : 1,
                }}
              >
                <option value="">{pendingAdd !== null ? 'adding…' : '+ add a unit…'}</option>
                {factions.map(f => (
                  <optgroup key={f.id} label={f.name}>
                    {f.units
                      .filter(u => !attachedSet.has(Number(u.id)))
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

            {availableUnits.length === 0 && attachedUnits.length > 0 && (
              <p className="t-hand t-secondary" style={{ fontSize: 15 }}>all roster units added</p>
            )}
          </div>

          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  );
}
