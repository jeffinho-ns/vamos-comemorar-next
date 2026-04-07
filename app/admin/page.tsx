"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MdCalendarToday,
  MdClose,
  MdEvent,
  MdMenuBook,
  MdOpenInNew,
  MdWarning,
} from "react-icons/md";
import { useAppContext } from "@/app/context/AppContext";
import { useEstablishmentPermissions } from "@/app/hooks/useEstablishmentPermissions";
import { getApiUrl } from "@/app/config/api";
import { isSuperAdminEmail } from "@/app/hooks/useUserPermissions";

const PLACEHOLDER = "/placeholder-cardapio.svg";
const HERO_BG =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80";

/** Imagens de eventos vêm do Firebase/Cloudinary — <img> evita bloqueio do next/image por hostname. */
function EventCoverImage({
  src,
  className,
}: {
  src: string | null | undefined;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const effective = broken || !src?.trim() ? PLACEHOLDER : src.trim();
  return (
    <img
      src={effective}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

type ApiEvento = {
  evento_id: number;
  nome: string;
  data_evento: string | null;
  horario?: string | null;
  horario_funcionamento?: string | null;
  tipo_evento: string;
  dia_da_semana?: number | null;
  establishment_name?: string | null;
  imagem_url?: string | null;
  descricao?: string | null;
};

type Announcement = {
  id: number;
  establishment_id: number | null;
  title: string;
  body: string;
  footer_label: string | null;
};

type WeeklyItem = {
  establishment_id: number;
  establishment_name: string;
  percent: number;
  tasks: {
    eventos_semana: boolean;
    cardapio: boolean;
    reservas: boolean;
  };
};

function weekendFriday(d: Date): Date {
  const day = d.getDay();
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  if (day === 6) x.setDate(x.getDate() - 1);
  else if (day === 0) x.setDate(x.getDate() - 2);
  else {
    const delta = 5 - day;
    x.setDate(x.getDate() + delta);
  }
  return x;
}

function fmtIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthMatrix(year: number, month0: number): (Date | null)[][] {
  const first = new Date(year, month0, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month0, d, 12, 0, 0, 0));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function eventsForCalendarDay(day: Date, list: ApiEvento[]): ApiEvento[] {
  const dow = day.getDay();
  const key = fmtIso(day);
  return list.filter((ev) => {
    if (ev.tipo_evento === "semanal") {
      const ds = ev.dia_da_semana;
      return ds === dow || Number(ds) === dow;
    }
    if (!ev.data_evento) return false;
    const part = ev.data_evento.split("T")[0].split(" ")[0];
    return part === key;
  });
}

export default function AdminHomeDashboard() {
  const { token, establishments, isLoading: ctxLoading, userEmail } = useAppContext();
  const { getFilteredEstablishments } = useEstablishmentPermissions();

  const filteredEstablishments = useMemo(
    () => getFilteredEstablishments(establishments),
    [establishments, getFilteredEstablishments],
  );

  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [events, setEvents] = useState<ApiEvento[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<
    number | null
  >(null);
  const [weekly, setWeekly] = useState<WeeklyItem[]>([]);
  const [weekendDayIndex, setWeekendDayIndex] = useState<0 | 1 | 2>(0);

  const isSuper = isSuperAdminEmail(userEmail);

  useEffect(() => {
    if (!filteredEstablishments.length || selectedEstId != null) return;
    const first = filteredEstablishments[0];
    const id = typeof first.id === "string" ? parseInt(first.id, 10) : Number(first.id);
    if (!Number.isNaN(id)) setSelectedEstId(id);
  }, [filteredEstablishments, selectedEstId]);

  const weekendDates = useMemo(() => {
    const fri = weekendFriday(new Date());
    const sat = new Date(fri);
    sat.setDate(fri.getDate() + 1);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    return [fri, sat, sun] as const;
  }, []);

  const selectedWeekendDate = weekendDates[weekendDayIndex];

  const loadEvents = useCallback(async () => {
    if (!token || selectedEstId == null) return;
    const API = getApiUrl();
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const start = fmtIso(new Date(y, m, 1));
    const end = fmtIso(new Date(y, m + 1, 0));
    setEventsLoading(true);
    try {
      const res = await fetch(
        `${API}/api/v1/eventos?establishment_id=${selectedEstId}&data_inicio=${start}&data_fim=${end}&limit=500`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setEvents(Array.isArray(data.eventos) ? data.eventos : []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [token, selectedEstId, calendarMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadAnnouncements = useCallback(async () => {
    if (!token || selectedEstId == null) return;
    const API = getApiUrl();
    try {
      const res = await fetch(
        `${API}/api/v1/admin-dashboard/announcements?establishment_id=${selectedEstId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
    } catch {
      setAnnouncements([]);
    }
  }, [token, selectedEstId]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const loadWeekly = useCallback(async () => {
    if (!token) return;
    const API = getApiUrl();
    try {
      let url = `${API}/api/v1/admin-dashboard/weekly-progress`;
      if (isSuper && filteredEstablishments.length) {
        const ids = filteredEstablishments
          .map((e) => (typeof e.id === "string" ? parseInt(e.id, 10) : Number(e.id)))
          .filter((n) => !Number.isNaN(n))
          .slice(0, 12)
          .join(",");
        if (ids) url += `?establishment_ids=${encodeURIComponent(ids)}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWeekly(Array.isArray(data.items) ? data.items : []);
    } catch {
      setWeekly([]);
    }
  }, [token, isSuper, filteredEstablishments]);

  useEffect(() => {
    loadWeekly();
  }, [loadWeekly]);

  const primaryAnnouncement = announcements[0];
  const showAnnouncement =
    primaryAnnouncement && primaryAnnouncement.id !== dismissedAnnouncementId;

  /** Só eventos únicos (data fixa); semanais ficam só no calendário. */
  const weekendEvents = useMemo(() => {
    const key = fmtIso(selectedWeekendDate);
    return events.filter((ev) => {
      const tipo = (ev.tipo_evento || "").toLowerCase().trim();
      if (tipo !== "unico") return false;
      const part = ev.data_evento?.split("T")[0].split(" ")[0];
      return part === key;
    });
  }, [events, selectedWeekendDate]);

  const weekendFeatured = weekendEvents[0];

  const calendarRows = useMemo(
    () => monthMatrix(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );

  const selectedDayEvents = selectedDay
    ? eventsForCalendarDay(selectedDay, events)
    : [];

  const barColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];

  if (ctxLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#eef0f4] text-slate-600">
        Carregando painel…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef0f4] text-slate-800 pb-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Painel
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Informações do seu estabelecimento e acesso rápido ao que importa.
            </p>
          </div>
          {filteredEstablishments.length > 0 && (
            <div className="flex flex-col gap-1 min-w-[220px]">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Estabelecimento
              </label>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={selectedEstId ?? ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setSelectedEstId(Number.isNaN(v) ? null : v);
                  setSelectedDay(null);
                }}
              >
                {filteredEstablishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Linha 1: Guia + Atenção */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-lg min-h-[220px] relative group">
            <Image
              src={HERO_BG}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
              <p className="text-white/90 text-sm font-medium mb-1">Boas-vindas</p>
              <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight max-w-xl">
                Guia interativo e documentação
              </h2>
              <p className="text-white/85 mt-2 max-w-lg text-sm sm:text-base leading-relaxed">
                Tutoriais passo a passo, fluxos do sistema e o manual de uso — tudo em um só lugar
                para você trabalhar com confiança.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/guia"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 px-8 py-4 text-lg font-bold shadow-lg hover:bg-slate-100 transition-colors min-w-[200px]"
                >
                  <MdMenuBook className="text-2xl" />
                  Manual de uso
                </Link>
                <Link
                  href="/documentacao"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/30 px-6 py-4 text-base font-semibold hover:bg-white/25 transition-colors"
                >
                  Documentação
                  <MdOpenInNew />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {showAnnouncement ? (
              <div className="rounded-3xl bg-rose-50 border border-rose-100 shadow-md p-5 sm:p-6 h-full min-h-[220px] relative">
                <button
                  type="button"
                  aria-label="Fechar aviso"
                  className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 p-1"
                  onClick={() => setDismissedAnnouncementId(primaryAnnouncement.id)}
                >
                  <MdClose size={22} />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <MdWarning className="text-rose-600 shrink-0 mt-0.5" size={28} />
                  <div>
                    <h3 className="text-lg font-bold text-rose-900">
                      {primaryAnnouncement.title}
                    </h3>
                    <p className="text-rose-950/90 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {primaryAnnouncement.body}
                    </p>
                    <p className="text-xs text-rose-700/80 mt-4 font-medium">
                      {primaryAnnouncement.footer_label || "Administrativo / RH"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-100 shadow-md p-5 sm:p-6 h-full min-h-[220px] flex flex-col justify-center">
                <div className="flex items-start gap-3">
                  <MdWarning className="text-amber-500 shrink-0" size={26} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Atenção</h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                      Não há comunicados administrativos ou do RH no momento. Quando houver avisos
                      para o seu estabelecimento, eles aparecerão aqui em destaque.
                    </p>
                    <p className="text-xs text-slate-400 mt-4">
                      Dúvidas? Procure seu gestor ou o RH.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: Fim de semana + Calendário */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-5 rounded-3xl bg-white shadow-md border border-slate-100 overflow-hidden flex flex-col min-h-[380px]">
            <div className="px-5 pt-5 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MdEvent className="text-indigo-600" />
                Eventos do fim de semana
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Somente eventos únicos (data fixa); os semanais continuam no calendário ao lado.
              </p>
              <div className="flex gap-2 mt-4">
                {(["Sex", "Sáb", "Dom"] as const).map((label, idx) => {
                  const d = weekendDates[idx];
                  const active = weekendDayIndex === idx;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setWeekendDayIndex(idx as 0 | 1 | 2)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {label}{" "}
                      <span className="opacity-80 font-normal">
                        {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 p-5 flex flex-col">
              {eventsLoading ? (
                <p className="text-slate-500 text-sm">Carregando eventos…</p>
              ) : weekendFeatured ? (
                <>
                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <EventCoverImage
                      src={weekendFeatured.imagem_url}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="mt-4 text-xl font-bold text-slate-900 leading-snug">
                    {weekendFeatured.nome}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {fmtIso(selectedWeekendDate)} ·{" "}
                    {weekendFeatured.horario ||
                      weekendFeatured.horario_funcionamento ||
                      "Horário a confirmar"}
                  </p>
                  {weekendFeatured.descricao ? (
                    <p className="text-sm text-slate-600 mt-3 line-clamp-4">
                      {weekendFeatured.descricao}
                    </p>
                  ) : null}
                  {weekendEvents.length > 1 ? (
                    <p className="text-xs text-slate-400 mt-auto pt-4">
                      + {weekendEvents.length - 1} outro(s) evento(s) neste dia — use o calendário ao
                      lado para detalhes.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <MdEvent className="text-slate-300 mb-2" size={48} />
                  <p className="text-slate-600 font-medium">Nenhum evento cadastrado para este dia</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Cadastre ou vincule eventos em{" "}
                    <Link href="/admin/eventos" className="text-indigo-600 font-medium underline">
                      Eventos
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-white shadow-md border border-slate-100 overflow-hidden flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MdCalendarToday className="text-indigo-600" />
                {calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                    )
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col lg:flex-row gap-5">
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarRows.flatMap((week, wi) =>
                    week.map((cell, ci) => {
                      const key = `${wi}-${ci}`;
                      if (!cell) {
                        return <div key={key} className="aspect-square rounded-xl" />;
                      }
                      const list = eventsForCalendarDay(cell, events);
                      const has = list.length > 0;
                      const isSel =
                        selectedDay &&
                        fmtIso(cell) === fmtIso(selectedDay);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDay(cell)}
                          className={`aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                            ${isSel ? "ring-2 ring-indigo-600 ring-offset-2 bg-indigo-50 text-indigo-900" : "hover:bg-slate-50"}
                            ${has ? "font-bold text-indigo-700" : "text-slate-600"}
                          `}
                        >
                          <span>{cell.getDate()}</span>
                          {has ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          ) : null}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
              <div className="lg:w-[42%] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5 flex flex-col">
                {!selectedDay ? (
                  <p className="text-sm text-slate-500">
                    Toque em uma data com marcação para ver o evento e a imagem.
                  </p>
                ) : selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum evento para {selectedDay.toLocaleDateString("pt-BR")}.
                  </p>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[320px] pr-1">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={`${ev.evento_id}-${ev.tipo_evento}`}
                        className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
                      >
                        <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden">
                          <EventCoverImage
                            src={ev.imagem_url}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-slate-900 leading-snug">{ev.nome}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {ev.tipo_evento === "semanal"
                              ? "Evento semanal"
                              : ev.data_evento?.split("T")[0]}{" "}
                            · {ev.horario || ev.horario_funcionamento || "—"}
                          </p>
                          <Link
                            href={`/admin/eventos/${ev.evento_id}/check-ins`}
                            className="text-xs font-semibold text-indigo-600 mt-2 inline-block hover:underline"
                          >
                            Abrir check-ins →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progresso semanal */}
        <div className="rounded-3xl bg-white shadow-md border border-slate-100 p-5 sm:p-6">
          <h3 className="text-lg font-bold text-slate-900">Progresso semanal</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Indicadores automáticos com base na atividade registrada no sistema (eventos, cardápio e
            reservas) nesta semana — útil para gestores acompanharem rotinas.
          </p>
          {weekly.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados de progresso para o seu perfil nesta semana. Verifique se você está vinculado
              a um estabelecimento.
            </p>
          ) : (
            <ul className="space-y-5">
              {weekly.map((row, i) => (
                <li key={row.establishment_id}>
                  <div className="flex justify-between text-sm font-medium text-slate-700 mb-1.5">
                    <span>
                      {row.establishment_name}{" "}
                      <span className="text-slate-400 font-normal">
                        · eventos {row.tasks.eventos_semana ? "✓" : "○"} · cardápio{" "}
                        {row.tasks.cardapio ? "✓" : "○"} · reservas {row.tasks.reservas ? "✓" : "○"}
                      </span>
                    </span>
                    <span>{row.percent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColors[i % barColors.length]}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
