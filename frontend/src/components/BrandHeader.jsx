export default function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-mark" aria-hidden="true">R</div>
      <div className="brand-copy">
        <span className="brand-name">Rupio</span>
        <span className="brand-caption">Hosted checkout</span>
      </div>
      <span className="test-badge"><span className="status-dot" /> TEST MODE</span>
    </header>
  );
}
