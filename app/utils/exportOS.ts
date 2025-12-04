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
      <title>OS de Artista - ${detail.event_name || 'Sem nome'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #7c3aed; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; }
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
        <div class="value">${detail.event_name || 'Não informado'}</div>
      </div>
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
  link.download = `OS_Artista_${detail.event_name || 'OS'}_${formatDate(detail.event_date).replace(/\//g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(detail: OperationalDetail) {
  // Criar CSV (simples, mas funciona)
  let csvContent = 'Campo,Valor\n';
  csvContent += `Dia do Evento,"${formatDate(detail.event_date)}"\n`;
  csvContent += `Nome do Projeto,"${detail.event_name || 'Não informado'}"\n`;

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
  link.download = `OS_Artista_${detail.event_name || 'OS'}_${formatDate(detail.event_date).replace(/\//g, '_')}.csv`;
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
      <title>OS de Artista - ${detail.event_name || 'Sem nome'}</title>
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
        <div class="value">${detail.event_name || 'Não informado'}</div>
      </div>
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

