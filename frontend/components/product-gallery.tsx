"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { useState } from "react";
import { IMAGE_ASSETS } from "@/lib/constants";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
  fallback = IMAGE_ASSETS.productSupplies,
}: {
  images?: ProductImage[];
  productName: string;
  fallback?: string;
}) {
  const gallery = images?.length ? images : [{ url: fallback, position: 0 }];
  const [index, setIndex] = useState(0);
  const current = gallery[index] ?? gallery[0];

  return (
    <div className="grid gap-3">
      <div className="relative min-h-[420px] overflow-hidden rounded-ucao shadow-ucao">
        <Image
          src={current.url}
          alt={`${productName} — photo ${index + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index === 0}
        />
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ucao-navy shadow-md transition hover:bg-white dark:bg-[#0b1c31]/90 dark:text-white"
              onClick={() => setIndex((value) => (value - 1 + gallery.length) % gallery.length)}
              aria-label="Photo précédente"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ucao-navy shadow-md transition hover:bg-white dark:bg-[#0b1c31]/90 dark:text-white"
              onClick={() => setIndex((value) => (value + 1) % gallery.length)}
              aria-label="Photo suivante"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
              {index + 1} / {gallery.length}
            </span>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, imageIndex) => (
            <button
              key={`${image.url}-${image.position}`}
              type="button"
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-ucao border-2 transition",
                imageIndex === index
                  ? "border-ucao-red shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              onClick={() => setIndex(imageIndex)}
              aria-label={`Afficher la photo ${imageIndex + 1}`}
              aria-current={imageIndex === index}
            >
              <Image
                src={image.url}
                alt={`${productName} — miniature ${imageIndex + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
