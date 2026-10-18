import VerifyEmailForm from "./VerifyEmailForm";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 py-12 text-white">
      {email ? (
        <VerifyEmailForm email={email} />
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10172a] p-8">
          <h1 className="mb-3 text-xl font-bold">Email address required</h1>
          <p className="mb-5 text-sm text-slate-300">
            Open the verification link from the account creation flow to verify your email.
          </p>
          <a href="/register" className="font-medium text-[#00f0ff] hover:text-white">Return to registration</a>
        </div>
      )}
    </main>
  );
}
