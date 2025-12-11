import React, { useState, useMemo, useEffect } from 'react';
import { Project, TimeEntry } from '../types';
import { groupEntriesByDay, formatTime, formatDurationHuman, formatDuration, formatCurrency, calculateEarnings } from '../utils';
import { Trash2, MapPin, Clock, Pencil, Moon, Filter, X, CheckSquare, Square, Calendar } from 'lucide-react';

interface TimeLogTableProps {
  entries: TimeEntry[];
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (entry: TimeEntry) => void;
}

const TimeLogTable: React.FC<TimeLogTableProps> = ({ entries, projects, onDelete, onEdit }) => {
  // Stati per Filtri Multipli
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // 1. Calcola i mesi disponibili dai dati esistenti (YYYY-MM)
  const availableMonths = useMemo(() => {
      const months = new Set(entries.map(e => new Date(e.startTime).toISOString().slice(0, 7)));
      return Array.from(months).sort().reverse();
  }, [entries]);

  // Inizializzazione: Seleziona tutto di default al primo caricamento
  useEffect(() => {
      if (projects.length > 0 && selectedProjectIds.length === 0) {
          setSelectedProjectIds(projects.map(p => p.id));
      }
      if (availableMonths.length > 0 && selectedMonths.length === 0) {
          // Default: Mese corrente o il più recente
          const currentMonth = new Date().toISOString().slice(0, 7);
          if (availableMonths.includes(currentMonth)) {
             setSelectedMonths([currentMonth]);
          } else {
             setSelectedMonths(availableMonths.slice(0, 1));
          }
      }
  }, [projects, availableMonths]); // Runna solo se cambiano le dipendenze base

  // Toggle Helpers
  const toggleProject = (id: string) => {
      setSelectedProjectIds(prev => 
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };
  const toggleAllProjects = () => {
      setSelectedProjectIds(selectedProjectIds.length === projects.length ? [] : projects.map(p => p.id));
  };

  const toggleMonth = (month: string) => {
      setSelectedMonths(prev => 
          prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
      );
  };
  const toggleAllMonths = () => {
      setSelectedMonths(selectedMonths.length === availableMonths.length ? [] : availableMonths);
  };

  // Filter Logic
  const filteredEntries = useMemo(() => {
      return entries.filter(entry => {
          const entryMonth = new Date(entry.startTime).toISOString().slice(0, 7);
          
          const matchesProject = selectedProjectIds.length > 0 ? selectedProjectIds.includes(entry.projectId) : false;
          const matchesMonth = selectedMonths.length > 0 ? selectedMonths.includes(entryMonth) : false;

          return matchesProject && matchesMonth;
      });
  }, [entries, selectedProjectIds, selectedMonths]);

  const grouped = groupEntriesByDay(filteredEntries);
  const totalFilteredEarnings = filteredEntries.reduce((acc, e) => acc + calculateEarnings(e), 0);
  const totalDuration = filteredEntries.reduce((acc, e) => acc + (e.duration || 0), 0);

  // Formatta Mese per UI (es. "2024-01" -> "Gennaio 2024")
  const formatMonthLabel = (m: string) => {
      const [y, mo] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mo) - 1, 1);
      return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
              <div className="flex items-center gap-2 font-medium text-gray-700">
                  <Filter size={18} className="text-indigo-600" />
                  <span>Filtri Avanzati</span>
                  <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 ml-2">
                      {selectedProjectIds.length} clienti, {selectedMonths.length} mesi
                  </span>
              </div>
              <div className="text-xs text-indigo-600 font-bold uppercase">
                  {showFilters ? 'Nascondi' : 'Espandi'}
              </div>
          </div>

          {showFilters && (
              <div className="p-4 border-t border-gray-200 space-y-6 animate-slide-down">
                  
                  {/* Filtro Clienti */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={12}/> Clienti
                          </label>
                          <button onClick={toggleAllProjects} className="text-xs text-indigo-600 hover:underline">
                              {selectedProjectIds.length === projects.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
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

                  {/* Filtro Mesi */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <Calendar size={12}/> Mesi
                          </label>
                          <button onClick={toggleAllMonths} className="text-xs text-indigo-600 hover:underline">
                              {selectedMonths.length === availableMonths.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
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
                          {availableMonths.length === 0 && <span className="text-sm text-gray-400 italic">Nessun dato temporale disponibile.</span>}
                      </div>
                  </div>
              </div>
          )}
      </div>
      
      {/* Totals Bar */}
      {filteredEntries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md col-span-2 md:col-span-1">
                  <span className="text-indigo-200 text-xs font-bold uppercase block mb-1">Guadagno Totale</span>
                  <span className="font-bold text-2xl">{formatCurrency(totalFilteredEarnings)}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm col-span-2 md:col-span-1">
                  <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Ore Totali</span>
                  <span className="font-bold text-2xl text-gray-800">{formatDurationHuman(totalDuration)}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm col-span-1">
                  <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Voci</span>
                  <span className="font-bold text-2xl text-gray-800">{filteredEntries.length}</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm col-span-1">
                  <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Giorni Lavorati</span>
                  <span className="font-bold text-2xl text-gray-800">{grouped.length}</span>
              </div>
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