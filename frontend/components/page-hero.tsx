import type { LucideIcon } from "lucide-react";

export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[linear-gradient(100deg,rgba(30,42,110,.94),rgba(30,42,110,.82)_58%,rgba(122,30,45,.68)),url('/images/page-hero-campus.jpg')] bg-cover bg-center py-[88px] text-white">
      <div className="container-ucao">
        <p className="eyebrow">
          <Icon size={16} /> {eyebrow}
        </p>
        <h1 className="mb-3 text-[clamp(36px,5vw,58px)] font-bold leading-tight">{title}</h1>
        <p>{children}</p>
      </div>
    </section>
  );
}
