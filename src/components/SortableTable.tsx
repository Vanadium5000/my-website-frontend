import { useState, useMemo } from "preact/hooks";
import { JSX } from "preact";
import { FiChevronUp, FiChevronDown, FiChevronsRight } from "react-icons/fi";

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
}

export function SortableTable<T>({
  columns,
  data,
  renderCell,
  initialSort,
  className = "",
  loading = false,
  emptyMessage = "No data available",
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(initialSort || null);

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
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-base-content/60"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, index) => (
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
    </div>
  );
}
