
import React from 'react';
import { Activity } from '../types';
import { Search, Filter, Download, Key, Folder, Users, Shield } from 'lucide-react';

interface ActivityViewProps {
  activities: Activity[];
}

const ActivityView: React.FC<ActivityViewProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch(type) {
        case 'secret': return Key;
        case 'project': return Folder;
        case 'team': return Users;
        default: return Shield;
    }
  };

  const getActionColor = (action: string) => {
      switch(action) {
          case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
          case 'delete': return 'bg-red-50 text-red-700 border-red-100';
          case 'update': return 'bg-amber-50 text-amber-700 border-amber-100';
          default: return 'bg-blue-50 text-blue-700 border-blue-100';
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Logs</h2>
          <p className="text-slate-500 text-sm mt-1">Track all actions across your accessible projects and secrets.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            Filters
          </button>
           <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
            {activities.map((activity) => {
                const Icon = getIcon(activity.targetType);
                return (
                    <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start md:items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getActionColor(activity.action)}`}>
                                        {activity.action} {activity.targetType}
                                    </span>
                                    <span className="font-medium text-slate-900 text-sm">{activity.target}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <span>by {activity.user.email}</span>
                                    {activity.project && (
                                        <>
                                            <span>•</span>
                                            <span>in {activity.project}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400 font-medium whitespace-nowrap pl-14 md:pl-0">
                            {activity.time}
                        </div>
                    </div>
                );
            })}
        </div>
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button className="text-sm text-slate-500 hover:text-slate-900 font-medium">Load more</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityView;
