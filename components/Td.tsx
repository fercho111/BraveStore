export function Td(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        padding: '0.35rem 0.5rem',
        borderBottom: '1px solid #eee',
        ...(props.style || {}),
      }}
    />
  );
}