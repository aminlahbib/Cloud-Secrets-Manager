import React from 'react';
import { Plus, Search, LayoutGrid, List, Layers, Building2 } from 'lucide-react';
import { FilterPanel, FilterConfig } from '../ui/FilterPanel';
import { useI18n } from '../../contexts/I18nContext';

interface PageHeaderProps {
  title: string;
  description?: string;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  onCreateNew: () => void;
  createButtonLabel: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onFilterClear?: () => void;
  groupBy?: 'none' | 'team' | 'workflow';
  onGroupByChange?: (groupBy: 'none' | 'team' | 'workflow') => void;
  showArchived?: boolean;
  onShowArchivedChange?: (show: boolean) => void;
  showGroupBy?: boolean;
  showArchivedToggle?: boolean;
  additionalActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  view,
  onViewChange,
  onCreateNew,
  createButtonLabel,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  filterValues,
  onFilterChange,
  onFilterClear,
  groupBy,
  onGroupByChange,
  showArchived,
  onShowArchivedChange,
  showGroupBy = false,
  showArchivedToggle = false,
  additionalActions,
}) => {
  const { t } = useI18n();
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {description && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="border rounded-lg p-1 flex gap-1 shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button 
              onClick={() => onViewChange('grid')}
              className="p-1.5 rounded transition-colors"
              style={{
                backgroundColor: view === 'grid' ? 'var(--elevation-1)' : 'transparent',
                color: view === 'grid' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                if (view !== 'grid') {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'grid') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onViewChange('list')}
              className="p-1.5 rounded transition-colors"
              style={{
                backgroundColor: view === 'list' ? 'var(--elevation-1)' : 'transparent',
                color: view === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                if (view !== 'list') {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'list') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {additionalActions}
          <button 
            className="px-4 py-2 font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onClick={onCreateNew}
          >
            <Plus className="w-4 h-4" />
            {createButtonLabel}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-primary-glow)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        {filters && filters.length > 0 && onFilterChange && onFilterClear && (
          <FilterPanel
            filters={filters}
            values={filterValues || {}}
            onChange={onFilterChange}
            onClear={onFilterClear}
          />
        )}
      </div>
        
      {/* Group By Selector and Archived Toggle */}
      {(showGroupBy || showArchivedToggle) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {showGroupBy && onGroupByChange && (
            <div className="flex items-center gap-3">
              <span className="text-body-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('pageHeader.groupBy')}
              </span>
              <div className="flex items-center gap-1 p-1 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => onGroupByChange('none')}
                  className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
                  style={{
                    backgroundColor: groupBy === 'none' ? 'var(--accent-primary-glow)' : 'transparent',
                    color: groupBy === 'none' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (groupBy !== 'none') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (groupBy !== 'none') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Layers className="h-4 w-4 inline mr-1.5" />
                  {t('pageHeader.groupByNone')}
                </button>
                <button
                  onClick={() => onGroupByChange('workflow')}
                  className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
                  style={{
                    backgroundColor: groupBy === 'workflow' ? 'var(--accent-primary-glow)' : 'transparent',
                    color: groupBy === 'workflow' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (groupBy !== 'workflow') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (groupBy !== 'workflow') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <LayoutGrid className="h-4 w-4 inline mr-1.5" />
                  {t('pageHeader.groupByWorkflow')}
                </button>
                <button
                  onClick={() => onGroupByChange('team')}
                  className="px-3 py-1.5 rounded text-body-sm transition-all duration-150"
                  style={{
                    backgroundColor: groupBy === 'team' ? 'var(--accent-primary-glow)' : 'transparent',
                    color: groupBy === 'team' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (groupBy !== 'team') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (groupBy !== 'team') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Building2 className="h-4 w-4 inline mr-1.5" />
                  {t('pageHeader.groupByTeam')}
                </button>
              </div>
            </div>
          )}
          {showArchivedToggle && onShowArchivedChange && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('pageHeader.showArchived')}
                </span>
                <div
                  className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer"
                  style={{
                    backgroundColor: showArchived ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  }}
                  onClick={() => onShowArchivedChange(!showArchived)}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform ${
                      showArchived ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

