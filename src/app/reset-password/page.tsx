"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { updatePassword } from "@/app/login/actions";
import BrandLogo from "@/components/brand-logo";

function ResetPasswordForm() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = useSearchParams().get("token") ?? "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05050a] px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-8">
        <Link href="/" aria-label="CareerForge AI home" className="inline-block">
          <BrandLogo className="h-10 w-32" />
        </Link>
        <h1 className="mt-8 text-2xl font-bold">Choose a new password</h1>

        {error && <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}

        <form
          className="mt-6 space-y-4"
          action={async (formData) => {
            setLoading(true);
            setError("");
            setMessage("");
            const result = await updatePassword(formData);
            if (result?.error) setError(result.error);
            if (result?.message) setMessage(result.message);
            setLoading(false);
          }}
        >
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="w-full rounded-lg border border-white/10 bg-[#10172a] px-4 py-3 text-sm outline-none focus:border-[#00f0ff]" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required className="w-full rounded-lg border border-white/10 bg-[#10172a] px-4 py-3 text-sm outline-none focus:border-[#00f0ff]" />
          </div>
          <button disabled={loading || !token} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold disabled:opacity-60">
            {loading ? "Updating password…" : token ? "Update password" : "Invalid or expired reset link"}
          </button>
        </form>
        {message && <Link href="/login" className="mt-5 inline-block text-sm text-[#00f0ff] hover:underline">Sign in</Link>}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
