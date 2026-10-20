import Image from "next/image";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block h-10 w-32 shrink-0 overflow-hidden rounded-md bg-white ${className}`}>
      <Image
        src="/brand/careerforge-logo.png"
        alt="CareerForge AI — The Placement Tutor"
        fill
        sizes="(max-width: 640px) 128px, 192px"
        className="object-contain"
      />
    </span>
  );
}
