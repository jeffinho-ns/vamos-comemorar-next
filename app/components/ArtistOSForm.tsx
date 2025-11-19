"use client";

import { OperationalDetailFormData } from '@/app/types/operationalDetail';

interface ArtistOSFormProps {
  formData: OperationalDetailFormData;
  onInputChange: (field: keyof OperationalDetailFormData, value: any) => void;
  errors: Record<string, string>;
}

export default function ArtistOSForm({ formData, onInputChange, errors }: ArtistOSFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          🎤 OS para Contratação de Artista / Banda / DJ
        </h3>
        <p className="text-sm text-purple-700">
          Preencha todos os dados necessários para gerar a Ordem de Serviço
        </p>
      </div>

      {/* Dados do Contratante */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🔹</span> Dados do Contratante (quem contrata)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Razão social do estabelecimento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contractor_name || ''}
              onChange={(e) => onInputChange('contractor_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.contractor_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.contractor_name && (
              <p className="mt-1 text-sm text-red-500">{errors.contractor_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              value={formData.contractor_cnpj || ''}
              onChange={(e) => onInputChange('contractor_cnpj', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço completo
            </label>
            <textarea
              value={formData.contractor_address || ''}
              onChange={(e) => onInputChange('contractor_address', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável legal (nome)
            </label>
            <input
              type="text"
              value={formData.contractor_legal_responsible || ''}
              onChange={(e) => onInputChange('contractor_legal_responsible', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF do responsável legal
            </label>
            <input
              type="text"
              value={formData.contractor_legal_cpf || ''}
              onChange={(e) => onInputChange('contractor_legal_cpf', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone de contato
            </label>
            <input
              type="text"
              value={formData.contractor_phone || ''}
              onChange={(e) => onInputChange('contractor_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail de contato
            </label>
            <input
              type="email"
              value={formData.contractor_email || ''}
              onChange={(e) => onInputChange('contractor_email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="contato@exemplo.com"
            />
          </div>
        </div>
      </div>

      {/* Dados do Contratado (Artista) */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🔹</span> Dados do Contratado (artista)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome artístico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.artist_artistic_name || ''}
              onChange={(e) => onInputChange('artist_artistic_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.artist_artistic_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.artist_artistic_name && (
              <p className="mt-1 text-sm text-red-500">{errors.artist_artistic_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={formData.artist_full_name || ''}
              onChange={(e) => onInputChange('artist_full_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF ou CNPJ
            </label>
            <input
              type="text"
              value={formData.artist_cpf_cnpj || ''}
              onChange={(e) => onInputChange('artist_cpf_cnpj', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do responsável (se for banda ou grupo)
            </label>
            <input
              type="text"
              value={formData.artist_responsible_name || ''}
              onChange={(e) => onInputChange('artist_responsible_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              value={formData.artist_address || ''}
              onChange={(e) => onInputChange('artist_address', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone de contato
            </label>
            <input
              type="text"
              value={formData.artist_phone || ''}
              onChange={(e) => onInputChange('artist_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail de contato
            </label>
            <input
              type="email"
              value={formData.artist_email || ''}
              onChange={(e) => onInputChange('artist_email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="contato@exemplo.com"
            />
          </div>
          <div className="md:col-span-4 border-t border-gray-200 pt-4 mt-2">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Conta bancária para pagamento</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.artist_bank_name || ''}
                  onChange={(e) => onInputChange('artist_bank_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                <input
                  type="text"
                  value={formData.artist_bank_agency || ''}
                  onChange={(e) => onInputChange('artist_bank_agency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                <input
                  type="text"
                  value={formData.artist_bank_account || ''}
                  onChange={(e) => onInputChange('artist_bank_account', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.artist_bank_account_type || ''}
                  onChange={(e) => onInputChange('artist_bank_account_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione</option>
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Evento / Apresentação */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🔹</span> Dados do Evento / Apresentação
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.event_name || ''}
              onChange={(e) => onInputChange('event_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.event_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.event_name && (
              <p className="mt-1 text-sm text-red-500">{errors.event_name}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local (endereço exato) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.event_location_address || ''}
              onChange={(e) => onInputChange('event_location_address', e.target.value)}
              rows={2}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.event_location_address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.event_location_address && (
              <p className="mt-1 text-sm text-red-500">{errors.event_location_address}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da apresentação <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.event_presentation_date || ''}
              onChange={(e) => onInputChange('event_presentation_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.event_presentation_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.event_presentation_date && (
              <p className="mt-1 text-sm text-red-500">{errors.event_presentation_date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário da apresentação <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.event_presentation_time || ''}
              onChange={(e) => onInputChange('event_presentation_time', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.event_presentation_time ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            />
            {errors.event_presentation_time && (
              <p className="mt-1 text-sm text-red-500">{errors.event_presentation_time}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração prevista do show
            </label>
            <input
              type="text"
              value={formData.event_duration || ''}
              onChange={(e) => onInputChange('event_duration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: 2 horas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário de passagem de som (se houver)
            </label>
            <input
              type="time"
              value={formData.event_soundcheck_time || ''}
              onChange={(e) => onInputChange('event_soundcheck_time', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estrutura oferecida (som, luz, palco, camarim, bebida, alimentação etc.)
            </label>
            <textarea
              value={formData.event_structure_offered || ''}
              onChange={(e) => onInputChange('event_structure_offered', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipamentos fornecidos pelo contratante
            </label>
            <textarea
              value={formData.event_equipment_provided_by_contractor || ''}
              onChange={(e) => onInputChange('event_equipment_provided_by_contractor', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipamentos trazidos pelo artista
            </label>
            <textarea
              value={formData.event_equipment_brought_by_artist || ''}
              onChange={(e) => onInputChange('event_equipment_brought_by_artist', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Condições Financeiras */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🔹</span> Condições Financeiras
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor total do cachê <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.financial_total_value || ''}
              onChange={(e) => onInputChange('financial_total_value', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.financial_total_value ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              placeholder="0.00"
              required
            />
            {errors.financial_total_value && (
              <p className="mt-1 text-sm text-red-500">{errors.financial_total_value}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de pagamento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.financial_payment_method || ''}
              onChange={(e) => onInputChange('financial_payment_method', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.financial_payment_method ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
              }`}
              required
            >
              <option value="">Selecione</option>
              <option value="pix">PIX</option>
              <option value="deposito">Depósito</option>
              <option value="transferencia">Transferência</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cheque">Cheque</option>
            </select>
            {errors.financial_payment_method && (
              <p className="mt-1 text-sm text-red-500">{errors.financial_payment_method}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condições de pagamento (sinal, data de saldo etc.)
            </label>
            <textarea
              value={formData.financial_payment_conditions || ''}
              onChange={(e) => onInputChange('financial_payment_conditions', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descontos ou taxas (caso haja)
            </label>
            <textarea
              value={formData.financial_discounts_or_fees || ''}
              onChange={(e) => onInputChange('financial_discounts_or_fees', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Condições Gerais */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🔹</span> Condições Gerais
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Multas ou penalidades por cancelamento ou atraso
            </label>
            <textarea
              value={formData.general_penalties || ''}
              onChange={(e) => onInputChange('general_penalties', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsabilidade por transporte e hospedagem
            </label>
            <textarea
              value={formData.general_transport_responsibility || ''}
              onChange={(e) => onInputChange('general_transport_responsibility', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direitos de imagem (se o contratante quiser divulgar o nome ou imagem do artista)
            </label>
            <textarea
              value={formData.general_image_rights || ''}
              onChange={(e) => onInputChange('general_image_rights', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assinatura do Contratante
            </label>
            <input
              type="text"
              value={formData.contractor_signature || ''}
              onChange={(e) => onInputChange('contractor_signature', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nome do responsável"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assinatura do Contratado (Artista)
            </label>
            <input
              type="text"
              value={formData.artist_signature || ''}
              onChange={(e) => onInputChange('artist_signature', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nome do responsável"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


