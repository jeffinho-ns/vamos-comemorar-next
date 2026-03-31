"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import { toast } from "react-toastify";
import { Download, FileText, Loader2, Phone } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.agilizaiapp.com.br";

type ContactItem = {
  id: string;
  nome: string;
  telefone: string;
  areaReservada: string;
  email?: string;
  reservationId?: number;
  reservationType?: "restaurant" | "large" | "unknown";
};

type LinkedGuestList = {
  reservation_id?: number;
  reservation_type?: string;
  owner_name?: string;
  area_name?: string;
  table_number?: string | number;
};

type LinkedReservation = {
  id: number;
  reservation_type?: string;
  responsavel?: string;
  client_name?: string;
  area_name?: string;
  table_number?: string | number;
  client_phone?: string;
  telefone?: string;
  phone?: string;
};

interface CheckinsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  eventDate: string;
  metrics: {
    totalPresentes: number;
    ocupacaoPct: number;
    totalReservas: number;
  };
  chartData: Array<{ hora: string; checkins: number }>;
  guestLists: LinkedGuestList[];
  reservations: LinkedReservation[];
}

function dateOnly(isoOrDate: string): string {
  return (isoOrDate || "").split("T")[0].split(" ")[0];
}

function getPhone(raw: any): string {
  const phone =
    raw?.client_phone ?? raw?.telefone ?? raw?.phone ?? raw?.whatsapp ?? "";
  return String(phone || "").trim();
}

function getEmail(raw: any): string {
  const email = raw?.client_email ?? raw?.email ?? "";
  return String(email || "").trim();
}

function asReservationType(raw?: string): "restaurant" | "large" | "unknown" {
  const val = String(raw || "").toLowerCase();
  if (val.includes("large")) return "large";
  if (val.includes("restaurant")) return "restaurant";
  return "unknown";
}

function buildMarketingTips(ocupacaoPct: number, totalReservas: number): string[] {
  if (ocupacaoPct >= 80) {
    return [
      "Alta ocupacao detectada: oferecer brinde de retorno para reservas VIP no proximo evento.",
      "Abrir lista de espera antecipada em D-3 para converter demanda reprimida em receita.",
    ];
  }
  if (ocupacaoPct >= 60) {
    return [
      "Boa tracao de publico: ativar campanha de upsell de mesas premium por WhatsApp.",
      "Enviar cupom de consumo para contatos que fizeram check-in no horario de pico.",
    ];
  }
  return [
    "Ocupacao abaixo do ideal: antecipar campanha de reengajamento com bonus de entrada.",
    "Criar acao com promoters focada em base inativa e remarketing dos ultimos 30 dias.",
  ];
}

export default function CheckinsReportModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  eventDate,
  metrics,
  chartData,
  guestLists,
  reservations,
}: CheckinsReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const linkedReservationMap = useMemo(() => {
    const map = new Map<string, ContactItem>();

    guestLists.forEach((gl) => {
      if (!gl.reservation_id) return;
      const area = gl.area_name || (gl.table_number ? `Mesa ${gl.table_number}` : "Nao informado");
      const type = asReservationType(gl.reservation_type);
      const mapKey = `${type}:${gl.reservation_id}`;
      map.set(mapKey, {
        id: mapKey,
        nome: String(gl.owner_name || "Sem nome"),
        telefone: "",
        areaReservada: area,
        reservationId: gl.reservation_id,
        reservationType: type,
      });
    });

    reservations.forEach((r) => {
      const id = Number(r.id);
      if (!id) return;
      const type = asReservationType(r.reservation_type || "restaurant");
      const mapKey = `${type}:${id}`;
      const area =
        r.area_name || (r.table_number ? `Mesa ${String(r.table_number)}` : "Nao informado");
      map.set(mapKey, {
        id: mapKey,
        nome: String(r.responsavel || r.client_name || map.get(mapKey)?.nome || "Sem nome"),
        telefone: String(
          r.client_phone || r.telefone || r.phone || map.get(mapKey)?.telefone || "",
        ),
        areaReservada: area,
        reservationId: id,
        reservationType: type,
      });
    });

    return map;
  }, [guestLists, reservations]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchContacts = async () => {
      setContactsLoading(true);
      setContactsError(null);

      try {
        const token = localStorage.getItem("authToken");
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const checkinsResponse = await fetch(
          `${API_URL}/api/v1/eventos/${eventId}/checkins`,
          { headers },
        );
        if (!checkinsResponse.ok) {
          throw new Error("Nao foi possivel carregar dados do evento.");
        }

        const checkinsData = await checkinsResponse.json();
        const evento = checkinsData?.evento;
        const eventoDate = dateOnly(evento?.data_evento || eventDate);
        const establishmentId = evento?.establishment_id;

        const reservationsUrls: string[] = [];
        if (establishmentId && eventoDate) {
          reservationsUrls.push(
            `${API_URL}/api/restaurant-reservations?establishment_id=${establishmentId}&date=${eventoDate}`,
            `${API_URL}/api/large-reservations?establishment_id=${establishmentId}&date=${eventoDate}`,
          );
        }

        const responses = await Promise.all(
          reservationsUrls.map((url) =>
            fetch(url, { headers }).then((res) =>
              res.ok ? res.json() : { reservations: [] },
            ),
          ),
        );

        const linkedKeys = new Set<string>(Array.from(linkedReservationMap.keys()));
        const allRows = responses.flatMap((payload: any) => [
          ...(payload?.reservations || []).map((row: any) => ({
            ...row,
            _reservation_type: "restaurant",
          })),
          ...(payload?.data || []).map((row: any) => ({
            ...row,
            _reservation_type: "large",
          })),
        ]);

        const mergedByNameAndArea = new Map<string, ContactItem>();
        allRows.forEach((row: any) => {
          const id = Number(row?.id);
          if (!id) return;
          const rowType = asReservationType(row?._reservation_type);
          const mapKey = `${rowType}:${id}`;

          const eventoIdRaw = Number(
            row?.evento_id ?? row?.event_id ?? row?.eventId ?? 0,
          );
          const sameEvent = eventoIdRaw > 0 && eventoIdRaw === Number(eventId);
          const sameDate = dateOnly(String(row?.reservation_date || "")) === eventoDate;
          if (!sameEvent && !sameDate && !linkedKeys.has(mapKey)) return;

          const fallback = linkedReservationMap.get(mapKey);
          const area =
            row?.area_name ||
            row?.area?.name ||
            fallback?.areaReservada ||
            (row?.table_number ? `Mesa ${row.table_number}` : "Nao informado");
          const name =
            row?.client_name || row?.responsavel || fallback?.nome || "Sem nome";
          const phone = getPhone(row) || fallback?.telefone || "";
          const email = getEmail(row) || fallback?.email || "";

          const dedupKey = `${String(name).trim().toLowerCase()}|${String(area).trim().toLowerCase()}`;
          const current = mergedByNameAndArea.get(dedupKey);
          const nextItem: ContactItem = {
            id: mapKey,
            nome: String(name),
            telefone: String(phone),
            email: String(email),
            areaReservada: String(area),
            reservationId: id,
            reservationType: rowType,
          };

          if (!current) {
            mergedByNameAndArea.set(dedupKey, nextItem);
          } else {
            mergedByNameAndArea.set(dedupKey, {
              ...current,
              telefone: current.telefone || nextItem.telefone,
              email: current.email || nextItem.email,
              reservationId: current.reservationId || nextItem.reservationId,
              reservationType: current.reservationType || nextItem.reservationType,
            });
          }
        });

        linkedReservationMap.forEach((value) => {
          const dedupKey = `${String(value.nome).trim().toLowerCase()}|${String(value.areaReservada).trim().toLowerCase()}`;
          const current = mergedByNameAndArea.get(dedupKey);
          if (!current) {
            mergedByNameAndArea.set(dedupKey, value);
          } else if (!current.telefone && value.telefone) {
            mergedByNameAndArea.set(dedupKey, { ...current, telefone: value.telefone });
          }
        });

        const contactsWithFallback = Array.from(mergedByNameAndArea.values());

        const missingPhoneTargets = contactsWithFallback.filter(
          (contact) => !contact.telefone && contact.reservationId,
        );

        await Promise.all(
          missingPhoneTargets.map(async (contact) => {
            const reservationId = contact.reservationId;
            if (!reservationId) return;

            const fetchDetail = async (reservationType: "restaurant" | "large") => {
              const endpoint =
                reservationType === "large"
                  ? `${API_URL}/api/large-reservations/${reservationId}`
                  : `${API_URL}/api/restaurant-reservations/${reservationId}`;
              const res = await fetch(endpoint, { headers });
              if (!res.ok) return null;
              const payload = await res.json();
              const data = payload?.reservation || payload?.data || null;
              if (!data) return null;
              return { phone: getPhone(data), email: getEmail(data) };
            };

            const preferredType = contact.reservationType || "unknown";
            let detail: { phone: string; email: string } | null = null;

            if (preferredType === "restaurant" || preferredType === "large") {
              detail = await fetchDetail(preferredType);
            } else {
              detail = (await fetchDetail("restaurant")) || (await fetchDetail("large"));
            }

            if (detail?.phone || detail?.email) {
              contact.telefone = detail.phone || contact.telefone;
              contact.email = detail.email || contact.email;
            }
          }),
        );

        const sortedContacts = contactsWithFallback.sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );
        setContacts(sortedContacts);
      } catch (err) {
        setContactsError(
          err instanceof Error ? err.message : "Erro ao buscar contatos do relatorio.",
        );
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    fetchContacts();
  }, [eventDate, eventId, isOpen, linkedReservationMap]);

  const marketingTips = useMemo(
    () => buildMarketingTips(metrics.ocupacaoPct, metrics.totalReservas),
    [metrics.ocupacaoPct, metrics.totalReservas],
  );

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeEventName = eventName
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      pdf.save(`relatorio-checkins-${safeEventName || eventId}.pdf`);
    } catch (error) {
      toast.error("Erro ao gerar PDF do relatorio.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Relatorio do evento"
      className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-0 max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden"
      overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Relatorio de Check-ins</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 text-sm font-medium transition-colors"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar PDF
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 text-sm"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-72px)]">
        <div ref={reportRef} className="bg-white text-slate-900 p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-emerald-700">Vamos Comemorar</h3>
            <p className="text-slate-700 mt-1">{eventName || "Evento sem nome"}</p>
            <p className="text-sm text-slate-500">Data do evento: {eventDate || "-"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Total Presentes</p>
              <p className="text-3xl font-bold text-emerald-800">{metrics.totalPresentes}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs uppercase tracking-wide text-sky-700">% de Ocupacao</p>
              <p className="text-3xl font-bold text-sky-800">{metrics.ocupacaoPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-xs uppercase tracking-wide text-violet-700">Total de Reservas</p>
              <p className="text-3xl font-bold text-violet-800">{metrics.totalReservas}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 mb-6">
            <h4 className="text-base font-semibold mb-2">Check-ins por hora</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="checkins"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-slate-600" />
              <h4 className="text-base font-semibold">Contatos para pos-venda</h4>
            </div>

            {contactsLoading && (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando contatos...
              </div>
            )}

            {contactsError && !contactsLoading && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {contactsError}
              </div>
            )}

            {!contactsLoading && !contactsError && contacts.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum contato encontrado para este evento.</p>
            )}

            {!contactsLoading && !contactsError && contacts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="py-2 pr-2">Nome</th>
                      <th className="py-2 pr-2">Telefone</th>
                      <th className="py-2">Area Reservada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-100">
                        <td className="py-2 pr-2">{contact.nome}</td>
                        <td className="py-2 pr-2">{contact.telefone || "-"}</td>
                        <td className="py-2">{contact.areaReservada || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Sugestoes de Marketing</h4>
            <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
              {marketingTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
