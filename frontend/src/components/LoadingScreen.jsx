import BrandHeader from './BrandHeader.jsx';

export default function LoadingScreen({ message = 'Preparing your checkout…', minimal = false }) {
  return (
    <main className={minimal ? 'loading-screen-shell' : 'app-shell'}>
      <BrandHeader />
      <section className={minimal ? 'loading-screen loading-screen-minimal' : 'loading-screen'} role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <h1>Please wait</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
