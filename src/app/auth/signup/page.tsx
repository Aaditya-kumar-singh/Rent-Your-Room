import { Suspense } from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      {/* Left Panel - Decorative / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/40 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale mix-blend-multiply" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">RoomRental</span>
          </div>

          <div className="space-y-8 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Start your journey with us.
            </h1>
            <p className="text-xl text-zinc-300 leading-relaxed">
              Join thousands of happy owners and seekers finding their perfect match every day. Safe, secure, and simple.
            </p>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-12 h-12 rounded-full border-4 border-zinc-900 bg-gray-300 flex items-center justify-center overflow-hidden bg-[url('https://i.pravatar.cc/100?img=${i + 10}')] bg-cover`} />
                ))}
              </div>
              <div className="pl-4">
                <p className="font-semibold">Join 10k+ users</p>
                <div className="flex text-yellow-500 text-sm">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end text-sm text-zinc-500">
            <p>© 2024 RoomRental Inc.</p>
            <div className="space-x-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-24 py-12 relative">
        <div className="absolute top-0 right-0 p-6 lg:hidden">
          {/* Logo for mobile */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <SignUpForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
