import type { AuditLog } from '../types';

export interface ActivityStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByDay: Record<string, number>;
  topUsers: Array<{ userId: string; email?: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

export function calculateActivityStats(logs: AuditLog[]): ActivityStats {
  const actionsByType: Record<string, number> = {};
  const actionsByUser: Record<string, number> = {};
  const actionsByDay: Record<string, number> = {};
  const userMap: Record<string, { userId: string; email?: string }> = {};

  logs.forEach((log) => {
    // Count by action type
    const action = log.action;
    actionsByType[action] = (actionsByType[action] || 0) + 1;

    // Count by user
    const userId = log.userId;
    actionsByUser[userId] = (actionsByUser[userId] || 0) + 1;
    
    // Store user info
    if (!userMap[userId]) {
      userMap[userId] = {
        userId,
        email: log.user?.email || log.username,
      };
    }

    // Count by day
    if (log.createdAt || log.timestamp) {
      const date = new Date(log.createdAt || log.timestamp!);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      actionsByDay[dayKey] = (actionsByDay[dayKey] || 0) + 1;
    }
  });

  // Get top users
  const topUsers = Object.entries(actionsByUser)
    .map(([userId, count]) => ({
      userId,
      email: userMap[userId]?.email,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get top actions
  const topActions = Object.entries(actionsByType)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalActions: logs.length,
    actionsByType,
    actionsByUser,
    actionsByDay,
    topUsers,
    topActions,
  };
}

export function formatActionName(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getActionCategory(action: string): string {
  if (action.includes('CREATE')) return 'Create';
  if (action.includes('UPDATE') || action.includes('ROTATE')) return 'Modify';
  if (action.includes('DELETE')) return 'Delete';
  if (action.includes('READ')) return 'Read';
  return 'Other';
}

export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

export function prepareChartData(
  actionsByDay: Record<string, number>,
  days: string[]
): Array<{ date: string; count: number; label: string }> {
  return days.map((day) => {
    const date = new Date(day);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: day,
      count: actionsByDay[day] || 0,
      label,
    };
  });
}

