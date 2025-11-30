
import React from 'react';
import { Metric, Project, Team } from '../types';
import StatCard from './StatCard';
import ProjectCard from './ProjectCard';
import TeamList from './TeamList';
import { Plus } from 'lucide-react';

interface DashboardViewProps {
  metrics: Metric[];
  projects: Project[];
  teams: Team[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ metrics, projects, teams }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your organization's secrets and access controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm">
            View Audit Logs
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <StatCard key={index} metric={metric} />
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Projects) - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Recent Projects</h3>
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Right Column (Teams & Quick Lists) - Spans 1 col */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-base font-bold text-slate-900">Teams</h3>
            </div>
            <TeamList teams={teams} />
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide text-xs">Recent Activity</h3>
                <button className="text-xs text-brand-600 font-medium">View all</button>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 2 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-100"></div>}
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 z-10 text-[10px] text-slate-500 font-medium">
                    SL
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 leading-snug">
                      <span className="font-semibold text-slate-900">Sarah L.</span> updated keys in <span className="text-brand-700 font-medium">Payment Gateway</span>
                    </p>
                    <span className="text-xs text-slate-400 mt-1 block">2 hours ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
