import React, { useMemo, useCallback } from 'react';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string | number;
  className?: string;
  showCheckboxes?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (key: string) => void;
  onSelectAll?: () => void;
  renderRowActions?: (item: T) => React.ReactNode;
  mobileCardView?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyState,
  onRowClick,
  rowKey,
  className = '',
  showCheckboxes = false,
  selectedItems,
  onSelectItem,
  onSelectAll,
  renderRowActions,
  mobileCardView,
}: DataTableProps<T>) {
  const allSelected = useMemo(() => {
    if (!selectedItems || !onSelectAll || data.length === 0) return false;
    return selectedItems.size === data.length && data.length > 0;
  }, [selectedItems, data.length, onSelectAll]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    }
  }, [onSelectAll]);

  const handleRowClick = useCallback((item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  }, [onRowClick]);

  if (loading) {
    return <SkeletonTable rows={5} cols={columns.length + (showCheckboxes ? 1 : 0) + (renderRowActions ? 1 : 0)} />;
  }

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description || ''}
        action={emptyState.action}
      />
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`hidden md:block rounded-lg border border-theme-subtle overflow-hidden bg-card ${className}`}>
        <table className="min-w-full table-theme">
          <thead className="table-header-theme">
            <tr>
              {showCheckboxes && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border border-theme-default text-accent-primary"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-tertiary bg-table-header ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {renderRowActions && (
                <th className="px-6 py-3 text-right text-caption font-medium uppercase tracking-wider text-theme-tertiary bg-table-header">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="table-theme divide-y divide-theme-subtle">
            {data.map((item, index) => {
              const key = String(rowKey(item) ?? `row-${index}`);
              const isSelected = selectedItems?.has(key) || false;

              return (
                <tr
                  key={key}
                  className={`transition-colors hover:bg-elevation-1 border-t border-theme-subtle ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(item)}
                >
                  {showCheckboxes && (
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectItem?.(key)}
                        className="h-4 w-4 rounded border border-theme-default text-accent-primary"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                    >
                      {column.render ? column.render(item, index) : String((item as any)[column.key])}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderRowActions(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className={`md:hidden grid grid-cols-1 gap-4 ${className}`}>
          {data.map((item, index) => {
            const key = String(rowKey(item) ?? `row-${index}`);
            return (
              <div key={key} className="relative">
                {showCheckboxes && selectedItems && onSelectItem && (
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(key)}
                      onChange={() => onSelectItem(key)}
                      className="h-5 w-5 rounded border border-theme-default text-accent-primary"
                    />
                  </div>
                )}
                {mobileCardView(item)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

