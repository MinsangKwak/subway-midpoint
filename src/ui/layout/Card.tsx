export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  );
}
