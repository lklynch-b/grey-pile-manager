import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPaints }   from '../slices/paintSlice';
import { fetchRecipes }  from '../slices/recipeSlice';
import { fetchRoster }   from '../slices/factionSlice';
import Header        from '../components/Header';
import Card          from '../components/Card';
import AddPaintModal   from './AddPaintModal';
import AddRecipeModal  from './AddRecipeModal';
import { Paint, PaintType } from '../types';

// Direction-B type → stage colour mapping
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

const PAINT_TYPES: PaintType[] = ['base', 'layer', 'wash', 'metallic', 'texture'];
const FILTERS = ['all', 'favourites', ...PAINT_TYPES] as const;
type Filter = typeof FILTERS[number];

export default function Paints() {
  const dispatch = useAppDispatch();
  const paints   = useAppSelector(s => s.paints.items);
  const recipes  = useAppSelector(s => s.recipes.items);
  const factions = useAppSelector(s => s.factions.items);

  const [search,          setSearch]          = useState('');
  const [filter,          setFilter]          = useState<Filter>('all');
  const [showAddPaint,    setShowAddPaint]    = useState(false);
  const [showAddRecipe,   setShowAddRecipe]   = useState(false);
  const [recipeSeedIds,   setRecipeSeedIds]   = useState<number[]>([]);

  useEffect(() => {
    dispatch(fetchPaints());
    dispatch(fetchRecipes());
    dispatch(fetchRoster());
  }, [dispatch]);

  const term = search.trim().toLowerCase();

  const visiblePaints = paints.filter(p => {
    if (term && !p.name.toLowerCase().includes(term)) return false;
    if (filter === 'favourites') return p.isFavourite;
    if (filter !== 'all')        return p.type === filter;
    return true;
  });

  const grouped = PAINT_TYPES
    .map(type => ({ type, items: visiblePaints.filter(p => p.type === type) }))
    .filter(g => g.items.length > 0);

  return (
    <>
      <Header
        title="Paint Library"
        sub={`${paints.length} pots · ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`}
      />

      {/* Search + add */}
      <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, height: 38, padding: '0 12px', border: '1px solid var(--edge)', borderRadius: 4, background: 'var(--card)', display: 'flex', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="find a colour, recipe…"
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink)' }}
          />
        </div>
        <button onClick={() => setShowAddPaint(true)} style={{
          width: 38, height: 38, borderRadius: 4, flexShrink: 0,
          background: 'var(--card)', border: '1px solid var(--edge)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-hand)', color: 'var(--accent)', fontSize: 22, fontWeight: 700,
          cursor: 'pointer',
        }}>+</button>
      </div>

      {showAddPaint && (
        <AddPaintModal
          onClose={() => setShowAddPaint(false)}
          onSaveAndMakeRecipe={(paint: Paint) => {
            setShowAddPaint(false);
            setRecipeSeedIds([paint.id]);
            setShowAddRecipe(true);
          }}
        />
      )}

      {showAddRecipe && (
        <AddRecipeModal
          initialPaintIds={recipeSeedIds}
          onClose={() => { setShowAddRecipe(false); setRecipeSeedIds([]); }}
        />
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const bg = active
            ? f === 'all' || f === 'favourites' ? 'var(--ink)' : TYPE_TAG[f as PaintType]
            : 'transparent';
          const color = active
            ? f === 'all' || f === 'favourites' ? 'var(--card)' : TYPE_INK[f as PaintType]
            : 'var(--ink2)';
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 4, flexShrink: 0,
              background: bg, color,
              border: `1px solid ${active ? bg : 'var(--edge)'}`,
              fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize',
            }}>
              {f === 'favourites' ? '★ Favourites' : f}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Saved recipes ─────────────────────────────────────── */}
        {recipes.length > 0 && (filter === 'all' || filter === 'favourites') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--ink)', transform: 'rotate(-0.5deg)' }}>
                saved recipes
              </div>
              <span className="t-micro">{recipes.length} mixes</span>
            </div>

            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px 6px' }}>
              {recipes.map((r, i) => {
                const faction = r.factionId ? factions.find(f => Number(f.id) === Number(r.factionId)) : null;
                const recipePaints = r.parts
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(pt => paints.find(p => Number(p.id) === Number(pt.paintId)))
                  .filter(Boolean);

                return (
                  <div key={r.id} style={{
                    minWidth: 196, background: 'var(--card)',
                    border: '1px solid var(--edge)', borderRadius: 4,
                    padding: 12, flexShrink: 0,
                    transform: `rotate(${i % 2 ? 0.7 : -0.7}deg)`,
                    boxShadow: '2px 3px 0 rgba(140,110,60,0.07)',
                  }}>
                    {/* Paint dot stack */}
                    <div style={{ display: 'flex', marginBottom: 10 }}>
                      {recipePaints.slice(0, 6).map((p, pi) => (
                        <div key={pi} style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: p!.hex,
                          border: '2px solid var(--card)',
                          marginLeft: pi === 0 ? 0 : -8,
                          boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.15)',
                        }} />
                      ))}
                      {recipePaints.length > 6 && (
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg2)', border: '2px solid var(--card)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink3)', fontWeight: 700 }}>
                          +{recipePaints.length - 6}
                        </div>
                      )}
                    </div>

                    <div className="t-list-title" style={{ fontSize: 13 }}>{r.name}</div>
                    {r.note && <div className="t-hand t-secondary" style={{ fontSize: 14, lineHeight: 1.1, marginTop: 4 }}>{r.note}</div>}

                    {faction && (
                      <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 3, background: 'var(--bg2)', border: '1px solid var(--edge)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: faction.accent ?? 'var(--ink3)' }} />
                        <span className="t-micro" style={{ textTransform: 'none' }}>{faction.name}</span>
                      </div>
                    )}

                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--rule)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink3)' }}>
                      {recipePaints.length} paint{recipePaints.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Paints grouped by type ────────────────────────────── */}
        {grouped.map(({ type, items }) => (
          <div key={type}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, textTransform: 'capitalize', color: 'var(--ink)' }}>
                {type}s
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
              <span className="t-micro">{items.length}</span>
            </div>

            <Card style={{ padding: 0 }}>
              {items.map((p, i) => {
                // Factions whose recipes include this paint
                const usedByFactions = factions.filter(f =>
                  recipes.some(r =>
                    Number(r.factionId) === Number(f.id) &&
                    r.parts.some(pt => Number(pt.paintId) === Number(p.id))
                  )
                );

                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderTop: i === 0 ? 'none' : '1px dashed var(--rule)',
                  }}>
                    {/* Paint swatch */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: p.hex,
                        border: '2px solid var(--card)',
                        boxShadow: `0 0 0 1px var(--edge), inset 0 -3px 4px rgba(0,0,0,0.18), inset 0 3px 4px rgba(255,255,255,0.25)`,
                      }} />
                      {p.isFavourite && (
                        <div style={{
                          position: 'absolute', top: -4, right: -4,
                          width: 15, height: 15, borderRadius: '50%',
                          background: 'var(--stage-painted-tag)',
                          color: 'var(--stage-painted-ink)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 700,
                          border: '1px solid var(--stage-painted-ink)55',
                        }}>★</div>
                      )}
                    </div>

                    {/* Name + type + faction */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="t-list-title">{p.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: TYPE_INK[p.type], background: TYPE_TAG[p.type], padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {p.type}
                        </span>
                      </div>
                      {usedByFactions.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {usedByFactions.map(f => (
                            <div key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 3, background: 'var(--bg2)', border: '1px solid var(--edge)' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: f.accent ?? 'var(--ink3)' }} />
                              <span className="t-micro" style={{ textTransform: 'none', fontSize: 9 }}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}

        {visiblePaints.length === 0 && (
          <p className="t-hand t-secondary" style={{ fontSize: 16, textAlign: 'center', paddingTop: 20 }}>
            {search ? 'no paints match that search' : 'no paints added yet'}
          </p>
        )}

      </div>
    </>
  );
}
