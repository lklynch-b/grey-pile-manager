import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchRoster } from '../../slices/factionSlice';
import { fetchEvents } from '../../slices/eventSlice';
import Header from '../../components/Header';
import AddEventModal  from './AddEventModal';
import EditEventModal from './EditEventModal';
import Card, { DatePlaque, EventRow, StageBar, FactionRow, CalendarCard, EventWithDays } from '../../components/Card';
import { STAGE_ORDER } from '../../utils/stageUtils';
import { StageCounts, Stage } from '../../types';

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function sumStageCounts(counts: StageCounts[]): StageCounts {
  return counts.reduce(
    (acc, c) => ({
      unbuilt: acc.unbuilt + c.unbuilt,
      built:   acc.built   + c.built,
      primed:  acc.primed  + c.primed,
      base:    acc.base    + c.base,
      painted: acc.painted + c.painted,
    }),
    { unbuilt: 0, built: 0, primed: 0, base: 0, painted: 0 },
  );
}

export default function Journal() {
  const dispatch        = useAppDispatch();
  const stats           = useAppSelector(s => s.stats.data);
  const events          = useAppSelector(s => s.events.items);
  const factions        = useAppSelector(s => s.factions.items);
  const factionsLoading  = useAppSelector(s => s.factions.loading);
  const factionsError    = useAppSelector(s => s.factions.error);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editEvent,    setEditEvent]    = useState<typeof upcomingEvents[0] | null>(null);

  const todaysDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    dispatch(fetchRoster());
    dispatch(fetchEvents());
  }, [dispatch]);

  const upcomingEvents: EventWithDays[] = events
    .map(e => ({ ...e, daysLeft: daysUntil(e.eventDate) }))
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nextEvent = upcomingEvents[0] ?? null;

  // Convert Stats.perStage array → StageCounts object for StageBar
  const statsStageCounts: StageCounts | null = stats
    ? {
        unbuilt: stats.perStage.find(p => p.stage === 'unbuilt')?.count ?? 0,
        built:   stats.perStage.find(p => p.stage === 'built')?.count   ?? 0,
        primed:  stats.perStage.find(p => p.stage === 'primed')?.count  ?? 0,
        base:    stats.perStage.find(p => p.stage === 'base')?.count    ?? 0,
        painted: stats.perStage.find(p => p.stage === 'painted')?.count ?? 0,
      }
    : null;

  return (
    <>
      <Header title="The Workbench" sub={todaysDate} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Stats / pile card ───────────────────────────────── */}
        {stats && statsStageCounts && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                  {stats.painted}
                  <span className="t-tertiary" style={{ fontWeight: 400 }}> / {stats.total}</span>
                </div>
                <div className="t-micro" style={{ marginTop: 4 }}>models painted</div>
              </div>
              <div className="t-hand--accent" style={{ marginTop: 6 }}>{stats.pile} on the sprue</div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--rule)' }}>
              <span className="t-section-label">The pile</span>
              <StageBar stageCounts={statsStageCounts} total={stats.total} height={14} border style={{ marginTop: 8 }} />
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                {STAGE_ORDER.map((s: Stage) => <span key={s} className="t-micro">{s}</span>)}
              </div>
            </div>
          </Card>
        )}

        {/* ── Next deadline (hero) ────────────────────────────── */}
        {nextEvent && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <EventRow event={nextEvent} size="hero" isLast />
          </Card>
        )}

        {/* ── 4-week calendar ─────────────────────────────────── */}
        <CalendarCard events={events} />

        {/* ── Upcoming deadlines list ─────────────────────────── */}
        <Card title="Upcoming" action={{ displayText: '+ event', onClick: () => setShowAddEvent(true) }}>
          {upcomingEvents.length === 0
            ? <p className="t-hand t-secondary" style={{ fontSize: 16 }}>nothing on the calendar yet</p>
            : upcomingEvents.map((e, i) => (
                <EventRow
                  key={e.id}
                  event={e}
                  size="list"
                  isLast={i === upcomingEvents.length - 1}
                  onClick={() => setEditEvent(e)}
                />
              ))
          }
        </Card>

        {/* ── By army ─────────────────────────────────────────── */}
        <Card title="By army">
          {factionsError && (
            <p className="t-hand t-secondary" style={{ fontSize: 16 }}>couldn't load armies — try again</p>
          )}
          {factionsLoading && !factions.length && (
            <p className="t-micro t-secondary">loading…</p>
          )}
          {!factionsLoading && !factionsError && factions.length === 0 && (
            <p className="t-hand t-secondary" style={{ fontSize: 16 }}>no armies yet — add one from the roster</p>
          )}
          {factions.map((f, i) => {
            const stageCounts   = sumStageCounts(f.units.map(u => u.stageCounts));
            const totalModels   = f.units.reduce((a, u) => a + u.modelCount, 0);
            const paintedModels = stageCounts.painted;
            const avgPct        = Math.round(
              f.units.reduce((a, u) => a + u.completionPct, 0) / Math.max(1, f.units.length),
            );
            return (
              <FactionRow
                key={f.id}
                name={f.name}
                painted={paintedModels}
                total={totalModels}
                stageCounts={stageCounts}
                completionPct={avgPct}
                isFirst={i === 0}
              />
            );
          })}
        </Card>

      </div>

      {showAddEvent && <AddEventModal  onClose={() => setShowAddEvent(false)} />}
      {editEvent    && <EditEventModal event={editEvent} onClose={() => setEditEvent(null)} />}
    </>
  );
}
