import React, { useState } from 'react';
import { useAppSelector } from '../store';
import { Event, StageCounts, Unit } from '../types';
import { STAGE_ORDER } from '../utils/stageUtils';

// ── CalendarCard ──────────────────────────────────────────────────────────────
// Full monthly calendar view, navigable by month. Starts on the current month.
// Days align to Mon–Sun. Padding cells from the previous month are shown muted.
// Events are marked with a coloured ribbon on their date.
// Activity heatmap colouring is left empty until journal-entry data is wired in.

type CalendarCardProps = {
  events: Event[];
};

export function CalendarCard({ events }: CalendarCardProps) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const goBack = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else              { setMonth(m => m - 1); }
  };
  const goForward = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else               { setMonth(m => m + 1); }
  };

  // Build grid: pad to Monday-aligned start, fill the month, pad to complete last row
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const startOffset  = (firstOfMonth.getDay() + 6) % 7; // Mon=0 … Sun=6

  type Cell = { date: Date; thisMonth: boolean } | null;
  const cells: Cell[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: d, thisMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), thisMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - startOffset - daysInMonth + 1);
    cells.push({ date: d, thisMonth: false });
  }

  const todayStr     = now.toISOString().slice(0, 10);
  const eventByDate  = new Map(events.map(e => [e.eventDate.slice(0, 10), e]));
  const monthLabel   = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const eventCount   = events.filter(e => e.eventDate.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`).length;

  return (
    <div className="card">
      {/* Header + navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          className="t-hand t-secondary"
          onClick={goBack}
          style={{ fontSize: 22, cursor: 'pointer', lineHeight: 1, userSelect: 'none' }}
        >
          ‹
        </span>
        <span className="t-card-title">{monthLabel}</span>
        <span
          className="t-hand t-secondary"
          onClick={goForward}
          style={{ fontSize: 22, cursor: 'pointer', lineHeight: 1, userSelect: 'none' }}
        >
          ›
        </span>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: 'var(--ink3)', textAlign: 'center' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '40px', gap: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const { date, thisMonth } = cell;
          const dateStr  = date.toISOString().slice(0, 10);
          const isToday  = dateStr === todayStr;
          const event    = thisMonth ? eventByDate.get(dateStr) : undefined;

          return (
            <div key={dateStr} style={{
              position: 'relative', borderRadius: 3, padding: 3,
              background: thisMonth ? 'var(--bg2)' : 'transparent',
              border: `1px solid ${isToday ? 'var(--accent)' : thisMonth ? 'var(--edge)' : 'transparent'}`,
              boxShadow: isToday ? '0 0 0 1px var(--accent)' : 'none',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, lineHeight: 1,
                color: isToday ? 'var(--accent)' : thisMonth ? 'var(--ink2)' : 'var(--ink3)',
                textAlign: 'right',
              }}>
                {date.getDate()}
              </div>
              {event && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: event.color, color: '#fffaee',
                  fontFamily: 'var(--font-serif)', fontSize: 8, fontWeight: 700,
                  padding: '1px 3px', textAlign: 'center',
                  letterSpacing: 0.2, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {event.shortName}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-hand t-secondary" style={{ fontSize: 16 }}>
          {eventCount > 0 ? `${eventCount} event${eventCount > 1 ? 's' : ''}` : 'no events'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink3)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid var(--accent)', background: 'var(--bg2)' }} />
          today
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--stage-painted-fill)', border: '1px solid var(--edge)' }} />
          event
        </div>
      </div>
    </div>
  );
}

// ── DatePlaque ────────────────────────────────────────────────────────────────
// Coloured month/day/year block used on event cards.
// size="hero"  → wider, larger day number, torn-paper right edge (next deadline card)
// size="list"  → compact, used in the upcoming-events list rows

type DatePlaqueProps = {
  isoDate: string;
  color: string;
  size?: 'hero' | 'list';
};

export function DatePlaque({ isoDate, color, size = 'list' }: DatePlaqueProps) {
  const d     = new Date(isoDate);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day   = d.getDate().toString();
  const year  = d.getFullYear().toString();
  const hero  = size === 'hero';

  return (
    <div style={{
      background: color, color: '#fffaee',
      padding:    hero ? '12px 14px' : '6px 4px',
      minWidth:   hero ? 72 : 52,
      borderRadius: hero ? 0 : 3,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-serif)', lineHeight: 1,
      position: 'relative',
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, opacity: 0.85, textTransform: 'uppercase' }}>{month}</div>
      <div style={{ fontSize: hero ? 30 : 22, fontWeight: 800, marginTop: hero ? 4 : 2 }}>{day}</div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, opacity: 0.85, marginTop: hero ? 2 : 1, textTransform: 'uppercase' }}>{year}</div>
      {hero && (
        <div style={{
          position: 'absolute', right: -1, top: 0, bottom: 0, width: 4,
          background: 'repeating-linear-gradient(to bottom, var(--card) 0 3px, transparent 3px 7px)',
        }} />
      )}
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────
// Date plaque + event name, scope, progress bar, countdown.
// Used in both the "next deadline" hero card and the "upcoming" list card.

export type EventWithDays = Event & { daysLeft: number };

type EventRowProps = {
  event: EventWithDays;
  size?: 'hero' | 'list';
  isLast?: boolean;
  onClick?: () => void;
};

export function EventRow({ event: e, size = 'list', isLast = false, onClick }: EventRowProps) {
  const urgent   = e.daysLeft <= 7;
  const hero     = size === 'hero';
  const factions = useAppSelector(s => s.factions.items);

  // Compute painted progress from the roster units committed to this event
  const eventUnits = factions
    .flatMap(f => f.units)
    .filter(u => e.unitIds?.includes(u.id));
  const painted      = eventUnits.reduce((sum, u) => sum + (u.stageCounts.painted ?? 0), 0);
  const total        = e.modelsNeeded || eventUnits.reduce((sum, u) => sum + u.modelCount, 0);
  const progressPct  = total > 0 ? Math.round((painted / total) * 100) : 0;
  const hasUnits     = eventUnits.length > 0;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 12,
        paddingBottom: isLast ? 0 : 10,
        borderBottom:  isLast ? 'none' : '1px dashed var(--rule)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <DatePlaque isoDate={e.eventDate} color={e.color} size={size} />

      <div style={{ flex: 1, minWidth: 0, padding: hero ? 14 : 0 }}>
        <div
          className="t-hand--accent"
          style={{ color: urgent ? e.color : undefined, transform: 'rotate(-0.6deg)', lineHeight: 1, marginBottom: 4 }}
        >
          {urgent ? `~ only ${e.daysLeft} days ~` : `~ in ${e.daysLeft} days ~`}
        </div>
        <div className="t-list-title">{e.name}</div>
        <div className="t-secondary" style={{ fontSize: hero ? 11 : undefined, marginTop: 2 }}>{e.scope}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 2, background: 'var(--bg2)', border: '1px solid var(--edge)', overflow: 'hidden' }}>
            {hasUnits && (
              <div style={{ width: `${progressPct}%`, height: '100%', background: e.color, transition: 'width 0.3s' }} />
            )}
          </div>
          <span className="t-micro">
            {hasUnits ? `${painted}/${total} painted` : `${total} needed`}
          </span>
        </div>

        {!hero && (
          <div style={{
            marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: urgent ? e.color : 'var(--ink3)',
            fontWeight: urgent ? 700 : 500,
          }}>
            <span>{e.daysLeft} days</span>
            {e.venue && <span style={{ fontStyle: 'italic' }}>{e.venue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── StageBar ──────────────────────────────────────────────────────────────────
// 5-segment coloured breakdown bar — wraps the .stage-bar CSS class.

type StageBarProps = {
  stageCounts: StageCounts;
  total: number;
  height?: number;
  border?: boolean;
  style?: React.CSSProperties;
};

export function StageBar({ stageCounts, total, height = 8, border = false, style }: StageBarProps) {
  return (
    <div
      className="stage-bar"
      style={{ height, border: border ? '1px solid var(--edge)' : undefined, ...style }}
    >
      {STAGE_ORDER.map(s => {
        const n = stageCounts[s] ?? 0;
        if (!n) return null;
        return (
          <div
            key={s}
            className={`stage-bar__segment stage-bar__segment--${s}`}
            style={{ width: `${(100 * n) / Math.max(1, total)}%` }}
          />
        );
      })}
    </div>
  );
}

// ── FactionRow ────────────────────────────────────────────────────────────────
// Army name + stage bar + weighted completion percentage.
// Accepts pre-computed values so the parent handles data aggregation.

type FactionRowProps = {
  name: string;
  painted: number;
  total: number;
  stageCounts: StageCounts;
  completionPct: number;
  isFirst?: boolean;
};

export function FactionRow({ name, painted, total, stageCounts, completionPct, isFirst = false }: FactionRowProps) {
  return (
    <div style={{
      padding: '8px 0',
      borderTop: isFirst ? 'none' : '1px dashed var(--rule)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-list-title">{name}</div>
        <div className="t-micro" style={{ marginTop: 1 }}>{painted}/{total} painted</div>
        <StageBar stageCounts={stageCounts} total={total} style={{ marginTop: 6 }} />
      </div>
      <div className="t-hand--lg" style={{ color: 'var(--stage-painted-ink)', lineHeight: 1 }}>
        {completionPct}%
      </div>
    </div>
  );
}

// ── UnitRow ───────────────────────────────────────────────────────────────────
// Single unit row used in the Roster page — photo placeholder, name, model
// count, per-stage dot counts, and completion percentage.

type UnitRowProps = {
  unit: Unit;
  isFirst?: boolean;
  onClick?: () => void;
};

export function UnitRow({ unit: u, isFirst = false, onClick }: UnitRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderTop: isFirst ? 'none' : '1px dashed var(--rule)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 4, flexShrink: 0,
        background: 'var(--bg2)', border: '1px solid var(--edge)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink3)',
      }}>
        {u.name.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="t-list-title">{u.name}</span>
          <span className="t-micro">×{u.modelCount}</span>
        </div>

        <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
          {STAGE_ORDER.map(s => {
            const n = u.stageCounts[s] ?? 0;
            return (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 2,
                padding: '1px 5px', borderRadius: 3,
                background: n > 0 ? `var(--stage-${s}-tag)` : 'transparent',
                opacity: n > 0 ? 1 : 0.3,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: `var(--stage-${s}-fill)`,
                  border: `1px solid var(--stage-${s}-ink)`,
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: `var(--stage-${s}-ink)`, fontWeight: 700,
                }}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="t-hand--lg" style={{ color: 'var(--stage-painted-ink)', lineHeight: 1 }}>
          {Math.round(u.completionPct)}%
        </div>
        <div className="t-micro">complete</div>
      </div>
    </div>
  );
}
