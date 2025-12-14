import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInForm from "@/components/auth/SignInForm";
import Image from "next/image";

interface SignInPageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message = params.message;
  const error = params.error;

  const errorMap: { [key: string]: string } = {
    OAuthCallback: "Error during OAuth callback. Please check your provider settings.",
    OAuthSignin: "Error identifying the user.",
    OAuthAccountNotLinked:
      "This email is already associated with another account.",
    Callback: "Error during callback.",
    Configuration: "Server configuration error.",
    AccessDenied: "Access denied.",
    Default: "An invalid error occurred.",
  };

  const errorMessage = error ? errorMap[error] || error : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Panel - Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 border-r border-border">
        <div className="absolute inset-0 z-10 bg-black/40" /> {/* Dark overlay */}
        <Image
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
          alt="Modern Interior"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 flex flex-col justify-between w-full h-full p-12 text-white">
          <div className="flex items-center gap-2">
            {/* Logo Icon Placeholer */}
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur border border-white/30" />
            <h1 className="text-xl font-bold tracking-tight">RentalRooms</h1>
          </div>
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed">
                "Finding a place to call home has never been easier.
                RentalRooms connects you with the perfect space."
              </p>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {(message || errorMessage) && (
            <div className={`p-4 rounded-lg text-sm font-medium ${errorMessage
              ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-900'
              : 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900'
              }`}>
              {errorMessage || message}
            </div>
          )}

          <SignInForm />

          <div className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
