import React from 'react';
import { Faction } from '../types';

type FactionPickerProps = {
  value: number | null;
  onChange: (id: number | null) => void;
  factions: Faction[];
};

export default function FactionPicker({ value, onChange, factions }: FactionPickerProps) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: '5px 12px', borderRadius: 4, flexShrink: 0,
          background: value === null ? 'var(--ink)' : 'transparent',
          color: value === null ? 'var(--card)' : 'var(--ink2)',
          border: `1px solid ${value === null ? 'var(--ink)' : 'var(--edge)'}`,
          fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        none
      </button>
      {factions.map(f => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(active ? null : f.id)}
            style={{
              padding: '5px 12px', borderRadius: 4, flexShrink: 0,
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--card)' : 'var(--ink2)',
              border: `1px solid ${active ? 'var(--ink)' : 'var(--edge)'}`,
              fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {f.accent && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.accent, flexShrink: 0 }} />
            )}
            {f.name}
          </button>
        );
      })}
    </div>
  );
}
