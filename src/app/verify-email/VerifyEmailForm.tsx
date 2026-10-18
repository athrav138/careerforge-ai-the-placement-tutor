"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resendVerification, verifyEmail } from "./actions";

export default function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await verifyEmail(email, otp);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Email verified. Please sign in to continue.");
        router.push("/login?verified=1");
        router.refresh();
      }
    } catch {
      setError("Unable to verify your email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const result = await resendVerification(email);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("A new verification code has been sent.");
      }
    } catch {
      setError("Unable to send a new code. Please try again later.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10172a] p-8 shadow-2xl">
      <p className="mb-2 text-xs font-mono tracking-[0.2em] text-[#00f0ff]">CAREERFORGE AI</p>
      <h1 className="mb-2 text-2xl font-bold text-white">Verify your email</h1>
      <p className="mb-6 text-sm leading-6 text-slate-300">
        Enter the 6-digit code sent to <span className="font-semibold text-white">{email}</span>.
        Verifying your email protects your student profile when you connect your account.
      </p>

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="otp" className="mb-2 block text-xs font-mono tracking-widest text-slate-400">
            VERIFICATION CODE
          </label>
          <input
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-lg border border-white/10 bg-[#05050a] px-4 py-3 text-center font-mono text-lg tracking-[0.45em] text-white outline-none transition focus:border-[#00f0ff]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full rounded-lg bg-[#2563eb] px-4 py-3 font-medium text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || loading}
        className="mt-5 w-full text-sm font-medium text-[#00f0ff] transition hover:text-white disabled:opacity-60"
      >
        {resending ? "Sending new code..." : "Resend verification code"}
      </button>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        If you did not request this account, you can safely leave this page.
      </p>
    </div>
  );
}
