import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface Column<T> {
  name: string;
  selector: (row: T, index?: number) => any;
  sortable?: boolean;
  width?: string;
  cell?: (row: T, index?: number) => React.ReactNode;
  wrap?: boolean;
}

interface CustomDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: boolean;
  paginationPerPage?: number;
  progressPending?: boolean;
  striped?: boolean;
  highlightOnHover?: boolean;
  customStyles?: any;
  noDataComponent?: React.ReactNode;
}

const CustomDataTable = <T,>({
  columns,
  data,
  pagination = true,
  paginationPerPage = 10,
  progressPending = false,
  striped = true,
  highlightOnHover = true,
  customStyles = {},
  noDataComponent,
}: CustomDataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  if (progressPending) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  const filteredData = data.filter((row) =>
    columns.some((col) => {
      const value = col.selector(row);
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    })
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = columns.find(c => c.name === sortColumn)?.selector(a) || '';
    const bVal = columns.find(c => c.name === sortColumn)?.selector(b) || '';
    const comparison = (aVal as any > bVal as any) ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / paginationPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * paginationPerPage,
    currentPage * paginationPerPage
  );

  const handleSort = (columnName: string) => {
    if (sortColumn !== columnName) {
      setSortColumn(columnName);
      setSortDirection('asc');
    } else {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  const exportToExcel = (data: T[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data.map((row, i) => ({
      'Sl.No': i + 1,
      ...Object.fromEntries(
        columns.map(col => [col.name, col.selector(row)])
      )
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename.replace('.xlsx', ''));
    XLSX.writeFile(wb, filename);
  };

  return (
    <div style={{ ...customStyles.tableWrapper, width: '100%' }}>
      {/* Search & Per Page */}
      {customStyles.tableToolbar && (
        <div style={customStyles.tableToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Show</span>
            <select style={customStyles.perPageSelect}>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={customStyles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  style={{
                    ...customStyles.headCells,
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default',
                    ...(sortColumn === column.name && {
                      backgroundColor: '#e3f2fd',
                    }),
                  }}
                  onClick={column.sortable ? () => handleSort(column.name) : undefined}
                >
                  {column.name}
                  {sortColumn === column.name && (
                    <span style={{ marginLeft: 4 }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
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
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#888',
                    fontStyle: 'italic',
                  }}
                >
                  {noDataComponent || 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    ...(striped && index % 2 === 1 && { backgroundColor: '#f8f9fa' }),
                    ...(highlightOnHover && { 
                      ':hover': { backgroundColor: '#e3f2fd' } 
                    }),
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.name}
                      style={{
                        ...customStyles.cells,
                        whiteSpace: column.wrap ? 'normal' : 'nowrap',
                      }}
                    >
                      {column.cell ? column.cell(row, index) : column.selector(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div style={customStyles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{
              padding: '4px 12px',
              border: '1px solid #ddd',
              background: currentPage === 1 ? '#f5f5f5' : '#fff',
            }}
          >
            Previous
          </button>
          <span style={{ margin: '0 16px', minWidth: '80px', textAlign: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{
              padding: '4px 12px',
              border: '1px solid #ddd',
              background: currentPage === totalPages ? '#f5f5f5' : '#fff',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomDataTable;
