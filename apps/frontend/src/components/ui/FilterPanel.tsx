import React, { useMemo, useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'dateRange';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = React.memo(({
  filters,
  values,
  onChange,
  onClear,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeFiltersCount = Object.values(values).filter(v => v !== '' && v !== null && v !== undefined).length;
  
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];
    filters.forEach((filter) => {
      const value = values[filter.key];
      if (value && value !== '' && value !== null && value !== undefined) {
        const option = filter.options?.find(opt => opt.value === value);
        active.push({
          key: filter.key,
          label: filter.label,
          value: option?.label || String(value),
        });
      }
    });
    return active;
  }, [filters, values]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        }}
      >
        <Filter className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        Filters
        {activeFiltersCount > 0 && (
          <span 
            className="text-xs rounded-full px-2 py-0.5"
            style={{
              backgroundColor: 'var(--accent-primary-glow)',
              color: 'var(--accent-primary)',
            }}
          >
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 border border-theme-subtle rounded-lg shadow-theme-lg p-4 z-20 min-w-[300px] transition-colors dropdown-glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body-sm font-semibold text-theme-primary">Filters</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClear}
                  className="text-caption transition-colors text-accent-primary hover:text-accent-primary"
                >
                  Clear all
                </button>
              )}
            </div>

            {activeFilters.length > 0 && (
              <div className="mb-4 pb-4 border-b border-theme-subtle">
                <p className="text-caption font-medium mb-2 text-theme-secondary">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge key={filter.key} variant="info" className="text-xs">
                      {filter.label}: {filter.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-caption font-medium mb-1 text-theme-primary">
                    {filter.label}
                  </label>
                  {filter.type === 'select' && filter.options && (
                    <select
                      value={values[filter.key] || ''}
                      onChange={(e) => onChange(filter.key, e.target.value || null)}
                      className="input-theme w-full px-3 py-2 text-body-sm"
                    >
                      <option value="">All</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === 'date' && (
                    <input
                      type="date"
                      value={values[filter.key] || ''}
                      onChange={(e) => onChange(filter.key, e.target.value || null)}
                      className="input-theme w-full px-3 py-2 text-body-sm"
                    />
                  )}
                  {filter.type === 'dateRange' && (
                    <div className="space-y-2">
                      <input
                        type="date"
                        placeholder="From"
                        value={values[`${filter.key}From`] || ''}
                        onChange={(e) => onChange(`${filter.key}From`, e.target.value || null)}
                        className="input-theme w-full px-3 py-2 text-body-sm"
                      />
                      <input
                        type="date"
                        placeholder="To"
                        value={values[`${filter.key}To`] || ''}
                        onChange={(e) => onChange(`${filter.key}To`, e.target.value || null)}
                        className="input-theme w-full px-3 py-2 text-body-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-theme-subtle flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

