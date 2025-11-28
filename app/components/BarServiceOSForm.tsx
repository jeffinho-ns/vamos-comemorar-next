"use client";

import { OperationalDetailFormData } from '@/app/types/operationalDetail';

interface BarServiceOSFormProps {
  formData: OperationalDetailFormData;
  onInputChange: (field: keyof OperationalDetailFormData, value: any) => void;
  errors: Record<string, string>;
}

export default function BarServiceOSForm({ formData, onInputChange, errors }: BarServiceOSFormProps) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          🍸 OS para Serviço de Bar / Fornecedor
        </h3>
        <p className="text-sm text-yellow-700">
          Preencha todos os dados necessários para gerar a Ordem de Serviço
        </p>
      </div>

      {/* Dados do Contratante */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">🔹</span> Dados do Contratante
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Razão social do estabelecimento ou evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contractor_name || ''}
              onChange={(e) => onInputChange('contractor_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.contractor_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              value={formData.contractor_address || ''}
              onChange={(e) => onInputChange('contractor_address', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável (nome)
            </label>
            <input
              type="text"
              value={formData.contractor_legal_responsible || ''}
              onChange={(e) => onInputChange('contractor_legal_responsible', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF do responsável
            </label>
            <input
              type="text"
              value={formData.contractor_legal_cpf || ''}
              onChange={(e) => onInputChange('contractor_legal_cpf', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contato (telefone/e-mail)
            </label>
            <input
              type="text"
              value={formData.contractor_phone || ''}
              onChange={(e) => onInputChange('contractor_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="contato@exemplo.com"
            />
          </div>
        </div>
      </div>

      {/* Dados do Contratado (Prestador do Serviço) */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">🔹</span> Dados do Contratado (prestador do serviço)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Razão social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.provider_name || ''}
              onChange={(e) => onInputChange('provider_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.provider_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {errors.provider_name && (
              <p className="mt-1 text-sm text-red-500">{errors.provider_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ ou CPF
            </label>
            <input
              type="text"
              value={formData.provider_cpf_cnpj || ''}
              onChange={(e) => onInputChange('provider_cpf_cnpj', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              value={formData.provider_address || ''}
              onChange={(e) => onInputChange('provider_address', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável (nome)
            </label>
            <input
              type="text"
              value={formData.provider_responsible_name || ''}
              onChange={(e) => onInputChange('provider_responsible_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contato do responsável
            </label>
            <input
              type="text"
              value={formData.provider_responsible_contact || ''}
              onChange={(e) => onInputChange('provider_responsible_contact', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="md:col-span-4 border-t border-gray-200 pt-4 mt-2">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Conta bancária para pagamento</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.provider_bank_name || ''}
                  onChange={(e) => onInputChange('provider_bank_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                <input
                  type="text"
                  value={formData.provider_bank_agency || ''}
                  onChange={(e) => onInputChange('provider_bank_agency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                <input
                  type="text"
                  value={formData.provider_bank_account || ''}
                  onChange={(e) => onInputChange('provider_bank_account', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.provider_bank_account_type || ''}
                  onChange={(e) => onInputChange('provider_bank_account_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

      {/* Descrição do Serviço */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">🔹</span> Descrição do Serviço
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.service_type || ''}
              onChange={(e) => onInputChange('service_type', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.service_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              placeholder="Ex: bar, bartender, coquetelaria, fornecimento de bebidas"
              required
            />
            {errors.service_type && (
              <p className="mt-1 text-sm text-red-500">{errors.service_type}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de profissionais envolvidos
            </label>
            <input
              type="number"
              value={formData.service_professionals_count || ''}
              onChange={(e) => onInputChange('service_professionals_count', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="0"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materiais e equipamentos inclusos (copos, balcão, gelo, insumos etc.)
            </label>
            <textarea
              value={formData.service_materials_included || ''}
              onChange={(e) => onInputChange('service_materials_included', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de início <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.service_start_date || ''}
              onChange={(e) => onInputChange('service_start_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.service_start_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {errors.service_start_date && (
              <p className="mt-1 text-sm text-red-500">{errors.service_start_date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de início <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.service_start_time || ''}
              onChange={(e) => onInputChange('service_start_time', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.service_start_time ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {errors.service_start_time && (
              <p className="mt-1 text-sm text-red-500">{errors.service_start_time}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de término <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.service_end_date || ''}
              onChange={(e) => onInputChange('service_end_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.service_end_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {errors.service_end_date && (
              <p className="mt-1 text-sm text-red-500">{errors.service_end_date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de término <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.service_end_time || ''}
              onChange={(e) => onInputChange('service_end_time', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.service_end_time ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {errors.service_end_time && (
              <p className="mt-1 text-sm text-red-500">{errors.service_end_time}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local de montagem e desmontagem
            </label>
            <textarea
              value={formData.service_setup_location || ''}
              onChange={(e) => onInputChange('service_setup_location', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável técnico (se houver)
            </label>
            <input
              type="text"
              value={formData.service_technical_responsible || ''}
              onChange={(e) => onInputChange('service_technical_responsible', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Condições Comerciais */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">🔹</span> Condições Comerciais
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor total do serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.commercial_total_value || ''}
              onChange={(e) => onInputChange('commercial_total_value', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.commercial_total_value ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
              }`}
              placeholder="0.00"
              required
            />
            {errors.commercial_total_value && (
              <p className="mt-1 text-sm text-red-500">{errors.commercial_total_value}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de pagamento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.commercial_payment_method || ''}
              onChange={(e) => onInputChange('commercial_payment_method', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.commercial_payment_method ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'
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
            {errors.commercial_payment_method && (
              <p className="mt-1 text-sm text-red-500">{errors.commercial_payment_method}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo de pagamento
            </label>
            <input
              type="text"
              value={formData.commercial_payment_deadline || ''}
              onChange={(e) => onInputChange('commercial_payment_deadline', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Ex: 30 dias após a prestação do serviço"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Política de cancelamento e reembolso
            </label>
            <textarea
              value={formData.commercial_cancellation_policy || ''}
              onChange={(e) => onInputChange('commercial_cancellation_policy', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custos adicionais (transporte, hospedagem, taxa extra de horas etc.)
            </label>
            <textarea
              value={formData.commercial_additional_costs || ''}
              onChange={(e) => onInputChange('commercial_additional_costs', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Condições Gerais */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">🔹</span> Condições Gerais
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsabilidade por danos a equipamentos ou estrutura
            </label>
            <textarea
              value={formData.general_damage_responsibility || ''}
              onChange={(e) => onInputChange('general_damage_responsibility', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regras de conduta e segurança
            </label>
            <textarea
              value={formData.general_conduct_rules || ''}
              onChange={(e) => onInputChange('general_conduct_rules', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seguro ou responsabilidade civil (caso aplicável)
            </label>
            <textarea
              value={formData.general_insurance || ''}
              onChange={(e) => onInputChange('general_insurance', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Nome do responsável"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assinatura do Prestador de Serviço
            </label>
            <input
              type="text"
              value={formData.provider_signature || ''}
              onChange={(e) => onInputChange('provider_signature', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Nome do responsável"
            />
          </div>
        </div>
      </div>
    </div>
  );
}



