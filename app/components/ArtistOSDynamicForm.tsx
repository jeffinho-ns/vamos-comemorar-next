"use client";

import { useState } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';

export interface DynamicField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'textarea';
}

interface ArtistOSDynamicFormProps {
  formData: Record<string, any>;
  onFieldChange: (key: string, value: string | number | null) => void;
  onAddField: (field: DynamicField) => void;
  onRemoveField: (key: string) => void;
  errors?: Record<string, string>;
}

// Campos sugeridos padrão
const SUGGESTED_FIELDS: Omit<DynamicField, 'value'>[] = [
  { key: 'working_hours', label: 'Horários de Funcionamento', type: 'textarea' },
  { key: 'ticket_values', label: 'Valores de entrada (ou venda antecipada)', type: 'textarea' },
  { key: 'promotions', label: 'Promoções', type: 'textarea' },
  { key: 'benefits', label: 'Benefícios', type: 'textarea' },
  { key: 'menu', label: 'Cardápio (caso tenha mudança por data)', type: 'textarea' },
  { key: 'briefing', label: 'Briefing (caso não seja uma data normal)', type: 'textarea' },
  { key: 'partnership', label: 'Parceria', type: 'textarea' },
  { key: 'tv_games', label: 'JOGOS PARA PASSAR NA TV', type: 'textarea' },
];

export default function ArtistOSDynamicForm({
  formData,
  onFieldChange,
  onAddField,
  onRemoveField,
  errors = {}
}: ArtistOSDynamicFormProps) {
  const [customFields, setCustomFields] = useState<DynamicField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea'>('text');

  // Obter todos os campos (sugeridos + customizados)
  const allFields = [
    ...SUGGESTED_FIELDS.map(field => ({
      ...field,
      value: formData[field.key] || '',
      isCustom: false
    })),
    ...customFields.map(field => ({
      ...field,
      isCustom: true
    }))
  ];

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const key = `custom_${Date.now()}_${newFieldLabel.toLowerCase().replace(/\s+/g, '_')}`;
    const newField: DynamicField = {
      key,
      label: newFieldLabel,
      value: '',
      type: newFieldType
    };

    setCustomFields([...customFields, newField]);
    onAddField(newField);
    setNewFieldLabel('');
    setNewFieldType('text');
    setShowAddField(false);
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields(customFields.filter(f => f.key !== key));
    onRemoveField(key);
  };

  return (
    <div className="space-y-6">
      {/* Campos Sugeridos */}
      <div className="space-y-4">
        {allFields.map((field) => (
          <div key={field.key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              {field.isCustom && (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(field.key)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Remover campo"
                >
                  <MdDelete size={20} />
                </button>
              )}
            </div>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors[field.key]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder={`Digite ${field.label.toLowerCase()}...`}
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors[field.key]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder={`Digite ${field.label.toLowerCase()}...`}
              />
            )}
            {errors[field.key] && (
              <p className="mt-1 text-sm text-red-500">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar Campo Personalizado */}
      {showAddField ? (
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Campo
              </label>
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Informações Adicionais"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Campo
              </label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as 'text' | 'textarea')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="text">Texto (uma linha)</option>
                <option value="textarea">Texto (múltiplas linhas)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomField}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <MdAdd size={20} />
                Adicionar Campo
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false);
                  setNewFieldLabel('');
                  setNewFieldType('text');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
        >
          <MdAdd size={20} />
          Adicionar Campo Personalizado
        </button>
      )}
    </div>
  );
}

