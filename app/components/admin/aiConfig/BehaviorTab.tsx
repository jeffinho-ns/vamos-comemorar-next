'use client';

import { AiBehaviorConfig } from '@/app/types/aiAssistant';
import { useAiSettings } from './useAiSettings';
import { FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, ToggleRow } from './shared';

const AFTER_HOURS_OPTIONS = [
  { value: 'padrao', label: 'Padrão (responde normalmente)' },
  { value: 'avisar_horario', label: 'Avisar que está fora do horário' },
  { value: 'encaminhar_humano', label: 'Encaminhar para um humano' },
  { value: 'silencio', label: 'Não responder até o horário' },
];

export default function BehaviorTab({ establishmentId }: { establishmentId: number | null }) {
  const { settings, setSettings, loading, saving, error, success, load, save } =
    useAiSettings(establishmentId);

  const cfg = settings.behavior_config || {};

  const setFlag = (key: keyof AiBehaviorConfig, value: boolean | string | number) => {
    setSettings((prev) => ({
      ...prev,
      behavior_config: { ...prev.behavior_config, [key]: value },
    }));
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando configurações...</p>;

  return (
    <div className="space-y-8">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Comportamento"
        description="Regras de atendimento — o que a IA faz, quando aciona um humano e o que deve evitar."
      />

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Reservas</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Não dar informações sobre reservas"
            description="A IA não confirma nem detalha reservas; encaminha para a equipe."
            checked={Boolean(cfg.nao_informar_reservas)}
            onChange={(v) => setFlag('nao_informar_reservas', v)}
          />
          <ToggleRow
            title="Bloquear visita sem reserva"
            description="Não confirma entrada/visita sem reserva; orienta a reservar antes."
            checked={Boolean(cfg.bloquear_visita_sem_reserva)}
            onChange={(v) => setFlag('bloquear_visita_sem_reserva', v)}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Fora da janela de atendimento</h4>
        <p className="mb-3 text-xs text-gray-500">O que fazer quando o cliente escreve fora do horário.</p>
        <select
          value={cfg.fora_horario_comportamento || 'padrao'}
          onChange={(e) => setFlag('fora_horario_comportamento', e.target.value)}
          className={`${INPUT_CLASS} sm:max-w-md`}
        >
          {AFTER_HOURS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Chamar humano quando...</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Cliente insiste para finalizar"
            description="Aciona um humano quando o cliente insiste em algo que a IA não resolve."
            checked={Boolean(cfg.chamar_humano_insistencia)}
            onChange={(v) => setFlag('chamar_humano_insistencia', v)}
          />
          <ToggleRow
            title="Erro técnico ou dúvida fora do alcance"
            description="Encaminha para humano em caso de falha ou pergunta que a IA não cobre."
            checked={Boolean(cfg.chamar_humano_erro)}
            onChange={(v) => setFlag('chamar_humano_erro', v)}
          />
          <ToggleRow
            title="Pedido fora da área"
            description="Encaminha quando o assunto foge do escopo da assistente."
            checked={Boolean(cfg.chamar_humano_fora_area)}
            onChange={(v) => setFlag('chamar_humano_fora_area', v)}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Atendimento humano</h4>
        <label className="mb-1 block text-xs text-gray-500">Mensagem ao encaminhar para a equipe</label>
        <textarea
          value={cfg.mensagem_atendimento_humano || ''}
          onChange={(e) => setFlag('mensagem_atendimento_humano', e.target.value)}
          rows={3}
          placeholder="Ex.: Já chamei alguém da equipe pra continuar com você por aqui, beleza?"
          className={INPUT_CLASS}
        />
        <div className="mt-3 max-w-xs">
          <label className="mb-1 block text-xs text-gray-500">Tempo limite de inatividade (minutos)</label>
          <input
            type="number"
            min={0}
            value={Number(cfg.tempo_limite_inatividade ?? 0)}
            onChange={(e) => setFlag('tempo_limite_inatividade', Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Conversa</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Bloquear links de entrada em eventos"
            description="Não compartilha links de entrada/ingresso de eventos automaticamente."
            checked={Boolean(cfg.bloquear_links_entrada_eventos)}
            onChange={(v) => setFlag('bloquear_links_entrada_eventos', v)}
          />
          <ToggleRow
            title='Evitar a palavra "evento"'
            description='Prefere "programação" ou a data em vez de "evento".'
            checked={Boolean(cfg.evitar_palavra_evento)}
            onChange={(v) => setFlag('evitar_palavra_evento', v)}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Menu</h4>
        <ToggleRow
          title="Bloquear informações de menu"
          description="A IA não envia detalhes do cardápio; usa o link oficial quando houver."
          checked={Boolean(cfg.bloquear_info_menu)}
          onChange={(v) => setFlag('bloquear_info_menu', v)}
        />
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Outros canais e mídia</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Considerar figurinhas e reações"
            description="Trata figurinhas e reações do cliente como interação válida."
            checked={Boolean(cfg.considerar_figurinhas)}
            onChange={(v) => setFlag('considerar_figurinhas', v)}
          />
          <ToggleRow
            title="Ignorar comentários de Instagram"
            description="Responde só mensagens diretas; ignora comentários públicos."
            checked={Boolean(cfg.ignorar_comentarios_instagram)}
            onChange={(v) => setFlag('ignorar_comentarios_instagram', v)}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Avançado</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Usar classificador BERT (recomendado)"
            description="Melhora a detecção de intenção antes de responder."
            checked={cfg.usar_classificador_bert !== false}
            onChange={(v) => setFlag('usar_classificador_bert', v)}
          />
          <ToggleRow
            title="Cancelador sutil"
            description="Desfaz respostas em caso de erro detectado, com menos ruído."
            checked={Boolean(cfg.cancelador_sutil)}
            onChange={(v) => setFlag('cancelador_sutil', v)}
          />
        </div>
      </div>

      <SaveBar onSave={save} onReset={load} saving={saving} disabled={establishmentId === null} />
    </div>
  );
}
