"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MdExpandMore,
  MdGroups,
  MdMap,
  MdRestaurant,
} from "react-icons/md";
import type { RooftopAreaCount } from "@/app/utils/rooftopCheckins";

interface RooftopUnifiedStatsHeaderProps {
  areaPeopleTotal: number;
  areasBreakdown: RooftopAreaCount[];
  reservationsCheckedIn: number;
  reservationsTotal: number;
  totalPeopleExpected: number;
  loading?: boolean;
  className?: string;
}

export default function RooftopUnifiedStatsHeader({
  areaPeopleTotal,
  areasBreakdown,
  reservationsCheckedIn,
  reservationsTotal,
  totalPeopleExpected,
  loading = false,
  className = "",
}: RooftopUnifiedStatsHeaderProps) {
  const [areasOpen, setAreasOpen] = useState(false);
  const areasButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!areasButtonRef.current) return;
      if (!areasButtonRef.current.contains(event.target as Node)) {
        setAreasOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const safeAreas = useMemo(() => {
    if (!areasBreakdown.length) {
      return [{ name: "Sem dados", people: 0 }];
    }
    return areasBreakdown;
  }, [areasBreakdown]);

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-1.5 md:grid-cols-3 md:gap-3">
        <div ref={areasButtonRef} className="relative">
          <button
            type="button"
            onClick={() => setAreasOpen((prev) => !prev)}
            className="w-full rounded-lg border border-sky-400/30 bg-sky-500/15 p-2 text-left text-white transition-colors hover:bg-sky-500/20 md:rounded-xl md:p-4"
          >
            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-sky-200 md:mb-1 md:gap-2 md:text-xs">
              <MdMap size={12} className="shrink-0 md:h-4 md:w-4" />
              <span className="truncate">Áreas</span>
            </div>
            <div className="flex items-center justify-between gap-1 md:gap-2">
              <span className="text-base font-bold tabular-nums md:text-2xl">
                {loading ? "..." : areaPeopleTotal}
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-sky-500/30 px-1.5 py-0.5 text-[10px] text-sky-100 md:gap-1 md:px-2 md:py-1 md:text-xs">
                <MdExpandMore
                  size={14}
                  className={areasOpen ? "rotate-180 transition-transform" : "transition-transform"}
                />
              </span>
            </div>
            <div className="mt-0.5 hidden text-xs text-sky-200/80 md:mt-1 md:block">Previsto por área</div>
          </button>

          <AnimatePresence>
            {areasOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/20 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-sm md:mt-2 md:max-h-64 md:rounded-xl"
              >
                {safeAreas.map((area) => (
                  <div
                    key={area.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-100 hover:bg-white/10"
                  >
                    <span className="truncate pr-3">{area.name}</span>
                    <span className="font-semibold tabular-nums text-sky-200">
                      {area.people}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 p-2 text-white md:rounded-xl md:p-4">
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-200 md:mb-1 md:gap-2 md:text-xs">
            <MdRestaurant size={12} className="shrink-0 md:h-4 md:w-4" />
            <span className="truncate">Reservas</span>
          </div>
          <div className="text-base font-bold tabular-nums md:text-2xl">
            {loading ? "..." : reservationsCheckedIn}/{loading ? "..." : reservationsTotal}
          </div>
          <div className="mt-0.5 hidden text-xs text-emerald-200/80 md:mt-1 md:block">
            Check-ins / total do dia
          </div>
        </div>

        <div className="rounded-lg border border-amber-400/30 bg-amber-500/15 p-2 text-white md:rounded-xl md:p-4">
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-amber-200 md:mb-1 md:gap-2 md:text-xs">
            <MdGroups size={12} className="shrink-0 md:h-4 md:w-4" />
            <span className="truncate">Pessoas</span>
          </div>
          <div className="text-base font-bold tabular-nums md:text-2xl">
            {loading ? "..." : totalPeopleExpected}
          </div>
          <div className="mt-0.5 hidden text-xs text-amber-200/80 md:mt-1 md:block">Previsto hoje</div>
        </div>
      </div>
    </div>
  );
}
