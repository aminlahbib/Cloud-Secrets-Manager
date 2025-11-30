
import { LucideIcon } from "lucide-react";

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Metric {
  label: string;
  value: string | number;
  trend: number; // percentage
  trendLabel: string;
  icon: LucideIcon;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'Owner' | 'Admin' | 'Member';
  workflow: string;
  tags: string[];
  membersCount: number;
  secretsCount: number;
  lastUpdated: string;
}

export interface Team {
  id: string;
  name: string;
  role: string;
  members: number;
  projects: number;
  avatarInitials: string;
  description?: string;
}

export interface Activity {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
    initials: string;
  };
  action: 'create' | 'read' | 'update' | 'delete';
  target: string;
  targetType: 'secret' | 'project' | 'team';
  time: string;
  project?: string;
}
