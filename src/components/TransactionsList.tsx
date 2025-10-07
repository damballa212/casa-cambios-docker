import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';
import AdvancedFilters, { FilterConfig } from './AdvancedFilters';
import ExportModal, { ExportConfig } from './ExportModal';
import TransactionDetailModal from './TransactionDetailModal';
import AddTransactionModal from './AddTransactionModal';
import DeleteTransactionModal from './DeleteTransactionModal';
import { useNotifications } from './NotificationSystem';
import jsPDF from 'jspdf';
import * as ExcelJS from 'exceljs';

interface Transaction {
  id: string;
  fecha: string;
  cliente: string;
  colaborador: string;
  usdTotal: number;
  comision: number;
  usdNeto: number;
  montoGs: number;
  tasaUsada: number;
  status: string;
  chatId: string;
  idempotencyKey: string;
  montoColaboradorUsd?: number;
  montoComisionGabrielUsd?: number;
  gananciaGabriel?: number; // Ganancia específica de Gabriel
  gananciaColaborador?: number; // Ganancia específica del colaborador
}

const TransactionsList: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  
  // Sistema de notificaciones
  const { addNotification } = useNotifications();
  
  // Función para eliminar transacción
  const handleDeleteTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setTransactionToDelete(transaction);
      setIsDeleteModalOpen(true);
    }
  };

  const executeDeleteTransaction = async (transactionId: string) => {
    try {
      setDeletingTransactionId(transactionId);
      
      const response = await apiService.deleteTransaction(transactionId);
      
      if (response.success) {
        // Actualizar la lista de transacciones
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        setFilteredTransactions(prev => prev.filter(t => t.id !== transactionId));
        
        // Cerrar modal
        setIsDeleteModalOpen(false);
        setTransactionToDelete(null);
        
        // Notificación de éxito profesional
        addNotification({
          type: 'success',
          title: '✅ Eliminación Completada',
          message: `Transacción ${transactionId} eliminada exitosamente con debugging completo.`
        });
      } else {
        throw new Error(response.message || 'Error al eliminar la transacción');
      }
    } catch (error: any) {
      console.error('Error eliminando transacción:', error);
      
      // Notificación de error profesional
      addNotification({
        type: 'error',
        title: '❌ Error en Eliminación',
        message: `No se pudo eliminar la transacción ${transactionId}: ${error.message || 'Error desconocido'}`
      });
      
      throw error; // Re-throw para que el modal pueda manejarlo
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);
  };
  
  // Estado de filtros avanzados
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    dateRange: {
      start: '',
      end: '',
      preset: ''
    },
    collaborator: '',
    client: '',
    status: '',
    amountRange: {
      min: null,
      max: null
    },
    commissionRange: {
      min: null,
      max: null
    },
    rateRange: {
      min: null,
      max: null
    }
  });

  // Cargar transacciones desde el API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await apiService.getTransactions();
        // Usar ganancias reales de la base de datos
        const transactionsWithGanancia = data.map((transaction: Transaction) => {
          return {
            ...transaction,
            gananciaGabriel: transaction.montoComisionGabrielUsd || 0,
            gananciaColaborador: transaction.montoColaboradorUsd || 0
          };
        });
        setTransactions(transactionsWithGanancia);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Error al cargar las transacciones');
        // Sin datos de fallback - mostrar error
         setTransactions([]);
       } finally {
         setLoading(false);
       }
     };

     fetchTransactions();
   }, []);

  // Aplicar filtros avanzados
  useEffect(() => {
    setIsFilterLoading(true);
    
    // Simular delay para mostrar loading
    const filterTimeout = setTimeout(() => {
      let filtered = transactions;

      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(transaction =>
          transaction.cliente.toLowerCase().includes(searchLower) ||
          transaction.colaborador.toLowerCase().includes(searchLower) ||
          transaction.id.toLowerCase().includes(searchLower) ||
          transaction.usdTotal.toString().includes(searchLower) ||
          transaction.montoGs.toString().includes(searchLower)
        );
      }

      // Filtro de rango de fechas
      if (filters.dateRange.start || filters.dateRange.end) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.fecha).toISOString().split('T')[0];
          const startDate = filters.dateRange.start;
          const endDate = filters.dateRange.end;
          
          if (startDate && endDate) {
            return transactionDate >= startDate && transactionDate <= endDate;
          } else if (startDate) {
            return transactionDate >= startDate;
          } else if (endDate) {
            return transactionDate <= endDate;
          }
          return true;
        });
      }

      // Filtro de colaborador
      if (filters.collaborator) {
        filtered = filtered.filter(transaction => transaction.colaborador === filters.collaborator);
      }

      // Filtro de cliente
      if (filters.client) {
        filtered = filtered.filter(transaction => transaction.cliente === filters.client);
      }

      // Filtro de estado
      if (filters.status) {
        filtered = filtered.filter(transaction => transaction.status === filters.status);
      }

      // Filtro de rango de monto
      if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
        filtered = filtered.filter(transaction => {
          const amount = transaction.usdTotal;
          if (filters.amountRange.min !== null && filters.amountRange.max !== null) {
            return amount >= filters.amountRange.min && amount <= filters.amountRange.max;
          } else if (filters.amountRange.min !== null) {
            return amount >= filters.amountRange.min;
          } else if (filters.amountRange.max !== null) {
            return amount <= filters.amountRange.max;
          }
          return true;
        });
      }

      // Filtro de rango de comisión
      if (filters.commissionRange.min !== null || filters.commissionRange.max !== null) {
        filtered = filtered.filter(transaction => {
          const commission = transaction.comision;
          if (filters.commissionRange.min !== null && filters.commissionRange.max !== null) {
            return commission >= filters.commissionRange.min && commission <= filters.commissionRange.max;
          } else if (filters.commissionRange.min !== null) {
            return commission >= filters.commissionRange.min;
          } else if (filters.commissionRange.max !== null) {
            return commission <= filters.commissionRange.max;
          }
          return true;
        });
      }

      // Filtro de rango de tasa
      if (filters.rateRange.min !== null || filters.rateRange.max !== null) {
        filtered = filtered.filter(transaction => {
          const rate = transaction.tasaUsada;
          if (filters.rateRange.min !== null && filters.rateRange.max !== null) {
            return rate >= filters.rateRange.min && rate <= filters.rateRange.max;
          } else if (filters.rateRange.min !== null) {
            return rate >= filters.rateRange.min;
          } else if (filters.rateRange.max !== null) {
            return rate <= filters.rateRange.max;
          }
          return true;
        });
      }

      setFilteredTransactions(filtered);
      setIsFilterLoading(false);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [transactions, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para aplicar filtros adicionales del modal de exportación
  const applyExportFilters = (data: Transaction[], filters: any, dateRange?: { start: string; end: string }) => {
    console.log('🔍 INICIO applyExportFilters - Total transacciones recibidas:', data.length);
    let filtered = [...data];
    
    // Aplicar filtro de fechas si está especificado
    if (dateRange && dateRange.start && dateRange.end) {
      // Usar solo las fechas como strings para comparación directa (YYYY-MM-DD)
      const startDateStr = dateRange.start;
      const endDateStr = dateRange.end;
      
      console.log('🔍 DEBUG FILTRO FECHAS:');
      console.log('Rango de fechas:', { start: startDateStr, end: endDateStr });
      console.log('Transacciones ANTES del filtro de fechas:', filtered.length);
      
      // Contar transacciones del 30/9 ANTES del filtro
      const sept30Before = filtered.filter(t => t.fecha.split('T')[0] === '2025-09-30').length;
      console.log('🔍 Transacciones del 30/9 ANTES del filtro:', sept30Before);
      
      // DEPURACIÓN CRÍTICA: Verificar el rango de fechas
      console.log('🔍 DEPURACIÓN CRÍTICA DEL RANGO:');
      console.log('startDateStr:', startDateStr, 'tipo:', typeof startDateStr);
      console.log('endDateStr:', endDateStr, 'tipo:', typeof endDateStr);
      console.log('Comparación 2025-09-30 >= startDateStr:', '2025-09-30' >= startDateStr);
      console.log('Comparación 2025-09-30 <= endDateStr:', '2025-09-30' <= endDateStr);
      console.log('Resultado lógico para 2025-09-30:', ('2025-09-30' >= startDateStr && '2025-09-30' <= endDateStr));
      
      filtered = filtered.filter(transaction => {
        // Obtener solo la parte de fecha de la transacción (YYYY-MM-DD)
        const transactionDateStr = transaction.fecha.split('T')[0];
        
        // Comparar directamente las fechas como strings (YYYY-MM-DD)
        const isInRange = transactionDateStr >= startDateStr && transactionDateStr <= endDateStr;
        
        // Log específico para transacciones del 30/9/2025
        if (transactionDateStr === '2025-09-30') {
          console.log('🚨 TRANSACCIÓN 30/9/2025 ENCONTRADA:');
          console.log('Cliente:', transaction.cliente);
          console.log('Colaborador:', transaction.colaborador);
          console.log('Fecha completa:', transaction.fecha);
          console.log('Fecha extraída:', transactionDateStr);
          console.log('¿Está en rango?', isInRange);
          console.log('Comparación:', `${transactionDateStr} >= ${startDateStr}:`, transactionDateStr >= startDateStr);
          console.log('Comparación:', `${transactionDateStr} <= ${endDateStr}:`, transactionDateStr <= endDateStr);
          console.log('🔍 RESULTADO DEL FILTRO:', isInRange ? 'INCLUIDA' : 'EXCLUIDA');
        }
        
        // IMPORTANTE: Solo incluir transacciones que están EN RANGO
        // Si isInRange es false, la transacción NO debe ser incluida
        return isInRange;
      });
      
      // Contar transacciones del 30/9 DESPUÉS del filtro
      const sept30After = filtered.filter(t => t.fecha.split('T')[0] === '2025-09-30').length;
      console.log('🔍 Transacciones del 30/9 DESPUÉS del filtro:', sept30After);
      console.log('Total transacciones después del filtro de fechas:', filtered.length);
      
      if (sept30After > 0) {
        console.log('❌ ERROR CRÍTICO: Las transacciones del 30/9 NO fueron filtradas correctamente!');
        console.log('❌ Transacciones del 30/9 que pasaron el filtro:');
        filtered.filter(t => t.fecha.split('T')[0] === '2025-09-30').forEach(t => {
          console.log('❌ Cliente:', t.cliente, 'Fecha:', t.fecha);
        });
      } else {
        console.log('✅ CORRECTO: Las transacciones del 30/9 fueron filtradas correctamente');
      }
    }
    
    // Aplicar filtro de colaborador si está especificado
    if (filters.collaborator) {
      filtered = filtered.filter(transaction => transaction.colaborador === filters.collaborator);
    }
    
    // Aplicar filtro de cliente si está especificado
    if (filters.client) {
      filtered = filtered.filter(transaction => transaction.cliente === filters.client);
    }
    
    // Aplicar filtro de estado si está especificado
    if (filters.status) {
      filtered = filtered.filter(transaction => transaction.status === filters.status);
    }
    
    // Aplicar filtro de monto mínimo si está especificado
    if (filters.minAmount !== undefined && filters.minAmount !== null) {
      filtered = filtered.filter(transaction => transaction.usdTotal >= filters.minAmount);
    }
    
    // Aplicar filtro de monto máximo si está especificado
    if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
      filtered = filtered.filter(transaction => transaction.usdTotal <= filters.maxAmount);
    }
    
    return filtered;
  };

  // Función para manejar la exportación
  const handleExport = async (config: ExportConfig) => {
    try {
      console.log('🚀 INICIANDO EXPORTACIÓN');
      console.log('Config completa:', JSON.stringify(config, null, 2));
      
      // Si el modal de exportación tiene filtros de fecha específicos, usar todas las transacciones
      // Si no tiene filtros de fecha, usar los datos ya filtrados de la tabla
      let dataToExport: Transaction[];
      
      if (config.dateRange && config.dateRange.start && config.dateRange.end) {
        // Si el modal tiene filtros de fecha, aplicarlos a todas las transacciones
        console.log('🚀 EXPORTANDO CON FILTROS DE FECHA DEL MODAL');
        console.log('Fechas del modal:', config.dateRange);
        console.log('Fecha de hoy:', new Date().toISOString().split('T')[0]);
        
        console.log('🔍 ANTES DE applyExportFilters - Total transacciones:', transactions.length);
        console.log('🔍 ANTES DE applyExportFilters - Sept 30 en transactions:', transactions.filter(t => t.fecha.includes('2025-09-30')).length);
        
        dataToExport = applyExportFilters(transactions, config.filters || {}, config.dateRange);
        
        console.log('🔍 DESPUÉS DE applyExportFilters - Total dataToExport:', dataToExport.length);
        console.log('🔍 DESPUÉS DE applyExportFilters - Sept 30 en dataToExport:', dataToExport.filter(t => t.fecha.includes('2025-09-30')).length);
      } else {
        // Si no hay filtros de fecha en el modal, usar los datos ya filtrados y aplicar solo otros filtros
        console.log('🚀 EXPORTANDO CON FILTROS PRINCIPALES DE LA TABLA');
        dataToExport = applyExportFilters(filteredTransactions, config.filters || {});
      }
      
      console.log('Total transacciones originales:', transactions.length);
      console.log('Total transacciones filtradas en tabla:', filteredTransactions.length);
      console.log('Total después de applyExportFilters:', dataToExport.length);
      console.log('Config de exportación:', config);
      
      // Verificar si hay transacciones del 30/9 en los datos finales
      const sept30Transactions = dataToExport.filter(t => t.fecha.startsWith('2025-09-30'));
      if (sept30Transactions.length > 0) {
        console.log('🚨 PROBLEMA: Transacciones del 30/9 en datos finales:', sept30Transactions.length);
        sept30Transactions.forEach(t => {
          console.log('- Cliente:', t.cliente, 'Fecha:', t.fecha);
        });
      } else {
        console.log('✅ Correcto: No hay transacciones del 30/9 en datos finales');
      }
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear timestamp único con milisegundos para evitar caché
      const now = new Date();
      const timestamp = `${now.toISOString().split('T')[0]}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}_${now.getMilliseconds().toString().padStart(3, '0')}`;
      const baseFilename = config.customFilename || `transacciones_${timestamp}`;
      
      // Generar y descargar archivo según el formato
      switch (config.format) {
        case 'csv':
          const csvContent = generateCSV(dataToExport, config);
          downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
          break;
          
        case 'excel':
          generateExcel(dataToExport, config).then(excelBuffer => {
             const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
             downloadFile(blob, `${baseFilename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
           }).catch(error => {
             console.error('Error generando Excel:', error);
             addNotification({
               type: 'error',
               title: 'Error de Exportación',
               message: 'No se pudo generar el archivo Excel'
             });
           });
          break;
          
        case 'json':
          const jsonContent = generateJSON(dataToExport, config);
          downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
          break;
          
        case 'pdf':
            console.log('🔍 ANTES DE GENERAR PDF - Verificando datos finales:');
            console.log('Total de transacciones:', dataToExport.length);
            const sept30InFinalData = dataToExport.filter(t => t.fecha.includes('2025-09-30'));
            if (sept30InFinalData.length > 0) {
              console.log('❌ PROBLEMA CRÍTICO: Transacciones del 30/9 en datos finales para PDF:', sept30InFinalData.length);
              console.log('❌ Detalles:', sept30InFinalData.map(t => ({ fecha: t.fecha, cliente: t.cliente })));
            } else {
              console.log('✅ CORRECTO: No hay transacciones del 30/9 en datos finales para PDF');
            }
            
            const pdfContent = generatePDF(dataToExport, config);
            downloadFile(pdfContent, `${baseFilename}.pdf`, 'application/pdf');
            break;
          
        default:
          throw new Error(`Formato no soportado: ${config.format}`);
      }
      
    } catch (error) {
      console.error('Error en exportación:', error);
      throw error;
    }
  };

  // Mapeo de campos para headers
  const getFieldMap = () => ({
    'id': 'ID',
    'fecha': 'Fecha',
    'cliente': 'Cliente',
    'colaborador': 'Colaborador',
    'usdTotal': 'USD Total',
    'comision': 'Comisión %',
    'usdNeto': 'USD Neto',
    'montoGs': 'Monto Gs',
    'tasaUsada': 'Tasa Usada',
    'status': 'Estado',
    'chatId': 'Chat ID',
    'gananciaGabriel': 'Ganancia Gabriel',
    'gananciaGabrielTotal': 'Ganancia Gabriel Total',
    'gananciaColaborador': 'Ganancia Colaborador',
    'gananciaColaboradorTotal': 'Ganancia Colaborador Total'
  });

  // Generar CSV
  const generateCSV = (data: Transaction[], config: ExportConfig) => {
    const fieldMap = getFieldMap();
    // Filtrar encabezados excluyendo campos de totales que van solo en pie de página
    const tableFields = config.fields.filter(field => 
      field !== 'gananciaGabrielTotal' && field !== 'gananciaColaboradorTotal'
    );
    const headers = tableFields.map(field => fieldMap[field as keyof typeof fieldMap] || field);
    
    const rows = data.map(transaction => 
      config.fields.map(field => {
        const value = (transaction as any)[field];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      })
    );
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    return csvContent;
  };

  // Generar Excel profesional con ExcelJS
  const generateExcel = async (data: Transaction[], config: ExportConfig) => {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del workbook
    workbook.creator = 'Casa de Cambios Dashboard';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Transacciones', {
      properties: { tabColor: { argb: 'FF4CAF50' } },
      views: [{ showGridLines: true, zoomScale: 100 }]
    });
    
    const fieldMap = getFieldMap();
    
    // Filtrar campos excluyendo totales que van solo en pie de página
    const tableFields = config.fields.filter(field => 
      field !== 'gananciaGabrielTotal' && field !== 'gananciaColaboradorTotal'
    );
    const headers = tableFields.map(field => fieldMap[field as keyof typeof fieldMap] || field);
    
    // Configurar columnas con anchos apropiados
    const columnWidths: { [key: string]: number } = {
      'id': 8,
      'fecha': 18,
      'cliente': 25,
      'colaborador': 18,
      'usdTotal': 15,
      'comision': 12,
      'usdNeto': 15,
      'montoGs': 18,
      'tasaUsada': 12,
      'status': 12,
      'chatId': 20,
      'gananciaGabriel': 18,
      'gananciaColaborador': 20
    };
    
    worksheet.columns = tableFields.map((field) => ({
      key: field,
      width: columnWidths[field] || 15
    }));
    
    let currentRow = 1;
    
    // Agregar metadatos si está habilitado
    if (config.includeMetadata) {
      // Título principal
      worksheet.mergeCells('A1:' + String.fromCharCode(65 + tableFields.length - 1) + '1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'CASA DE CAMBIOS - REPORTE DE TRANSACCIONES';
      titleCell.style = {
        font: { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF2E7D32' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } },
        border: {
          top: { style: 'thin', color: { argb: 'FF4CAF50' } },
          left: { style: 'thin', color: { argb: 'FF4CAF50' } },
          bottom: { style: 'thin', color: { argb: 'FF4CAF50' } },
          right: { style: 'thin', color: { argb: 'FF4CAF50' } }
        }
      };
      worksheet.getRow(1).height = 30;
      currentRow = 3;
      
      // Información del reporte
      const infoData = [
        ['Generado:', new Date().toLocaleString('es-ES')],
        ['Total de registros:', data.length],
        ['Período:', `${data.length > 0 ? (() => {
          const fechaISO = data[data.length - 1].fecha.split('T')[0];
          const [year, month, day] = fechaISO.split('-');
          return `${day}/${month}/${year}`;
        })() : 'N/A'} - ${data.length > 0 ? (() => {
          const fechaISO = data[0].fecha.split('T')[0];
          const [year, month, day] = fechaISO.split('-');
          return `${day}/${month}/${year}`;
        })() : 'N/A'}`]
      ];
      
      infoData.forEach((info, index) => {
        const row = worksheet.getRow(currentRow + index);
        row.getCell(1).value = info[0];
        row.getCell(2).value = info[1];
        row.getCell(1).style = {
          font: { bold: true, color: { argb: 'FF424242' } },
          alignment: { horizontal: 'right' }
        };
        row.getCell(2).style = {
          font: { color: { argb: 'FF424242' } },
          alignment: { horizontal: 'left' }
        };
      });
      
      currentRow += infoData.length + 2;
    }
    
    // Agregar encabezados
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = {
        font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } },
        border: {
          top: { style: 'thin', color: { argb: 'FF2E7D32' } },
          left: { style: 'thin', color: { argb: 'FF2E7D32' } },
          bottom: { style: 'thin', color: { argb: 'FF2E7D32' } },
          right: { style: 'thin', color: { argb: 'FF2E7D32' } }
        }
      };
    });
    headerRow.height = 25;
    currentRow++;
    
    // Agregar datos (excluyendo campos de totales que van solo en pie de página)
    data.forEach((transaction, rowIndex) => {
      const row = worksheet.getRow(currentRow + rowIndex);
      
      tableFields.forEach((field, colIndex) => {
        
        const cell = row.getCell(colIndex + 1);
        let value = (transaction as any)[field];
        
        // Formatear valores según el tipo
        if (field === 'fecha') {
          value = new Date(value).toLocaleDateString('es-ES');
        } else if (['usdTotal', 'usdNeto', 'gananciaGabriel', 'gananciaColaborador'].includes(field)) {
          value = Number(value || 0);
          cell.numFmt = '$#,##0.00';
        } else if (field === 'comision') {
          value = Number(value || 0);
          cell.numFmt = '0.00%';
        } else if (field === 'montoGs') {
          value = Number(value || 0);
          cell.numFmt = '#,##0';
        } else if (field === 'tasaUsada') {
          value = Number(value || 0);
          cell.numFmt = '#,##0.00';
        }
        
        cell.value = value;
        
        // Estilo de celda
        const isEvenRow = rowIndex % 2 === 0;
        cell.style = {
          font: { name: 'Calibri', size: 10, color: { argb: 'FF424242' } },
          alignment: { 
            horizontal: ['usdTotal', 'usdNeto', 'comision', 'montoGs', 'tasaUsada', 'gananciaGabriel', 'gananciaColaborador'].includes(field) ? 'right' : 'left',
            vertical: 'middle'
          },
          fill: { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: isEvenRow ? 'FFFAFAFA' : 'FFFFFFFF' }
          },
          border: {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          }
        };
        
        // Colores especiales para ciertos campos
        if (field === 'status') {
          const statusColors: { [key: string]: string } = {
            'completed': 'FF4CAF50',
            'processing': 'FFFF9800',
            'error': 'FFF44336'
          };
          if (statusColors[value]) {
            cell.style.font = { ...cell.style.font, color: { argb: statusColors[value] }, bold: true };
          }
        }
      });
      
      row.height = 20;
    });
    
    // Agregar pie de tabla con totales
    const footerStartRow = currentRow + data.length + 1;
    
    // Calcular totales
    const totalGananciaGabriel = data.reduce((sum, t) => sum + (t.gananciaGabriel || 0), 0);
    const totalGananciaColaborador = data.reduce((sum, t) => sum + (t.gananciaColaborador || 0), 0);
    
    // Solo agregar pie de tabla si se incluyen campos de ganancia
    const hasGananciaFields = config.fields.some(field => 
      field === 'gananciaGabriel' || field === 'gananciaColaborador' ||
      field === 'gananciaGabrielTotal' || field === 'gananciaColaboradorTotal'
    );
    
    if (hasGananciaFields) {
       // Espacio antes del pie de tabla
       const spaceRow = worksheet.getRow(footerStartRow);
       spaceRow.height = 15;
       
       // Línea separadora elegante con doble borde
       const separatorRow = worksheet.getRow(footerStartRow + 1);
       const tableWidth = config.fields.filter(f => f !== 'gananciaGabrielTotal' && f !== 'gananciaColaboradorTotal').length;
       for (let i = 1; i <= tableWidth; i++) {
         const cell = separatorRow.getCell(i);
         cell.style = {
           border: {
             top: { style: 'double', color: { argb: 'FF1B5E20' } }
           }
         };
       }
       
       // Sección de totales con diseño moderno
       const footerBgColor = 'FF263238'; // Gris oscuro elegante
       const footerTextColor = 'FFFFFFFF'; // Blanco
       const accentColor = 'FF4CAF50'; // Verde corporativo
       
       // Título principal del pie de tabla
       const titleRow = worksheet.getRow(footerStartRow + 2);
       worksheet.mergeCells(`A${footerStartRow + 2}:${String.fromCharCode(65 + tableWidth - 1)}${footerStartRow + 2}`);
       const titleCell = titleRow.getCell(1);
       titleCell.value = '📊 RESUMEN FINANCIERO';
       titleCell.style = {
         font: { name: 'Calibri', size: 14, bold: true, color: { argb: footerTextColor } },
         alignment: { horizontal: 'center', vertical: 'middle' },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: footerBgColor } },
         border: {
           top: { style: 'medium', color: { argb: accentColor } },
           left: { style: 'medium', color: { argb: accentColor } },
           right: { style: 'medium', color: { argb: accentColor } },
           bottom: { style: 'thin', color: { argb: accentColor } }
         }
       };
       titleRow.height = 35;
       
       // Contenedor de totales con diseño en cards
       const totalsStartRow = footerStartRow + 3;
       
       // Card 1: Ganancia Gabriel Total
       const gabrielCardRow = worksheet.getRow(totalsStartRow);
       const gabrielLabelCells = Math.ceil(tableWidth * 0.6);
       
       // Merge cells para la etiqueta de Gabriel
       worksheet.mergeCells(`A${totalsStartRow}:${String.fromCharCode(65 + gabrielLabelCells - 1)}${totalsStartRow}`);
       const gabrielLabelCell = gabrielCardRow.getCell(1);
       gabrielLabelCell.value = '💰 GANANCIA GABRIEL TOTAL';
       gabrielLabelCell.style = {
         font: { name: 'Calibri', size: 12, bold: true, color: { argb: footerTextColor } },
         alignment: { horizontal: 'right', vertical: 'middle', indent: 1 },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } },
         border: {
           top: { style: 'thin', color: { argb: accentColor } },
           left: { style: 'medium', color: { argb: accentColor } },
           bottom: { style: 'thin', color: { argb: accentColor } },
           right: { style: 'thin', color: { argb: accentColor } }
         }
       };
       
       // Merge cells para el valor de Gabriel
       worksheet.mergeCells(`${String.fromCharCode(65 + gabrielLabelCells)}${totalsStartRow}:${String.fromCharCode(65 + tableWidth - 1)}${totalsStartRow}`);
       const gabrielValueCell = gabrielCardRow.getCell(gabrielLabelCells + 1);
       gabrielValueCell.value = totalGananciaGabriel;
       gabrielValueCell.numFmt = '$#,##0.00';
       gabrielValueCell.style = {
         font: { name: 'Calibri', size: 14, bold: true, color: { argb: accentColor } },
         alignment: { horizontal: 'center', vertical: 'middle' },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } },
         border: {
           top: { style: 'thin', color: { argb: accentColor } },
           right: { style: 'medium', color: { argb: accentColor } },
           bottom: { style: 'thin', color: { argb: accentColor } },
           left: { style: 'thin', color: { argb: accentColor } }
         }
       };
       gabrielCardRow.height = 30;
       
       // Card 2: Ganancia Colaborador Total
       const colaboradorCardRow = worksheet.getRow(totalsStartRow + 1);
       
       // Merge cells para la etiqueta de Colaborador
       worksheet.mergeCells(`A${totalsStartRow + 1}:${String.fromCharCode(65 + gabrielLabelCells - 1)}${totalsStartRow + 1}`);
       const colaboradorLabelCell = colaboradorCardRow.getCell(1);
       colaboradorLabelCell.value = '🤝 GANANCIA COLABORADOR TOTAL';
       colaboradorLabelCell.style = {
         font: { name: 'Calibri', size: 12, bold: true, color: { argb: footerTextColor } },
         alignment: { horizontal: 'right', vertical: 'middle', indent: 1 },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } },
         border: {
           top: { style: 'thin', color: { argb: accentColor } },
           left: { style: 'medium', color: { argb: accentColor } },
           bottom: { style: 'medium', color: { argb: accentColor } },
           right: { style: 'thin', color: { argb: accentColor } }
         }
       };
       
       // Merge cells para el valor de Colaborador
       worksheet.mergeCells(`${String.fromCharCode(65 + gabrielLabelCells)}${totalsStartRow + 1}:${String.fromCharCode(65 + tableWidth - 1)}${totalsStartRow + 1}`);
       const colaboradorValueCell = colaboradorCardRow.getCell(gabrielLabelCells + 1);
       colaboradorValueCell.value = totalGananciaColaborador;
       colaboradorValueCell.numFmt = '$#,##0.00';
       colaboradorValueCell.style = {
         font: { name: 'Calibri', size: 14, bold: true, color: { argb: accentColor } },
         alignment: { horizontal: 'center', vertical: 'middle' },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } },
         border: {
           top: { style: 'thin', color: { argb: accentColor } },
           right: { style: 'medium', color: { argb: accentColor } },
           bottom: { style: 'medium', color: { argb: accentColor } },
           left: { style: 'thin', color: { argb: accentColor } }
         }
       };
       colaboradorCardRow.height = 30;
       
       // Total general (suma de ambos)
       const totalGeneral = totalGananciaGabriel + totalGananciaColaborador;
       const totalRow = worksheet.getRow(totalsStartRow + 2);
       worksheet.mergeCells(`A${totalsStartRow + 2}:${String.fromCharCode(65 + tableWidth - 1)}${totalsStartRow + 2}`);
       const totalCell = totalRow.getCell(1);
       totalCell.value = `🏆 TOTAL GENERAL: ${totalGeneral.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}`;
       totalCell.style = {
         font: { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFD700' } },
         alignment: { horizontal: 'center', vertical: 'middle' },
         fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } },
         border: {
           top: { style: 'medium', color: { argb: 'FFFFD700' } },
           left: { style: 'medium', color: { argb: 'FFFFD700' } },
           right: { style: 'medium', color: { argb: 'FFFFD700' } },
           bottom: { style: 'medium', color: { argb: 'FFFFD700' } }
         }
       };
       totalRow.height = 35;
     }
    
    // Agregar filtros automáticos
    const dataRange = `A${config.includeMetadata ? currentRow - 1 : 1}:${String.fromCharCode(65 + config.fields.length - 1)}${currentRow + data.length - 1}`;
    worksheet.autoFilter = dataRange;
    
    // Congelar paneles
    worksheet.views = [{
      state: 'frozen',
      xSplit: 0,
      ySplit: config.includeMetadata ? currentRow - 1 : 1,
      topLeftCell: `A${config.includeMetadata ? currentRow : 2}`,
      activeCell: 'A1'
    }];
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  };

  // Generar JSON
  const generateJSON = (data: Transaction[], config: ExportConfig) => {
    const fieldMap = getFieldMap();
    
    const exportData = data.map(transaction => {
      const item: any = {};
      config.fields.forEach(field => {
          // Saltar campos de totales en datos de transacciones individuales
          if (field === 'gananciaGabrielTotal' || field === 'gananciaColaboradorTotal') return;
          
          const displayName = fieldMap[field as keyof typeof fieldMap] || field;
          let value = (transaction as any)[field];
          
          // Formateo especial para ciertos campos en JSON
          if (field === 'gananciaGabriel' || field === 'gananciaColaborador' || field === 'usdTotal' || field === 'usdNeto') {
            value = Number(value).toFixed(2);
          }
          
          item[displayName] = value;
        });
      return item;
    });
    
    const result: any = {
      data: exportData
    };
    
    if (config.includeMetadata) {
      result.metadata = {
        generatedAt: new Date().toISOString(),
        totalRecords: data.length,
        fields: config.fields,
        filters: config.filters
      };
    }
    
    return JSON.stringify(result, null, 2);
  };

  // Generar PDF real usando jsPDF
      const generatePDF = (data: Transaction[], config: ExportConfig) => {
        // Debug: Verificar datos que llegan a generatePDF
        console.log('🔍 generatePDF - Datos recibidos:', data.length);
        console.log('🔍 generatePDF - Primeras 3 transacciones:', data.slice(0, 3).map(t => ({ fecha: t.fecha, cliente: t.cliente })));
        
        // Verificar si hay transacciones del 30/9 (formato correcto: 2025-09-30)
        const sept30Transactions = data.filter(t => t.fecha.includes('2025-09-30'));
        if (sept30Transactions.length > 0) {
          console.log('❌ generatePDF - PROBLEMA: Transacciones del 30/9 encontradas:', sept30Transactions.length);
          console.log('❌ generatePDF - Detalles:', sept30Transactions.map(t => ({ fecha: t.fecha, cliente: t.cliente })));
        } else {
          console.log('✅ generatePDF - Correcto: No hay transacciones del 30/9');
        }
        
        // 🔍 LOGGING EXHAUSTIVO DEL CONTENIDO DEL PDF
        console.log('📄 PDF CONTENT LOGGING - INICIO');
        console.log('📄 Total de transacciones que se escribirán al PDF:', data.length);
        console.log('📄 Todas las fechas que se escribirán al PDF:', data.map(t => t.fecha));
        console.log('📄 Fechas únicas en el PDF:', [...new Set(data.map(t => t.fecha.split('T')[0]))]);
        console.log('📄 Verificación final - Transacciones del 30/9 en data:', data.filter(t => t.fecha.includes('2025-09-30')).length);
        
        const fieldMap = getFieldMap();
        const doc = new jsPDF();
        
        // Configuración inicial
        let yPosition = 25;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // Colores corporativos
        const primaryColor = [34, 197, 94]; // Verde
        const secondaryColor = [59, 130, 246]; // Azul
        const darkColor = [31, 41, 55]; // Gris oscuro
        const lightGray = [243, 244, 246]; // Gris claro
        const accentColor = [168, 85, 247]; // Púrpura
        
        // Header con fondo de color
         doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Logo/Icono simulado
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 17.5, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(34, 197, 94);
        doc.setFont('helvetica', 'bold');
        doc.text('$', 25, 20, { align: 'center' });
        
        // Título principal
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('CASA DE CAMBIOS', 40, 18);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Reporte de Transacciones', 40, 26);
        
        // Fecha en el header
        doc.setFontSize(10);
        doc.text(new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }), pageWidth - margin, 20, { align: 'right' });
        
        yPosition = 50;
       
       // Sección de información con cards
        if (config.includeMetadata) {
          // Card de información general
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.roundedRect(margin, yPosition, contentWidth / 2 - 5, 35, 3, 3, 'F');
          
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('INFORMACIÓN GENERAL', margin + 5, yPosition + 8);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Registros: ${data.length}`, margin + 5, yPosition + 16);
          doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin + 5, yPosition + 22);
          doc.text(`Período: ${config.dateRange.start || 'N/A'} - ${config.dateRange.end || 'N/A'}`, margin + 5, yPosition + 28);
          
          // Card de filtros (si existen)
          if (Object.keys(config.filters).length > 0) {
            doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.roundedRect(margin + contentWidth / 2 + 5, yPosition, contentWidth / 2 - 5, 35, 3, 3, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FILTROS APLICADOS', margin + contentWidth / 2 + 10, yPosition + 8);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            let filterY = yPosition + 16;
            
            if (config.filters.collaborator) {
              doc.text(`Colaborador: ${config.filters.collaborator}`, margin + contentWidth / 2 + 10, filterY);
              filterY += 5;
            }
            if (config.filters.client) {
              doc.text(`Cliente: ${config.filters.client}`, margin + contentWidth / 2 + 10, filterY);
              filterY += 5;
            }
            if (config.filters.status) {
              doc.text(`Estado: ${config.filters.status}`, margin + contentWidth / 2 + 10, filterY);
              filterY += 5;
            }
          }
          
          yPosition += 45;
        }
       
       // Título de sección de datos
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DE TRANSACCIONES', margin, yPosition);
        yPosition += 15;
        
        // Headers de tabla con estilo moderno (filtrar campos de totales)
         const tableFields = config.fields.filter(field => field !== 'gananciaGabrielTotal' && field !== 'gananciaColaboradorTotal');
         const headers = tableFields.map(field => fieldMap[field as keyof typeof fieldMap] || field);
         const colWidth = contentWidth / headers.length;
        
        // Fondo del header
        doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.rect(margin, yPosition - 5, contentWidth, 12, 'F');
        
        // Texto del header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        headers.forEach((header, index) => {
          const x = margin + (index * colWidth) + 2;
          doc.text(header.substring(0, 12), x, yPosition + 2);
        });
        yPosition += 12;
       
       // Datos de la tabla con filas alternadas
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        data.forEach((transaction, index) => {
          // 🔍 LOGGING DETALLADO DE CADA FILA DEL PDF
          const fechaCompleta = transaction.fecha;
          const fechaExtraida = fechaCompleta.split('T')[0];
          console.log(`📄 FILA ${index + 1}/${data.length} - Cliente: ${transaction.cliente}, Fecha: ${fechaExtraida}`);
          
          if (fechaExtraida.includes('2025-09-30')) {
            console.log(`🚨 CRÍTICO: FILA ${index + 1} CONTIENE FECHA 30/9 - Cliente: ${transaction.cliente}, Fecha completa: ${fechaCompleta}`);
          }
          
          // Verificar si necesitamos nueva página
          if (yPosition > 250) {
            doc.addPage();
            
            // Repetir header en nueva página
            yPosition = 25;
            
            // Header con fondo
            doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.rect(margin, yPosition - 5, contentWidth, 12, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            
            headers.forEach((header, headerIndex) => {
               const x = margin + (headerIndex * colWidth) + 2;
               doc.text(header.substring(0, 12), x, yPosition + 2);
             });
            yPosition += 12;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }
          
          // Fondo alternado para filas
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252); // Gris muy claro
            doc.rect(margin, yPosition - 2, contentWidth, 10, 'F');
          }
          
          // Color de texto según el estado
          const status = (transaction as any).status;
          if (status === 'completed') {
            doc.setTextColor(22, 163, 74); // Verde
          } else if (status === 'pending') {
            doc.setTextColor(245, 158, 11); // Amarillo
          } else if (status === 'failed') {
            doc.setTextColor(239, 68, 68); // Rojo
          } else {
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          }
          
          // Dibujar fila de datos (filtrar campos de totales)
           const tableFields = config.fields.filter(field => field !== 'gananciaGabrielTotal' && field !== 'gananciaColaboradorTotal');
           tableFields.forEach((field, fieldIndex) => {
             const value = (transaction as any)[field];
             let displayValue = String(value);
             
             // Formateo especial por tipo de campo
              if (field === 'fecha') {
                // Extraer la fecha sin conversión de zona horaria para evitar problemas
                const fechaISO = value.split('T')[0]; // Obtiene "2025-10-01" de "2025-10-01T19:58:52.51+00:00"
                const [year, month, day] = fechaISO.split('-');
                displayValue = `${day}/${month}/${year}`; // Formato dd/mm/yyyy
              } else if (field === 'usdTotal' || field === 'usdNeto' || field === 'gananciaGabriel' || field === 'gananciaColaborador') {
                displayValue = `$${Number(value).toFixed(2)}`;
                doc.setTextColor(22, 163, 74); // Verde para montos
              } else if (field === 'comision') {
                displayValue = `${value}%`;
                doc.setTextColor(168, 85, 247); // Púrpura para comisiones
              } else if (field === 'montoGs') {
                displayValue = `${Number(value).toLocaleString()} Gs`;
              } else if (field === 'tasaUsada') {
                displayValue = `${Number(value).toLocaleString()}`;
              } else if (field === 'status') {
                // Mantener el color ya establecido arriba
              } else {
                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
              }
              
              const x = margin + (fieldIndex * (contentWidth / tableFields.length)) + 2;
              doc.text(displayValue.substring(0, 15), x, yPosition + 3);
           });
          
          yPosition += 10;
        });
       
       // Resumen estadístico con diseño moderno
        yPosition += 20;
        // Forzar nueva página para el resumen ejecutivo
        doc.addPage();
        yPosition = 25;
        
        // Título de resumen
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN EJECUTIVO', margin, yPosition);
        yPosition += 20;
        
        // Calcular estadísticas
        const totalUSD = data.reduce((sum, t) => sum + (t.usdTotal || 0), 0);
        const totalCommissions = data.reduce((sum, t) => sum + ((t.usdTotal * t.comision / 100) || 0), 0);
        const avgTransaction = data.length > 0 ? totalUSD / data.length : 0;
        const uniqueCollaborators = [...new Set(data.map(t => t.colaborador))];
        const uniqueClients = [...new Set(data.map(t => t.cliente))];
        
        // Card 1: Volumen total
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(margin, yPosition, (contentWidth / 2) - 5, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('VOLUMEN TOTAL', margin + 5, yPosition + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${totalUSD.toFixed(2)}`, margin + 5, yPosition + 18);
        
        // Card 2: Comisiones
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.roundedRect(margin + (contentWidth / 2) + 5, yPosition, (contentWidth / 2) - 5, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('COMISIONES', margin + (contentWidth / 2) + 10, yPosition + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${totalCommissions.toFixed(2)}`, margin + (contentWidth / 2) + 10, yPosition + 18);
        
        yPosition += 35;
        
        // Card 3: Promedio
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.roundedRect(margin, yPosition, (contentWidth / 2) - 5, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PROMEDIO', margin + 5, yPosition + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${avgTransaction.toFixed(2)}`, margin + 5, yPosition + 18);
        
        // Card 4: Transacciones
        doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.roundedRect(margin + (contentWidth / 2) + 5, yPosition, (contentWidth / 2) - 5, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TRANSACCIONES', margin + (contentWidth / 2) + 10, yPosition + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${data.length}`, margin + (contentWidth / 2) + 10, yPosition + 18);
        
        yPosition += 35;
         
         // Card 5: Ganancia Gabriel (solo si está seleccionado gananciaGabrielTotal)
          if (config.fields.includes('gananciaGabrielTotal')) {
            const totalGananciaGabriel = data.reduce((sum, t) => sum + (t.gananciaGabriel || 0), 0);
            doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('GANANCIA GABRIEL TOTAL', margin + 5, yPosition + 8);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`$${totalGananciaGabriel.toFixed(2)}`, margin + 5, yPosition + 18);
            yPosition += 35;
          }
          
          // Card 6: Ganancia Colaborador (solo si está seleccionado gananciaColaboradorTotal)
          if (config.fields.includes('gananciaColaboradorTotal')) {
            const totalGananciaColaborador = data.reduce((sum, t) => sum + (t.gananciaColaborador || 0), 0);
            doc.setFillColor(34, 197, 94); // Verde para colaboradores
            doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('GANANCIA COLABORADOR TOTAL', margin + 5, yPosition + 8);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`$${totalGananciaColaborador.toFixed(2)}`, margin + 5, yPosition + 18);
            yPosition += 35;
          }
         
         yPosition += 35;
         
         // Información adicional
         doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
         doc.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');
        
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PARTICIPANTES', margin + 5, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Colaboradores: ${uniqueCollaborators.join(', ')}`, margin + 5, yPosition + 14);
        doc.text(`Clientes únicos: ${uniqueClients.length}`, margin + 5, yPosition + 18);
       
       // Footer moderno en todas las páginas
         const pageCount = (doc as any).internal.pages.length - 1;
         for (let i = 1; i <= pageCount; i++) {
           doc.setPage(i);
           
           // Línea superior del footer
           const footerY = pageHeight - 20;
           doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
           doc.setLineWidth(0.5);
           doc.line(margin, footerY, pageWidth - margin, footerY);
           
           // Información del footer
           doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
           doc.setFontSize(8);
           doc.setFont('helvetica', 'normal');
           
           // Lado izquierdo: Empresa
           doc.text('Casa de Cambios Dashboard', margin, footerY + 8);
           
           // Centro: Fecha de generación
           doc.text(
             `${new Date().toLocaleDateString('es-ES')}`,
             pageWidth / 2,
             footerY + 8,
             { align: 'center' }
           );
           
           // Lado derecho: Paginación
           doc.text(
             `Página ${i} de ${pageCount}`,
             pageWidth - margin,
             footerY + 8,
             { align: 'right' }
           );
         }
       
       // Retornar el PDF como blob
       return doc.output('blob');
     };

  // Descargar archivo
  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    let blob: Blob;
    if (content instanceof Blob) {
      blob = content;
    } else {
      blob = new Blob([content], { type: mimeType });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Transacciones</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Transacción</span>
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCollaborators={[...new Set(transactions.map(t => t.colaborador))].filter(Boolean)}
        availableClients={[...new Set(transactions.map(t => t.cliente))].filter(Boolean)}
        availableStatuses={[
          { value: 'completed', label: 'Completado', color: 'green' },
          { value: 'processing', label: 'Procesando', color: 'yellow' },
          { value: 'error', label: 'Error', color: 'red' }
        ]}
        isLoading={isFilterLoading}
      />

      {/* Loading State */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando transacciones...</span>
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
       <ExportModal
         isOpen={isExportModalOpen}
         onClose={() => setIsExportModalOpen(false)}
         dataType="transactions"
         availableFields={[
             { key: 'id', label: 'ID', type: 'string' },
             { key: 'fecha', label: 'Fecha', type: 'date' },
             { key: 'cliente', label: 'Cliente', type: 'string' },
             { key: 'colaborador', label: 'Colaborador', type: 'string' },
             { key: 'usdTotal', label: 'USD Total', type: 'number' },
             { key: 'comision', label: 'Comisión %', type: 'number' },
             { key: 'usdNeto', label: 'USD Neto', type: 'number' },
             { key: 'montoGs', label: 'Monto Gs', type: 'number' },
             { key: 'tasaUsada', label: 'Tasa Usada', type: 'number' },
             { key: 'status', label: 'Estado', type: 'string' },
             { key: 'chatId', label: 'Chat ID', type: 'string' },
             { key: 'gananciaGabriel', label: 'Ganancia Gabriel (por transacción)', type: 'number' },
             { key: 'gananciaGabrielTotal', label: 'Ganancia Gabriel Total (solo en resumen)', type: 'number' },
             { key: 'gananciaColaborador', label: 'Ganancia Colaborador (por transacción)', type: 'number' },
             { key: 'gananciaColaboradorTotal', label: 'Ganancia Colaborador Total (solo en resumen)', type: 'number' }
           ]}
         availableFilters={{
           collaborators: [...new Set(filteredTransactions.map(t => t.colaborador))].filter(Boolean),
           clients: [...new Set(filteredTransactions.map(t => t.cliente))].filter(Boolean),
           statuses: ['completed', 'pending', 'failed']
         }}
         onExport={handleExport}
       />

      {/* Error State */}
      {error && (
        <div className="bg-red-50/70 backdrop-blur-md rounded-2xl border border-red-200/50 shadow-lg p-6">
          <div className="flex items-center space-x-3 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Transactions - Mobile Card Layout */}
      {!loading && !error && (
        <>
          {/* Mobile Card Layout */}
          <div className="block lg:hidden space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.cliente}</div>
                      <div className="text-xs text-gray-500">ID: {transaction.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-md hover:bg-blue-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      disabled={deletingTransactionId === transaction.id}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingTransactionId === transaction.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <div className="font-medium">{(() => {
                      const fechaISO = transaction.fecha.split('T')[0];
                      const [year, month, day] = fechaISO.split('-');
                      return `${day}/${month}/${year}`;
                    })()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Colaborador:</span>
                    <div className="font-medium">{transaction.colaborador}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">USD Total:</span>
                    <div className="font-medium text-green-600">${transaction.usdTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Comisión:</span>
                    <div className="font-medium">{transaction.comision}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasa:</span>
                    <div className="font-medium text-blue-600">{transaction.tasaUsada.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transaction.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status === 'completed' ? 'Completada' : transaction.status === 'processing' ? 'Procesando' : 'Error'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50/70">
                  <tr>
                   <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                   <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                   <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                   <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                   <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USD Total</th>
                   <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión %</th>
                   <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Usada</th>
                   <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Gs</th>
                   <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                   <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                 </tr>
             </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200/50">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50/30 transition-colors duration-200">
                  <td className="w-16 px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="w-32 px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.fecha).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-gray-400">
                      {new Date(transaction.fecha).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="w-40 px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{transaction.cliente}</div>
                        <div className="text-xs text-gray-500 truncate">{transaction.chatId.split('@')[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="w-32 px-4 py-3 whitespace-nowrap text-sm text-gray-900">{transaction.colaborador}</td>
                  <td className="w-28 px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">${transaction.usdTotal.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="w-24 px-4 py-3 whitespace-nowrap text-sm text-gray-900">{transaction.comision}%</td>
                  <td className="w-28 px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium text-blue-600">{transaction.tasaUsada.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">Gs/$</span>
                  </td>
                  <td className="w-32 px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {transaction.montoGs.toLocaleString()} Gs
                  </td>
                  <td className="w-28 px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status === 'completed' ? 'Completada' :
                         transaction.status === 'processing' ? 'Procesando' : 'Error'}
                      </span>
                    </div>
                  </td>
                  <td className="w-24 px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200 inline-flex items-center justify-center p-1 rounded-md hover:bg-blue-50"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={deletingTransactionId === transaction.id}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200 inline-flex items-center justify-center p-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        {deletingTransactionId === transaction.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Statistics */}
      {!loading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Volumen USD</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTransactions.reduce((sum, t) => sum + t.usdTotal, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comisiones</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTransactions.reduce((sum, t) => sum + (t.usdTotal * t.comision / 100), 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio Comisión</p>
              <p className="text-2xl font-bold text-gray-900">
                {(filteredTransactions.reduce((sum, t) => sum + t.comision, 0) / filteredTransactions.length).toFixed(1)}%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
      )}
      
      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
      
      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(message) => {
          addNotification({
            title: 'Transacción Creada',
            message,
            type: 'success'
          });
        }}
        onError={(message) => {
          addNotification({
            title: 'Error',
            message,
            type: 'error'
          });
        }}
        onTransactionCreated={() => {
           // Recargar la lista de transacciones
           const reloadTransactions = async () => {
             try {
               setLoading(true);
               const data = await apiService.getTransactions();
               const transactionsWithGanancia = data.map((transaction: Transaction) => {
                 const comisionTotal = transaction.usdTotal * (transaction.comision / 100);
                 return {
                   ...transaction,
                   gananciaGabriel: comisionTotal * 0.5,
                   gananciaColaborador: comisionTotal * 0.5
                 };
               });
               setTransactions(transactionsWithGanancia);
               setError(null);
             } catch (err: any) {
               console.error('Error fetching transactions:', err);
               setError(err.message);
               setTransactions([]);
             } finally {
               setLoading(false);
             }
           };
           reloadTransactions();
         }}
      />

      {/* Delete Transaction Modal */}
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        transaction={transactionToDelete}
        onConfirm={executeDeleteTransaction}
      />
    </div>
  );
};

export default TransactionsList;