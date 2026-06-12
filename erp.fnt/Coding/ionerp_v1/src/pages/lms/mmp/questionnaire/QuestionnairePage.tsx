/**
 * Questionnaire list page — displays all questionnaires with edit, delete, and export actions.
 * Create/edit flows navigate to QuestionnaireCreatePage.
 */

import React, { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import { SchemaColumnDefs } from "./questionnaireSchema";
import { useAxios } from "../../../../hooks/useAxios";
import { getQuestionnaireList } from "./responseInterface";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";


const QuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<getQuestionnaireList | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  
  const axiosOptions = useMemo(
  () => ({
    method: "get" as const,
    loader: true,
    shouldFetch: true,
  }),
  [],
);
  const { responseData, addItem, refetch } = useAxios<any, getQuestionnaireList[]>(
    ApiEndpoint.questionnaire.questionnaire_list,
    axiosOptions,
  );

  const displayData = useMemo(
    () => (Array.isArray(responseData) ? responseData : []),
    [responseData],
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return displayData;
    const lowerSearch = searchTerm.toLowerCase();
    return displayData.filter(
      (item) =>
        item.quiz_title?.toLowerCase().includes(lowerSearch) ||
        item.quiz_description?.toLowerCase().includes(lowerSearch),
    );
  }, [displayData, searchTerm]);

  const handleAdd = useCallback(() => {
    navigate("/lms/questionnaire/create");
  }, [navigate]);

  const handleEdit = useCallback(
    (data: getQuestionnaireList) => {
      navigate(`/lms/questionnaire/edit/${data.quiz_id}`);
    },
    [navigate],
  );

  const handleExportPdf = useCallback((item: getQuestionnaireList) => {
    // TODO: integrate export PDF API when backend is ready
    toast.info(`Export PDF for "${item.quiz_title}" will be integrated with backend`);
  }, []);

  const handleDeleteTrigger = useCallback(
    (item: getQuestionnaireList, message: string) => {
      setConfirmMessage(message);
      setDeleteId(item);
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteId) {
      const payload = {
        flag: "questionnaire",
        record_id: deleteId.quiz_id,
        status: 2,
      };

      const response = await addItem(payload, ApiEndpoint.master_soft_delete);

      if (response) {
        refetch();
      }

      setDeleteId(null);
    }
  }, [addItem, deleteId, refetch]);

  const columnDefs = useMemo(
    () => [
      ...SchemaColumnDefs.map((col) => ({
        ...col,
        flex: 1,
        minWidth: 100,
      })),
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-2 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.data)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-800"
              title="Edit questionnaire"
            />
            <FiDownload
              size={18}
              onClick={() => handleExportPdf(params.data)}
              className="cursor-pointer text-blue-600 hover:text-blue-800"
              title="Export PDF"
            />
            <MdOutlineDoNotDisturbAlt
              className="cursor-pointer text-red-600 hover:text-red-800"
              size={18}
              title="Delete questionnaire"
              onClick={() =>
                handleDeleteTrigger(
                  params.data,
                  "Are you sure you want to delete this questionnaire?",
                )
              }
            />
            {params.data.status === 1 ? (
              <FaCheckCircle
                className="cursor-pointer text-green-600 hover:text-green-800"
                size={18}
                title="Click to deactivate"
                onClick={() =>
                  handleDeleteTrigger(params.data, "Deactivate this questionnaire?")
                }
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                size={18}
                title="Click to activate"
                onClick={() =>
                  handleDeleteTrigger(params.data, "Activate this questionnaire?")
                }
              />
            )}
          </div>
        ),
        width: 120,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ],
    [handleEdit, handleExportPdf, handleDeleteTrigger],
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll,
        .ag-body-vertical-scroll {
          display: none !important;
        }
        .ag-body-viewport {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .ag-body-viewport::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>

      <div>
        <div className="flex justify-between items-center pb-5">
          <h3 className="text-lg leading-6 font-medium">Questionnaire Details</h3>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <DataTable
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={true}
          addButtonHandler={handleAdd}
          headerFilter={false}
          pageSize={filteredData.length || 10}
        />

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Confirm"
          message={confirmMessage}
        />
      </div>
    </>
  );
};

export default QuestionnairePage;
