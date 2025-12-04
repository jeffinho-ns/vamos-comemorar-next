import { OperationalDetail } from '@/app/types/operationalDetail';

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

export async function exportToWord(detail: OperationalDetail) {
  // Criar conteúdo HTML
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>OS de Artista - ${detail.event_name || detail.artistic_attraction || 'Sem nome'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #7c3aed; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>OS de Artista/Banda/DJ</h1>
      <div class="field">
        <div class="label">Dia do Evento:</div>
        <div class="value">${formatDate(detail.event_date)}</div>
      </div>
      <div class="field">
        <div class="label">Nome do Projeto:</div>
        <div class="value">${detail.event_name || detail.artistic_attraction || 'Não informado'}</div>
      </div>
      ${detail.os_number ? `<div class="field">
        <div class="label">Número da OS:</div>
        <div class="value">${detail.os_number}</div>
      </div>` : ''}
      ${detail.show_schedule ? `<div class="field">
        <div class="label">Horários de Funcionamento:</div>
        <div class="value">${String(detail.show_schedule).replace(/\n/g, '<br>')}</div>
      </div>` : ''}
      ${detail.ticket_prices ? `<div class="field">
        <div class="label">Valores de entrada:</div>
        <div class="value">${String(detail.ticket_prices).replace(/\n/g, '<br>')}</div>
      </div>` : ''}
      ${detail.promotions ? `<div class="field">
        <div class="label">Promoções:</div>
        <div class="value">${String(detail.promotions).replace(/\n/g, '<br>')}</div>
      </div>` : ''}
  `;

  // Adicionar campos dinâmicos de admin_notes (JSON)
  if (detail.admin_notes) {
    try {
      const notesData = JSON.parse(detail.admin_notes);
      if (notesData.dynamicFields) {
        Object.entries(notesData.dynamicFields).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            htmlContent += `
              <div class="field">
                <div class="label">${label}:</div>
                <div class="value">${String(value).replace(/\n/g, '<br>')}</div>
              </div>
            `;
          }
        });
      }
    } catch {
      // Se não for JSON, ignorar
    }
  }

  htmlContent += `
    </body>
    </html>
  `;

  // Converter para Word usando Blob
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `OS_Artista_${(detail.event_name || detail.artistic_attraction || 'OS').replace(/[^a-zA-Z0-9]/g, '_')}_${formatDate(detail.event_date).replace(/\//g, '_')}.doc`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(detail: OperationalDetail) {
  // Criar CSV (simples, mas funciona)
  let csvContent = 'Campo,Valor\n';
  csvContent += `Dia do Evento,"${formatDate(detail.event_date)}"\n`;
  csvContent += `Nome do Projeto,"${detail.event_name || detail.artistic_attraction || 'Não informado'}"\n`;
  if (detail.os_number) {
    csvContent += `Número da OS,"${detail.os_number}"\n`;
  }
  if (detail.show_schedule) {
    const escaped = String(detail.show_schedule).replace(/"/g, '""');
    csvContent += `Horários de Funcionamento,"${escaped}"\n`;
  }
  if (detail.ticket_prices) {
    const escaped = String(detail.ticket_prices).replace(/"/g, '""');
    csvContent += `Valores de entrada,"${escaped}"\n`;
  }
  if (detail.promotions) {
    const escaped = String(detail.promotions).replace(/"/g, '""');
    csvContent += `Promoções,"${escaped}"\n`;
  }

  // Adicionar campos dinâmicos de admin_notes (JSON)
  if (detail.admin_notes) {
    try {
      const notesData = JSON.parse(detail.admin_notes);
      if (notesData.dynamicFields) {
        Object.entries(notesData.dynamicFields).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const escapedValue = String(value).replace(/"/g, '""');
            csvContent += `"${label}","${escapedValue}"\n`;
          }
        });
      }
    } catch {
      // Se não for JSON, ignorar
    }
  }

  const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `OS_Artista_${(detail.event_name || detail.artistic_attraction || 'OS').replace(/[^a-zA-Z0-9]/g, '_')}_${formatDate(detail.event_date).replace(/\//g, '_')}.csv`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(detail: OperationalDetail) {
  // Usar window.print() para PDF (funciona bem no navegador)
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para exportar em PDF');
    return;
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>OS de Artista - ${detail.event_name || detail.artistic_attraction || 'Sem nome'}</title>
      <style>
        @media print {
          @page { margin: 2cm; }
        }
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
        .field { margin-bottom: 15px; page-break-inside: avoid; }
        .label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .value { margin-top: 5px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>OS de Artista/Banda/DJ</h1>
      <div class="field">
        <div class="label">Dia do Evento:</div>
        <div class="value">${formatDate(detail.event_date)}</div>
      </div>
      <div class="field">
        <div class="label">Nome do Projeto:</div>
        <div class="value">${detail.event_name || detail.artistic_attraction || 'Não informado'}</div>
      </div>
      ${detail.os_number ? `<div class="field">
        <div class="label">Número da OS:</div>
        <div class="value">${detail.os_number}</div>
      </div>` : ''}
      ${detail.show_schedule ? `<div class="field">
        <div class="label">Horários de Funcionamento:</div>
        <div class="value">${String(detail.show_schedule).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : ''}
      ${detail.ticket_prices ? `<div class="field">
        <div class="label">Valores de entrada:</div>
        <div class="value">${String(detail.ticket_prices).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : ''}
      ${detail.promotions ? `<div class="field">
        <div class="label">Promoções:</div>
        <div class="value">${String(detail.promotions).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : ''}
  `;

  // Adicionar campos dinâmicos de admin_notes (JSON)
  if (detail.admin_notes) {
    try {
      const notesData = JSON.parse(detail.admin_notes);
      if (notesData.dynamicFields) {
        Object.entries(notesData.dynamicFields).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            htmlContent += `
              <div class="field">
                <div class="label">${label}:</div>
                <div class="value">${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>
            `;
          }
        });
      }
    } catch {
      // Se não for JSON, ignorar
    }
  }

  htmlContent += `
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

