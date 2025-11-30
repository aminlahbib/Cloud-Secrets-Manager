
import React from 'react';
import { Team } from '../types';
import { Plus, Users, Folder, MoreHorizontal, Settings, Trash2 } from 'lucide-react';

interface TeamsViewProps {
  teams: Team[];
}

const TeamsView: React.FC<TeamsViewProps> = ({ teams }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Teams</h2>
          <p className="text-slate-500 text-sm mt-1">Manage team members and access controls.</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
             <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                            {team.avatarInitials}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{team.name}</h3>
                            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium px-2 py-0.5 bg-slate-100 rounded-full mt-1 inline-block">
                                {team.role}
                            </span>
                        </div>
                    </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-6 h-10 line-clamp-2">
                    {team.description || "No description provided for this team."}
                </p>

                <div className="flex items-center gap-4 mb-6 border-t border-b border-slate-50 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{team.members} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Folder className="w-4 h-4 text-slate-400" />
                        <span>{team.projects} projects</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                        <Settings className="w-4 h-4" />
                        Manage
                    </button>
                    <button className="py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
             </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsView;
