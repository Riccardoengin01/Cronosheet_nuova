import React, { useState } from 'react';
import { Project, TimeEntry } from '../types';
import { groupEntriesByDay, formatTime, formatDurationHuman, formatDuration, formatCurrency, calculateEarnings } from '../utils';
import { Trash2, MapPin, Clock, Pencil, DollarSign, Moon, Filter, X } from 'lucide-react';

interface TimeLogTableProps {
  entries: TimeEntry[];
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (entry: TimeEntry) => void;
}

const TimeLogTable: React.FC<TimeLogTableProps> = ({ entries, projects, onDelete, onEdit }) => {
  // State for filters
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>(''); // Format "YYYY-MM"

  // Filter Logic
  const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      const entryMonthStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
      
      const matchesProject = filterProjectId ? entry.projectId === filterProjectId : true;
      const matchesMonth = filterMonth ? entryMonthStr === filterMonth : true;

      return matchesProject && matchesMonth;
  });

  const grouped = groupEntriesByDay(filteredEntries);
  const totalFilteredEarnings = filteredEntries.reduce((acc, e) => acc + calculateEarnings(e), 0);

  if (entries.length === 0) {
      return (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500">Nessun servizio registrato</h3>
              <p className="text-gray-400">Aggiungi un nuovo servizio per iniziare.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
              <Filter size={18} />
              <span>Filtra Registro:</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <select 
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterProjectId}
                  onChange={e => setFilterProjectId(e.target.value)}
              >
                  <option value="">Tutti i Clienti</option>
                  {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
              
              <input 
                  type="month"
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
              />

              {(filterProjectId || filterMonth) && (
                  <button 
                    onClick={() => { setFilterProjectId(''); setFilterMonth(''); }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="Rimuovi Filtri"
                  >
                      <X size={20} />
                  </button>
              )}
          </div>
      </div>
      
      {/* Totals for Filtered View */}
      {(filterProjectId || filterMonth) && filteredEntries.length > 0 && (
          <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-900">
              <span className="font-semibold">Totale Periodo Selezionato:</span>
              <span className="font-bold text-xl">{formatCurrency(totalFilteredEarnings)}</span>
          </div>
      )}

      {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
              Nessun servizio trovato con i filtri selezionati.
          </div>
      ) : (
        grouped.map(group => (
            <div key={group.date} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium text-gray-700 capitalize">
                {new Date(group.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <span className="font-mono font-bold text-gray-500 text-sm">
                Totale: {formatDurationHuman(group.totalDuration)}
                </span>
            </div>
            
            <div className="divide-y divide-gray-100">
                {group.entries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const earnings = calculateEarnings(entry);
                
                return (
                    <div key={entry.id} className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <span 
                                className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1"
                                style={{ color: project?.color, backgroundColor: `${project?.color}15` }}
                            >
                                <MapPin size={10} />
                                {project?.name || 'Sconosciuto'}
                            </span>
                            {entry.isNightShift && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                                    <Moon size={10} /> Notte
                                </span>
                            )}
                        </div>
                        <p className="font-medium text-gray-800 text-base">
                            {entry.description || <span className="text-gray-400 italic">Nessuna nota</span>}
                        </p>
                        
                        {/* Mobile Financials */}
                        {earnings > 0 && (
                            <div className="md:hidden mt-2 text-sm text-emerald-600 font-semibold">
                                {formatCurrency(earnings)}
                            </div>
                        )}
                    </div>

                    {/* Financials Column Desktop */}
                    <div className="hidden md:flex flex-col items-end w-32">
                        {earnings > 0 && (
                            <div className="flex items-center text-emerald-600 font-bold text-base" title="Guadagno Totale">
                                {formatCurrency(earnings)}
                            </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                            {formatCurrency(entry.hourlyRate || 0)}/h
                            {entry.expenses && entry.expenses.length > 0 && ` + ${entry.expenses.length} extra`}
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-2 md:mt-0">
                        <div className="text-sm text-gray-600 font-mono flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : '...'}
                        </div>

                        <div className="font-mono font-bold text-gray-700 w-16 text-right">
                            {formatDuration(entry.duration).slice(0, 5)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => onEdit(entry)}
                                className="text-gray-300 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 rounded-full"
                                title="Modifica"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(entry.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                title="Elimina"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            </div>
        ))
      )}
    </div>
  );
};

export default TimeLogTable;