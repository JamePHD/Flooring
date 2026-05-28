export default function NewsPage() {
  const videoPlaceholders = Array.from({ length: 6 });

  return (
    <main className="flex-1 bg-white text-gray-900">
      <section className="bg-gradient-to-r from-[#0d5a57] via-[#118b85] to-[#15c4c4] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            News
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Video News
          </h1>
          <div className="mt-6 h-1 w-20 rounded-full bg-white/80" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex aspect-video items-center justify-center bg-gray-200">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400">
                  <span className="ml-1 h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-gray-400" />
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-7 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="h-7 w-40 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-64 max-w-full rounded bg-gray-100" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-24 rounded-md border border-gray-200 bg-white"
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {videoPlaceholders.map((_, index) => (
                <article
                  key={index}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex aspect-video items-center justify-center bg-gray-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-300 shadow-sm">
                      <span className="ml-0.5 h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-gray-300" />
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-20 rounded bg-gray-100" />
                    <div className="h-5 w-5/6 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="h-4 w-3/5 rounded bg-gray-100" />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="h-6 w-36 rounded bg-gray-200" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="h-16 w-24 shrink-0 rounded bg-gray-200" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-16 rounded bg-gray-200" />
                      <div className="h-4 w-full rounded bg-gray-200" />
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="h-6 w-28 rounded bg-gray-200" />
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 rounded-md border border-gray-200 bg-gray-50"
                  />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
