
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Metric, Project, Team, User, Activity } from './types';
import { LayoutDashboard, Key, ShieldAlert, FolderGit2, RefreshCw } from 'lucide-react';

// Views
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import ActivityView from './components/ActivityView';
import TeamsView from './components/TeamsView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  // --- Data Definitions ---

  const currentUser: User = {
    name: "Amine Lahbib",
    email: "amine.lhb12@gmail.com",
    avatarUrl: "https://picsum.photos/100/100"
  };

  const metrics: Metric[] = [
    {
      label: "Total Projects",
      value: 12,
      trend: 15.3,
      trendLabel: "vs last month",
      icon: FolderGit2,
      color: "bg-blue-500"
    },
    {
      label: "Active Secrets",
      value: "1,248",
      trend: 8.2,
      trendLabel: "Added this week",
      icon: Key,
      color: "bg-amber-500"
    },
    {
      label: "Expiring Soon",
      value: "3",
      trend: -12.5,
      trendLabel: "Next 7 days",
      icon: ShieldAlert,
      color: "bg-red-500"
    },
    {
        label: "Sync Status",
        value: "98.2%",
        trend: 1.2,
        trendLabel: "Uptime",
        icon: RefreshCw,
        color: "bg-emerald-500"
      }
  ];

  const projects: Project[] = [
    {
      id: "1",
      name: "Payment Gateway Service",
      description: "Core payment processing logic and Stripe API keys.",
      type: "Owner",
      workflow: "Production",
      tags: ["Finance", "PCI-DSS"],
      membersCount: 8,
      secretsCount: 42,
      lastUpdated: "2h ago"
    },
    {
      id: "2",
      name: "Customer Dashboard UI",
      description: "Frontend dashboard for customer analytics.",
      type: "Admin",
      workflow: "Staging",
      tags: ["Frontend", "React"],
      membersCount: 12,
      secretsCount: 15,
      lastUpdated: "5h ago"
    },
    {
      id: "3",
      name: "Legacy Auth System",
      description: "Maintenance mode for old authentication.",
      type: "Member",
      workflow: "Development",
      tags: ["Legacy", "Auth"],
      membersCount: 3,
      secretsCount: 8,
      lastUpdated: "1d ago"
    },
    {
      id: "4",
      name: "Data Pipeline Service",
      description: "ETL jobs and warehouse credentials.",
      type: "Owner",
      workflow: "Production",
      tags: ["Data", "Python"],
      membersCount: 5,
      secretsCount: 128,
      lastUpdated: "3d ago"
    },
    {
        id: "5",
        name: "Mobile API Gateway",
        description: "BFF pattern for iOS and Android apps.",
        type: "Admin",
        workflow: "Production",
        tags: ["API", "Gateway"],
        membersCount: 6,
        secretsCount: 24,
        lastUpdated: "5d ago"
      },
  ];

  const teams: Team[] = [
    { id: "1", name: "Core Engineering", role: "Owner", members: 12, projects: 5, avatarInitials: "CE", description: "Responsible for maintaining the core infrastructure and backend services." },
    { id: "2", name: "DevOps Squad", role: "Admin", members: 4, projects: 12, avatarInitials: "DS", description: "Managing CI/CD pipelines, cloud infrastructure and security policies." },
    { id: "3", name: "Frontend Guild", role: "Member", members: 8, projects: 3, avatarInitials: "FG", description: "Cross-functional team for all frontend applications and design systems." },
  ];

  const activities: Activity[] = [
      {
          id: "1",
          user: { name: "Amine Lahbib", email: "amine.lhb12@gmail.com", initials: "AL" },
          action: "read",
          target: "test 2",
          targetType: "secret",
          time: "4h ago",
          project: "Payment Gateway"
      },
      {
        id: "2",
        user: { name: "Sarah L.", email: "sarah@company.com", initials: "SL" },
        action: "read",
        target: "test 2dsadas",
        targetType: "secret",
        time: "16h ago",
        project: "Payment Gateway"
    },
    {
        id: "3",
        user: { name: "Sarah L.", email: "sarah@company.com", initials: "SL" },
        action: "create",
        target: "test 2dsadas",
        targetType: "secret",
        time: "16h ago",
        project: "Customer Dashboard"
    },
    {
        id: "4",
        user: { name: "Mike R.", email: "mike@company.com", initials: "MR" },
        action: "read",
        target: "test-activity.rt",
        targetType: "secret",
        time: "1d ago",
        project: "Data Pipeline"
    },
    {
        id: "5",
        user: { name: "Amine Lahbib", email: "amine.lhb12@gmail.com", initials: "AL" },
        action: "read",
        target: "test 22",
        targetType: "secret",
        time: "1d ago",
        project: "Legacy Auth"
    },
    {
        id: "6",
        user: { name: "Amine Lahbib", email: "amine.lhb12@gmail.com", initials: "AL" },
        action: "create",
        target: "test 22",
        targetType: "secret",
        time: "1d ago",
        project: "Legacy Auth"
    },
    {
        id: "7",
        user: { name: "System", email: "bot@cloudsecrets.io", initials: "SY" },
        action: "update",
        target: "Production Env",
        targetType: "project",
        time: "1d ago",
        project: "Mobile API"
    }
  ];

  // --- Render Logic ---

  const renderContent = () => {
      switch(activeTab) {
          case 'home':
              return <DashboardView metrics={metrics} projects={projects} teams={teams} />;
          case 'projects':
              return <ProjectsView projects={projects} />;
          case 'activity':
              return <ActivityView activities={activities} />;
          case 'teams':
              return <TeamsView teams={teams} />;
          case 'settings':
              return <SettingsView user={currentUser} />;
          default:
              return <DashboardView metrics={metrics} projects={projects} teams={teams} />;
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        <Header user={currentUser} />
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
            {renderContent()}
            
            {/* Footer Spacer */}
            <div className="h-12"></div>
        </div>
      </main>
    </div>
  );
};

export default App;
