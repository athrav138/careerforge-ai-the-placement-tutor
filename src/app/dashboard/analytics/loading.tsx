import DashboardHeader from "@/components/dashboard/header";

export default function AnalyticsLoading() {
  return (
    <>
      <DashboardHeader
        title="Readiness analytics"
        subtitle="Progress insights from your saved placement preparation data."
      />
      <div
        aria-label="Loading readiness analytics"
        aria-busy="true"
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {["measured", "snapshots", "skills"].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      </div>
    </>
  );
}
