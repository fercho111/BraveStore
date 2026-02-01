'use client';

import { ReactNode, MouseEvent, KeyboardEvent } from 'react';

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const go = () => {
    // Works without next/router; no dependency on router hooks.
    window.location.href = href;
  };

  const onClick = (e: MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;

    // If the user clicked an interactive element, do not navigate.
    if (target.closest('a,button,input,select,textarea,label,form')) return;

    go();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go();
    }
  };

  return (
    <tr
      className={className}
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </tr>
  );
}
