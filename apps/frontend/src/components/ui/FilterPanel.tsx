import React, { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { Button } from './Button';

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

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="text-caption rounded-full px-2 py-0.5 bg-status-info text-theme-inverse">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

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

