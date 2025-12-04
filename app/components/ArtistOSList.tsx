"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdEdit, MdVisibility, MdFileDownload, MdAdd } from 'react-icons/md';
import { OperationalDetail } from '@/app/types/operationalDetail';
import ArtistOSViewModal from './ArtistOSViewModal';
import ArtistOSEditModal from './ArtistOSEditModal';
import { exportToWord, exportToExcel, exportToPDF } from '@/app/utils/exportOS';

interface ArtistOSListProps {
  details: OperationalDetail[];
  onRefresh: () => void;
  onAddNew: () => void;
}

export default function ArtistOSList({
  details,
  onRefresh,
  onAddNew
}: ArtistOSListProps) {
  const [viewingDetail, setViewingDetail] = useState<OperationalDetail | null>(null);
  const [editingDetail, setEditingDetail] = useState<OperationalDetail | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T12:00:00');
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleView = (detail: OperationalDetail) => {
    setViewingDetail(detail);
    setShowViewModal(true);
  };

  const handleEdit = (detail: OperationalDetail) => {
    setEditingDetail(detail);
    setShowEditModal(true);
  };

  const handleExport = async (detail: OperationalDetail, format: 'word' | 'excel' | 'pdf') => {
    setExporting(`${detail.id}-${format}`);
    try {
      switch (format) {
        case 'word':
          await exportToWord(detail);
          break;
        case 'excel':
          await exportToExcel(detail);
          break;
        case 'pdf':
          await exportToPDF(detail);
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o arquivo. Tente novamente.');
    } finally {
      setExporting(null);
    }
  };

  const handleSave = async (data: Record<string, any>) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`/api/operational-details/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao salvar');
    }

    onRefresh();
  };

  // Filtrar apenas OS de artista
  const artistOS = details.filter(d => d.os_type === 'artist');

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">OS de Artista/Banda/DJ</h2>
          <button
            onClick={onAddNew}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
          >
            <MdAdd size={20} /> Nova OS
          </button>
        </div>

        {artistOS.length === 0 ? (
          <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/20">
            <p className="text-gray-500 mb-6">Nenhuma OS de Artista encontrada</p>
            <button
              onClick={onAddNew}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
            >
              <MdAdd size={20} /> Criar Primeira OS
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {artistOS.map((detail, index) => (
              <motion.div
                key={detail.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {formatDate(detail.event_date)} - {detail.event_name || 'Sem nome'}
                    </h3>
                    {detail.artist_artistic_name && (
                      <p className="text-sm text-gray-600">
                        🎤 {detail.artist_artistic_name}
                      </p>
                    )}
                    {detail.establishment_name && (
                      <p className="text-sm text-gray-500 mt-1">
                        📍 {detail.establishment_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(detail)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <MdVisibility size={20} />
                    </button>
                    <button
                      onClick={() => handleEdit(detail)}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <MdEdit size={20} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = document.getElementById(`export-menu-${detail.id}`);
                          if (menu) {
                            menu.classList.toggle('hidden');
                          }
                        }}
                        className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors"
                        title="Exportar"
                      >
                        <MdFileDownload size={20} />
                      </button>
                      <div
                        id={`export-menu-${detail.id}`}
                        className="hidden absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleExport(detail, 'word');
                            const menu = document.getElementById(`export-menu-${detail.id}`);
                            if (menu) menu.classList.add('hidden');
                          }}
                          disabled={exporting === `${detail.id}-word`}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          {exporting === `${detail.id}-word` ? 'Exportando...' : '📄 Word'}
                        </button>
                        <button
                          onClick={() => {
                            handleExport(detail, 'excel');
                            const menu = document.getElementById(`export-menu-${detail.id}`);
                            if (menu) menu.classList.add('hidden');
                          }}
                          disabled={exporting === `${detail.id}-excel`}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          {exporting === `${detail.id}-excel` ? 'Exportando...' : '📊 Excel'}
                        </button>
                        <button
                          onClick={() => {
                            handleExport(detail, 'pdf');
                            const menu = document.getElementById(`export-menu-${detail.id}`);
                            if (menu) menu.classList.add('hidden');
                          }}
                          disabled={exporting === `${detail.id}-pdf`}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          {exporting === `${detail.id}-pdf` ? 'Exportando...' : '📑 PDF'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ArtistOSViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingDetail(null);
        }}
        detail={viewingDetail}
      />

      <ArtistOSEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDetail(null);
        }}
        onSave={handleSave}
        detail={editingDetail}
      />
    </>
  );
}

