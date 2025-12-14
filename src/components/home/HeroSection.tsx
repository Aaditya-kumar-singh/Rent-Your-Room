"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const router = useRouter();

  const { data: session, status } = useSession();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("location", searchQuery);
    if (priceRange) params.set("maxPrice", priceRange);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-32 space-y-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-[20%] -left-[10%] w-[50vh] h-[50vh] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8">
          Find Your <span className="text-primary relative whitespace-nowrap">
            Perfect Room
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
          Discover comfortable, affordable rooms with verified owners and secure booking in your favorite neighborhood.
        </p>

        {/* User Type Cards or Welcome Back */}
        {status === "authenticated" && session ? (
          <div className="flex flex-col items-center justify-center mb-16 space-y-6">
            <div className="p-8 bg-card border border-border rounded-2xl shadow-sm text-center max-w-lg w-full">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Welcome back{session.user?.name ? `, ${session.user.name.split(' ')[0]}` : session.user?.email ? `, ${session.user.email.split('@')[0]}` : ""}!
              </h2>
              <p className="text-muted-foreground mb-6">
                Ready to manage your bookings or find a new place?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  Go to Dashboard
                </Link>
                <Link href="/search" className="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                  Browse Rooms
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
              {/* Seeker Card */}
              <Link href="/auth/signup?type=seeker" className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 py-10 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">I'm a Seeker</h3>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    Looking for the perfect room to rent
                  </p>
                </div>
              </Link>

              {/* Owner Card */}
              <Link href="/auth/signup?type=owner" className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 py-10 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">I'm an Owner</h3>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    Want to list my property for rent
                  </p>
                </div>
              </Link>
            </div>

            {/* Sign In Link */}
            <div className="mb-20">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </>
        )}

        {/* Search Bar - Floating */}
        <div className="max-w-4xl mx-auto transform translate-y-4">
          <form onSubmit={handleSearch} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-3 md:p-4 grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">
            {/* Location Input */}
            <div className="relative flex items-center bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 transition-colors focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:ring-2 focus-within:ring-primary/20">
              <svg className="w-5 h-5 text-muted-foreground mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                placeholder="Enter city, locality or area"
                className="w-full bg-transparent border-none focus:ring-0 py-3 text-foreground placeholder:text-muted-foreground font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Budget Input */}
            <div className="relative flex items-center bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 transition-colors focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:ring-2 focus-within:ring-primary/20">
              <svg className="w-5 h-5 text-muted-foreground mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <select
                className="w-full bg-transparent border-none focus:ring-0 py-3 text-foreground font-medium cursor-pointer"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="" className="text-muted-foreground">Any Budget</option>
                <option value="5000">Under ₹5,000</option>
                <option value="10000">Under ₹10,000</option>
                <option value="15000">Under ₹15,000</option>
                <option value="20000">Under ₹20,000</option>
                <option value="25000">Under ₹25,000</option>
              </select>
            </div>

            {/* Search Button */}
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-primary/25">
              Search
            </button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-4">
            <div className="text-4xl font-bold text-foreground mb-1">10k+</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Verified Rooms</div>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-foreground mb-1">5k+</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Happy Tenants</div>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-foreground mb-1">50+</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cities Covered</div>
          </div>
        </div>
      </div>
    </section>
  );
}
