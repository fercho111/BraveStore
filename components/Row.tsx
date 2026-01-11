export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        padding: '0.5rem 0',
        borderBottom: '1px solid #eee',
      }}
    >
      <dt style={{ color: '#666' }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}