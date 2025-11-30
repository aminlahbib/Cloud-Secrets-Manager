import React from 'react';
import { Team } from '../types';
import { Users, ChevronRight, Key } from 'lucide-react';

interface TeamListProps {
  teams: Team[];
}

const TeamList: React.FC<TeamListProps> = ({ teams }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Your Teams</h3>
        <button className="text-sm text-brand-600 font-medium hover:text-brand-700">View all</button>
      </div>
      <div className="divide-y divide-slate-50">
        {teams.map((team) => (
          <div key={team.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-50">
                {team.avatarInitials}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{team.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {team.members} members
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Key className="w-3 h-3" /> {team.projects} projects
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md tracking-wide">
                    {team.role}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamList;