import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { formatActionName } from '../../utils/analytics';

interface ActionDistributionChartProps {
  actionsByType: Record<string, number>;
  title?: string;
}

// CSS variable names for colors
const COLOR_VARS = [
  '--status-info',
  '--status-success',
  '--status-warning',
  '--status-danger',
  '--accent-secondary',
  '--accent-primary',
];

// Helper to get computed CSS variable value
const getCSSVariable = (varName: string): string => {
  if (typeof window === 'undefined') return '#3b82f6'; // fallback
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#3b82f6';
};

export const ActionDistributionChart: React.FC<ActionDistributionChartProps> = React.memo(({
  actionsByType,
  title = 'Actions Distribution',
}) => {
  const [colors, setColors] = useState<string[]>([]);

  // Compute colors from CSS variables
  useEffect(() => {
    const computedColors = COLOR_VARS.map(varName => getCSSVariable(varName));
    setColors(computedColors);
  }, []);

  const data = useMemo(() => 
    Object.entries(actionsByType)
      .map(([action, count]) => ({
        name: formatActionName(action),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    [actionsByType]
  );

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

  // Use computed colors or fallback
  const chartColors = colors.length > 0 ? colors : COLOR_VARS.map(() => '#3b82f6');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill={chartColors[0]}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
});

