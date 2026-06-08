import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRoster } from '../slices/factionSlice';
import Header from '../components/Header';
import Card, { UnitRow } from '../components/Card';
import UnitModal from './UnitModal';

export default function Roster() {
  const dispatch = useAppDispatch();
  const factions = useAppSelector(s => s.factions.items);
  const loading  = useAppSelector(s => s.factions.loading);
  const error    = useAppSelector(s => s.factions.error);

  const [search,         setSearch]         = useState('');
  const [openUnitId,     setOpenUnitId]     = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchRoster());
  }, [dispatch]);

  const totalModels = factions.flatMap(f => f.units).reduce((a, u) => a + u.modelCount, 0);

  const term = search.trim().toLowerCase();
  const visibleFactions = term
    ? factions
        .map(f => ({
          ...f,
          units: f.name.toLowerCase().includes(term)
            ? f.units
            : f.units.filter(u => u.name.toLowerCase().includes(term)),
        }))
        .filter(f => f.units.length > 0)
    : factions;

  return (
    <>
      <Header title="The Roster" sub={`${factions.length} armies · ${totalModels} models`} />

      <div style={{ padding: '12px 16px 6px' }}>
        <div style={{
          height: 38, padding: '0 12px',
          border: '1px solid var(--edge)', borderRadius: 4, background: 'var(--card)',
          display: 'flex', alignItems: 'center',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search the roster…"
            disabled={loading || !!error}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-hand)', fontSize: 16, color: 'var(--ink)',
              opacity: loading || !!error ? 0.4 : 1,
              cursor:  loading || !!error ? 'not-allowed' : 'text',
            }}
          />
        </div>
      </div>

      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <p className="t-hand t-secondary" style={{ fontSize: 16 }}>couldn't load roster — try again</p>
        )}
        {loading && !factions.length && (
          <p className="t-micro t-secondary" style={{ padding: '8px 0' }}>loading…</p>
        )}
        {!loading && !error && factions.length === 0 && (
          <p className="t-hand t-secondary" style={{ fontSize: 16 }}>no armies yet — add one from the + tab</p>
        )}

        {visibleFactions.map(f => {
          const factionTotal = f.units.reduce((a, u) => a + u.modelCount, 0);
          return (
            <div key={f.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, fontWeight: 700 }}>
                  {f.name}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                <span className="t-micro">{factionTotal} models</span>
              </div>

              <Card style={{ padding: 0 }}>
                {f.units.map((u, i) => (
                  <UnitRow
                    key={u.id}
                    unit={u}
                    isFirst={i === 0}
                    onClick={() => setOpenUnitId(u.id)}
                  />
                ))}
              </Card>
            </div>
          );
        })}
      </div>

      {openUnitId !== null && (
        <UnitModal unitId={openUnitId} onClose={() => setOpenUnitId(null)} />
      )}
    </>
  );
}
