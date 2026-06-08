import React from 'react';

type HeaderProps = {
    title: string;
    sub: string;
};

export default function Header({ title, sub }: HeaderProps) {
    return React.createElement(
        'div',
        {
            style: {
                padding: '14px 20px 12px',
                borderBottom: '2px solid #e1d3b1',
                position: 'relative',
            },
        },
        React.createElement('p', { className: 't-hand--accent' }, sub),
        React.createElement('p', { className: 't-screen-title' }, title),
    );
}