import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
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
  questions: QuestionnaireQuestion[];
}

const getQuestionOptionLine = (option: QuestionnaireOption, index: number) =>
  `${String.fromCharCode(65 + index)}. ${option.que_option || ""}${
    option.specify_flag ? " __________ (Specify)" : ""
  }`;

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
    selectedQuestionnaire?.field_settings?.field_setting_id ??
    selectedQuestionnaire?.field_setting_id ??
    detail?.field_settings?.field_setting_id ??
    detail?.field_setting_id;
  const selectedFieldSettingDescription =
    selectedQuestionnaire?.field_settings?.field_setting_desc ||
    selectedQuestionnaire?.field_setting_desc ||
    detail?.field_settings?.field_setting_desc ||
    detail?.field_setting_desc ||
    fieldSettings.find(
      (item) =>
        normalizeFieldSettingValue(item.field_setting_id) ===
        normalizeFieldSettingValue(savedFieldSettingId),
    )?.field_setting_desc ||
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
          hookData.doc.setFont("times", "bold");
          hookData.doc.setFontSize(8.6);
          hookData.doc.text("Field Setting:", cell.x + 2.2, cell.y + 4.2);
          hookData.doc.setFont("times", "normal");
          hookData.doc.text(
            selectedFieldSettingDescription,
            cell.x + 2.2 + hookData.doc.getTextWidth("Field Setting: "),
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
    <MmpModuleShell title="Questionnaires">
      <div className="mb-14 flex items-start justify-between gap-6 px-4 pt-1">
        <div className="w-[360px]">
          <label className="mb-1.5 block text-[16px] font-normal leading-6">
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
                className="h-[34px] rounded bg-[#5cb85c] px-5 text-[15px] text-white"
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
              className="h-[34px] rounded bg-[#337ab7] px-5 text-[15px] text-white"
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
  <div className="flex flex-row items-center justify-center gap-8 whitespace-nowrap pt-1.5">
    <FaPencilAlt
      className="shrink-0 cursor-pointer text-[14px] text-[#337ab7]"
      onClick={() =>
        openQuestionEditor(question.questionnaire_que_id)
      }
    />

    <FaRegTrashAlt
  className="shrink-0 cursor-pointer text-[14px] text-[#ff0000]"
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
    </MmpModuleShell>
  );
};

export default QuestionnairePage;
