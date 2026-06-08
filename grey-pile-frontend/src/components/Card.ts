import React from 'react';

type AppAction = {
  displayText: string;
  link?:    string;
  onClick?: () => void;
};

type CardProps = {
  children?: React.ReactNode;
  title?: string;
  action?: AppAction;
  className?: string;
  style?: React.CSSProperties;
};

export default function Card({ children, title, action, className = '', style }: CardProps) {
  const actionEl = action
    ? React.createElement(
        action.onClick ? 'button' : 'a',
        action.onClick
          ? { onClick: action.onClick, className: 't-hand--accent', style: { background: 'none', border: 'none', padding: 0, cursor: 'pointer' } }
          : { href: action.link,       className: 't-hand--accent' },
        action.displayText,
      )
    : null;

  const header = (title || action)
    ? React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 } },
        title     ? React.createElement('span', { className: 't-card-title' }, title) : null,
        actionEl,
      )
    : null;

  return React.createElement('div', { className: `card ${className}`.trim(), style }, header, children);
}

export { DatePlaque, EventRow, StageBar, FactionRow, CalendarCard, UnitRow } from './CardParts';
export type { EventWithDays } from './CardParts';
