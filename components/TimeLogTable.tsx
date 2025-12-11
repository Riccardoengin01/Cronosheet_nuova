import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, TimeEntry } from '../types';
import { groupEntriesByDay, formatTime, formatDurationHuman, formatDuration, formatCurrency, calculateEarnings } from '../utils';
import { Trash2, MapPin, Clock, Pencil, Moon, Filter, X, CheckSquare, Square, Calendar, ChevronDown, Search } from 'lucide-react';

interface TimeLogTableProps {
  entries: TimeEntry[];
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (entry: TimeEntry) => void;
}

const TimeLogTable: React.FC<TimeLogTableProps> = ({ entries, projects, onDelete, onEdit }) => {
  // --- STATI FILTRI ---
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // --- LOGICA DATI DISPONIBILI ---

  // 1. Estrai anni disponibili dai dati
  const availableYears = useMemo(() => {
      const years = new Set(entries.map(e => new Date(e.startTime).getFullYear().toString()));
      const sorted = Array.from(years).sort().reverse();
      // Assicurati che l'anno corrente ci sia sempre, anche se vuoto
      const current = new Date().getFullYear().toString();
      if (!sorted.includes(current)) sorted.unshift(current);
      return sorted;
  }, [entries]);

  // 2. Estrai mesi disponibili SOLO per l'anno selezionato
  const availableMonthsInYear = useMemo(() => {
      const months = new Set(
          entries
            .filter(e => new Date(e.startTime).getFullYear().toString() === selectedYear)
            .map(e => new Date(e.startTime).toISOString().slice(0, 7)) // YYYY-MM
      );
      return Array.from(months).sort().reverse();
  }, [entries, selectedYear]);

  // --- EFFETTI DI INIZIALIZZAZIONE ---

  // Seleziona tutti i clienti all'avvio
  useEffect(() => {
      if (projects.length > 0 && selectedProjectIds.length === 0) {
          setSelectedProjectIds(projects.map(p => p.id));
      }
  }, [projects]);

  // Gestione click fuori dal dropdown clienti
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
              setIsClientDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---

  const toggleProject = (id: string) => {
      setSelectedProjectIds(prev => 
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const toggleAllProjects = () => {
      if (selectedProjectIds.length === projects.length) {
          setSelectedProjectIds([]);
      } else {
          setSelectedProjectIds(projects.map(p => p.id));
      }
  };

  const toggleMonth = (month: string) => {
      setSelectedMonths(prev => 
          prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
      );
  };

  const toggleAllMonthsInYear = () => {
      // Se tutti i mesi DISPONIBILI DELL'ANNO sono selezionati, deseleziona quelli dell'anno corrente
      // Altrimenti aggiungi quelli mancanti dell'anno corrente
      const allSelected = availableMonthsInYear.every(m => selectedMonths.includes(m));
      
      if (allSelected) {
          setSelectedMonths(prev => prev.filter(m => !availableMonthsInYear.includes(m)));
      } else {
          const toAdd = availableMonthsInYear.filter(m => !selectedMonths.includes(m));
          setSelectedMonths(prev => [...prev, ...toAdd]);
      }
  };

  // Filtra Clienti per la ricerca nel dropdown
  const filteredProjectsList = projects.filter(p => 
      p.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  // --- LOGICA FILTRAGGIO ENTRY ---
  
  const filteredEntries = useMemo(() => {
      return entries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          const entryMonth = entryDate.toISOString().slice(0, 7); // YYYY-MM
          
          // 1. Filtro Progetto
          const matchesProject = selectedProjectIds.length > 0 ? selectedProjectIds.includes(entry.projectId) : false;
          
          // 2. Filtro Mese (Se nessun mese è selezionato globalmente, mostra tutto dell'anno corrente? 
          //    No, meglio mostrare tutto se selectedMonths è vuoto, OPPURE logica rigorosa.
          //    Qui usiamo logica: Se selectedMonths ha valori, deve matchare. Se vuoto, non mostra niente o tutto?
          //    UX Choice: Se l'utente non seleziona mesi, mostriamo tutto l'anno selezionato.
          let matchesMonth = false;
          if (selectedMonths.length > 0) {
              matchesMonth = selectedMonths.includes(entryMonth);
          } else {
              // Fallback: Se non ho filtri mese specifici, mostro tutto l'anno selezionato
              matchesMonth = entryDate.getFullYear().toString() === selectedYear;
          }

          // Nota: il filtro selectedMonths contiene stringhe "YYYY-MM", quindi include già l'anno.
          // Tuttavia, se ho selezionato "Nov 2023" e cambio la view all'anno "2024", 
          // voglio vedere ancora le entry 2023 o no?
          // Per coerenza con l'UI "Anno", forziamo che l'entry debba appartenere all'anno selezionato
          // TRANNE se ho esplicitamente selezionato dei mesi.
          // Semplificazione: Mostriamo solo ciò che corrisponde ai mesi selezionati. 
          // Se la lista mesi è vuota, mostriamo tutto l'anno corrente selezionato nel tab.

          const matchesYear = entryDate.getFullYear().toString() === selectedYear;

          if (selectedMonths.length > 0) {
              return matchesProject && matchesMonth; 
          } else {
              return matchesProject && matchesYear;
          }
      });
  }, [entries, selectedProjectIds, selectedMonths, selectedYear]);

  const grouped = groupEntriesByDay(filteredEntries);
  const totalFilteredEarnings = filteredEntries.reduce((acc, e) => acc + calculateEarnings(e), 0);
  const totalDuration = filteredEntries.reduce((acc, e) => acc + (e.duration || 0), 0);

  // --- RENDER HELPERS ---
  const formatMonthLabel = (m: string) => {
      const [y, mo] = m.split('-');
      const date = new Date(parseInt(y), parseInt(mo) - 1, 1);
      return date.toLocaleDateString('it-IT', { month: 'short' });
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
      
      {/* --- COMPACT FILTER BAR --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center p-2 gap-2">
          
          {/* 1. Year Selector (Tabs) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg shrink-0 overflow-x-auto">
              {availableYears.map(year => (
                  <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${
                          selectedYear === year 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      {year}
                  </button>
              ))}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden md:block mx-2"></div>

          {/* 2. Clienti Dropdown (Space Saver) */}
          <div className="relative" ref={clientDropdownRef}>
              <button 
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all w-full md:w-auto justify-between ${
                      selectedProjectIds.length > 0 && selectedProjectIds.length < projects.length
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
              >
                  <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>
                          {selectedProjectIds.length === projects.length 
                            ? 'Tutti i Clienti' 
                            : `${selectedProjectIds.length} Clienti scelti`}
                      </span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isClientDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3 animate-slide-down">
                      {/* Search */}
                      <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input 
                              type="text" 
                              placeholder="Cerca cliente..." 
                              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                              value={clientSearchTerm}
                              onChange={e => setClientSearchTerm(e.target.value)}
                              autoFocus
                          />
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-xs font-bold text-gray-400 uppercase">Seleziona</span>
                          <button onClick={toggleAllProjects} className="text-xs text-indigo-600 font-bold hover:underline">
                              {selectedProjectIds.length === projects.length ? 'Deseleziona' : 'Tutti'}
                          </button>
                      </div>

                      {/* List */}
                      <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                          {filteredProjectsList.map(p => {
                              const isSelected = selectedProjectIds.includes(p.id);
                              return (
                                  <button
                                      key={p.id}
                                      onClick={() => toggleProject(p.id)}
                                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors text-left ${
                                          isSelected ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50 text-gray-600'
                                      }`}
                                  >
                                      {isSelected ? <CheckSquare size={14} className="shrink-0"/> : <Square size={14} className="shrink-0 text-gray-300"/>}
                                      <span className="truncate">{p.name}</span>
                                  </button>
                              )
                          })}
                          {filteredProjectsList.length === 0 && <p className="text-center text-xs text-gray-400 py-2">Nessun risultato</p>}
                      </div>
                  </div>
              )}
          </div>

          <div className="w-px h-8 bg-gray-200 hidden md:block mx-2"></div>

          {/* 3. Mesi Horizontal Scroll (Space Saver) */}
          <div className="flex-grow flex items-center gap-2 overflow-hidden">
             <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 custom-scrollbar w-full">
                  <button 
                      onClick={toggleAllMonthsInYear}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                      Tutto {selectedYear}
                  </button>
                  {availableMonthsInYear.length === 0 && (
                      <span className="text-xs text-gray-400 italic px-2">Nessun dato nel {selectedYear}</span>
                  )}
                  {availableMonthsInYear.map(m => {
                      const isSelected = selectedMonths.includes(m);
                      return (
                          <button
                              key={m}
                              onClick={() => toggleMonth(m)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all capitalize whitespace-nowrap ${
                                  isSelected 
                                  ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium' 
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                          >
                              {isSelected && <CheckSquare size={12} />}
                              {formatMonthLabel(m)}
                          </button>
                      )
                  })}
             </div>
          </div>
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
              Nessun servizio trovato con i filtri selezionati nel {selectedYear}.
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