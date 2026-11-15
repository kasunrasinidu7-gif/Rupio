import BrandHeader from './BrandHeader.jsx';

export default function LoadingScreen({ message = 'Preparing your checkout…' }) {
  return (
    <main className="app-shell">
      <BrandHeader />
      <section className="loading-screen" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <h1>Please wait</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
