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
    <section className="bg-[linear-gradient(90deg,rgba(7,87,70,.92),rgba(16,36,63,.86)),url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85')] bg-cover bg-center py-[88px] text-white">
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
