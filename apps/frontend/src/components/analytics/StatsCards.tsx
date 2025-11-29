import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import type { ActivityStats } from '../../utils/analytics';

interface StatsCardsProps {
  stats: ActivityStats;
}

export const StatsCards: React.FC<StatsCardsProps> = React.memo(({ stats }) => {
  const uniqueUsers = useMemo(() => Object.keys(stats.actionsByUser).length, [stats.actionsByUser]);
  const uniqueActions = useMemo(() => Object.keys(stats.actionsByType).length, [stats.actionsByType]);
  
  // Calculate average per day (last 7 days)
  const avgPerDay = useMemo(() => {
    const last7Days = Object.values(stats.actionsByDay).slice(-7);
    return last7Days.length > 0
      ? Math.round(last7Days.reduce((a, b) => a + b, 0) / last7Days.length)
      : 0;
  }, [stats.actionsByDay]);

  const statItems = useMemo(() => [
    {
      label: 'Total Actions',
      value: stats.totalActions.toLocaleString(),
      icon: <Activity className="h-5 w-5" />,
      color: 'var(--status-info)',
      bgColor: 'var(--status-info-bg)',
    },
    {
      label: 'Active Users',
      value: uniqueUsers.toString(),
      icon: <Users className="h-5 w-5" />,
      color: 'var(--status-success)',
      bgColor: 'var(--status-success-bg)',
    },
    {
      label: 'Action Types',
      value: uniqueActions.toString(),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'var(--accent-secondary)',
      bgColor: 'var(--elevation-1)',
    },
    {
      label: 'Avg/Day (7d)',
      value: avgPerDay.toString(),
      icon: <Clock className="h-5 w-5" />,
      color: 'var(--accent-primary)',
      bgColor: 'var(--accent-primary-glow)',
    },
  ], [stats.totalActions, uniqueUsers, uniqueActions, avgPerDay]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: item.bgColor, color: item.color }}>
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

