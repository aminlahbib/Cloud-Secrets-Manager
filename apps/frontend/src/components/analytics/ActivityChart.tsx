import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card } from '../ui/Card';

interface ActivityChartProps {
  data: Array<{ date: string; count: number; label: string }>;
  title?: string;
  type?: 'line' | 'bar';
}

export const ActivityChart: React.FC<ActivityChartProps> = React.memo(({ 
  data, 
  title = 'Activity Over Time',
  type = 'line' 
}) => {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </Card>
    );
  }

  const ChartComponent = useMemo(() => type === 'line' ? LineChart : BarChart, [type]);
  const DataComponent = useMemo(() => type === 'line' ? Line : Bar, [type]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="label" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <DataComponent 
            type="monotone" 
            dataKey="count" 
            stroke="#3b82f6" 
            fill="#3b82f6"
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
});

