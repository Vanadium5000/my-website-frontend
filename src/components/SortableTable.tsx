import { useState, useMemo, useEffect } from "preact/hooks";
import { JSX } from "preact";
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronsRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export interface TableColumn<T> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
}

export interface SortableTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  renderCell?: (item: T, columnKey: string) => JSX.Element | string;
  initialSort?: {
    key: string;
    direction: "asc" | "desc";
  };
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
    showWhenOver?: number;
  };
}

export function SortableTable<T>({
  columns,
  data,
  renderCell,
  initialSort,
  className = "",
  loading = false,
  emptyMessage = "No data available",
  pagination = { enabled: true, pageSize: 50, showWhenOver: 50 },
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(initialSort || null);

  const [currentPage, setCurrentPage] = useState(1);

  const shouldShowPagination =
    pagination.enabled && data.length > (pagination.showWhenOver || 50);

  const sortedData = useMemo(() => {
    if (!sortConfig || !data?.length) return data || [];

    const sorted = [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      // Handle null/undefined values - put them at the end
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

      // Sort based on value type
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        // Fallback string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!shouldShowPagination) return sortedData;
    const pageSize = pagination.pageSize || 50;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, shouldShowPagination, pagination.pageSize]);

  const totalPages = useMemo(() => {
    if (!shouldShowPagination) return 1;
    return Math.ceil(sortedData.length / (pagination.pageSize || 50));
  }, [sortedData.length, shouldShowPagination, pagination.pageSize]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        // Cycle: unsorted -> asc -> desc -> asc...
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        } else {
          return { key, direction: "asc" };
        }
      } else {
        return { key, direction: "asc" };
      }
    });
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FiChevronsRight className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <FiChevronUp className="w-4 h-4" />
    ) : (
      <FiChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`table table-zebra table-fixed w-full ${className}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.width ? "" : undefined}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.sortable !== false ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-1 hover:bg-base-200 px-2 py-1 rounded"
                    type="button"
                  >
                    <span>{column.title}</span>
                    {getSortIcon(column.key)}
                  </button>
                ) : (
                  <span>{column.title}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-base-content/60"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((item, index) => (
              <tr key={(item as any).id || index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {renderCell
                      ? renderCell(item, column.key)
                      : (item as any)[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {shouldShowPagination && totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn btn-sm ${
                  page === currentPage ? "btn-active" : ""
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="join-item btn btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
