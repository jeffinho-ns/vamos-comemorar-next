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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div ref={areasButtonRef} className="relative">
          <button
            type="button"
            onClick={() => setAreasOpen((prev) => !prev)}
            className="w-full rounded-xl border border-sky-400/30 bg-sky-500/15 p-4 text-left text-white transition-colors hover:bg-sky-500/20"
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-sky-200">
              <MdMap size={16} />
              Areas
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {loading ? "..." : areaPeopleTotal}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/30 px-2 py-1 text-xs text-sky-100">
                Subareas
                <MdExpandMore
                  size={16}
                  className={areasOpen ? "rotate-180 transition-transform" : "transition-transform"}
                />
              </span>
            </div>
            <div className="mt-1 text-xs text-sky-200/80">Pessoas presentes</div>
          </button>

          <AnimatePresence>
            {areasOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/20 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-sm"
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

        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-white">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-200">
            <MdRestaurant size={16} />
            Reservas
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {loading ? "..." : reservationsCheckedIn}/{loading ? "..." : reservationsTotal}
          </div>
          <div className="mt-1 text-xs text-emerald-200/80">
            Check-ins realizados / total do dia
          </div>
        </div>

        <div className="rounded-xl border border-amber-400/30 bg-amber-500/15 p-4 text-white">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-200">
            <MdGroups size={16} />
            Total de pessoas
          </div>
          <div className="text-2xl font-bold tabular-nums">
            {loading ? "..." : totalPeopleExpected}
          </div>
          <div className="mt-1 text-xs text-amber-200/80">Previsto para hoje</div>
        </div>
      </div>
    </div>
  );
}
