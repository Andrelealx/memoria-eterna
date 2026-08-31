export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl animate-pulse px-4 py-16 sm:px-6" aria-label="Carregando página">
      <div className="mx-auto h-5 w-28 rounded-full bg-secondary" />
      <div className="mx-auto mt-5 h-12 max-w-lg rounded-2xl bg-secondary" />
      <div className="mx-auto mt-4 h-5 max-w-md rounded-full bg-secondary" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-64 rounded-3xl bg-secondary" />)}
      </div>
      <span className="sr-only">Carregando...</span>
    </main>
  );
}
