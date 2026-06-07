import React, { useRef, useMemo, useState, useEffect, useCallback, useTransition } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import UIButton from "../FormBuilder/fields/Button";
import { useTheme } from "../../contexts/ThemeContext";
import moment from "moment";

interface DataTableProps {
  columnDefs: any[];
  rowData: any[];
  pagination?: boolean;
  pageSize?: number;
  headerFilter?: boolean;
  showSearch?: boolean;
  showEntries?: boolean;
  showAddButton?: boolean;
  showAddButtonName?: string;
  showExportButton?: boolean;
  showExportButtonName?: string;
  showImportButton?: boolean;
  showExportCSVButton?: boolean;
  showSaveButton?: boolean;
  showSaveButtonName?: string;
  saveButtonHandler?: () => void;
  addButtonHandler?: () => void;
  importButtonHandler?: () => void;
  exportCSVButtonHandler?: () => void;
  autoGroupColumnDef?: any;
  singleClickEdit?: boolean;
  rowSelection?: any;
  onGridReady?: (fulldata: any) => void;
  onSelectionChanged?: (selectedRows: any) => void;
  onGridReadyKeyValue?: string;
  showExportFileName?: string;
  getRowStyle?: (params: any) => any;
  getRowClass?: (params: any) => string | string[] | undefined;
  wrapHeaders?: boolean;
  quickFilterText?: string;
  autoHeight?: boolean;
  loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columnDefs,
  rowData,
  pagination = true,
  pageSize: initialPageSize = 10,
  headerFilter = false,
  showSearch = true,
  showEntries = true,
  showAddButton = false,
  showAddButtonName,
  showExportButton = false,
  showExportFileName,
  showExportButtonName,
  showImportButton = false,
  showExportCSVButton = false,
  showSaveButton = false,
  showSaveButtonName,
  addButtonHandler,
  importButtonHandler,
  exportCSVButtonHandler,
  saveButtonHandler,
  singleClickEdit = false,
  rowSelection,
  onGridReady,
  getRowStyle,
  getRowClass,
  wrapHeaders = false,
  quickFilterText: externalQuickFilter,
  autoHeight = false,
  loading: externalLoading,
}) => {
  const [isPending, startTransition] = useTransition();
  const gridRef = useRef<any>(null);
  const { theme } = useTheme();
  const [currentRowData, setCurrentRowData] = useState<any[]>([]);
  const [internalQuickFilter, setInternalQuickFilter] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    if (rowData) {
      startTransition(() => {
        setCurrentRowData(
          Array.isArray(rowData)
            ? rowData.map((row, index) => ({
              ...row,
              idX: String(row.idX ?? row.id ?? index), // Ensure unique string ID
              isSelected: row.isSelected || false, // Set default selection state
            }))
            : [],
        );
      });
    }
  }, [rowData]);

  const defaultColDef = useMemo(() => {
    return {
      filter: "agTextColumnFilter",
      floatingFilter: headerFilter,
      resizable: true,
      sortable: true,
      flex: 1,
      minWidth: 100,
      wrapHeaderText: wrapHeaders ? true : undefined,
      autoHeaderHeight: wrapHeaders ? true : undefined,
      headerClass: "ag-header-cell-custom",
    };
  }, [headerFilter, wrapHeaders]);

  const gridTheme = theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine";

  const onExportClick = () => {
    if (!gridRef.current || !gridRef.current.api) return;
    const api = gridRef.current.api;
    api.exportDataAsCsv({
      fileName: showExportFileName
        ? `${showExportFileName}_${moment().format("llll")}.csv`
        : `export_${moment().format("llll")}.csv`,
      columnKeys: columnDefs
        .filter((col: { field: string }) => col.field && col.field !== "action")
        .map((col: { field: string }) => col.field),
    });
  };

  const handleGridReady = useCallback(
    (params: any) => {
      if (params.api) gridRef.current = params;
      params.api.forEachNode((node: any) => {
        if (node.data.isSelected) node.setSelected(true);
      });
      if (onGridReady) onGridReady(params);
    },
    [onGridReady],
  );

  const handleRowSelectionChange = React.useCallback((selectedRows: any[]) => {
    setCurrentRowData((prevData: any[]) =>
      prevData.map((row: { idX: any }) => ({
        ...row,
        isSelected: selectedRows.some((selected) => selected.idX === row.idX),
      })),
    );
  }, []);

  const onFirstDataRendered = React.useCallback((params: any) => {
    params.api.forEachNode((node: any) => {
      if (node.data.isSelected) node.setSelected(true);
    });
  }, []);

  return (
    <div className='w-full'>
      <div className='mb-4 flex flex-wrap justify-between items-center gap-4'>
        <div className='flex items-center gap-4 flex-wrap'>


          <div className='flex flex-wrap gap-2'>
            {showAddButton && (
              <UIButton type='button' variant='primary' size='sm' onClick={addButtonHandler}>
                {showAddButtonName || "Add"}
              </UIButton>
            )}
            {showExportCSVButton && (
              <UIButton type='button' variant='secondary' size='sm' onClick={exportCSVButtonHandler}>
                Export CSV
              </UIButton>
            )}
            {showImportButton && (
              <UIButton type='button' variant='secondary' size='sm' onClick={importButtonHandler}>
                Import
              </UIButton>
            )}
            {showExportButton && (
              <UIButton type='button' variant='secondary' size='sm' onClick={onExportClick}>
                {showExportButtonName || "Export Data"}
              </UIButton>
            )}
            {showSaveButton && (
              <UIButton type='button' variant='secondary' size='sm' onClick={saveButtonHandler}>
                {showSaveButtonName || "Save Data"}
              </UIButton>
            )}
          </div>
        </div>


      </div>

      <div
        className={`${gridTheme} rounded-lg overflow-hidden border border-gray-200 w-full mb-8`}
        style={
          autoHeight
            ? { width: "100%" }
            : currentRowData?.length > 4
            ? { height: "calc(100vh - 200px)", minHeight: "200px" }
            : { height: "calc(100vh - 200px)", maxHeight: "300px", minHeight: "200px" }
        }
      >
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={currentRowData}
          rowSelection={rowSelection === "multiple" ? "multiple" : "single"}
          headerHeight={wrapHeaders ? undefined : 40}
          domLayout={autoHeight ? "autoHeight" : "normal"}
          rowHeight={35}
          paginationPageSize={pageSize}
          pagination={pagination}
          onGridReady={handleGridReady}
          getRowClass={getRowClass}
          suppressRowHoverHighlight={false}
          singleClickEdit={singleClickEdit}
          onSelectionChanged={(event: { api: { getSelectedRows: () => any } }) => {
            const selectedRows = event.api.getSelectedRows();
            handleRowSelectionChange(selectedRows);
          }}
          loading={externalLoading ?? isPending}
          quickFilterText={externalQuickFilter || internalQuickFilter}
          stopEditingWhenCellsLoseFocus={true}
          onFirstDataRendered={onFirstDataRendered}
          getRowId={(params: { data: { idX: any } }) => params.data.idX}
          getRowStyle={(params: any) => {
            const baseStyle = { cursor: "pointer" };
            if (getRowStyle) {
              return { ...baseStyle, ...getRowStyle(params) };
            }
            return baseStyle;
          }}
        />
      </div>
    </div>
  );
};

export default DataTable;