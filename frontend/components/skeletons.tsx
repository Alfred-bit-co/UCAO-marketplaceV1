import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton rounded-ucao",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="container-ucao space-y-6 py-[84px]">
      <Bone className="mx-auto h-8 w-64" />
      <Bone className="mx-auto h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Bone className="h-32" />
        <Bone className="h-32" />
        <Bone className="h-32" />
      </div>
      <Bone className="h-64 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container-ucao space-y-6 py-[42px]">
      <div className="grid gap-5 md:grid-cols-3">
        <Bone className="h-36" />
        <Bone className="h-36" />
        <Bone className="h-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Bone className="h-80" />
        <Bone className="h-80" />
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="container-ucao space-y-6 py-[30px]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Bone key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bone className="h-80" />
        <Bone className="h-80" />
      </div>
      <Bone className="h-96 w-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container-ucao grid max-w-4xl gap-5 py-[54px] md:grid-cols-[0.75fr_1.25fr]">
      <Bone className="h-72" />
      <Bone className="h-96" />
    </div>
  );
}

/** Même grille et mêmes proportions que les vraies cartes produit : rien ne saute à l'arrivée des données. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 pb-[42px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true" aria-label="Chargement des produits">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 dark:bg-[#10233b] dark:ring-white/10">
          <Bone className="aspect-square w-full rounded-none" />
          <div className="space-y-2.5 p-3 pt-5">
            <Bone className="h-5 w-1/2" />
            <Bone className="h-4 w-4/5" />
            <Bone className="h-3 w-1/3" />
            <Bone className="mt-3 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grille des stands (2 colonnes), couverture + logo rond. */
export function StandGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2" aria-busy="true" aria-label="Chargement des stands">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-ucao border border-ucao-line bg-white dark:border-[#2a3a52] dark:bg-[#132238]">
          <Bone className="h-40 w-full rounded-none" />
          <div className="relative space-y-3 p-5 pt-10">
            <Bone className="absolute -top-8 left-5 size-16 rounded-full border-4 border-white dark:border-[#132238]" />
            <Bone className="h-5 w-1/2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
            <Bone className="mt-2 h-[46px] w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bandeau de page (même hauteur que PageHero) affiché pendant le chargement. */
export function HeroSkeleton() {
  return (
    <div className="bg-[linear-gradient(100deg,#1e2a6e,#2c3a7a_58%,#5a2440)] py-[88px]">
      <div className="container-ucao space-y-4">
        <div className="h-4 w-28 rounded-ucao bg-white/20" />
        <div className="h-12 w-[min(520px,90%)] rounded-ucao bg-white/20" />
        <div className="h-4 w-[min(380px,70%)] rounded-ucao bg-white/15" />
      </div>
    </div>
  );
}

/** Page d'un produit ou d'un stand : image à gauche, informations à droite. */
export function DetailSkeleton() {
  return (
    <div className="container-ucao grid gap-8 py-[54px] md:grid-cols-2" aria-busy="true" aria-label="Chargement">
      <Bone className="aspect-square w-full" />
      <div className="space-y-4">
        <Bone className="h-7 w-24" />
        <Bone className="h-12 w-4/5" />
        <Bone className="h-8 w-32" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-36 w-full" />
        <div className="flex gap-3">
          <Bone className="h-[46px] w-48" />
          <Bone className="h-[46px] w-40" />
        </div>
      </div>
    </div>
  );
}
