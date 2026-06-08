import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchUnitDetail } from '../slices/unitSlice';
import { advanceStage, addModels, deleteModel, deleteUnit } from '../services/rosterService';
import { Stage } from '../types';
import { STAGE_ORDER } from '../utils/stageUtils';

const STAGE_LABELS: Record<Stage, string> = {
  unbuilt: 'unbuilt',
  built:   'built',
  primed:  'primed',
  base:    'base coat',
  painted: 'painted',
};

type UnitModalProps = {
  unitId: number;
  onClose: () => void;
};

export default function UnitModal({ unitId, onClose }: UnitModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const detail   = useAppSelector(s => s.units.detail);
  const models   = useAppSelector(s => s.models.items);
  const loading  = useAppSelector(s => s.units.loading);

  const [advancing,         setAdvancing]         = useState<number | null>(null);
  const [deleting,          setDeleting]          = useState<number | null>(null);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(false);
  const [deletingUnit,      setDeletingUnit]      = useState(false);
  const [showAddForm,       setShowAddForm]        = useState(false);
  const [addStage,          setAddStage]           = useState<Stage>('unbuilt');
  const [addCount,          setAddCount]           = useState(1);
  const [adding,            setAdding]             = useState(false);

  useEffect(() => {
    dispatch(fetchUnitDetail(unitId));
  }, [dispatch, unitId]);

  const handleAdvance = async (modelId: number) => {
    setAdvancing(modelId);
    try { await dispatch(advanceStage(modelId)); }
    finally { setAdvancing(null); }
  };

  const handleDelete = (modelId: number) => {
    if (models.length === 1) {
      // Last model — ask before nuking the whole unit
      setConfirmDeleteUnit(true);
    } else {
      doDeleteModel(modelId);
    }
  };

  const doDeleteModel = async (modelId: number) => {
    setDeleting(modelId);
    try { await dispatch(deleteModel(modelId, unitId)); }
    finally { setDeleting(null); }
  };

  const handleDeleteUnit = async () => {
    setDeletingUnit(true);
    await dispatch(deleteUnit(unitId));
    onClose();
  };

  const handleAddModels = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await dispatch(addModels({ unitId, count: addCount, stage: addStage }));
      setShowAddForm(false);
      setAddCount(1);
      setAddStage('unbuilt');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(59, 47, 35, 0.45)' }} />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--card)',
        borderRadius: '12px 12px 0 0',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(59, 47, 35, 0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
              {detail?.id === unitId ? detail.name : '…'}
            </div>
            {detail?.id === unitId && (
              <div className="t-micro" style={{ marginTop: 3 }}>
                {detail.factionName} · {models.length} model{models.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <span onClick={onClose} className="t-hand t-secondary" style={{ fontSize: 22, cursor: 'pointer', paddingLeft: 12 }}>✕</span>
        </div>

        {/* Model list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <p className="t-micro t-secondary" style={{ padding: '16px' }}>loading models…</p>}

          {!loading && models.map((m, i) => {
            const isPainted  = m.stage === 'painted';
            const isAdvancing = advancing === m.id;
            const isDeleting  = deleting  === m.id;

            return (
              <div key={m.id} style={{
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderTop: i === 0 ? 'none' : '1px dashed var(--rule)',
                opacity: isDeleting ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}>
                {/* Photo — tap to open model detail */}
                <div onClick={() => navigate(`/roster/models/${m.id}`)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt={`model ${i + 1}`} style={{ width: 52, height: 52, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--edge)' }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 4, background: 'var(--bg2)', border: '1px solid var(--edge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink3)' }}>
                        #{i + 1}
                      </div>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className={`badge badge--${m.stage}`}>{STAGE_LABELS[m.stage]}</span>
                  {m.notes && <div className="t-hand t-secondary" style={{ fontSize: 14, marginTop: 5, lineHeight: 1.2 }}>{m.notes}</div>}
                </div>

                {/* Advance */}
                {!isPainted && (
                  <button
                    onClick={() => handleAdvance(m.id)}
                    disabled={isAdvancing || isDeleting}
                    style={{ flexShrink: 0, padding: '6px 10px', background: 'transparent', border: '1px solid var(--accent)', borderRadius: 4, fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', cursor: isAdvancing ? 'not-allowed' : 'pointer', opacity: isAdvancing ? 0.5 : 1 }}
                  >
                    {isAdvancing ? '…' : 'advance →'}
                  </button>
                )}
                {isPainted && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stage-painted-ink)', fontWeight: 700, flexShrink: 0 }}>done ✓</span>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={isDeleting || isAdvancing}
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', color: 'var(--ink3)', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}
                  title="remove model"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Last-model confirmation */}
          {confirmDeleteUnit && (
            <div style={{
              margin: '0 16px 12px', padding: '14px',
              background: 'var(--stage-painted-tag)', borderRadius: 4,
              border: '1px dashed var(--stage-painted-ink)',
            }}>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 17, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 12 }}>
                that's the last model — remove the whole unit?
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteUnit}
                  disabled={deletingUnit}
                  style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: deletingUnit ? 0.6 : 1 }}
                >
                  {deletingUnit ? 'removing…' : 'yes, remove unit'}
                </button>
                <button
                  onClick={() => setConfirmDeleteUnit(false)}
                  disabled={deletingUnit}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--edge)', borderRadius: 4, fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', cursor: 'pointer' }}
                >
                  cancel
                </button>
              </div>
            </div>
          )}

          {/* Add models section */}
          <div style={{ padding: '12px 16px', borderTop: models.length ? '1px dashed var(--rule)' : 'none' }}>
            {!showAddForm
              ? <button
                  onClick={() => setShowAddForm(true)}
                  style={{ background: 'none', border: '1px dashed var(--edge)', borderRadius: 4, width: '100%', padding: '10px', cursor: 'pointer', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink3)' }}
                >
                  + add models
                </button>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Stage selector */}
                  <div>
                    <div className="t-section-label" style={{ marginBottom: 8 }}>starting stage</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {STAGE_ORDER.map(s => {
                        const active = addStage === s;
                        return (
                          <button key={s} onClick={() => setAddStage(s)} style={{
                            flex: 1, padding: '7px 4px',
                            background: active ? `var(--stage-${s}-tag)` : 'transparent',
                            border: `1px ${active ? 'dashed' : 'solid'} ${active ? `var(--stage-${s}-ink)` : 'transparent'}`,
                            borderRadius: 4, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            opacity: active ? 1 : 0.45,
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--stage-${s}-fill)`, border: `1px solid var(--stage-${s}-ink)` }} />
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: 10, color: `var(--stage-${s}-ink)`, fontWeight: 700, lineHeight: 1 }}>
                              {STAGE_LABELS[s]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Count + confirm row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => setAddCount(c => Math.max(1, c - 1))} style={stepperBtn}>−</button>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{addCount}</span>
                      <button onClick={() => setAddCount(c => c + 1)} style={stepperBtn}>+</button>
                    </div>
                    <button
                      onClick={handleAddModels}
                      disabled={adding}
                      className="btn btn--primary"
                      style={{ flex: 1, height: 38, fontSize: 13 }}
                    >
                      {adding ? 'adding…' : `add ${addCount} model${addCount !== 1 ? 's' : ''}`}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink3)', padding: '0 4px' }}
                    >
                      cancel
                    </button>
                  </div>
                </div>
              )
            }
          </div>

          <div style={{ height: 8 }} />
        </div>
      </div>
    </>
  );
}

const stepperBtn: React.CSSProperties = {
  width: 30, height: 30, flexShrink: 0,
  border: '1px solid var(--edge)', borderRadius: 4,
  background: 'var(--card)', cursor: 'pointer',
  fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--ink)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
