import React from 'react';
import { Project } from '../types';
import { Folder, MoreHorizontal, Shield, Lock, Clock, Globe } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getWorkflowStyle = (workflow: string) => {
    switch (workflow) {
      case 'Production': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Staging': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-slate-500">
                <Folder className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-900 leading-snug">{project.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getWorkflowStyle(project.workflow)} uppercase tracking-wide`}>
                      {project.workflow}
                   </span>
                   <span className="text-xs text-slate-400">•</span>
                   <span className="text-xs text-slate-500">{project.type}</span>
                </div>
            </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-50">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-5 line-clamp-2 h-10">
        {project.description}
      </p>

      {/* Footer metrics */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100" title="Secrets">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{project.secretsCount}</span>
            </div>
             <div className="flex -space-x-1.5">
                {[...Array(Math.min(3, project.membersCount))].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                       {String.fromCharCode(65 + i)}
                    </div>
                ))}
                {project.membersCount > 3 && (
                     <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                     +{project.membersCount - 3}
                  </div>
                )}
            </div>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {project.lastUpdated}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;