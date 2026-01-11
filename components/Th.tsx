export function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      style={{
        padding: '0.4rem 0.5rem',
        borderBottom: '1px solid #ddd',
        textAlign: 'left',
        backgroundColor: '#7f00e0',
        fontWeight: 600,
        ...(props.style || {}),
      }}
    />
  );
}