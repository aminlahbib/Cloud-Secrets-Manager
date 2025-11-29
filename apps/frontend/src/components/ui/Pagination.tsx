import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  
  // Always show first page
  pages.push(1);

  // Show pages around current page
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (i > 1 && pages[pages.length - 1] !== i - 1) {
      pages.push('...');
    }
    pages.push(i);
  }

  // Always show last page
  if (totalPages > 1) {
    if (pages[pages.length - 1] !== totalPages - 1 && totalPages > 2) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-theme-default text-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-elevation-1"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => (
        <React.Fragment key={index}>
          {typeof page === 'number' ? (
            <button
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                currentPage === page 
                  ? 'bg-accent-primary text-theme-inverse border-accent-primary' 
                  : 'bg-transparent text-theme-primary border-theme-default hover:bg-elevation-1'
              }`}
            >
              {page}
            </button>
          ) : (
            <span className="px-2 text-theme-secondary">...</span>
          )}
        </React.Fragment>
      ))}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-theme-default text-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-elevation-1"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

