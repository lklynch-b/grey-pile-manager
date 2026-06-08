import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { createRecipe } from '../services/paintService';
import FactionPicker from '../components/FactionPicker';

type AddRecipeModalProps = {
  initialPaintIds?: number[];
  onClose: () => void;
};

export default function AddRecipeModal({ initialPaintIds = [], onClose }: AddRecipeModalProps) {
  const dispatch  = useAppDispatch();
  const factions  = useAppSelector(s => s.factions.items);
  const allPaints = useAppSelector(s => s.paints.items);

  const [name,       setName]       = useState('');
  const [note,       setNote]       = useState('');
  const [factionId,  setFactionId]  = useState<number | null>(null);
  const [partIds,    setPartIds]    = useState<number[]>(initialPaintIds);
  const [paintSearch, setPaintSearch] = useState('');
  const [showPicker,  setShowPicker]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  const availablePaints = allPaints.filter(p =>
    !partIds.includes(p.id) &&
    (paintSearch.trim() === '' || p.name.toLowerCase().includes(paintSearch.trim().toLowerCase()))
  );

  const addPart = (paintId: number) => {
    setPartIds(ids => [...ids, paintId]);
    setPaintSearch('');
    setShowPicker(false);
  };

  const removePart = (paintId: number) => {
    setPartIds(ids => ids.filter(id => id !== paintId));
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await dispatch(createRecipe({ name: name.trim(), note: note.trim() || undefined, factionId, paintIds: partIds }));
      onClose();
    } catch {
      setError('something went wrong — try again');
      setSaving(false);
    }
  };

  const partPaints = partIds.map(id => allPaints.find(p => p.id === id)).filter(Boolean) as typeof allPaints;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(59,47,35,0.45)' }} />

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--card)',
        borderRadius: '12px 12px 0 0',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(59,47,35,0.18)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>New recipe</div>
          <span onClick={onClose} className="t-hand t-secondary" style={{ fontSize: 22, cursor: 'pointer', paddingLeft: 12 }}>✕</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px dashed var(--rule)', padding: '14px 16px' }}>
            <div className="t-section-label" style={{ minWidth: 72 }}>Name</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Verdant Host Cloak"
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink)' }}
            />
          </div>

          {/* Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px dashed var(--rule)', padding: '14px 16px' }}>
            <div className="t-section-label" style={{ minWidth: 72 }}>Note</div>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="optional notes…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink)' }}
            />
          </div>

          {/* Faction */}
          {factions.length > 0 && (
            <div style={{ padding: '14px 16px', borderBottom: '1px dashed var(--rule)' }}>
              <div className="t-section-label" style={{ marginBottom: 10 }}>army</div>
              <FactionPicker value={factionId} onChange={setFactionId} factions={factions} />
            </div>
          )}

          {/* Paints / parts */}
          <div style={{ padding: '14px 16px' }}>
            <div className="t-section-label" style={{ marginBottom: 10 }}>paints</div>

            {/* Selected parts */}
            {partPaints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {partPaints.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: p.hex,
                      boxShadow: '0 0 0 1px var(--edge), inset 0 -2px 3px rgba(0,0,0,0.15)',
                    }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--ink)' }}>
                      {p.name}
                    </span>
                    <span className="t-micro" style={{ marginRight: 4 }}>#{i + 1}</span>
                    <button
                      onClick={() => removePart(p.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink3)', lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add paint button */}
            {!showPicker && (
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 4, cursor: 'pointer',
                  background: 'transparent', border: '1px dashed var(--edge)',
                  fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink2)',
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, color: 'var(--accent)' }}>+</span>
                add a paint
              </button>
            )}

            {/* Paint picker */}
            {showPicker && (
              <div style={{ border: '1px solid var(--edge)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px dashed var(--rule)', gap: 8 }}>
                  <input
                    value={paintSearch}
                    onChange={e => setPaintSearch(e.target.value)}
                    placeholder="search paints…"
                    autoFocus
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink)' }}
                  />
                  <span onClick={() => { setShowPicker(false); setPaintSearch(''); }} className="t-hand t-secondary" style={{ fontSize: 18, cursor: 'pointer' }}>✕</span>
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {availablePaints.length === 0 ? (
                    <div className="t-hand t-secondary" style={{ padding: '12px 14px', fontSize: 15 }}>
                      {paintSearch ? 'no paints match' : 'all paints already added'}
                    </div>
                  ) : (
                    availablePaints.slice(0, 20).map((p, i) => (
                      <div
                        key={p.id}
                        onClick={() => addPart(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 14px', cursor: 'pointer',
                          borderTop: i === 0 ? 'none' : '1px dashed var(--rule)',
                        }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: p.hex, boxShadow: '0 0 0 1px var(--edge)' }} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                        <span className="t-micro" style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{p.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="t-hand" style={{ padding: '0 16px', fontSize: 14, color: 'var(--accent)' }}>{error}</p>}
          <div style={{ height: 8 }} />
        </div>

        {/* Save bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)', flexShrink: 0 }}>
          <button onClick={handleSave} disabled={!canSave || saving} className="btn btn--primary">
            {saving ? 'saving…' : 'save recipe'}
          </button>
        </div>
      </div>
    </>
  );
}
