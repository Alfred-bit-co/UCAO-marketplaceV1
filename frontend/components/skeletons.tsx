import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-ucao bg-gradient-to-r from-ucao-soft via-white to-ucao-soft dark:from-[#132238] dark:via-[#1a2d48] dark:to-[#132238]",
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

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="panel overflow-hidden p-0">
          <Bone className="h-48 rounded-none" />
          <div className="space-y-3 p-4">
            <Bone className="h-5 w-3/4" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
