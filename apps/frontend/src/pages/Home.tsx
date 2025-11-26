import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your cloud secrets securely and efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Action Card */}
        <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2">Quick Start</h2>
          <p className="mb-6 text-purple-100">Create a new project to start managing your secrets.</p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/audit" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">No recent activity to show.</p>
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Projects</h2>
          <Link to="/projects" className="text-purple-600 hover:text-purple-700 font-medium">
            View all projects
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Project Card */}
          <Link to="/secrets" className="block group">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:border-purple-200">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Folder className="w-6 h-6 text-purple-600" />
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Default Project</h3>
              <p className="text-gray-500 text-sm mb-4">Main secrets repository</p>
              <div className="flex items-center text-sm text-gray-400">
                <span>Updated 2h ago</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

