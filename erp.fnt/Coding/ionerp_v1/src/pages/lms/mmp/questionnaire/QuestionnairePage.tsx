import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCaretDown, FaFilePdf, FaPencilAlt, FaRegFileAlt, FaRegTrashAlt } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { FieldSettingOption, getQuestionnaireList } from "./responseInterface";
import { FIELD_SETTING_PLACEHOLDER } from "./questionnaireConstants";

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
  questions: QuestionnaireQuestion[];
}

const getQuestionOptionLine = (option: QuestionnaireOption, index: number) =>
  `${String.fromCharCode(65 + index)}. ${option.que_option || ""}${
    option.specify_flag ? " __________ (Specify)" : ""
  }`;

const normalizeFieldSettingDescription = (value: unknown) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue && normalizedValue !== FIELD_SETTING_PLACEHOLDER
    ? normalizedValue
    : "";
};

const formatOptions = (options: QuestionnaireOption[]) => (
  <div className="mt-1 grid grid-cols-1 gap-x-16 gap-y-1 pl-5 text-[13px] leading-6 md:grid-cols-2">
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
  const normalizeFieldSettingValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    return String(value).trim();
  };
  const selectedQuestionnaire = questionnaires.find(
    (questionnaire) => questionnaire.questionnaire_id === Number(selectedId),
  );
  const savedFieldSettingId =
    selectedQuestionnaire?.access_level ??
    selectedQuestionnaire?.field_settings?.field_setting_id ??
    selectedQuestionnaire?.field_setting_id ??
    detail?.access_level ??
    detail?.field_settings?.field_setting_id ??
    detail?.field_setting_id;
  const matchedFieldSettingOption = fieldSettings.find(
    (item) =>
      normalizeFieldSettingValue(item.field_setting_id) ===
      normalizeFieldSettingValue(savedFieldSettingId),
  );
  const selectedFieldSettingDescription =
    matchedFieldSettingOption?.field_setting_desc ||
    normalizeFieldSettingDescription(selectedQuestionnaire?.field_settings?.field_setting_desc) ||
    normalizeFieldSettingDescription(selectedQuestionnaire?.field_setting_desc) ||
    normalizeFieldSettingDescription(detail?.field_settings?.field_setting_desc) ||
    normalizeFieldSettingDescription(detail?.field_setting_desc) ||
    "";

  const loadQuestionnaireDetail = async (questionnaireId: number) => {
    const response = await axiosInstance.get<any>(
      `${ApiEndpoint.questionnaire.questionnaire_full}/${questionnaireId}`,
    );
    const nextDetail = response.data.data || null;
    setDetail(nextDetail);
    return nextDetail as QuestionnaireDetail | null;
  };

  const loadVisibleQuestionnaires = React.useCallback(async () => {
    const questionnaireResponse = await axiosInstance.get<any>(
      ApiEndpoint.questionnaire.questionnaire_list,
    );
    const questionnaireItems: getQuestionnaireList[] =
      questionnaireResponse.data.data || [];
    const detailResponses = await Promise.allSettled(
      questionnaireItems.map((questionnaire) =>
        axiosInstance.get<any>(
          `${ApiEndpoint.questionnaire.questionnaire_full}/${questionnaire.questionnaire_id}`,
        ),
      ),
    );
    const visibleQuestionnaires = questionnaireItems.filter((questionnaire, index) => {
      const detailResult = detailResponses[index];
      if (detailResult.status !== "fulfilled") {
        return true;
      }
      const questions = detailResult.value.data?.data?.questions || [];
      return Array.isArray(questions) && questions.length > 0;
    });
    setQuestionnaires(visibleQuestionnaires);
    return visibleQuestionnaires;
  }, []);

  useEffect(() => {
    Promise.all([
      loadVisibleQuestionnaires(),
      axiosInstance.get<any>(ApiEndpoint.questionnaire.field_setting_list),
    ])
      .then(([, fieldSettingResponse]) => {
        setFieldSettings(
          (Array.isArray(fieldSettingResponse.data)
            ? fieldSettingResponse.data
            : fieldSettingResponse.data?.data || []
          ).filter((item: any) => item.field_setting_id !== undefined),
        );
      })
      .catch(() => toast.error("Unable to load questionnaire list"));
  }, [loadVisibleQuestionnaires]);

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
      const refreshedDetail = await loadQuestionnaireDetail(detail.questionnaire_id);
      if (!refreshedDetail || refreshedDetail.questions.length === 0) {
        setSelectedId("");
        setDetail(null);
        setShowExport(false);
        await loadVisibleQuestionnaires();
      }
      toast.success("Question deleted successfully");
    } catch {
      toast.error("Unable to delete question");
    }
  };

  const exportPdf = async () => {
    if (!detail) return;

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 14;
    const rightMargin = 14;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const headerTextCenterX = pageWidth / 2 + 4;
    const headerLines = [
      "IonIdea Institute of Technology and Management",
      "IonIdea Institute of Technology and Management, Bangalore - Demo site",
      "Department of",
    ];
    let currentY = 15.2;

    doc.setFont("times", "normal");

    doc.setFont("times", "normal");
    doc.setFontSize(8.6);
    headerLines.forEach((line) => {
      doc.text(line, headerTextCenterX, currentY, { align: "center" });
      currentY += 4.2;
    });

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    const dividerY = currentY + 1.8;
    doc.line(leftMargin, dividerY, pageWidth - rightMargin, dividerY);

    currentY = dividerY + 8;
    doc.setFont("times", "bold");
    doc.setFontSize(10.8);
    doc.setTextColor(139, 0, 0);
    doc.text("Questionnaire Questions Report", leftMargin, currentY);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.8);
    currentY += 7;

    const drawLabelValue = (label: string, value: string) => {
      doc.setFont("times", "bold");
      doc.text(label, leftMargin, currentY);
      const labelWidth = doc.getTextWidth(label);
      const valueLines = doc.splitTextToSize(
        value || "",
        Math.max(contentWidth - labelWidth - 2, 20),
      );

      doc.setFont("times", "normal");
      doc.text(valueLines.length ? valueLines : [""], leftMargin + labelWidth + 2, currentY);
      currentY += Math.max(valueLines.length, 1) * 4.6;
    };

    drawLabelValue("Questionnaire Title:", detail.questionnaire_name || "");
    drawLabelValue("Message to Mentees:", detail.message_to_mentees || "");

    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      margin: { left: leftMargin, right: rightMargin, bottom: 14 },
      theme: "grid",
      head: [["Q. No.", "Questions"]],
      body: [
        ...(selectedFieldSettingDescription
          ? [[{ content: `Field Setting: ${selectedFieldSettingDescription}`, colSpan: 2 }]]
          : []),
        ...questions.map((question, index) => {
          const optionLines = (question.options || []).map(getQuestionOptionLine);
          const questionText = [question.question, ...(optionLines.length ? ["", ...optionLines] : [])]
            .filter((line) => line !== undefined && line !== null)
            .join("\n");

          return [String(index + 1), questionText];
        }),
      ],
      styles: {
        font: "times",
        fontSize: 8.6,
        textColor: [0, 0, 0],
        lineColor: [190, 190, 190],
        lineWidth: 0.2,
        overflow: "linebreak",
        cellPadding: { top: 1.6, right: 2.2, bottom: 1.6, left: 2.2 },
        valign: "top",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        lineColor: [190, 190, 190],
        lineWidth: 0.2,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: contentWidth - 20 },
      },
      didParseCell: (hookData) => {
        if (selectedFieldSettingDescription && hookData.section === "body" && hookData.row.index === 0) {
          hookData.cell.text = [""];
          hookData.cell.styles.fontStyle = "normal";
          hookData.cell.styles.cellPadding = { top: 1.4, right: 2.2, bottom: 1.4, left: 2.2 };
        }
      },
      didDrawCell: (hookData) => {
        if (selectedFieldSettingDescription && hookData.section === "body" && hookData.row.index === 0) {
          const { cell } = hookData;
          hookData.doc.setFontSize(8.6);
          hookData.doc.text(
            `Field Setting: ${selectedFieldSettingDescription}`,
            cell.x + 2.2,
            cell.y + 4.2,
          );
        }
      },
      rowPageBreak: "avoid",
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
    <section className="min-h-[540px] w-full min-w-0 overflow-x-hidden rounded-md border border-gray-200 bg-white p-3 shadow-md md:p-4">
      <div className="mb-3 flex items-center justify-between rounded-tl-[20px] rounded-tr-none rounded-br-[20px] rounded-bl-none bg-slate-800 px-5 py-[5px] text-white">
        <h2 className="text-[18px] font-semibold leading-6">Questionnaires</h2>
      </div>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 px-2 pt-0.5">
        <div className="w-full max-w-[340px]">
          <label className="mb-1 block text-[14px] font-normal leading-5 text-slate-800">
            Questionnaire Title: <span className="text-red-500">*</span>
          </label>
          <select
            className="h-[34px] w-full rounded border border-gray-300 px-3 text-[13px] text-slate-700"
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
          <div className="flex items-center gap-3 pr-1 pt-[22px]">
            <div className="relative">
              <button
                className="inline-flex h-[32px] items-center gap-1.5 rounded bg-[#5cb85c] px-3.5 text-[13px] font-medium text-white"
                onClick={() => setShowExport(!showExport)}
              >
                <FaRegFileAlt className="text-[12px]" />
                <span>Export</span>
                <FaCaretDown className="text-[12px]" />
              </button>
              {showExport && (
                <button
                  className="absolute right-0 top-[36px] inline-flex h-[34px] w-[94px] items-center gap-2 rounded border border-gray-200 bg-white px-3 text-left text-[13px] text-gray-700 shadow-md"
                  onClick={exportPdf}
                >
                  <FaFilePdf className="text-[13px] text-red-600" />
                  .pdf
                </button>
              )}
            </div>
            <button
              className="h-[32px] rounded bg-[#337ab7] px-4 text-[13px] font-medium text-white"
              onClick={openSelectedQuestionnaire}
            >
              Add More Questions
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto px-2">
      <table className="w-full min-w-[780px] border-collapse border border-gray-300 text-[13px] text-slate-800">
        <thead className="bg-white">
          <tr>
            <th className="w-[72px] border border-gray-300 px-4 py-2.5 text-left font-semibold">Q.No.</th>
            <th className="border border-gray-300 px-4 py-2.5 text-left font-semibold">Questions</th>
            <th className="w-[128px] border border-gray-300 px-4 py-2.5 text-left font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {!detailVisible && (
            <tr>
              <td className="border border-gray-300 px-4 py-3" colSpan={3}>
                No Data to display
              </td>
            </tr>
          )}
          {detailVisible && (
            <tr className="bg-sky-100">
              <td className="border border-gray-300 px-4 py-2 text-[13px] align-middle" colSpan={3}>
                <span className="font-semibold">Field Setting:</span>{" "}
                {selectedFieldSettingDescription}
              </td>
            </tr>
          )}
          {detailVisible &&
            questions.map((question, index) => (
              <tr key={question.questionnaire_que_id}>
                <td className="border border-gray-300 px-4 py-3 text-center align-top leading-6">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-4 py-3 align-top text-[13px] leading-6">
  <div className="pr-3">{question.question}</div>
  {formatOptions(question.options)}
</td>

<td className="border border-gray-300 px-4 py-3 align-top">
  <div className="flex flex-row items-center justify-center gap-6 whitespace-nowrap pt-1">
    <FaPencilAlt
      className="shrink-0 cursor-pointer text-[13px] text-[#337ab7]"
      onClick={() =>
        openQuestionEditor(question.questionnaire_que_id)
      }
    />

    <FaRegTrashAlt
  className="shrink-0 cursor-pointer text-[13px] text-[#ff0000]"
  onClick={() =>
    handleDeleteQuestion(question.questionnaire_que_id)
  }
/>
  </div>
</td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>
    </section>
  );
};

export default QuestionnairePage;
