"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/login/actions";
import BrandLogo from "@/components/brand-logo";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05050a] px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-8">
        <Link href="/" aria-label="CareerForge AI home" className="inline-block">
          <BrandLogo className="h-10 w-32" />
        </Link>
        <h1 className="mt-8 text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-400">We’ll email you a secure link to choose a new password.</p>

        {error && <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}

        <form
          className="mt-6 space-y-4"
          action={async (formData) => {
            setLoading(true);
            setError("");
            setMessage("");
            const result = await requestPasswordReset(formData);
            if (result?.error) setError(result.error);
            if (result?.message) setMessage(result.message);
            setLoading(false);
          }}
        >
          <label className="block text-sm text-slate-300" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-white/10 bg-[#10172a] px-4 py-3 text-sm outline-none focus:border-[#00f0ff]"
          />
          <button disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold disabled:opacity-60">
            {loading ? "Sending link…" : "Send reset link"}
          </button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm text-[#00f0ff] hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
