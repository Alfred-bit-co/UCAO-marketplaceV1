"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Stand } from "@/lib/types";
import { StandCard } from "./stand-card";

export function StandsBrowser({ stands }: { stands: Stand[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(stands.length, 1);
  const stand = stands[page - 1] ?? stands[0];

  return (
    <>
      <section className="container-ucao">{stand && <StandCard stand={stand} />}</section>
      <div className="flex items-center justify-center gap-3 pb-[84px]">
        <button className="btn btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
          <ChevronLeft size={18} /> Précédent
        </button>
        <span className="font-black">Page {page} / {pages}</span>
        <button className="btn btn-ghost" type="button" disabled={page >= pages} onClick={() => setPage((value) => Math.min(value + 1, pages))}>
          Suivant <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
