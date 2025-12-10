import React, { useState, useMemo } from 'react';
import { Project, TimeEntry } from '../types';
import { formatCurrency, formatDuration, calculateEarnings, formatTime } from '../utils';
import { Printer, Calendar, FileText, Download } from 'lucide-react';

interface BillingProps {
  entries: TimeEntry[];
  projects: Project[];
}

const Billing: React.FC<BillingProps> = ({ entries, projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
        if (!selectedProjectId || !selectedMonth) return false;
        
        const entryMonth = new Date(e.startTime).toISOString().slice(0, 7);
        return e.projectId === selectedProjectId && entryMonth === selectedMonth;
    }).sort((a, b) => a.startTime - b.startTime);
  }, [entries, selectedProjectId, selectedMonth]);

  const totalAmount = filteredEntries.reduce((acc, curr) => acc + calculateEarnings(curr), 0);
  const totalHours = filteredEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 3600;

  const handlePrint = () => {
      window.print();
  };

  if (projects.length === 0) {
      return (
          <div className="text-center py-20 text-gray-400">
              Nessun cliente disponibile. Aggiungi clienti nella sezione "Gestione Clienti".
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Controls - Hidden in print */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Configura Riepilogo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente / Postazione</label>
                <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                >
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mese di Riferimento</label>
                <input 
                    type="month"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                />
            </div>
            <div className="flex items-end">
                <button 
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-md"
                >
                    <Printer size={18} /> Stampa / PDF
                </button>
            </div>
        </div>
      </div>

      {/* The Bill / Summary Document */}
      <div className="bg-white p-10 rounded-none md:rounded-xl shadow-lg print:shadow-none print:border-none print:w-full print:p-0">
          
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Riepilogo Servizi</h1>
                  <p className="text-slate-500 mt-2">Documento informativo prestazioni</p>
              </div>
              <div className="text-right">
                  <h3 className="text-xl font-bold text-indigo-600">{selectedProject?.name}</h3>
                  <p className="text-slate-600 font-medium">
                      Periodo: {new Date(selectedMonth).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </p>
              </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-bold tracking-wider">
                          <th className="px-4 py-3 rounded-l-lg">Data</th>
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
                          
                          return (
                              <tr key={entry.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                      {new Date(entry.startTime).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-600">
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
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">
                                  Nessuna voce presente per questo periodo.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Footer Totals */}
          <div className="mt-8 border-t-2 border-slate-200 pt-6 flex justify-end">
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