import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoPencil, GoTrash } from "react-icons/go";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import MmpModuleShell from "../components/MmpModuleShell";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { FieldSettingOption, getQuestionnaireList } from "./responseInterface";

interface QuestionnaireOption {
  questionnaire_options_id: number;
  que_option: string;
  specify_flag: boolean;
}

interface QuestionnaireQuestion {
  questionnaire_que_id: number;
  que_no: number;
  question: string;
  options: QuestionnaireOption[];
}

interface QuestionnaireDetail extends getQuestionnaireList {
  field_setting_id?: number | null;
  field_setting_desc?: string;
  field_settings?: {
    field_setting_id?: number | null;
    field_setting_desc?: string;
  };
  questions: QuestionnaireQuestion[];
}

const formatOptions = (options: QuestionnaireOption[]) => (
  <div className="mt-1 grid grid-cols-1 gap-x-20 gap-y-1.5 pl-6 text-[15px] leading-7 md:grid-cols-2">
    {(options || []).map((option, index) => (
      <span key={option.questionnaire_options_id || index} className="whitespace-pre-wrap">
        {String.fromCharCode(65 + index)}. {option.que_option}
        {option.specify_flag ? "__________(Specify)" : ""}
      </span>
    ))}
  </div>
);

const QuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState("");
  const [questionnaires, setQuestionnaires] = useState<getQuestionnaireList[]>([]);
  const [detail, setDetail] = useState<QuestionnaireDetail | null>(null);
  const [fieldSettings, setFieldSettings] = useState<FieldSettingOption[]>([]);
  const [showExport, setShowExport] = useState(false);
  const questions = detail?.questions || [];
  const detailVisible = Boolean(detail);
  const selectedFieldSettingDescription =
    detail?.field_settings?.field_setting_desc ||
    detail?.field_setting_desc ||
    fieldSettings.find(
      (item) =>
        item.field_setting_id ===
        (detail?.field_settings?.field_setting_id ?? detail?.field_setting_id),
    )?.field_setting_desc ||
    "";

  const loadQuestionnaireDetail = async (questionnaireId: number) => {
    const response = await axiosInstance.get<any>(
      `${ApiEndpoint.questionnaire.questionnaire_full}/${questionnaireId}`,
    );
    setDetail(response.data.data || null);
  };

  useEffect(() => {
    Promise.all([
      axiosInstance.get<any>(ApiEndpoint.questionnaire.questionnaire_list),
      axiosInstance.get<any>(ApiEndpoint.questionnaire.field_setting_list),
    ])
      .then(([questionnaireResponse, fieldSettingResponse]) => {
        setQuestionnaires(questionnaireResponse.data.data || []);
        setFieldSettings(
          (Array.isArray(fieldSettingResponse.data)
            ? fieldSettingResponse.data
            : fieldSettingResponse.data?.data || []
          ).filter((item: any) => item.status === 1),
        );
      })
      .catch(() => toast.error("Unable to load questionnaire list"));
  }, []);

  const selectedQuestionnaire = questionnaires.find(
    (questionnaire) => questionnaire.questionnaire_id === Number(selectedId),
  );

  const handleSelect = async (value: string) => {
    if (value === "create") {
      navigate("/lms_mmp/questionnaire/create");
      return;
    }
    setSelectedId(value);
    setShowExport(false);
    if (!value) {
      setDetail(null);
      return;
    }
    const questionnaireId = Number(value);
    if (!Number.isInteger(questionnaireId)) return;
    try {
      await loadQuestionnaireDetail(questionnaireId);
    } catch {
      toast.error("Unable to load questionnaire data");
    }
  };

  const handleDeleteQuestion = async (questionnaireQueId: number) => {
    if (!detail?.questionnaire_id) return;
    const confirmed = window.confirm("Are you sure you want to delete this question?");
    if (!confirmed) return;

    try {
      const response = await axiosInstance.delete<any>(
        `${ApiEndpoint.questionnaire.delete_question}/${questionnaireQueId}`,
      );
      if (!response.data.status) {
        throw new Error(response.data.message || "Unable to delete question");
      }
      await loadQuestionnaireDetail(detail.questionnaire_id);
      toast.success("Question deleted successfully");
    } catch {
      toast.error("Unable to delete question");
    }
  };

  const exportPdf = () => {
    if (!detail) return;
    const doc = new jsPDF();
    doc.text(detail.questionnaire_name, 14, 16);
    doc.setFontSize(10);
    doc.text(detail.message_to_mentees || "", 14, 24);
    autoTable(doc, {
      startY: 34,
      head: [["Q.No.", "Questions"]],
      body: questions.map((question, index) => [
        index + 1,
        `${question.question}\n${question.options.map((option) => option.que_option).join("    ")}`,
      ]),
    });
    doc.save(`${detail.questionnaire_name}.pdf`);
    setShowExport(false);
  };

  const openSelectedQuestionnaire = () => {
    if (!selectedQuestionnaire) return;
    navigate(`/lms_mmp/questionnaire/edit/${selectedQuestionnaire.questionnaire_id}`);
  };

  const openQuestionEditor = (questionnaireQueId: number) => {
    if (!selectedQuestionnaire) return;
    navigate(
      `/lms_mmp/questionnaire/edit/${selectedQuestionnaire.questionnaire_id}?questionId=${questionnaireQueId}`,
    );
  };

  return (
    <MmpModuleShell title="Questionnaires">
      <div className="mb-14 flex items-start justify-between gap-6 px-4 pt-1">
        <div className="w-[360px]">
          <label className="mb-1.5 block text-[15px] leading-6">
            Questionnaire Title: <span className="text-red-500">*</span>
          </label>
          <select
            className="h-[38px] w-full rounded border border-gray-300 px-4 text-[15px]"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">Select Questionnaire</option>
            <option value="create">Create Questionnaire</option>
            {questionnaires.map((questionnaire) => (
              <option
                key={questionnaire.questionnaire_id}
                value={questionnaire.questionnaire_id}
              >
                {questionnaire.questionnaire_name}
              </option>
            ))}
          </select>
        </div>

        {detailVisible && (
          <div className="flex items-start gap-[84px] pt-11 pr-2">
            <div className="relative">
              <button
                className="h-[34px] rounded bg-green-500 px-5 text-[15px] text-white"
                onClick={() => setShowExport(!showExport)}
              >
                Export v
              </button>
              {showExport && (
                <button
                  className="absolute right-0 top-10 w-28 rounded border bg-white px-4 py-3 text-left text-sm shadow"
                  onClick={exportPdf}
                >
                  .pdf
                </button>
              )}
            </div>
            <button
              className="h-[34px] rounded bg-blue-600 px-5 text-[15px] text-white"
              onClick={openSelectedQuestionnaire}
            >
              Add More Questions
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto px-4">
      <table className="w-full min-w-[820px] border-collapse border border-gray-300 text-[15px]">
        <thead className="bg-white">
          <tr>
            <th className="w-[76px] border border-gray-300 px-5 py-4 text-left font-semibold">Q.No.</th>
            <th className="border border-gray-300 px-4 py-4 text-left font-semibold">Questions</th>
            <th className="w-[152px] border border-gray-300 px-4 py-4 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {!detailVisible && (
            <tr>
              <td className="border border-gray-300 px-4 py-4" colSpan={3}>
                No Data to display
              </td>
            </tr>
          )}
          {detailVisible && (
            <tr className="bg-sky-100">
              <td className="border border-gray-300 px-4 py-[11px] text-[15px]" colSpan={3}>
                <span className="font-semibold">Field Setting:</span>{" "}
                {selectedFieldSettingDescription}
              </td>
            </tr>
          )}
          {detailVisible &&
            questions.map((question, index) => (
              <tr key={question.questionnaire_que_id}>
                <td className="border border-gray-300 px-4 py-4 text-center align-top leading-7">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-4 py-4 align-top text-[15px] leading-7">
                  <div className="pr-4">{question.question}</div>
                  {formatOptions(question.options)}
                </td>
                <td className="border border-gray-300 px-4 py-4 align-top">
                  <div className="flex justify-center gap-8 pt-1.5">
                    <GoPencil
                      className="mt-0.5 cursor-pointer text-[16px] text-blue-600"
                      onClick={() => openQuestionEditor(question.questionnaire_que_id)}
                    />
                    <GoTrash
                      className="mt-0.5 cursor-pointer text-[16px] text-red-600"
                      onClick={() =>
                        handleDeleteQuestion(question.questionnaire_que_id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>
    </MmpModuleShell>
  );
};

export default QuestionnairePage;
