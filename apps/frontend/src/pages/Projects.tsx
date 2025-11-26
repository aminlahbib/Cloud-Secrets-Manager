import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus, MoreVertical, Search } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your projects and secret collections</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center">
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border-none focus:ring-0 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/secrets" className="block">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-purple-200 group h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Folder className="w-8 h-8 text-purple-600" />
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Default Project</h3>
              <p className="text-gray-500 text-sm line-clamp-2">
                Your primary workspace for managing application secrets and configuration.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
              <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-xs font-medium text-purple-700">AL</div>
              </div>
              <span className="text-gray-400">12 Secrets</span>
            </div>
          </div>
        </Link>

        {/* Placeholder for Empty State / Add New */}
        <button className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-colors h-full min-h-[200px]">
          <Plus className="w-12 h-12 mb-3 opacity-50" />
          <span className="font-medium">Create another project</span>
        </button>
      </div>
    </div>
  );
};

