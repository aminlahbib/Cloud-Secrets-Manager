
import React from 'react';
import { User } from '../types';
import { User as UserIcon, Shield, Bell, Settings as SettingsIcon } from 'lucide-react';

interface SettingsViewProps {
  user: User;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0 space-y-1">
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-700">
                <UserIcon className="w-4.5 h-4.5" />
                Profile
             </button>
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Shield className="w-4.5 h-4.5" />
                Security
             </button>
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Bell className="w-4.5 h-4.5" />
                Notifications
             </button>
             <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <SettingsIcon className="w-4.5 h-4.5" />
                Preferences
             </button>
          </div>

          {/* Content Form */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-8">
             <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Settings</h3>
             
             {/* Avatar Section */}
             <div className="flex items-center gap-6 mb-8">
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border border-slate-200 object-cover" />
                <div>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm">
                        Change Avatar
                    </button>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                </div>
             </div>

             <form className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Display Name</label>
                        <input 
                            type="text" 
                            defaultValue={user.name}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Username</label>
                        <input 
                            type="text" 
                            defaultValue="amine.lhb"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input 
                        type="email" 
                        defaultValue={user.email}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 focus:outline-none"
                        readOnly
                    />
                    <p className="text-xs text-slate-400">Email cannot be changed. Contact support if needed.</p>
                </div>

                <div className="pt-6 flex items-center justify-end border-t border-slate-100">
                    <button type="button" className="px-5 py-2.5 bg-brand-600 text-white font-medium rounded-lg text-sm hover:bg-brand-700 transition-colors shadow-sm">
                        Save Changes
                    </button>
                </div>
             </form>
          </div>
      </div>
    </div>
  );
};

export default SettingsView;
