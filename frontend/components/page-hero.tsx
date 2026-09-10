import type { IconComponent } from "@/lib/icons";

export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  children,
  backgroundImage = "/images/page-hero-campus.jpg",
}: {
  icon?: IconComponent;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  /** Public image path used behind the page heading. */
  backgroundImage?: string;
}) {
  return (
    <section
      className="
        bg-cover
        bg-center
        py-[88px]
        text-white
      "
      style={{
        backgroundImage: `linear-gradient(100deg, rgba(30, 42, 110, .84), rgba(30, 42, 110, .70) 58%, rgba(122, 30, 45, .54)), url("${backgroundImage}")`,
      }}
    >
      <div className="container-ucao">
        <p className="eyebrow text-white/85">
          {Icon && <Icon size={16} />}
          {eyebrow}
        </p>

        <h1 className="mb-3 text-[clamp(36px,5vw,58px)] font-medium leading-tight">
          {title}
        </h1>

        <p>{children}</p>
      </div>
    </section>
  );
}
