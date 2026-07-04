import React, { useEffect, useMemo, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import MmpModuleShell from "../components/MmpModuleShell";

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type TermRecord = {
  semester_id?: number | string;
  term_id?: number | string;
  id?: number | string;
  semester_desc?: string;
  term_name?: string;
  semester?: number | string;
  label?: string;
  value?: number | string;
};

type TermOption = {
  value: string;
  label: string;
};

type ReportFormState = {
  reportTitle: string;
  counsellingDate: Date | null;
  purposeOfMeeting: string;
  observationsAndActionTaken: string;
  parentsCommunication: "yes" | "no";
  higherAuthoritiesCommunication: "yes" | "no";
  menteeSignatureWithDate: string;
  mentorSignatureWithDate: string;
};

type FieldErrors = Partial<Record<"reportTitle" | "counsellingDate" | "purposeOfMeeting" | "observationsAndActionTaken", string>>;

const inputClassName =
  "form-control rounded border border-gray-300 px-3 text-[13px] font-normal text-gray-900 outline-none transition";

const reportOptions = [
  { value: "", label: "Select Report" },
  { value: "create-report", label: "Create Report" },
];

const createInitialFormState = (): ReportFormState => ({
  reportTitle: "",
  counsellingDate: null,
  purposeOfMeeting: "",
  observationsAndActionTaken: "",
  parentsCommunication: "no",
  higherAuthoritiesCommunication: "no",
  menteeSignatureWithDate: "",
  mentorSignatureWithDate: "",
});

const getErrorMessage = (error: ApiError, fallback: string) =>
  error.response?.data?.message || fallback;

const normalizeTermOption = (term: TermRecord): TermOption | null => {
  const value = term.term_id ?? term.semester_id ?? term.id ?? term.value;
  const label =
    term.term_name?.toString().trim() ||
    term.semester_desc?.toString().trim() ||
    term.label?.toString().trim() ||
    term.semester?.toString().trim() ||
    "";

  if (value == null || !label) {
    return null;
  }

  return {
    value: String(value),
    label,
  };
};

const stripEditorText = (value: string) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const isEditorEmpty = (value: string) => stripEditorText(value).length === 0;

const getEditorCharacterCount = (value: string) => stripEditorText(value).length;

const IssueObservationReportPage: React.FC = () => {
  const [studentUsnInput, setStudentUsnInput] = useState("");
  const [selectedStudentUsn, setSelectedStudentUsn] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [termOptions, setTermOptions] = useState<TermOption[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [formState, setFormState] = useState<ReportFormState>(createInitialFormState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const selectedTermLabel = useMemo(
    () => termOptions.find((term) => term.value === selectedTerm)?.label || "",
    [selectedTerm, termOptions],
  );

  const shouldShowCreateForm = selectedReport === "create-report";
  const purposeCount = getEditorCharacterCount(formState.purposeOfMeeting);
  const observationsCount = getEditorCharacterCount(formState.observationsAndActionTaken);
  const hasVerifiedSaveApi = false;
  const hasVerifiedHistoryApi = false;
  const mentorName = "";

  const resetReportForm = () => {
    setFormState(createInitialFormState());
    setFieldErrors({});
    setIsHistoryOpen(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadTerms = async () => {
      try {
        setIsLoadingTerms(true);
        const response = await axiosInstance.get<ApiEnvelope<TermRecord[]>>(
          ApiEndpoint.mentorMentee.terms,
          {
            validateStatus: () => true,
          },
        );

        if (!isMounted) {
          return;
        }

        const nextTerms =
          response.status === 200
            ? (response.data?.data ?? [])
                .map(normalizeTermOption)
                .filter((term): term is TermOption => term !== null)
            : [];

        setTermOptions(nextTerms);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }
        setTermOptions([]);
        toast.error(getErrorMessage(error, "Unable to load applicable terms"));
      } finally {
        if (isMounted) {
          setIsLoadingTerms(false);
        }
      }
    };

    void loadTerms();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStudentEnter = () => {
    const normalizedUsn = studentUsnInput.trim();
    if (!normalizedUsn) {
      toast.error("Student USN is required");
      return;
    }

    if (normalizedUsn !== selectedStudentUsn) {
      setSelectedStudentUsn(normalizedUsn);
      resetReportForm();
    }
  };

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);
    resetReportForm();
  };

  const handleReportChange = (value: string) => {
    setSelectedReport(value);
    resetReportForm();
  };

  const updateFormField = <K extends keyof ReportFormState>(
    field: K,
    value: ReportFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleEditorChange = (
    field: "purposeOfMeeting" | "observationsAndActionTaken",
    value: string,
  ) => {
    if (getEditorCharacterCount(value) > 2000) {
      return;
    }

    updateFormField(field, value);
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!selectedStudentUsn) {
      toast.error("Please enter a valid Student USN");
      return false;
    }

    if (!selectedTerm) {
      toast.error("Please select a term");
      return false;
    }

    if (!formState.reportTitle.trim()) {
      nextErrors.reportTitle = "Report Title is required";
    }

    if (!formState.counsellingDate) {
      nextErrors.counsellingDate = "Counselling Date is required";
    }

    if (isEditorEmpty(formState.purposeOfMeeting)) {
      nextErrors.purposeOfMeeting = "Purpose of meeting / Issue reported is required";
    }

    if (isEditorEmpty(formState.observationsAndActionTaken)) {
      nextErrors.observationsAndActionTaken =
        "Observations and Action Taken is required";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (!hasVerifiedSaveApi) {
      toast.error(
        "Save is unavailable because no verified Issue & Observation report save API exists in the current frontend service",
      );
      return;
    }
  };

  return (
    <div className="issue-observation-report-page">
      <style>
        {`
          .issue-observation-report-page section {
            min-height: 532px;
          }

          .issue-observation-report-page section > div:first-child {
            margin-top: 8px;
            margin-left: -10px;
            margin-right: 10px;
            margin-bottom: 0;
            min-height: 34px;
            height: 34px;
            padding: 0 20px;
            border-top-left-radius: 22px;
            border-bottom-right-radius: 22px;
          }

          .issue-observation-report-page section > div:first-child h2 {
            font-size: 18px;
            font-weight: 400 !important;
            line-height: 1.2;
          }

          @media (min-width: 768px) {
            .issue-observation-report-page .issue-observation-form-row {
              margin-top: 29px;
              margin-left: -3px;
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 310px)) !important;
              column-gap: 30px !important;
              row-gap: 0 !important;
              align-items: start !important;
              width: 990px !important;
              max-width: 100% !important;
              justify-content: start !important;
            }

            .issue-observation-report-page .issue-observation-form-row > div {
              width: 310px !important;
              min-width: 310px !important;
              max-width: 310px !important;
            }
          }

          .issue-observation-report-page .issue-observation-form-row,
          .issue-observation-report-page .issue-observation-form-row > div,
          .issue-observation-report-page .issue-observation-form-row input,
          .issue-observation-report-page .issue-observation-form-row select,
          .issue-observation-report-page .issue-observation-form-row .student-usn-control {
            width: 310px;
            min-width: 310px;
            max-width: 310px;
            height: 34px;
            min-height: 34px;
            box-sizing: border-box;
          }

          .issue-observation-report-page .issue-observation-form-row {
            height: auto;
          }

          .issue-observation-report-page .issue-observation-form-row > div {
            height: auto;
          }

          .issue-observation-report-page .student-usn-control input,
          .issue-observation-report-page .student-usn-control input:focus {
            border: 0 !important;
            box-shadow: none !important;
          }

          .issue-observation-report-page input:focus,
          .issue-observation-report-page select:focus,
          .issue-observation-report-page [role="combobox"]:focus,
          .issue-observation-report-page [role="combobox"]:focus-within,
          .issue-observation-report-page .react-datepicker-wrapper input:focus {
            border-color: #66afe9 !important;
            outline: 0 !important;
            box-shadow:
              inset 0 1px 1px rgba(0, 0, 0, 0.075),
              0 0 8px rgba(102, 175, 233, 0.6) !important;
          }

          .issue-observation-report-page .react-datepicker-wrapper,
          .issue-observation-report-page .react-datepicker__input-container {
            display: block;
            width: 100%;
          }

          .issue-observation-report-page .tox-tinymce {
            border-color: #d1d5db;
            border-radius: 0.375rem;
          }
        `}
      </style>

      <MmpModuleShell title="Issues and Observations Report">
        <div className="issue-observation-form-row grid grid-cols-1 items-start gap-7 md:grid-cols-3">
          <div className="min-w-0 self-start">
            <label className="mb-[6px] block text-[13px] font-semibold text-black">
              Student USN: <span className="text-red-500">*</span>
            </label>
            <div
              className="student-usn-control relative rounded border border-gray-300"
              role="combobox"
              aria-controls="issue-observation-student-options"
              aria-expanded={false}
            >
              <input
                value={studentUsnInput}
                onChange={(event) => setStudentUsnInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleStudentEnter();
                  }
                }}
                className={`${inputClassName} border-0 bg-transparent focus:border-transparent`}
                placeholder="Type USN..."
                aria-label="Student USN"
                aria-autocomplete="list"
              />
            </div>
            <p className="mt-[4px] text-[12px] font-normal text-black">
              Press 'Enter' key after typing USN.
            </p>
          </div>

          <div className="min-w-0 self-start">
            <label className="mb-[6px] block text-[13px] font-semibold text-black">
              Term: <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClassName}
              value={selectedTerm}
              onChange={(event) => handleTermChange(event.target.value)}
              aria-label="Term"
              disabled={isLoadingTerms}
            >
              <option value="">Select Term</option>
              {termOptions.map((term) => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 self-start">
            <label className="mb-[6px] block text-[13px] font-semibold text-black">
              Report: <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClassName}
              value={selectedReport}
              onChange={(event) => handleReportChange(event.target.value)}
              aria-label="Report"
            >
              {reportOptions.map((report) => (
                <option key={report.value || "empty"} value={report.value}>
                  {report.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {shouldShowCreateForm && (
          <div className="mt-10 space-y-8">
            <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center">
              <label className="text-[13px] font-semibold text-black">
                Report Title: <span className="text-red-500">*</span>
              </label>
              <div>
                <input
                  type="text"
                  value={formState.reportTitle}
                  onChange={(event) => updateFormField("reportTitle", event.target.value)}
                  className={`${inputClassName} h-[42px] w-full max-w-none`}
                  aria-label="Report Title"
                />
                {fieldErrors.reportTitle && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.reportTitle}</p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded border border-gray-300">
              <div className="grid grid-cols-1 border-b border-gray-300 md:grid-cols-[220px_minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  USN:
                </div>
                <div className="border-b border-gray-300 px-4 py-3 text-[13px] text-black md:border-b-0 md:border-r">
                  {selectedStudentUsn}
                </div>
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Mentor:
                </div>
                <div className="px-4 py-3 text-[13px] text-black">{mentorName}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Counselling Date: <span className="text-red-500">*</span>
                </div>
                <div className="border-b border-gray-300 px-4 py-3 md:border-b-0 md:border-r">
                  <DatePicker
                    selected={formState.counsellingDate}
                    onChange={(date) => updateFormField("counsellingDate", date)}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="DD-MM-YYYY"
                    className={`${inputClassName} h-[42px] w-full max-w-none`}
                    aria-label="Counselling Date"
                  />
                  {fieldErrors.counsellingDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.counsellingDate}
                    </p>
                  )}
                </div>
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Term:
                </div>
                <div className="px-4 py-3 text-[13px] text-black">{selectedTermLabel}</div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-black">
                Purpose of meeting / Issue reported:{" "}
                <span className="text-red-500">*</span>
              </label>
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formState.purposeOfMeeting}
                onEditorChange={(value) => handleEditorChange("purposeOfMeeting", value)}
                init={{
                  height: 240,
                  menubar: false,
                  statusbar: false,
                  plugins: ["lists", "link"],
                  toolbar:
                    "undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | link",
                  content_style: "body { font-family: Arial, sans-serif; font-size: 13px; }",
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                {fieldErrors.purposeOfMeeting ? (
                  <p className="text-xs text-red-600">{fieldErrors.purposeOfMeeting}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-600">{purposeCount}/2000</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-black">
                Observations and Action Taken: <span className="text-red-500">*</span>
              </label>
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formState.observationsAndActionTaken}
                onEditorChange={(value) =>
                  handleEditorChange("observationsAndActionTaken", value)
                }
                init={{
                  height: 240,
                  menubar: false,
                  statusbar: false,
                  plugins: ["lists", "link"],
                  toolbar:
                    "undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | link",
                  content_style: "body { font-family: Arial, sans-serif; font-size: 13px; }",
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                {fieldErrors.observationsAndActionTaken ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.observationsAndActionTaken}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-600">{observationsCount}/2000</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
              <label className="text-[13px] font-semibold text-black">
                Has the issue been communicated and discussed with parents?
              </label>
              <select
                value={formState.parentsCommunication}
                onChange={(event) =>
                  updateFormField(
                    "parentsCommunication",
                    event.target.value as ReportFormState["parentsCommunication"],
                  )
                }
                className={`${inputClassName} h-[42px] w-full max-w-none`}
                aria-label="Communicated with parents"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
              <label className="text-[13px] font-semibold text-black">
                Has the issue been communicated and discussed with higher authorities?
              </label>
              <select
                value={formState.higherAuthoritiesCommunication}
                onChange={(event) =>
                  updateFormField(
                    "higherAuthoritiesCommunication",
                    event.target.value as ReportFormState["higherAuthoritiesCommunication"],
                  )
                }
                className={`${inputClassName} h-[42px] w-full max-w-none`}
                aria-label="Communicated with higher authorities"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-black">
                  Mentee Signature with Date
                </label>
                <input
                  type="text"
                  value={formState.menteeSignatureWithDate}
                  readOnly
                  className={`${inputClassName} h-[42px] w-full max-w-none bg-gray-50`}
                  aria-label="Mentee Signature with Date"
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-black">
                  Mentor Signature with Date
                </label>
                <input
                  type="text"
                  value={formState.mentorSignatureWithDate}
                  readOnly
                  className={`${inputClassName} h-[42px] w-full max-w-none bg-gray-50`}
                  aria-label="Mentor Signature with Date"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <UIButton
                onClick={handleSave}
                className="bg-[#337ab7] px-5 py-2 text-[13px] text-white hover:bg-[#286090]"
                title={
                  hasVerifiedSaveApi
                    ? "Save"
                    : "Save is unavailable because no verified Issue & Observation report save API exists in the current frontend service"
                }
              >
                Save
              </UIButton>
            </div>

            <div className="rounded border border-gray-200">
              <button
                type="button"
                onClick={() => setIsHistoryOpen((current) => !current)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-semibold text-[#337ab7]"
              >
                {isHistoryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>History</span>
              </button>
              {isHistoryOpen && (
                <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600">
                  {hasVerifiedHistoryApi
                    ? null
                    : "History is unavailable because no verified Issue & Observation report history API exists in the current frontend service."}
                </div>
              )}
            </div>
          </div>
        )}
      </MmpModuleShell>
    </div>
  );
};

export default IssueObservationReportPage;
