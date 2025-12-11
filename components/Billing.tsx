import React, { useState, useMemo, useEffect } from 'react';
import { Project, TimeEntry } from '../types';
import { formatCurrency, formatDuration, calculateEarnings, formatTime } from '../utils';
import { Printer, Calendar, CheckSquare, Square, MapPin } from 'lucide-react';

interface BillingProps {
  entries: TimeEntry[];
  projects: Project[];
}

const Billing: React.FC<BillingProps> = ({ entries, projects }) => {
  // Supporto Multi-Selezione
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Calcola i mesi disponibili dai dati (YYYY-MM)
  const availableMonths = useMemo(() => {
      const months = new Set(entries.map(e => new Date(e.startTime).toISOString().slice(0, 7)));
      return Array.from(months).sort().reverse();
  }, [entries]);

  // Inizializza selezionando tutto o i dati più recenti
  useEffect(() => {
      if (projects.length > 0 && selectedProjectIds.length === 0) {
          setSelectedProjectIds(projects.map(p => p.id));
      }
      if (availableMonths.length > 0 && selectedMonths.length === 0) {
           const currentMonth = new Date().toISOString().slice(0, 7);
           if (availableMonths.includes(currentMonth)) {
               setSelectedMonths([currentMonth]);
           } else {
               setSelectedMonths(availableMonths.slice(0, 1));
           }
      }
  }, [projects, availableMonths]);

  // Handlers Toggle
  const toggleProject = (id: string) => {
      if (selectedProjectIds.includes(id)) {
          setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
      } else {
          setSelectedProjectIds([...selectedProjectIds, id]);
      }
  };
  const toggleAllProjects = () => {
      setSelectedProjectIds(selectedProjectIds.length === projects.length ? [] : projects.map(p => p.id));
  };

  const toggleMonth = (month: string) => {
      if (selectedMonths.includes(month)) {
          setSelectedMonths(selectedMonths.filter(m => m !== month));
      } else {
          setSelectedMonths([...selectedMonths, month]);
      }
  };
  const toggleAllMonths = () => {
      setSelectedMonths(selectedMonths.length === availableMonths.length ? [] : availableMonths);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
        if (selectedProjectIds.length === 0 || selectedMonths.length === 0) return false;
        
        const entryMonth = new Date(e.startTime).toISOString().slice(0, 7);
        // Filtra se l'ID progetto è nell'array dei selezionati E il mese è selezionato
        return selectedProjectIds.includes(e.projectId) && selectedMonths.includes(entryMonth);
    }).sort((a, b) => a.startTime - b.startTime);
  }, [entries, selectedProjectIds, selectedMonths]);

  const totalAmount = filteredEntries.reduce((acc, curr) => acc + calculateEarnings(curr), 0);
  const totalHours = filteredEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 3600;

  const handlePrint = () => {
      window.print();
  };

  const formatMonthLabel = (m: string) => {
      const [y, mo] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mo) - 1, 1);
      return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  // Costruisci stringa periodo per il PDF
  const periodString = useMemo(() => {
      if (selectedMonths.length === 0) return '-';
      if (selectedMonths.length === 1) return formatMonthLabel(selectedMonths[0]);
      
      // Se sono tanti, mostriamo range se consecutivi (semplificato: lista separata da virgola)
      // Ordiniamo per data
      const sorted = [...selectedMonths].sort();
      return sorted.map(m => formatMonthLabel(m).replace(/ [0-9]{4}/, '')).join(', ') + ' ' + sorted[0].split('-')[0];
  }, [selectedMonths]);

  if (projects.length === 0) {
      return (
          <div className="text-center py-20 text-gray-400">
              Nessun cliente disponibile. Aggiungi clienti nella sezione "Gestione Clienti".
          </div>
      );
  }

  // Determina se mostrare la colonna "Cliente" (utile se ne ho selezionati più di uno)
  const showProjectColumn = selectedProjectIds.length > 1;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Controls - Hidden in print */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:hidden grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="text-indigo-600" />
                Configura Periodo e Clienti
            </h2>
            
            {/* Selettore Mesi Multipli */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Mesi da includere</label>
                    <button onClick={toggleAllMonths} className="text-xs text-indigo-600 font-bold hover:underline">
                        {selectedMonths.length === availableMonths.length ? 'Deseleziona' : 'Seleziona Tutti'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {availableMonths.map(m => {
                        const isSelected = selectedMonths.includes(m);
                        return (
                            <button
                                key={m}
                                onClick={() => toggleMonth(m)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all capitalize ${
                                    isSelected 
                                    ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                {formatMonthLabel(m)}
                            </button>
                        )
                    })}
                     {availableMonths.length === 0 && <span className="text-sm text-gray-400 italic">Nessun mese disponibile.</span>}
                </div>
            </div>

             {/* Selettore Progetti */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Clienti da includere</label>
                    <button onClick={toggleAllProjects} className="text-xs text-indigo-600 font-bold hover:underline">
                        {selectedProjectIds.length === projects.length ? 'Deseleziona' : 'Seleziona Tutti'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {projects.map(p => {
                        const isSelected = selectedProjectIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => toggleProject(p.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all ${
                                    isSelected 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-medium' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                {p.name}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>

        <div className="flex flex-col justify-end items-end space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 w-full">
                <p className="text-sm text-gray-500 mb-1">Anteprima Totali</p>
                <div className="flex justify-between items-end">
                     <div>
                         <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
                         <p className="text-sm text-gray-600">{filteredEntries.length} servizi selezionati</p>
                     </div>
                     <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors shadow-lg active:scale-95"
                    >
                        <Printer size={20} /> Stampa / Salva PDF
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-400">
                Suggerimento: Seleziona più mesi per generare report trimestrali o annuali.
            </p>
        </div>
      </div>

      {/* The Bill / Summary Document */}
      <div className="bg-white p-10 rounded-none md:rounded-xl shadow-lg print:shadow-none print:border-none print:w-full print:p-0 min-h-[800px]">
          
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Riepilogo Servizi</h1>
                  <p className="text-slate-500 mt-2">Documento informativo prestazioni</p>
              </div>
              <div className="text-right max-w-sm">
                  <h3 className="text-xl font-bold text-indigo-600 truncate">
                      {selectedProjectIds.length === 1 
                        ? projects.find(p => p.id === selectedProjectIds[0])?.name 
                        : 'Riepilogo Multi-Cliente'}
                  </h3>
                  <p className="text-slate-600 font-medium capitalize mt-1">
                      Periodo: {periodString}
                  </p>
              </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-bold tracking-wider">
                          <th className="px-4 py-3 rounded-l-lg">Data</th>
                          {showProjectColumn && <th className="px-4 py-3">Cliente</th>}
                          <th className="px-4 py-3">Orario</th>
                          <th className="px-4 py-3">Descrizione</th>
                          <th className="px-4 py-3 text-right">Ore</th>
                          <th className="px-4 py-3 text-right">Tariffa</th>
                          <th className="px-4 py-3 text-right">Extra</th>
                          <th className="px-4 py-3 text-right rounded-r-lg">Totale</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredEntries.map(entry => {
                          const earnings = calculateEarnings(entry);
                          const expensesTotal = entry.expenses ? entry.expenses.reduce((s, x) => s + x.amount, 0) : 0;
                          const project = projects.find(p => p.id === entry.projectId);

                          return (
                              <tr key={entry.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                      {new Date(entry.startTime).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                  </td>
                                  
                                  {showProjectColumn && (
                                     <td className="px-4 py-3 text-indigo-600 font-semibold text-xs uppercase tracking-wide">
                                         {project?.name || '-'}
                                     </td>
                                  )}

                                  <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                                      {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : '...'}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                                      {entry.description || '-'}
                                      {entry.isNightShift && <span className="ml-2 text-xs bg-slate-200 px-1 rounded">Notte</span>}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono">
                                      {formatDuration(entry.duration).slice(0, 5)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                      {formatCurrency(entry.hourlyRate || 0)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                      {expensesTotal > 0 ? formatCurrency(expensesTotal) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                                      {formatCurrency(earnings)}
                                  </td>
                              </tr>
                          );
                      })}
                      {filteredEntries.length === 0 && (
                          <tr>
                              <td colSpan={showProjectColumn ? 8 : 7} className="px-4 py-8 text-center text-gray-400 italic">
                                  Nessuna voce trovata per i criteri selezionati.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Footer Totals */}
          <div className="mt-8 border-t-2 border-slate-200 pt-6 flex justify-end break-inside-avoid">
              <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                  <div className="flex justify-between text-slate-600">
                      <span>Totale Ore Lavorate:</span>
                      <span className="font-mono font-medium">{totalHours.toFixed(2)} h</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                      <span>Totale Voci:</span>
                      <span className="font-mono font-medium">{filteredEntries.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-4 border-t border-slate-200 mt-2">
                      <span>TOTALE DA FATTURARE</span>
                      <span className="text-indigo-700">{formatCurrency(totalAmount)}</span>
                  </div>
              </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:left-0 print:w-full">
              Generato con Cronosheet - {new Date().toLocaleDateString()}
          </div>
      </div>
    </div>
  );
};

export default Billing;