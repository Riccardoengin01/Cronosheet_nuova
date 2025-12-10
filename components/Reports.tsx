import React from 'react';
import { Project, TimeEntry } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatDurationHuman } from '../utils';

interface ReportsProps {
  entries: TimeEntry[];
  projects: Project[];
}

const Reports: React.FC<ReportsProps> = ({ entries, projects }) => {
  // Aggregate data for Pie Chart (By Project)
  const projectData = projects.map(project => {
    const totalSeconds = entries
      .filter(e => e.projectId === project.id)
      .reduce((acc, curr) => {
        const duration = curr.duration || (curr.endTime ? (curr.endTime - curr.startTime) / 1000 : 0);
        return acc + duration;
      }, 0);
    
    return {
      name: project.name,
      value: totalSeconds / 3600, // Hours
      color: project.color
    };
  }).filter(d => d.value > 0);

  // Aggregate data for Bar Chart (By Day - Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(dateStr => {
    const dayEntries = entries.filter(e => {
        const eDate = new Date(e.startTime).toISOString().split('T')[0];
        return eDate === dateStr;
    });
    
    const hours = dayEntries.reduce((acc, curr) => {
         const duration = curr.duration || (curr.endTime ? (curr.endTime - curr.startTime) / 1000 : 0);
         return acc + duration;
    }, 0) / 3600;

    return {
        date: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' }),
        hours: hours
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Time per Project</h3>
        <div className="h-64">
          {projectData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={projectData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {projectData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Pie>
               <Tooltip 
                 formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'Duration']}
               />
               <Legend />
             </PieChart>
           </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No Data Available</div>
          )}
         
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Activity Last 7 Days</h3>
        <div className="h-64">
        {projectData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'Hours']} cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
           ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No Data Available</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Total Tracked</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">
                      {formatDurationHuman(entries.reduce((acc, curr) => acc + (curr.duration || 0), 0))}
                  </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Most Active Project</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1 truncate">
                      {projectData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
                  </p>
              </div>
               <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Avg Daily (Last 7d)</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">
                      {(dailyData.reduce((a, b) => a + b.hours, 0) / 7).toFixed(1)}h
                  </p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider">Total Tasks</p>
                  <p className="text-2xl font-bold text-pink-900 mt-1">
                      {entries.length}
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;