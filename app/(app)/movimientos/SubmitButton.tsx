// app/(app)/movimientos/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      style={{
        padding: '0.6rem 0.9rem',
        borderRadius: 8,
        border: '1px solid #222',
        background: pending ? '#666' : '#222',
        color: '#fff',
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
      disabled={pending}
    >
      {pending ? 'Guardando…' : 'Guardar movimiento'}
    </button>
  );
}
