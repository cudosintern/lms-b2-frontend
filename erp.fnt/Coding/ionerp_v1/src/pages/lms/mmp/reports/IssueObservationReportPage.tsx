import React, { useMemo, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import DatePicker from "react-datepicker";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { useAuth } from "../../../../hooks/useAuth";
import { LocalStorageHelper } from "../../../../utils/localStorageHelper";
import { loginData } from "../../../login/loginModel";
import MmpModuleShell from "../components/MmpModuleShell";
import {
  deleteIssueObservation,
  IssueObservationHistoryItem,
  IssueObservationReportDetail,
  IssueObservationReportListItem,
  IssueObservationStudent,
  getIssueObservationDetail,
  getIssueObservationHistory,
  getIssueObservationReports,
  getStudentByUsn,
  mentorAgreeIssueObservation,
  saveIssueObservation,
} from "./issueObservationReportApi";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
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

type FieldErrors = Partial<
  Record<
    | "reportTitle"
    | "counsellingDate"
    | "purposeOfMeeting"
    | "observationsAndActionTaken",
    string
  >
>;

const AUTH_COOKIE_KEY = "auth_state";

const inputClassName =
  "form-control rounded border border-gray-300 px-3 text-[13px] font-normal text-gray-900 outline-none transition";

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

const createTermOption = (semesterId?: number | string | null): TermOption[] => {
  if (semesterId == null || semesterId === "") {
    return [];
  }

  return [
    {
      value: String(semesterId),
      label: String(semesterId),
    },
  ];
};

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB");
};

const createReportOptionLabel = (report: IssueObservationReportListItem) =>
  report.report_title?.trim() || String(report.lms_isnob_id);

const applyLinkDialogDemoUi = () => {
  let attemptCount = 0;

  const syncDialogUi = () => {
    const dialogTitle = Array.from(document.querySelectorAll(".tox-dialog__title")).find(
      (titleNode) => /link/i.test(titleNode.textContent || ""),
    );

    if (!dialogTitle) {
      return false;
    }

    dialogTitle.textContent = "Insert link";

    const dialogElement = dialogTitle.closest(".tox-dialog");
    if (!dialogElement) {
      return false;
    }

    dialogElement.classList.add("issue-observation-link-dialog");
    dialogElement.closest(".tox-dialog-wrap")?.classList.add(
      "issue-observation-link-dialog-wrap",
    );

    const labels = Array.from(
      dialogElement.querySelectorAll(".tox-form__group label, .tox-form__group .tox-label"),
    );
    const expectedLabels = ["Url", "Text to display", "Title", "Target"];

    labels.slice(0, expectedLabels.length).forEach((labelNode, index) => {
      labelNode.textContent = expectedLabels[index];
    });

    const footerButtons = Array.from(
      dialogElement.querySelectorAll(".tox-dialog__footer .tox-button"),
    );
    footerButtons.forEach((buttonNode) => {
      const buttonText = (buttonNode.textContent || "").trim().toLowerCase();

      if (buttonText === "save") {
        buttonNode.textContent = "Ok";
      }

      if (buttonText === "cancel") {
        buttonNode.textContent = "Cancel";
      }
    });

    return true;
  };

  const applyWithRetry = () => {
    if (syncDialogUi() || attemptCount >= 10) {
      return;
    }

    attemptCount += 1;
    window.setTimeout(applyWithRetry, 40);
  };

  applyWithRetry();
};

const createEditorInit = () => ({
  height: 170,
  menubar: false,
  statusbar: false,
  plugins: ["lists", "link"],
  toolbar:
    "undo redo | styles | bold italic | alignleft aligncenter alignright | bullist numlist | outdent indent | link",
  toolbar_mode: "wrap" as const,
  link_title: true,
  link_target_list: [
    { title: "None", value: "" },
    { title: "New window", value: "_blank" },
  ],
  style_formats: [
    {
      title: "Headings",
      items: [
        { title: "Heading 1", block: "h1" },
        { title: "Heading 2", block: "h2" },
        { title: "Heading 3", block: "h3" },
        { title: "Heading 4", block: "h4" },
        { title: "Heading 5", block: "h5" },
        { title: "Heading 6", block: "h6" },
      ],
    },
    {
      title: "Inline",
      items: [
        { title: "Bold", format: "bold" },
        { title: "Italic", format: "italic" },
        { title: "Underline", format: "underline" },
        { title: "Strikethrough", format: "strikethrough" },
        { title: "Superscript", format: "superscript" },
        { title: "Subscript", format: "subscript" },
        { title: "Code", format: "code" },
      ],
    },
    {
      title: "Blocks",
      items: [
        { title: "Paragraph", block: "p" },
        { title: "Blockquote", block: "blockquote" },
        { title: "Div", block: "div" },
        { title: "Pre", block: "pre" },
      ],
    },
    {
      title: "Alignment",
      items: [
        { title: "Left", format: "alignleft" },
        { title: "Center", format: "aligncenter" },
        { title: "Right", format: "alignright" },
        { title: "Justify", format: "alignjustify" },
      ],
    },
  ],
  content_style: "body { font-family: Arial, sans-serif; font-size: 13px; }",
  setup: (editor: any) => {
    editor.on("OpenWindow", () => {
      applyLinkDialogDemoUi();
    });
  },
});

const AGREED_STATUS = 1;
// Temporary fallback approved by mentor until login/auth_state returns real user id.
const TEMP_MENTOR_USERS_ID = 2281;
const MENTOR_SIGNATURE_DATE_FIELD_CANDIDATES = [
  "mentor_signature_date",
  "mentor_agree_date",
  "mentor_status_date",
  "mentor_signed_date",
  "mentor_agreed_date",
  "mentor_signature_at",
  "mentor_agree_at",
  "mentor_status_at",
  "mentor_signed_at",
  "mentor_agreed_at",
] as const;

const toPositiveNumber = (value: unknown): number | null => {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const getProfileObject = (profile: loginData["profile"]) => {
  if (!profile) {
    return null;
  }

  if (typeof profile !== "string") {
    return null;
  }

  try {
    const parsedProfile = JSON.parse(profile);
    return parsedProfile && typeof parsedProfile === "object" ? parsedProfile : null;
  } catch {
    return null;
  }
};

const getAgreementDateValue = (
  source: Record<string, unknown> | null | undefined,
  fieldCandidates: readonly string[],
) => {
  if (!source) {
    return null;
  }

  for (const fieldName of fieldCandidates) {
    const fieldValue = source[fieldName];
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue;
    }
  }

  return null;
};

const unwrapStoredValue = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>) &&
    "expiry" in (value as Record<string, unknown>)
  ) {
    return (value as Record<string, unknown>).value;
  }

  return value;
};

const getTokenPayload = (token: string) => {
  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const normalizedPayload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = window.atob(paddedPayload);
    const parsedPayload = JSON.parse(decodedPayload);
    return parsedPayload && typeof parsedPayload === "object" ? parsedPayload : null;
  } catch {
    return null;
  }
};

const resolveMentorUserId = (authState: loginData | null) => {
  const authStateValue = unwrapStoredValue(authState);
  const objectFieldCandidates = [
    "id",
    "user_id",
    "users_id",
    "userId",
    "userid",
    "value.id",
    "value.user_id",
    "value.users_id",
    "value.userId",
    "value.userid",
    "profile.id",
    "profile.user_id",
    "profile.users_id",
    "profile.userId",
    "user.id",
    "user.user_id",
    "user.users_id",
    "user.userId",
  ];
  const tokenClaimCandidates = [
    "id",
    "user_id",
    "users_id",
    "userId",
    "userid",
    "sub",
  ];

  const getPathValue = (source: unknown, path: string): unknown => {
    return path.split(".").reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[segment];
    }, source);
  };

  const objectSources: Array<{ source: string; value: unknown }> = [
    { source: "auth_state", value: authState },
    { source: "auth_state.value", value: authStateValue },
    { source: "auth_state.profile", value: getProfileObject(authState?.profile) },
  ];
  const tokenSources: Array<{ source: string; token: string }> = [];

  if (authState?.access_token) {
    tokenSources.push({ source: "auth_state.access_token", token: authState.access_token });
  }
  const nestedAccessToken = getPathValue(authState, "value.access_token");
  if (typeof nestedAccessToken === "string") {
    tokenSources.push({ source: "auth_state.value.access_token", token: nestedAccessToken });
  }

  for (const { source, value } of objectSources) {
    if (!value || typeof value !== "object") {
      continue;
    }

    for (const fieldPath of objectFieldCandidates) {
      const fieldValue = getPathValue(value, fieldPath);
      const resolvedValue = toPositiveNumber(fieldValue);
      if (resolvedValue) {
        return {
          mentorUserId: resolvedValue,
          source: `${source}.${fieldPath}`,
        };
      }
    }
  }

  for (const { source, token } of tokenSources) {
    const tokenPayload = getTokenPayload(token);
    if (!tokenPayload) {
      continue;
    }

    for (const claim of tokenClaimCandidates) {
      const claimValue = (tokenPayload as Record<string, unknown>)[claim];
      const resolvedValue = toPositiveNumber(claimValue);
      if (resolvedValue) {
        return {
          mentorUserId: resolvedValue,
          source: `${source}.${claim}`,
        };
      }
    }
  }

  return {
    mentorUserId: TEMP_MENTOR_USERS_ID,
    source: "temporary_fallback",
  };
};

const IssueObservationReportPage: React.FC = () => {
  const { authState: authStateFromHook } = useAuth();
  const authState =
    authStateFromHook ?? LocalStorageHelper.getObject<loginData>(AUTH_COOKIE_KEY);
  const mentorUserResolution = resolveMentorUserId(authState);
  const mentorName = [authState?.first_name, authState?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const [studentUsnInput, setStudentUsnInput] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<IssueObservationStudent | null>(null);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [termOptions, setTermOptions] = useState<TermOption[]>([]);
  const [selectedReport, setSelectedReport] = useState("");
  const [reportOptions, setReportOptions] = useState<IssueObservationReportListItem[]>([]);
  const [selectedReportDetail, setSelectedReportDetail] =
    useState<IssueObservationReportDetail | null>(null);
  const [reportHistory, setReportHistory] = useState<IssueObservationHistoryItem[]>([]);
  const [formState, setFormState] = useState<ReportFormState>(createInitialFormState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSelectedReport, setIsLoadingSelectedReport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const topSectionRef = useRef<HTMLDivElement | null>(null);

  const selectedTermLabel = useMemo(
    () => termOptions.find((term) => term.value === selectedTerm)?.label || "",
    [selectedTerm, termOptions],
  );

  const dropdownReports = useMemo(
    () => [
      { value: "", label: "Select Report" },
      { value: "create-report", label: "Create Report" },
      ...reportOptions.map((report) => ({
        value: String(report.lms_isnob_id),
        label: createReportOptionLabel(report),
      })),
    ],
    [reportOptions],
  );

  const shouldShowCreateForm = selectedReport === "create-report";
  const shouldShowReportDetails = Boolean(selectedReportDetail) && !shouldShowCreateForm;
  const mentorSignatureDateForSelectedDetail = getAgreementDateValue(
    selectedReportDetail as Record<string, unknown> | null | undefined,
    MENTOR_SIGNATURE_DATE_FIELD_CANDIDATES,
  );
  const purposeCount = getEditorCharacterCount(formState.purposeOfMeeting);
  const observationsCount = getEditorCharacterCount(formState.observationsAndActionTaken);
  const isMentorAgreed =
    selectedReportDetail?.mentor_status === AGREED_STATUS ||
    formState.mentorSignatureWithDate.toLowerCase().includes("agreed");
  const isMenteeAgreed =
    selectedReportDetail?.mentee_status === AGREED_STATUS ||
    formState.menteeSignatureWithDate.toLowerCase().includes("agreed");
  const isReportCompleted = isMentorAgreed && isMenteeAgreed;

  const formatAgreementStatus = (status?: number | null) =>
    status === AGREED_STATUS ? "Agreed" : "Pending";

  const buildSignatureStatus = (
    statusLabel: string,
    dateValue?: string | null,
    isAgreedValue?: boolean,
  ) => {
    if (dateValue) {
      return `${statusLabel} - ${formatDisplayDate(dateValue) || dateValue}`;
    }

    return isAgreedValue ? `${statusLabel} - Agreed` : `${statusLabel} - Pending`;
  };

  const resetReportSelectionState = () => {
    setSelectedReport("");
    setSelectedReportDetail(null);
    setReportHistory([]);
    setIsHistoryOpen(false);
  };

  const resetReportForm = () => {
    setFormState(createInitialFormState());
    setFieldErrors({});
  };

  const scrollToTopSection = () => {
    requestAnimationFrame(() => {
      topSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const applyTermFromSemesterId = (semesterId?: number | string | null) => {
    const nextTermOptions = createTermOption(semesterId);
    setTermOptions(nextTermOptions);
    setSelectedTerm(nextTermOptions[0]?.value || "");
  };

  const loadReportsForStudent = async (student: IssueObservationStudent) => {
    setIsLoadingReports(true);

    try {
      const response = await getIssueObservationReports(student.student_id);
      setReportOptions(response.data ?? []);
    } catch (error: any) {
      setReportOptions([]);
      toast.error(getErrorMessage(error, "Unable to load reports"));
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadSelectedReportData = async (reportId: number) => {
    setIsLoadingSelectedReport(true);

    try {
      const [detailResponse, historyResponse] = await Promise.all([
        getIssueObservationDetail(reportId),
        getIssueObservationHistory(reportId),
      ]);

      setSelectedReportDetail(detailResponse.data);
      setReportHistory(historyResponse.data ?? []);
      setIsHistoryOpen(false);
      applyTermFromSemesterId(detailResponse.data?.semester_id);
      const mentorSignatureDate = getAgreementDateValue(
        detailResponse.data as Record<string, unknown> | null | undefined,
        MENTOR_SIGNATURE_DATE_FIELD_CANDIDATES,
      );
      setFormState((current) => ({
        ...current,
        menteeSignatureWithDate: buildSignatureStatus(
          "Mentee Status",
          null,
          detailResponse.data?.mentee_status === AGREED_STATUS,
        ),
        mentorSignatureWithDate: buildSignatureStatus(
          "Mentor Status",
          mentorSignatureDate,
          detailResponse.data?.mentor_status === AGREED_STATUS,
        ),
      }));
    } catch (error: any) {
      setSelectedReportDetail(null);
      setReportHistory([]);
      setIsHistoryOpen(false);
      toast.error(getErrorMessage(error, "Unable to load report details"));
    } finally {
      setIsLoadingSelectedReport(false);
    }
  };

  const refreshSelectedReportState = async (
    student: IssueObservationStudent,
    reportId: number,
    options?: {
      scrollToTop?: boolean;
      resetCreateForm?: boolean;
      clearSelectionAfterRefresh?: boolean;
    },
  ) => {
    await loadReportsForStudent(student);

    if (options?.resetCreateForm) {
      resetReportForm();
    }

    if (options?.clearSelectionAfterRefresh) {
      resetReportSelectionState();
      applyTermFromSemesterId(selectedTerm || student.semester_id);

      if (options?.scrollToTop) {
        scrollToTopSection();
      }

      return;
    }

    setSelectedReport(String(reportId));
    await loadSelectedReportData(reportId);

    if (options?.scrollToTop) {
      scrollToTopSection();
    }
  };

  const handleStudentEnter = async () => {
    const normalizedUsn = studentUsnInput.trim();

    if (!normalizedUsn) {
      return;
    }

    setIsSearchingStudent(true);
    resetReportForm();
    resetReportSelectionState();
    setReportOptions([]);

    try {
      const response = await getStudentByUsn(normalizedUsn);
      const student = response.data;

      setStudentUsnInput(student.student_usn);
      setSelectedStudent(student);
      applyTermFromSemesterId(student.semester_id);
      await loadReportsForStudent(student);
    } catch (error: any) {
      setSelectedStudent(null);
      setTermOptions([]);
      setSelectedTerm("");
      toast.error(getErrorMessage(error, "Unable to find student"));
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);
  };

  const handleReportChange = async (value: string) => {
    setSelectedReport(value);
    setSelectedReportDetail(null);
    setReportHistory([]);
    setIsHistoryOpen(false);
    resetReportForm();

    if (!value || value === "create-report") {
      if (selectedStudent) {
        applyTermFromSemesterId(selectedStudent.semester_id);
      }
      return;
    }

    await loadSelectedReportData(Number(value));
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

    if (!selectedStudent) {
      toast.error("Please enter a valid Student USN");
      return false;
    }

    if (!selectedTerm) {
      toast.error("Select Term");
      return false;
    }

    if (!mentorUserResolution.mentorUserId) {
      toast.error("Cannot save because logged-in mentor user id is missing from auth state.");
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

  const handleSave = async () => {
    if (
      !validateForm() ||
      !selectedStudent ||
      !mentorUserResolution.mentorUserId ||
      !formState.counsellingDate
    ) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await saveIssueObservation({
        academic_batch_id: selectedStudent.academic_batch_id,
        semester_id: Number(selectedTerm),
        ssd_id: selectedStudent.student_id,
        student_usn: selectedStudent.student_usn,
        report_title: formState.reportTitle.trim(),
        counselling_date: formState.counsellingDate.toISOString(),
        mentor_users_id: mentorUserResolution.mentorUserId,
        purpose_of_meeting_desc: formState.purposeOfMeeting,
        observation_desc: formState.observationsAndActionTaken,
        comm_parent_flag: formState.parentsCommunication === "yes" ? 1 : 0,
        comm_high_auth_flag:
          formState.higherAuthoritiesCommunication === "yes" ? 1 : 0,
        mentor_status: 0,
        mentee_status: 0,
        parent_guardian_status: 0,
      });

      toast.success(response.data.message);
      await refreshSelectedReportState(selectedStudent, response.data.lms_isnob_id, {
        resetCreateForm: true,
      });
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to save report"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndAgree = async () => {
    if (
      !validateForm() ||
      !selectedStudent ||
      !mentorUserResolution.mentorUserId ||
      !formState.counsellingDate
    ) {
      return;
    }

    setIsSaving(true);
    setIsAgreeing(true);

    try {
      const saveResponse = await saveIssueObservation({
        academic_batch_id: selectedStudent.academic_batch_id,
        semester_id: Number(selectedTerm),
        ssd_id: selectedStudent.student_id,
        student_usn: selectedStudent.student_usn,
        report_title: formState.reportTitle.trim(),
        counselling_date: formState.counsellingDate.toISOString(),
        mentor_users_id: mentorUserResolution.mentorUserId,
        purpose_of_meeting_desc: formState.purposeOfMeeting,
        observation_desc: formState.observationsAndActionTaken,
        comm_parent_flag: formState.parentsCommunication === "yes" ? 1 : 0,
        comm_high_auth_flag:
          formState.higherAuthoritiesCommunication === "yes" ? 1 : 0,
        mentor_status: 0,
        mentee_status: 0,
        parent_guardian_status: 0,
      });

      const reportId = saveResponse.data.lms_isnob_id;
      await mentorAgreeIssueObservation(reportId, { mentor_status: AGREED_STATUS });
      await refreshSelectedReportState(selectedStudent, reportId, {
        resetCreateForm: true,
        clearSelectionAfterRefresh: true,
        scrollToTop: true,
      });
      toast.success("Report saved and mentor agreed successfully.");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to save and agree report"));
    } finally {
      setIsSaving(false);
      setIsAgreeing(false);
    }
  };

  const handleExistingReportMentorAgree = async () => {
    if (!selectedReportDetail || !selectedStudent || isMentorAgreed) {
      return;
    }

    setIsAgreeing(true);

    try {
      await mentorAgreeIssueObservation(selectedReportDetail.lms_isnob_id, {
        mentor_status: AGREED_STATUS,
      });
      await refreshSelectedReportState(selectedStudent, selectedReportDetail.lms_isnob_id, {
        clearSelectionAfterRefresh: true,
        scrollToTop: true,
      });
      toast.success("Mentor agreed successfully.");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to update mentor agreement"));
    } finally {
      setIsAgreeing(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReportDetail || !selectedStudent) {
      return;
    }

    const isConfirmed = window.confirm("Are you sure you want to delete this report?");
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await deleteIssueObservation(selectedReportDetail.lms_isnob_id, {
        delete_reason_desc: "Deleted by faculty from Issue Observation Report page.",
      });

      toast.success(response.message);
      await loadReportsForStudent(selectedStudent);
      resetReportForm();
      resetReportSelectionState();
      applyTermFromSemesterId(selectedTerm || selectedStudent.semester_id);
      scrollToTopSection();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to delete report"));
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
              margin-top: 24px;
              margin-left: -3px;
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 290px)) !important;
              column-gap: 22px !important;
              row-gap: 0 !important;
              align-items: start !important;
              width: 914px !important;
              max-width: 100% !important;
              justify-content: start !important;
            }

            .issue-observation-report-page .issue-observation-form-row > div {
              width: 290px !important;
              min-width: 290px !important;
              max-width: 290px !important;
            }
          }

          .issue-observation-report-page .issue-observation-form-row,
          .issue-observation-report-page .issue-observation-form-row > div,
          .issue-observation-report-page .issue-observation-form-row input,
          .issue-observation-report-page .issue-observation-form-row select,
          .issue-observation-report-page .issue-observation-form-row .student-usn-control {
            width: 290px;
            min-width: 290px;
            max-width: 290px;
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
            border: 1px solid #aeb4bb !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }

          .issue-observation-report-page .tox .tox-editor-header {
            padding: 0 !important;
            border-bottom: 1px solid #b4bac1 !important;
            box-shadow: inset 0 1px 0 #fafafa !important;
            background: linear-gradient(to bottom, #f4f4f4 0%, #e7e7e7 55%, #dbdbdb 100%) !important;
          }

          .issue-observation-report-page .tox .tox-toolbar-overlord,
          .issue-observation-report-page .tox .tox-toolbar,
          .issue-observation-report-page .tox .tox-toolbar__primary,
          .issue-observation-report-page .tox .tox-menubar {
            min-height: 32px !important;
            background: linear-gradient(to bottom, #f4f4f4 0%, #e7e7e7 55%, #dbdbdb 100%) !important;
          }

          .issue-observation-report-page .tox .tox-toolbar__primary {
            padding: 1px 2px !important;
            gap: 0 !important;
            align-items: center !important;
          }

          .issue-observation-report-page .tox .tox-toolbar__group {
            margin: 0 1px 0 0 !important;
            padding: 0 1px 0 0 !important;
            gap: 0 !important;
            border-right: 1px solid #c6c6c6 !important;
            align-items: center !important;
          }

          .issue-observation-report-page .tox .tox-toolbar__group:last-child {
            margin-right: 0 !important;
            padding-right: 0 !important;
            border-right: 0 !important;
          }

          .issue-observation-report-page .tox .tox-tbtn {
            min-width: 30px !important;
            height: 29px !important;
            margin: 0 !important;
            padding: 0 4px !important;
            border: 1px solid #b8b8b8 !important;
            border-radius: 1px !important;
            background: linear-gradient(to bottom, #fefefe 0%, #ececec 100%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
          }

          .issue-observation-report-page .tox .tox-tbtn:hover,
          .issue-observation-report-page .tox .tox-tbtn:focus,
          .issue-observation-report-page .tox .tox-tbtn--enabled {
            background: linear-gradient(to bottom, #ffffff 0%, #e4e4e4 100%) !important;
            border-color: #b2b2b2 !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
          }

          .issue-observation-report-page .tox .tox-tbtn:active,
          .issue-observation-report-page .tox .tox-tbtn--enabled[aria-pressed="true"] {
            background: linear-gradient(to bottom, #e3e3e3 0%, #f2f2f2 100%) !important;
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.08) !important;
          }

          .issue-observation-report-page .tox .tox-tbtn:disabled,
          .issue-observation-report-page .tox .tox-tbtn--disabled,
          .issue-observation-report-page .tox .tox-tbtn[aria-disabled="true"] {
            cursor: default !important;
            opacity: 1 !important;
            border: 1px solid #c4c8cd !important;
            background: linear-gradient(to bottom, #fbfbfb 0%, #ececec 100%) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
            filter: none !important;
          }

          .issue-observation-report-page .tox .tox-tbtn--select {
            min-width: 94px !important;
            width: 94px !important;
            justify-content: space-between !important;
            padding: 0 6px !important;
          }

          .issue-observation-report-page .tox .tox-tbtn__select-label {
            font-size: 12px !important;
            font-weight: 400 !important;
            line-height: 1 !important;
          }

          .issue-observation-report-page .tox .tox-tbtn--select .tox-tbtn__select-label {
            color: transparent !important;
            position: relative;
            min-width: 46px;
          }

          .issue-observation-report-page
            .tox
            .tox-tbtn--select
            .tox-tbtn__select-label::after {
            content: "Formats";
            color: #2f3744;
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
          }

          .issue-observation-report-page .tox .tox-sidebar-wrap {
            margin-top: 0 !important;
            border-top: 0 !important;
            background: #ffffff !important;
          }

          .issue-observation-report-page .tox .tox-edit-area,
          .issue-observation-report-page .tox .tox-edit-area__iframe {
            border-top: 0 !important;
          }

          .issue-observation-link-dialog-wrap .tox-dialog-wrap__backdrop {
            background: rgba(82, 82, 82, 0.68) !important;
          }

          .issue-observation-link-dialog {
            width: 448px !important;
            max-width: calc(100vw - 40px) !important;
            border: 1px solid #cfcfcf !important;
            border-radius: 2px !important;
            overflow: hidden;
            background: #fff !important;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24) !important;
          }

          .issue-observation-link-dialog,
          .issue-observation-link-dialog * {
            box-sizing: border-box;
          }

          .issue-observation-link-dialog .tox-dialog__header {
            padding: 10px 16px !important;
            background: #fff !important;
            border-bottom: 1px solid #d6d6d6 !important;
          }

          .issue-observation-link-dialog .tox-dialog__title {
            font-size: 18px !important;
            font-weight: 500 !important;
            color: #222 !important;
            letter-spacing: 0 !important;
          }

          .issue-observation-link-dialog .tox-button--icon {
            width: 28px !important;
            height: 28px !important;
          }

          .issue-observation-link-dialog .tox-dialog__body-content {
            padding: 14px 16px 12px !important;
            background: #fff !important;
            overflow-x: hidden !important;
          }

          .issue-observation-link-dialog .tox-dialog__body,
          .issue-observation-link-dialog .tox-dialog__body-content,
          .issue-observation-link-dialog .tox-form,
          .issue-observation-link-dialog .tox-form__group,
          .issue-observation-link-dialog .tox-form__controls-h-stack {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .issue-observation-link-dialog .tox-form {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .issue-observation-link-dialog .tox-form__group {
            margin: 0 !important;
            display: grid !important;
            grid-template-columns: 104px minmax(0, 1fr) !important;
            align-items: center;
            column-gap: 14px;
            row-gap: 0;
            overflow: hidden;
          }

          .issue-observation-link-dialog .tox-form__group label,
          .issue-observation-link-dialog .tox-form__group .tox-label {
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
            font-size: 13px !important;
            color: #333 !important;
            line-height: 1.2 !important;
            white-space: nowrap;
            text-align: left !important;
          }

          .issue-observation-link-dialog .tox-form__controls-h-stack {
            gap: 0 !important;
            display: block !important;
            overflow: hidden;
          }

          .issue-observation-link-dialog .tox-textfield,
          .issue-observation-link-dialog .tox-listboxfield .tox-listbox--select,
          .issue-observation-link-dialog .tox-listboxfield select {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            min-height: 28px !important;
            height: 28px !important;
            border-radius: 2px !important;
            border-color: #bfc4ca !important;
            box-shadow: none !important;
            font-size: 13px !important;
          }

          .issue-observation-link-dialog .tox-listboxfield,
          .issue-observation-link-dialog .tox-listbox,
          .issue-observation-link-dialog .tox-form__controls-h-stack > * {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .issue-observation-link-dialog .tox-listboxfield .tox-listbox--select {
            background: linear-gradient(to bottom, #fbfbfb 0%, #e7e7e7 100%) !important;
          }

          .issue-observation-link-dialog-wrap .tox-menu.tox-collection,
          .issue-observation-link-dialog-wrap .tox-collection__group,
          .issue-observation-link-dialog-wrap .tox-collection--list {
            max-width: min(416px, calc(100vw - 56px)) !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }

          .issue-observation-link-dialog .tox-dialog__footer {
            padding: 12px 14px !important;
            background: linear-gradient(to bottom, #f7f7f7 0%, #e8e8e8 100%) !important;
            border-top: 1px solid #d2d2d2 !important;
            justify-content: flex-end !important;
          }

          .issue-observation-link-dialog .tox-dialog__footer-end {
            margin-left: auto !important;
            gap: 4px !important;
          }

          .issue-observation-link-dialog .tox-dialog__footer .tox-button {
            min-height: 28px !important;
            height: 28px !important;
            padding: 0 14px !important;
            border-radius: 2px !important;
            box-shadow: none !important;
            font-size: 13px !important;
          }

          .issue-observation-link-dialog .tox-dialog__footer .tox-button--secondary {
            background: linear-gradient(to bottom, #ffffff 0%, #ececec 100%) !important;
            border-color: #c7c7c7 !important;
            color: #333 !important;
          }

          .issue-observation-report-page .create-report-shell {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: none;
          }

          .issue-observation-report-page .create-report-shell .compact-label {
            font-size: 13px;
            font-weight: 600;
            color: #000;
          }

          .issue-observation-report-page .report-title-row {
            display: grid;
            grid-template-columns: 145px minmax(320px, 690px);
            align-items: center;
            gap: 12px;
            justify-content: start;
          }

          .issue-observation-report-page .report-title-input {
            width: 100%;
            max-width: 690px;
          }

          .issue-observation-report-page .info-table {
            width: 100%;
            border: 1px solid #d7dbe2;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .issue-observation-report-page .info-table td {
            border: 1px solid #d7dbe2;
            padding: 7px 16px;
            vertical-align: middle;
            font-size: 13px;
            line-height: 1.25;
            color: #000;
          }

          .issue-observation-report-page .info-table .label-cell {
            width: 16%;
            font-weight: 400;
            background: #fff;
            white-space: nowrap;
          }

          .issue-observation-report-page .info-table .value-cell {
            width: 34%;
          }

          .issue-observation-report-page .table-date-input {
            width: 100%;
            max-width: 100%;
            height: 34px;
            padding-right: 42px;
            border-radius: 3px 0 0 3px;
          }

          .issue-observation-report-page .date-input-shell {
            position: relative;
            width: 100%;
            max-width: 424px;
          }

          .issue-observation-report-page .date-input-shell .react-datepicker-wrapper {
            width: 100%;
          }

          .issue-observation-report-page .date-input-icon {
            position: absolute;
            top: 0;
            right: 0;
            width: 40px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #cfd4dc;
            border-left: 0;
            border-radius: 0 3px 3px 0;
            background: linear-gradient(to bottom, #f8f8f8 0%, #ececec 100%);
            color: #6b7280;
            pointer-events: none;
          }

          .issue-observation-report-page .editor-block {
            width: 100%;
            max-width: none;
          }

          .issue-observation-report-page .editor-block .tox.tox-tinymce .tox-edit-area__iframe,
          .issue-observation-report-page .editor-block .tox.tox-tinymce {
            min-height: 170px !important;
          }

          .issue-observation-report-page .editor-counter {
            margin-top: 2px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .issue-observation-report-page .question-row {
            display: grid;
            grid-template-columns: minmax(320px, max-content) 76px;
            align-items: center;
            justify-content: start;
            column-gap: 7px;
            row-gap: 2px;
          }

          .issue-observation-report-page .question-select {
            width: 76px;
            min-width: 76px;
            height: 28px;
            padding: 0 18px 0 8px;
            border-radius: 2px;
          }

          .issue-observation-report-page .signature-grid {
            display: grid;
            grid-template-columns: 268px 268px;
            gap: 84px;
            justify-content: start;
            width: 100%;
            max-width: none;
          }

          .issue-observation-report-page .signature-input {
            width: 100%;
            max-width: 268px;
            height: 32px;
            border: 1px solid #555 !important;
            border-radius: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }

          .issue-observation-report-page .create-action-row {
            display: flex;
            width: 100%;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 0;
          }

          .issue-observation-report-page .history-panel {
            width: 100%;
            max-width: none;
            border: 1px solid #d9d9d9;
            border-radius: 0;
            overflow: hidden;
          }

          .issue-observation-report-page .history-panel button {
            min-height: 34px;
            padding: 7px 12px;
            color: #337ab7;
            font-size: 13px;
            font-weight: 600;
            transition: color 0.15s ease-in-out;
          }

          .issue-observation-report-page .history-panel button:hover {
            color: #f0ad4e;
          }

          .issue-observation-report-page .history-panel svg {
            flex-shrink: 0;
          }

          @media (max-width: 767px) {
            .issue-observation-report-page .report-title-row,
            .issue-observation-report-page .question-row,
            .issue-observation-report-page .signature-grid {
              grid-template-columns: 1fr;
            }

            .issue-observation-report-page .report-title-input,
            .issue-observation-report-page .signature-input,
            .issue-observation-report-page .question-select {
              max-width: 100%;
              width: 100%;
            }

            .issue-observation-report-page .info-table,
            .issue-observation-report-page .info-table tbody,
            .issue-observation-report-page .info-table tr,
            .issue-observation-report-page .info-table td {
              display: block;
              width: 100%;
            }

            .issue-observation-report-page .info-table td {
              border-bottom: 0;
            }

            .issue-observation-report-page .info-table tr:last-child td:last-child {
              border-bottom: 1px solid #d1d5db;
            }
          }
        `}
      </style>

      <MmpModuleShell title="Issues and Observations Report">
        <div
          ref={topSectionRef}
          className="issue-observation-form-row grid grid-cols-1 items-start gap-5 md:grid-cols-3"
        >
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
                    void handleStudentEnter();
                  }
                }}
                className={`${inputClassName} border-0 bg-transparent focus:border-transparent`}
                placeholder="Type USN..."
                aria-label="Student USN"
                aria-autocomplete="list"
                disabled={isSearchingStudent}
              />
            </div>
            <p className="mt-[4px] text-[12px] font-normal text-black">
              Press 'Enter' key after typing USN.
            </p>
            {selectedStudent?.student_name && (
              <p className="mt-[4px] text-[12px] font-normal text-gray-700">
                {selectedStudent.student_name}
              </p>
            )}
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
              disabled={termOptions.length === 0}
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
              onChange={(event) => void handleReportChange(event.target.value)}
              aria-label="Report"
              disabled={!selectedStudent || isLoadingReports}
            >
              {dropdownReports.map((report) => (
                <option key={report.value || "empty"} value={report.value}>
                  {report.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {shouldShowCreateForm && (
          <div className="create-report-shell">
            <div className="report-title-row">
              <label className="compact-label">
                Report Title: <span className="text-red-500">*</span>
              </label>
              <div>
                <input
                  type="text"
                  value={formState.reportTitle}
                  onChange={(event) => updateFormField("reportTitle", event.target.value)}
                  className={`${inputClassName} report-title-input h-[36px]`}
                  aria-label="Report Title"
                />
                {fieldErrors.reportTitle && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.reportTitle}</p>
                )}
              </div>
            </div>

            <table className="info-table">
              <tbody>
                <tr>
                  <td className="label-cell">USN:</td>
                  <td className="value-cell">{selectedStudent?.student_usn || ""}</td>
                  <td className="label-cell">Mentor:</td>
                  <td className="value-cell">{mentorName}</td>
                </tr>
                <tr>
                  <td className="label-cell">
                    Counselling Date: <span className="text-red-500">*</span>
                  </td>
                  <td className="value-cell">
                    <div className="date-input-shell">
                      <DatePicker
                        selected={formState.counsellingDate}
                        onChange={(date) => updateFormField("counsellingDate", date)}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="DD-MM-YYYY"
                        className={`${inputClassName} table-date-input`}
                        aria-label="Counselling Date"
                      />
                      <span className="date-input-icon">
                        <CalendarDays size={15} />
                      </span>
                    </div>
                    {fieldErrors.counsellingDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.counsellingDate}
                      </p>
                    )}
                  </td>
                  <td className="label-cell">Term:</td>
                  <td className="value-cell">{selectedTermLabel}</td>
                </tr>
              </tbody>
            </table>

            <div className="editor-block">
              <label className="compact-label mb-2 block">
                Purpose of meeting / Issue reported:{" "}
                <span className="text-red-500">*</span>
              </label>
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formState.purposeOfMeeting}
                onEditorChange={(value) => handleEditorChange("purposeOfMeeting", value)}
                init={createEditorInit()}
              />
              <div className="editor-counter">
                {fieldErrors.purposeOfMeeting ? (
                  <p className="text-xs text-red-600">{fieldErrors.purposeOfMeeting}</p>
                ) : null}
                <p className="text-xs text-gray-600">{purposeCount}/2000</p>
              </div>
            </div>

            <div className="editor-block">
              <label className="compact-label mb-2 block">
                Observations and Action Taken: <span className="text-red-500">*</span>
              </label>
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                value={formState.observationsAndActionTaken}
                onEditorChange={(value) =>
                  handleEditorChange("observationsAndActionTaken", value)
                }
                init={createEditorInit()}
              />
              <div className="editor-counter">
                {fieldErrors.observationsAndActionTaken ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.observationsAndActionTaken}
                  </p>
                ) : null}
                <p className="text-xs text-gray-600">{observationsCount}/2000</p>
              </div>
            </div>

            <div className="question-row">
              <label className="compact-label">
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
                className={`${inputClassName} question-select`}
                aria-label="Communicated with parents"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="question-row">
              <label className="compact-label">
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
                className={`${inputClassName} question-select`}
                aria-label="Communicated with higher authorities"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="signature-grid">
              <div>
                <label className="compact-label mb-2 block">
                  Mentee Signature with Date
                </label>
                <input
                  type="text"
                  value={formState.menteeSignatureWithDate}
                  readOnly
                  className={`${inputClassName} signature-input`}
                  aria-label="Mentee Signature with Date"
                />
              </div>
              <div>
                <label className="compact-label mb-2 block">
                  Mentor Signature with Date
                </label>
                <input
                  type="text"
                  value={formState.mentorSignatureWithDate}
                  readOnly
                  className={`${inputClassName} signature-input`}
                  aria-label="Mentor Signature with Date"
                />
              </div>
            </div>

            <div className="create-action-row">
              <UIButton
                onClick={() => void handleSave()}
                className="h-[30px] min-w-[54px] rounded-[1px] bg-[#337ab7] px-3 py-1 text-[12px] text-white hover:bg-[#286090]"
                disabled={isSaving || isAgreeing}
                title="Save"
              >
                {isSaving ? "Saving..." : "Save"}
              </UIButton>
              <UIButton
                onClick={() => void handleSaveAndAgree()}
                className="h-[30px] min-w-[104px] rounded-[1px] bg-[#337ab7] px-3 py-1 text-[12px] text-white hover:bg-[#286090]"
                disabled={isSaving || isAgreeing}
                title="Save & Agree"
              >
                {isAgreeing ? "Saving & Agreeing..." : "Save & Agree"}
              </UIButton>
            </div>

            <div className="history-panel">
              <button
                type="button"
                onClick={() => setIsHistoryOpen((current) => !current)}
                className="flex w-full items-center gap-2 text-left"
              >
                {isHistoryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>History</span>
              </button>
              {isHistoryOpen && (
                <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600">
                  {reportHistory.length === 0 ? null : (
                    <div className="space-y-3">
                      {reportHistory.map((item) => (
                        <div
                          key={item.history_id}
                          className="rounded border border-gray-200 px-3 py-3"
                        >
                          <p className="text-[13px] font-semibold text-black">
                            {item.action_type}
                          </p>
                          <p className="text-[13px] text-gray-700">{item.report_title}</p>
                          <p className="text-[12px] text-gray-600">
                            Modified By: {item.modified_by || "-"}
                          </p>
                          <p className="text-[12px] text-gray-600">
                            Action Time: {formatDisplayDate(item.action_timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoadingSelectedReport && !shouldShowCreateForm && (
          <div className="mt-10 rounded border border-gray-200 px-4 py-4 text-sm text-gray-600">
            Loading report details...
          </div>
        )}

        {shouldShowReportDetails && selectedReportDetail && (
          <div className="mt-10 space-y-8">
            <div className="overflow-hidden rounded border border-gray-300">
              <div className="grid grid-cols-1 border-b border-gray-300 md:grid-cols-[220px_minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Report Title
                </div>
                <div className="border-b border-gray-300 px-4 py-3 text-[13px] text-black md:border-b-0 md:border-r">
                  {selectedReportDetail.report_title}
                </div>
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  USN
                </div>
                <div className="px-4 py-3 text-[13px] text-black">
                  {selectedReportDetail.student_usn}
                </div>
              </div>

              <div className="grid grid-cols-1 border-b border-gray-300 md:grid-cols-[220px_minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Counselling Date
                </div>
                <div className="border-b border-gray-300 px-4 py-3 text-[13px] text-black md:border-b-0 md:border-r">
                  {formatDisplayDate(selectedReportDetail.counselling_date)}
                </div>
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Term
                </div>
                <div className="px-4 py-3 text-[13px] text-black">{selectedTermLabel}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Mentor Status
                </div>
                <div className="border-b border-gray-300 px-4 py-3 text-[13px] text-black md:border-b-0 md:border-r">
                  {formatAgreementStatus(selectedReportDetail.mentor_status)}
                </div>
                <div className="border-b border-gray-300 bg-white px-4 py-3 text-[13px] font-semibold text-black md:border-b-0 md:border-r">
                  Mentee Status
                </div>
                <div className="px-4 py-3 text-[13px] text-black">
                  {formatAgreementStatus(selectedReportDetail.mentee_status)}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-black">
                  Mentee Signature with Date
                </label>
                <input
                  type="text"
                  value={buildSignatureStatus(
                    "Mentee Status",
                    null,
                    selectedReportDetail.mentee_status === AGREED_STATUS,
                  )}
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
                  value={buildSignatureStatus(
                    "Mentor Status",
                    mentorSignatureDateForSelectedDetail,
                    selectedReportDetail.mentor_status === AGREED_STATUS,
                  )}
                  readOnly
                  className={`${inputClassName} h-[42px] w-full max-w-none bg-gray-50`}
                  aria-label="Mentor Signature with Date"
                />
              </div>
            </div>

            <div className="text-[13px] font-semibold text-black">
              Report Status: {isReportCompleted ? "Completed" : "In Progress"}
            </div>

            <div className="flex justify-end gap-3">
              <UIButton
                onClick={() => void handleDeleteReport()}
                className="bg-[#d9534f] px-5 py-2 text-[13px] text-white hover:bg-[#c9302c]"
                title="Delete"
              >
                Delete
              </UIButton>
              {!isMentorAgreed && (
                <UIButton
                  onClick={() => void handleExistingReportMentorAgree()}
                  className="bg-[#337ab7] px-5 py-2 text-[13px] text-white hover:bg-[#286090]"
                  disabled={isAgreeing}
                  title="Mentor Agree"
                >
                  {isAgreeing ? "Agreeing..." : "Mentor Agree"}
                </UIButton>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-black">
                Purpose of meeting / Issue reported
              </label>
              <div
                className="min-h-[120px] rounded border border-gray-300 px-4 py-3 text-[13px] text-black"
                dangerouslySetInnerHTML={{
                  __html: selectedReportDetail.purpose_of_meeting_desc || "",
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-black">
                Observations and Action Taken
              </label>
              <div
                className="min-h-[120px] rounded border border-gray-300 px-4 py-3 text-[13px] text-black"
                dangerouslySetInnerHTML={{
                  __html: selectedReportDetail.observation_desc || "",
                }}
              />
            </div>

            <div className="rounded border border-gray-200">
              <button
                type="button"
                onClick={() => setIsHistoryOpen((current) => !current)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-semibold text-[#337ab7] transition-colors hover:text-[#f0ad4e]"
              >
                {isHistoryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>History</span>
              </button>
              {isHistoryOpen && (
                <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600">
                  {reportHistory.length === 0 ? (
                    "No history returned by backend for this report."
                  ) : (
                    <div className="space-y-3">
                      {reportHistory.map((item) => (
                        <div
                          key={item.history_id}
                          className="rounded border border-gray-200 px-3 py-3"
                        >
                          <p className="text-[13px] font-semibold text-black">
                            {item.action_type}
                          </p>
                          <p className="text-[13px] text-gray-700">{item.report_title}</p>
                          <p className="text-[12px] text-gray-600">
                            Modified By: {item.modified_by || "-"}
                          </p>
                          <p className="text-[12px] text-gray-600">
                            Action Time: {formatDisplayDate(item.action_timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
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
