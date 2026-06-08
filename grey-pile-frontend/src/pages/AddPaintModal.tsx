import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { createPaint } from '../services/paintService';
import { Paint, PaintType } from '../types';

const PAINT_TYPES: PaintType[] = ['base', 'layer', 'wash', 'metallic', 'texture'];

const TYPE_TAG: Record<PaintType, string> = {
  base:     'var(--stage-built-tag)',
  layer:    'var(--stage-base-tag)',
  wash:     'var(--stage-unbuilt-tag)',
  metallic: 'var(--stage-primed-tag)',
  texture:  'var(--stage-painted-tag)',
};
const TYPE_INK: Record<PaintType, string> = {
  base:     'var(--stage-built-ink)',
  layer:    'var(--stage-base-ink)',
  wash:     'var(--stage-unbuilt-ink)',
  metallic: 'var(--stage-primed-ink)',
  texture:  'var(--stage-painted-ink)',
};

type AddPaintModalProps = {
  onClose: () => void;
  onSaveAndMakeRecipe?: (paint: Paint) => void;
};

export default function AddPaintModal({ onClose, onSaveAndMakeRecipe }: AddPaintModalProps) {
  const dispatch = useAppDispatch();

  const [name,        setName]        = useState('');
  const [hex,         setHex]         = useState('#a3c0a4');
  const [type,        setType]        = useState<PaintType>('base');
  const [isFavourite, setIsFavourite] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const canSave = name.trim() && /^#[0-9a-fA-F]{6}$/.test(hex);

  // Keep the text input and colour picker in sync
  const handleHexText = (raw: string) => {
    const val = raw.startsWith('#') ? raw : `#${raw}`;
    setHex(val);
  };

  const handleSave = async (andMakeRecipe = false) => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const paint = await dispatch(createPaint({ name: name.trim(), hex, type, isFavourite }));
      if (andMakeRecipe && onSaveAndMakeRecipe) {
        onSaveAndMakeRecipe(paint);
      } else {
        onClose();
      }
    } catch {
      setError('something went wrong — try again');
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(59,47,35,0.45)' }} />

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
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>New paint</div>
          <span onClick={onClose} className="t-hand t-secondary" style={{ fontSize: 22, cursor: 'pointer', paddingLeft: 12 }}>✕</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Colour preview + picker */}
          <div style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Big paint pot preview — tapping opens the native colour picker */}
            <label style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : 'var(--bg2)',
                boxShadow: `0 0 0 1px var(--edge), inset 0 -4px 6px rgba(0,0,0,0.18), inset 0 4px 6px rgba(255,255,255,0.25)`,
              }} />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#a3c0a4'}
                onChange={e => setHex(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
            </label>

            {/* Hex text input */}
            <div style={{ flex: 1 }}>
              <div className="t-section-label" style={{ marginBottom: 6 }}>hex colour</div>
              <input
                value={hex}
                onChange={e => handleHexText(e.target.value)}
                placeholder="#a3c0a4"
                maxLength={7}
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', borderBottom: '1px dashed var(--rule)',
                  outline: 'none', padding: '4px 0',
                  fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--ink)',
                }}
              />
              {hex && !/^#[0-9a-fA-F]{6}$/.test(hex) && (
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
                  needs to be a 6-digit hex code
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px dashed var(--rule)', padding: '14px 16px' }}>
            <div className="t-section-label" style={{ minWidth: 72 }}>Name</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Moss Green"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink)' }}
              autoFocus
            />
          </div>

          {/* Type selector */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div className="t-section-label" style={{ marginBottom: 12 }}>type</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {PAINT_TYPES.map(t => {
                const active = type === t;
                return (
                  <button key={t} onClick={() => setType(t)} style={{
                    flex: 1, padding: '8px 4px',
                    background: active ? TYPE_TAG[t] : 'transparent',
                    border: `1px ${active ? 'dashed' : 'solid'} ${active ? TYPE_INK[t] : 'transparent'}`,
                    borderRadius: 4, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    opacity: active ? 1 : 0.45,
                    transition: 'opacity 0.12s',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_TAG[t], border: `1px solid ${TYPE_INK[t]}` }} />
                    <span style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: TYPE_INK[t], fontWeight: 700, lineHeight: 1 }}>
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favourite toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px 16px' }}>
            <div className="t-section-label" style={{ minWidth: 72 }}>Favourite</div>
            <button
              onClick={() => setIsFavourite(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: 40, height: 22, borderRadius: 11,
                background: isFavourite ? 'var(--stage-painted-fill)' : 'var(--bg2)',
                border: `1px solid ${isFavourite ? 'var(--stage-painted-ink)' : 'var(--edge)'}`,
                position: 'relative', transition: 'background 0.15s',
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  left: isFavourite ? 20 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: isFavourite ? 'var(--stage-painted-ink)' : 'var(--ink3)',
                  transition: 'left 0.15s',
                }} />
              </div>
              <span className="t-hand t-secondary" style={{ fontSize: 16 }}>
                {isFavourite ? '★ marked as favourite' : 'mark as favourite'}
              </span>
            </button>
          </div>

          {error && <p className="t-hand" style={{ padding: '0 16px', fontSize: 14, color: 'var(--accent)' }}>{error}</p>}
          <div style={{ height: 8 }} />
        </div>

        {/* Save bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onSaveAndMakeRecipe && (
            <button onClick={() => handleSave(true)} disabled={!canSave || saving} className="btn btn--secondary">
              {saving ? 'adding…' : 'save & create recipe →'}
            </button>
          )}
          <button onClick={() => handleSave(false)} disabled={!canSave || saving} className="btn btn--primary">
            {saving ? 'adding…' : 'add paint'}
          </button>
        </div>
      </div>
    </>
  );
}
