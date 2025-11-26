import React from 'react';
import { Users, UserPlus, Mail } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Manage team members and access controls</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center">
          <UserPlus className="w-5 h-5 mr-2" />
          Invite Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">AL</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Amine Lahbib</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="w-3 h-3 mr-1" />
                  amine@example.com
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Owner
            </span>
          </div>
          
          {/* Empty State Placeholder */}
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No other members</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by inviting people to your team.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

