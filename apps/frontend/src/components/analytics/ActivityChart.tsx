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
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-tertiary)' }}>
          No data available
        </div>
      </Card>
    );
  }

  const ChartComponent = useMemo(() => type === 'line' ? LineChart : BarChart, [type]);
  const DataComponent = useMemo(() => type === 'line' ? Line : Bar, [type]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="label" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
          />
          <DataComponent 
            type="monotone" 
            dataKey="count" 
            stroke="var(--status-info)" 
            fill="var(--status-info)"
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
});

