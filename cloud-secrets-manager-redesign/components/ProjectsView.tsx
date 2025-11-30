
import React from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { Search, Filter, Plus, LayoutGrid, List } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your projects and secret collections.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1 shadow-sm">
              <button className="p-1.5 bg-slate-100 rounded text-slate-700">
                  <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-slate-50 rounded text-slate-400">
                  <List className="w-4 h-4" />
              </button>
           </div>
           <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
            />
         </div>
         <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            Filters
         </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsView;
