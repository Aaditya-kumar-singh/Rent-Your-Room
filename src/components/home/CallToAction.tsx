import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* For Room Seekers */}
          <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 transition-all group-hover:bg-blue-500/10" />

            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-4">
              Looking for a Room?
            </h3>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Find your perfect room with our advanced search filters, verified listings, and secure booking process.
            </p>

            <ul className="space-y-3 mb-10 w-full">
              {[
                "Verified property owners",
                "Safe payment gateway",
                "Google Maps integration"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-foreground font-medium">
                  <svg className="w-5 h-5 text-blue-500 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/search"
              className="mt-auto inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/25 w-full sm:w-auto"
            >
              Start Searching
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* For Property Owners */}
          <div className="bg-zinc-900 text-white rounded-3xl p-8 lg:p-12 shadow-xl shadow-zinc-900/10 hover:shadow-2xl transition-shadow flex flex-col items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10 transition-all group-hover:bg-green-500/20" />

            <div className="w-14 h-14 bg-zinc-800 text-green-400 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
              </svg>
            </div>

            <h3 className="text-3xl font-bold mb-4">
              Have a Room to Rent?
            </h3>
            <p className="text-zinc-400 mb-8 text-lg leading-relaxed">
              List your property and connect with verified tenants. Earn rental income with complete peace of mind.
            </p>

            <ul className="space-y-3 mb-10 w-full">
              {[
                "Free property listing",
                "Verified tenant profiles",
                "Secure payment processing",
                "Easy booking management"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-zinc-200 font-medium">
                  <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/rooms/create"
              className="mt-auto inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-green-600/25 w-full sm:w-auto"
            >
              List Your Room
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
