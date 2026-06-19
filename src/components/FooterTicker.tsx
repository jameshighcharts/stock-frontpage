export const FooterTicker = ({ items }: { items: string[] }) => {
  const loop = [...items, ...items];
  return (
    <footer className="footer">
      <span className="badge">WIRE</span>
      <div className="scroll-track">
        {loop.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </footer>
  );
};
