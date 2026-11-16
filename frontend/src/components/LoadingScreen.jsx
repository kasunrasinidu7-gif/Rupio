import BrandHeader from './BrandHeader.jsx';

export default function LoadingScreen({ message = 'Preparing your checkout…', minimal = false }) {
  return (
    <main className={minimal ? 'loading-screen-shell' : 'app-shell'}>
      <BrandHeader />
      <section className={minimal ? 'loading-screen loading-screen-minimal' : 'loading-screen'} role="status" aria-live="polite">
        <div className="loading-skeleton-card" aria-hidden="true">
          <div className="loading-skeleton-heading">
            <span className="loading-skeleton-circle" />
            <div className="loading-skeleton-heading-lines">
              <span className="loading-skeleton-line loading-skeleton-eyebrow" />
              <span className="loading-skeleton-line loading-skeleton-title" />
            </div>
          </div>
          <span className="loading-skeleton-line loading-skeleton-label" />
          <span className="loading-skeleton-field" />
          <span className="loading-skeleton-line loading-skeleton-note" />
          <span className="loading-skeleton-button" />
        </div>
        <h1>Please wait</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
