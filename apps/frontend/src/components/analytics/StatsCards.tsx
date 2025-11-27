import React from 'react';
import { Card } from '../ui/Card';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import type { ActivityStats } from '../../utils/analytics';

interface StatsCardsProps {
  stats: ActivityStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const uniqueUsers = Object.keys(stats.actionsByUser).length;
  const uniqueActions = Object.keys(stats.actionsByType).length;
  
  // Calculate average per day (last 7 days)
  const last7Days = Object.values(stats.actionsByDay).slice(-7);
  const avgPerDay = last7Days.length > 0
    ? Math.round(last7Days.reduce((a, b) => a + b, 0) / last7Days.length)
    : 0;

  const statItems = [
    {
      label: 'Total Actions',
      value: stats.totalActions.toLocaleString(),
      icon: <Activity className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Active Users',
      value: uniqueUsers.toString(),
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Action Types',
      value: uniqueActions.toString(),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Avg/Day (7d)',
      value: avgPerDay.toString(),
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
            </div>
            <div className={`${item.bgColor} ${item.color} p-3 rounded-lg`}>
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

