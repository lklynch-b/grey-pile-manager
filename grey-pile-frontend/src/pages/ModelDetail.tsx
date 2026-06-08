import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRecipes } from '../slices/recipeSlice';
import { fetchPaints } from '../slices/paintSlice';
import { advanceStage, assignRecipe } from '../services/rosterService';
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

export default function ModelDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const modelId  = Number(id);
  const models   = useAppSelector(s => s.models.items);
  const detail   = useAppSelector(s => s.units.detail);
  const recipes  = useAppSelector(s => s.recipes.items);
  const paints   = useAppSelector(s => s.paints.items);

  const [advancing, setAdvancing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    dispatch(fetchRecipes());
    dispatch(fetchPaints());
  }, [dispatch]);

  const model      = models.find(m => Number(m.id) === modelId);
  const modelIndex = models.findIndex(m => Number(m.id) === modelId);

  const recipe = model?.recipeId
    ? recipes.find(r => Number(r.id) === Number(model.recipeId))
    : null;

  const recipePaints = recipe
    ? [...recipe.parts]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(part => ({ part, paint: paints.find(p => Number(p.id) === Number(part.paintId)) }))
    : [];

  const handleAdvance = async () => {
    if (!model) return;
    setAdvancing(true);
    try { await dispatch(advanceStage(Number(model.id))); }
    finally { setAdvancing(false); }
  };

  const handleAssignRecipe = async (recipeId: number | null) => {
    if (!model) return;
    setAssigning(true);
    try { await dispatch(assignRecipe(modelId, recipeId)); }
    finally { setAssigning(false); }
  };

  // ── Not in state (navigated directly without opening unit modal) ─────────────
  if (!model) {
    return (
      <>
        <Header title="Model" sub="not loaded" />
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="t-hand t-secondary" style={{ fontSize: 17 }}>
            open a unit from the roster first to load its models
          </p>
          <button className="btn btn--ghost" onClick={() => navigate('/roster')}>
            ← roster
          </button>
        </div>
      </>
    );
  }

  const isPainted    = model.stage === 'painted';
  const unitLabel    = detail ? `${detail.factionName} — ${detail.name}` : '';
  const modelLabel   = modelIndex >= 0 ? `#${modelIndex + 1} of ${models.length}` : '';

  return (
    <>
      {/* Nav row */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>‹ back</button>
        {modelLabel && <span className="t-micro">{modelLabel}</span>}
      </div>

      <div style={{ padding: '4px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Polaroid */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {model.photoUrl
            ? <div className="polaroid">
                <img src={model.photoUrl} alt="model" style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 1 }} />
              </div>
            : <div className="polaroid rotate-neg-sm">
                <div className="polaroid__photo" style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--ink3)', fontWeight: 700 }}>
                    {modelIndex >= 0 ? `#${modelIndex + 1}` : '?'}
                  </div>
                  <div className="t-micro">no photo yet</div>
                </div>
                <span className="polaroid__caption">{detail?.name ?? 'model'}</span>
              </div>
          }
        </div>

        {/* Identity */}
        {unitLabel && (
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
              {detail!.name}
              {modelIndex >= 0 && (
                <span style={{ fontStyle: 'italic', color: 'var(--accent2)', marginLeft: 6 }}>№{modelIndex + 1}</span>
              )}
            </div>
            <div className="t-hand t-secondary" style={{ fontSize: 16 }}>{detail!.factionName}</div>
          </div>
        )}

        {/* Stage stepper */}
        <div className="card">
          <div className="t-section-label" style={{ marginBottom: 12 }}>progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {STAGE_ORDER.map((s: Stage) => {
              const reached = STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(model.stage);
              const current = s === model.stage;
              return (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: reached ? 1 : 0.3 }}>
                  <div style={{
                    width: current ? 14 : 10, height: current ? 14 : 10,
                    borderRadius: '50%',
                    background: reached ? `var(--stage-${s}-fill)` : 'var(--bg2)',
                    border: `2px solid var(--stage-${s}-ink)`,
                    transition: 'all 0.2s',
                  }} />
                  <span style={{ fontFamily: 'var(--font-hand)', fontSize: current ? 13 : 11, color: `var(--stage-${s}-ink)`, fontWeight: current ? 700 : 500 }}>
                    {STAGE_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 4, background: `var(--stage-${model.stage}-tag)`, border: `1px dashed var(--stage-${model.stage}-ink)55` }}>
            <div className="t-hand" style={{ fontSize: 17, color: `var(--stage-${model.stage}-ink)` }}>
              {isPainted ? 'this one\'s done ✓' : `up next → ${STAGE_LABELS[STAGE_ORDER[STAGE_ORDER.indexOf(model.stage) + 1]]}`}
            </div>
            {!isPainted && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                style={{ padding: '6px 14px', background: `var(--stage-painted-ink)`, color: '#fff', border: 'none', borderRadius: 4, fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 700, cursor: advancing ? 'not-allowed' : 'pointer', opacity: advancing ? 0.5 : 1 }}
              >
                {advancing ? '…' : 'advance stage'}
              </button>
            )}
          </div>
        </div>

        {/* Paint recipe */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div className="t-card-title">Paint recipe</div>
            {recipe && (
              <button
                onClick={() => handleAssignRecipe(null)}
                disabled={assigning}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-hand)', fontSize: 15, color: 'var(--ink3)' }}
              >
                clear
              </button>
            )}
          </div>

          {/* Recipe parts */}
          {recipe && recipePaints.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              background: `repeating-linear-gradient(to bottom, transparent 0 27px, var(--rule) 27px 28px)`,
              paddingTop: 4, marginBottom: 14,
            }}>
              {recipePaints.map(({ part, paint }) => (
                <div key={part.id} style={{ height: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: paint?.hex ?? 'var(--bg2)',
                    border: '1.5px solid rgba(59,47,35,0.2)',
                    boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.15), inset 0 2px 3px rgba(255,255,255,0.2)',
                  }} />
                  <span className="t-list-title" style={{ fontSize: 13 }}>{paint?.name ?? `paint #${part.paintId}`}</span>
                  {paint && (
                    <span className={`badge badge--${paint.type}`} style={{ fontSize: 9 }}>{paint.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {recipe && recipePaints.length === 0 && (
            <p className="t-hand t-secondary" style={{ fontSize: 15, marginBottom: 14 }}>recipe has no parts yet</p>
          )}

          {!recipe && (
            <p className="t-hand t-secondary" style={{ fontSize: 15, marginBottom: 14 }}>no recipe assigned</p>
          )}

          {/* Recipe picker */}
          {recipes.length > 0 && (
            <select
              value={model.recipeId ?? ''}
              disabled={assigning}
              onChange={e => handleAssignRecipe(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px dashed var(--edge)', borderRadius: 4,
                background: 'var(--card)', cursor: 'pointer',
                fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink)',
                appearance: 'none',
                opacity: assigning ? 0.5 : 1,
              }}
            >
              <option value="">{recipe ? 'change recipe…' : 'assign a recipe…'}</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          {recipes.length === 0 && !recipe && (
            <p className="t-micro t-secondary">no recipes saved yet — add some from the Paints tab</p>
          )}
        </div>

        {/* Notes */}
        {model.notes && (
          <div className="card rotate-pos-sm" style={{ background: 'var(--stage-primed-tag)' }}>
            <div className="t-section-label" style={{ marginBottom: 6 }}>notes</div>
            <div className="t-hand" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1.25 }}>
              {model.notes}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
