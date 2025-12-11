"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdEdit, MdVisibility, MdFileDownload, MdAdd, MdClose } from 'react-icons/md';
import { OperationalDetail } from '@/app/types/operationalDetail';
import ArtistOSViewModal from './ArtistOSViewModal';
import ArtistOSEditModal from './ArtistOSEditModal';
import { exportToWord, exportToExcel, exportToPDF } from '@/app/utils/exportOS';

interface ArtistOSListProps {
  details: OperationalDetail[];
  onRefresh: () => void;
  onAddNew: () => void;
  canEdit?: boolean;
  canCreate?: boolean;
}

export default function ArtistOSList({
  details,
  onRefresh,
  onAddNew,
  canEdit = true,
  canCreate = true
}: ArtistOSListProps) {
  const [viewingDetail, setViewingDetail] = useState<OperationalDetail | null>(null);
  const [editingDetail, setEditingDetail] = useState<OperationalDetail | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDetailForExport, setSelectedDetailForExport] = useState<OperationalDetail | null>(null);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      console.warn('⚠️ formatDate: dateString é null/undefined');
      return 'Data não informada';
    }
    
    // Log para debug em produção
    if (typeof dateString !== 'string') {
      console.warn('⚠️ formatDate: dateString não é string:', typeof dateString, dateString);
      return 'Data inválida';
    }
    
    try {
      // Limpar a string de data
      const cleanDate = String(dateString).trim();
      
      // Se já está no formato YYYY-MM-DD, adicionar hora
      let date: Date;
      if (cleanDate.includes('T')) {
        date = new Date(cleanDate);
      } else if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato YYYY-MM-DD
        date = new Date(cleanDate + 'T12:00:00');
      } else {
        // Tentar parsear diretamente
        date = new Date(cleanDate);
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('⚠️ formatDate: data inválida após parse:', cleanDate);
        return 'Data inválida';
      }
      
      const formatted = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      return formatted;
    } catch (error) {
      console.error('❌ Erro ao formatar data:', error, dateString);
      return 'Data inválida';
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

  const handleOpenExportModal = (detail: OperationalDetail) => {
    setSelectedDetailForExport(detail);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setSelectedDetailForExport(null);
    setExporting(null);
  };

  const handleExport = async (format: 'word' | 'excel' | 'pdf') => {
    if (!selectedDetailForExport) return;
    
    setExporting(`${selectedDetailForExport.id}-${format}`);
    try {
      switch (format) {
        case 'word':
          await exportToWord(selectedDetailForExport);
          break;
        case 'excel':
          await exportToExcel(selectedDetailForExport);
          break;
        case 'pdf':
          await exportToPDF(selectedDetailForExport);
          break;
      }
      handleCloseExportModal();
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
          {canCreate && (
            <button
              onClick={onAddNew}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
            >
              <MdAdd size={20} /> Nova OS
            </button>
          )}
        </div>

        {artistOS.length === 0 ? (
          <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/20">
            <p className="text-gray-500 mb-6">Nenhuma OS de Artista encontrada</p>
            {canCreate && (
              <button
                onClick={onAddNew}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
              >
                <MdAdd size={20} /> Criar Primeira OS
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {artistOS.map((detail, index) => {
              // Debug: log dos dados do detail
              if (index === 0) {
                console.log('🔍 Debug ArtistOS - detail completo:', detail);
                console.log('🔍 Debug ArtistOS - event_date:', detail.event_date, typeof detail.event_date);
                console.log('🔍 Debug ArtistOS - event_name:', detail.event_name);
                console.log('🔍 Debug ArtistOS - artistic_attraction:', detail.artistic_attraction);
              }
              
              const eventName = detail.event_name || detail.artistic_attraction || (detail as any).project_name || 'Sem nome';
              const formattedDate = formatDate(detail.event_date);
              
              return (
              <motion.div
                key={detail.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200 relative overflow-visible"
                style={{ overflow: 'visible' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {formattedDate} - {eventName}
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
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(detail)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <MdEdit size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenExportModal(detail)}
                      className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors"
                      title="Exportar"
                    >
                      <MdFileDownload size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
              );
            })}
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

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && selectedDetailForExport && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleCloseExportModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Exportar OS</h2>
                <button
                  onClick={handleCloseExportModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={!!exporting}
                >
                  <MdClose size={24} />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Escolha o formato para exportar a OS de <strong>{selectedDetailForExport.event_name || selectedDetailForExport.artistic_attraction || 'Artista'}</strong>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleExport('word')}
                  disabled={!!exporting}
                  className="w-full flex items-center justify-between px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Microsoft Word</div>
                      <div className="text-sm text-gray-600">Documento .docx</div>
                    </div>
                  </div>
                  {exporting === `${selectedDetailForExport.id}-word` && (
                    <span className="animate-spin text-blue-600">⏳</span>
                  )}
                </button>

                <button
                  onClick={() => handleExport('excel')}
                  disabled={!!exporting}
                  className="w-full flex items-center justify-between px-6 py-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Microsoft Excel</div>
                      <div className="text-sm text-gray-600">Planilha .xlsx</div>
                    </div>
                  </div>
                  {exporting === `${selectedDetailForExport.id}-excel` && (
                    <span className="animate-spin text-green-600">⏳</span>
                  )}
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!exporting}
                  className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📑</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">PDF</div>
                      <div className="text-sm text-gray-600">Documento .pdf</div>
                    </div>
                  </div>
                  {exporting === `${selectedDetailForExport.id}-pdf` && (
                    <span className="animate-spin text-red-600">⏳</span>
                  )}
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseExportModal}
                  disabled={!!exporting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

