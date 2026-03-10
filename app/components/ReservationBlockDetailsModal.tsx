"use client";

interface ReservationBlockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: any[];
  apiUrl: string;
  onBlocksChanged?: () => void;
}

export default function ReservationBlockDetailsModal({
  isOpen,
  onClose,
  blocks,
  apiUrl,
  onBlocksChanged,
}: ReservationBlockDetailsModalProps) {
  if (!isOpen) return null;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRemove = async (blockId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${apiUrl}/api/restaurant-reservation-blocks/${blockId}`, {
        method: "DELETE",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      if (!res.ok) {
        console.error("Erro ao remover bloqueio:", await res.text());
        alert("Não foi possível remover o bloqueio. Tente novamente.");
        return;
      }
      if (onBlocksChanged) onBlocksChanged();
    } catch (e) {
      console.error("Erro ao remover bloqueio:", e);
      alert("Erro ao remover bloqueio. Verifique sua conexão.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Detalhes do bloqueio de agenda
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Fechar
          </button>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-gray-600">
            Não há bloqueios aplicados para este dia.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold text-gray-800">
                    Período:
                  </span>{" "}
                  {formatDateTime(block.start_datetime)} &rarr;{" "}
                  {formatDateTime(block.end_datetime)}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold text-gray-800">Área:</span>{" "}
                  {block.area_name ||
                    block.area_display_name ||
                    (block.area_id ? `Área #${block.area_id}` : "Todas as áreas")}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold text-gray-800">Motivo:</span>{" "}
                  {block.reason || "Bloqueio de agenda"}
                </div>
                {block.recurrence_type && block.recurrence_type !== "none" && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold text-gray-800">
                      Recorrência:
                    </span>{" "}
                    {block.recurrence_type === "weekly"
                      ? "Semanal"
                      : block.recurrence_type}
                  </div>
                )}
                {typeof block.max_people_capacity === "number" && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-semibold text-gray-800">
                      Capacidade máxima:
                    </span>{" "}
                    {block.max_people_capacity} pessoas
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemove(block.id)}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Remover bloqueio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

