"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { authClient } from "@/lib/auth";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const providerError = searchParams.get("error") === "profile_sync_failed"
    ? "Your identity was verified, but your application profile could not be loaded. Please try again."
    : searchParams.get("error") === "auth_failed"
      ? "Sign-in could not be completed. Please try again."
      : "";

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const { error: oauthError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (oauthError) setError("Google sign-in is unavailable. Please try again.");
    } catch {
      setError("Google sign-in is unavailable. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#05050a] text-white font-sans selection:bg-[#00f0ff]/30">
      {/* Left side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black flex-col justify-center items-center">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-50"
            src="/videos/career-intelligence-core.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05050a] via-transparent to-[#05050a] opacity-80" />
        </div>
        
        <div className="relative z-10 p-12 max-w-lg text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="text-2xl font-black tracking-tighter text-white">CareerForge<span className="text-[#00f0ff]">.AI</span></span>
          </Link>
          <h2 className="text-4xl font-bold mb-6">Forge Your Future.</h2>
          <p className="text-slate-300 text-lg">
            CareerForge AI analyzes your skills, understands your potential, and builds a personalized path from where you are to where you want to be.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-12">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tighter text-white">CareerForge<span className="text-[#00f0ff]">.AI</span></span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-400 mb-8">Continue your career journey.</p>

          {(error || providerError) && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
              {error || providerError}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-[#10172a] border border-white/10 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors font-medium text-white mb-6"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#05050a] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <form action={async (formData) => {
            setLoading(true);
            const res = await login(formData);
            if (res?.error) setError(res.error);
            setLoading(false);
          }} className="space-y-5">
            <div>
              <label className="text-xs tracking-widest text-slate-400 font-mono block mb-2">EMAIL</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full bg-[#10172a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all placeholder:text-slate-600" 
                placeholder="you@example.com" 
              />
            </div>
            <div>
              <label className="text-xs tracking-widest text-slate-400 font-mono block mb-2">PASSWORD</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full bg-[#10172a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all placeholder:text-slate-600" 
                placeholder="Enter password" 
              />
            </div>
            
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full justify-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors font-medium">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
