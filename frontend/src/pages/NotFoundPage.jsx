import BrandHeader from '../components/BrandHeader.jsx';

export default function NotFoundPage() {
  return (
    <main className="result-shell">
      <BrandHeader />
      <section className="panel">
        <p className="eyebrow">CHECKOUT UNAVAILABLE</p>
        <h1>This Rupio checkout link could not be found.</h1>
        <p className="muted">Return to the app that sent you here and start checkout again.</p>
      </section>
    </main>
  );
}
