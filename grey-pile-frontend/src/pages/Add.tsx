import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRoster } from '../slices/factionSlice';
import { createUnitWithModels } from '../services/rosterService';
import Header from '../components/Header';
import { STAGE_ORDER } from '../utils/stageUtils';
import { Stage } from '../types';

const STAGE_LABELS: Record<Stage, string> = {
  unbuilt: 'unbuilt',
  built:   'built',
  primed:  'primed',
  base:    'base coat',
  painted: 'painted',
};

export default function Add() {
  const dispatch = useAppDispatch();
  const factions = useAppSelector(s => s.factions.items);
  const navigate = useNavigate();

  const [factionSelect,   setFactionSelect]   = useState('');
  const [newFactionName,  setNewFactionName]   = useState('');
  const [unitName,        setUnitName]         = useState('');
  const [count,           setCount]            = useState(1);
  const [stage,           setStage]            = useState<Stage>('unbuilt');
  const [photoSrc,        setPhotoSrc]         = useState<string | null>(null);
  const [saving,          setSaving]           = useState(false);
  const [error,           setError]            = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchRoster());
  }, [dispatch]);

  const isNewArmy    = factionSelect === '__new__' || factions.length === 0;
  const factionName  = isNewArmy ? newFactionName.trim() : factionSelect;
  const canSave      = factionName && unitName.trim() && count > 0;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await dispatch(createUnitWithModels({
        factionName,
        unitName: unitName.trim(),
        count,
        stage,
      }));
      navigate('/roster');
    } catch {
      setError('something went wrong — try again');
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="New Unit" sub="add to the roster" />

      <div style={{ padding: '16px 16px 160px', display: 'flex', flexDirection: 'column' }}>

        {/* Polaroid photo picker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div
            onClick={() => fileRef.current?.click()}
            className="polaroid rotate-neg-md"
            style={{ cursor: 'pointer', width: 156 }}
          >
            {photoSrc
              ? <img src={photoSrc} alt="unit" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 1 }} />
              : <div className="polaroid__photo" style={{ width: 140, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ fontSize: 24, color: 'var(--ink3)' }}>◔</div>
                  <div className="t-micro">tap to snap</div>
                </div>
            }
            <span className="polaroid__caption">{photoSrc ? 'tap to change' : 'optional photo'}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        {/* Army */}
        <FormRow label="Army">
          {factions.length > 0 && (
            <select
              value={factionSelect}
              onChange={e => setFactionSelect(e.target.value)}
              style={selectStyle}
            >
              <option className='t-list-title' value="">choose an army…</option>
              {factions.map(f => (
                <option className='t-list-title' key={f.id} value={f.name}>{f.name}</option>
              ))}
              <option className='t-list-title' value="__new__">+ new army</option>
            </select>
          )}
          {isNewArmy && (
            <input
              value={newFactionName}
              onChange={e => setNewFactionName(e.target.value)}
              placeholder="army name…"
              style={{ ...inputStyle, marginTop: factions.length > 0 ? 8 : 0 }}
              autoFocus={factions.length === 0}
            />
          )}
        </FormRow>

        {/* Unit name */}
        <FormRow label="Unit name">
          <input
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            placeholder="e.g. Thornblade Riders"
            style={inputStyle}
          />
        </FormRow>

        {/* Count */}
        <FormRow label="How many">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setCount(c => Math.max(1, c - 1))} style={stepperBtn}>−</button>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
              {count}
            </span>
            <button onClick={() => setCount(c => c + 1)} style={stepperBtn}>+</button>
          </div>
        </FormRow>

        {/* Starting stage */}
        <div style={{ paddingTop: 20 }}>
          <div className="t-section-label" style={{ marginBottom: 12 }}>starting stage</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STAGE_ORDER.map(s => {
              const active = stage === s;
              return (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  style={{
                    flex: 1, padding: '8px 4px',
                    background: active ? `var(--stage-${s}-tag)` : 'transparent',
                    border: `1px ${active ? 'dashed' : 'solid'} ${active ? `var(--stage-${s}-ink)` : 'transparent'}`,
                    borderRadius: 4, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    opacity: active ? 1 : 0.45,
                    transition: 'opacity 0.12s',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: `var(--stage-${s}-fill)`,
                    border: `1px solid var(--stage-${s}-ink)`,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-hand)', fontSize: 11,
                    color: `var(--stage-${s}-ink)`, fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {STAGE_LABELS[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="t-hand" style={{ fontSize: 14, marginTop: 16, color: 'var(--accent)' }}>{error}</p>
        )}
      </div>

      {/* Sticky save bar — sits above the tab bar (64px) */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 101,
        padding: '12px 16px',
        background: 'var(--card)', borderTop: '1px solid var(--edge)',
      }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="btn btn--primary"
        >
          {saving ? 'adding…' : 'add to the roster'}
        </button>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px dashed var(--rule)', padding: '14px 4px',
    }}>
      <div className="t-section-label" style={{ minWidth: 80 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink)',
};

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  fontFamily: 'var(--font-hand)', fontSize: 18, color: 'var(--ink)',
  appearance: 'none', cursor: 'pointer',
};

const stepperBtn: React.CSSProperties = {
  width: 32, height: 32, flexShrink: 0,
  border: '1px solid var(--edge)', borderRadius: 4,
  background: 'var(--card)', cursor: 'pointer',
  fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
