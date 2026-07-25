import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaRegFileAlt, FaTimes } from "react-icons/fa";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import MmpModuleShell from "../components/MmpModuleShell";

type NavigationState = {
  mentors_group_id?: number;
  academic_batch_id?: number;
  mentors_pgm_title?: string;
  config_type_id?: number | null;
  questionnaire_id?: number | null;
};

type GroupCompleteResponse = {
  group?: {
    mentors_group_id?: number;
    academic_batch_id?: number;
    config_type_id?: number | null;
    questionnaire_id?: number | null;
    mentors_pgm_title?: string;
  };
  semester_ids?: number[];
};

type QuestionnaireRecord = {
  questionnaire_id: number;
  questionnaire_name: string;
};

type GroupListMentor = {
  mentor_id?: number;
  mentees?: GroupMenteeMapping[];
};

type GroupListRecord = {
  mentors_group_id?: number;
  academic_batch_id?: number;
  config_type_id?: number | null;
  questionnaire_id?: number | null;
  mentors_pgm_title?: string;
  mentees?: GroupMenteeMapping[];
  mentors?: GroupListMentor[];
};

type QuestionnaireOption = {
  questionnaire_options_id?: number | null;
  que_option?: string;
  specify_flag?: boolean;
};

type QuestionnaireQuestion = {
  questionnaire_que_id?: number | null;
  que_no?: number;
  question?: string;
  questionnaire_type?: string;
  questionnaire_type_name?: string;
  options?: QuestionnaireOption[];
};

type QuestionnaireDetail = {
  questionnaire_id?: number;
  questionnaire_name?: string;
  questionnaire_title?: string;
  questionnaire_type?: string;
  questionnaire_type_name?: string;
  message_to_mentees?: string;
  field_setting_desc?: string;
  field_settings?: {
    field_setting_desc?: string;
  };
  questions?: QuestionnaireQuestion[];
};

type AcademicBatchRecord = {
  academic_batch_id?: number;
  academic_batch_desc?: string;
};

type SemesterRecord = {
  semester_id?: number;
  semester_desc?: string;
  term_name?: string;
};

type ConfigurationType = {
  config_type_id: number;
  config_type_name: string;
  min_mentees?: number;
  max_mentees?: number;
  allow_mentee_rating?: boolean;
  rating_type_id?: number | null;
};

type GroupMenteeMapping = {
  group_mentee_id?: number;
  student_id?: number;
  usn?: string;
  usno?: string;
  student_usn?: string;
};

type EligibleMenteeApi = {
  student_id?: number;
  usn?: string;
  usno?: string;
  name?: string;
  student_name?: string;
  email?: string;
  section?: string;
  section_name?: string;
  student_section?: string;
};

type ApiEnvelope<T> = {
  message?: string;
  data?: T;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

type FormState = {
  mentors_group_id: number;
  academic_batch_id: number;
  config_type_id: number;
  questionnaire_id: number;
  mentors_pgm_title: string;
  semester_ids: number[];
};

type MenteeRow = {
  student_id: number;
  name: string;
  usn: string;
  email: string;
  section: string;
  mappingState: "current" | "other" | "unmapped";
};

const QUESTIONNAIRE_MODAL_CLOSE_DURATION_MS = 180;

const getErrorMessage = (error: ApiError, fallback: string) =>
  error.response?.data?.message || error.message || fallback;

const getResponseMessage = (message?: string, fallback = "Completed") =>
  message?.trim() || fallback;

const parseNumericId = (value: string | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getMenteeEmailTooltip = (email: string) =>
  email.trim() ? `Email: ${email.trim()}` : "Email not available";

const buildMenteeName = (mentee: Pick<MenteeRow, "name" | "usn">) =>
  mentee.usn ? `${mentee.usn} - ${mentee.name}` : mentee.name;

const formatApplicableTerm = (semester: SemesterRecord | undefined, semesterId: number) => {
  const rawText = semester?.semester_desc?.trim() || semester?.term_name?.trim() || `${semesterId}`;
  const normalizedText = rawText.replace(/\s+/g, " ").trim();
  const semesterMatch = normalizedText.match(/^semester\s*(\d+)$/i);
  if (semesterMatch) {
    return `${semesterMatch[1]} - Semester`;
  }

  const numericMatch = normalizedText.match(/^(\d+)$/);
  if (numericMatch) {
    return `${numericMatch[1]} - Semester`;
  }

  return normalizedText;
};

const normalizeEligibleMentee = (item: EligibleMenteeApi): MenteeRow | null => {
  const student_id = Number(item.student_id ?? 0);
  if (!student_id) {
    return null;
  }

  return {
    student_id,
    name: item.name?.trim() || item.student_name?.trim() || `Student ID: ${student_id}`,
    usn: item.usn?.trim() || item.usno?.trim() || "",
    email: item.email?.trim() || "",
    section:
      item.section?.trim() ||
      item.section_name?.trim() ||
      item.student_section?.trim() ||
      "",
    mappingState: "unmapped",
  };
};

const dedupeMenteesByStudentId = (mentees: MenteeRow[]) => {
  const menteeMap = new Map<number, MenteeRow>();

  mentees.forEach((mentee) => {
    if (!menteeMap.has(mentee.student_id)) {
      menteeMap.set(mentee.student_id, mentee);
      return;
    }

    const existing = menteeMap.get(mentee.student_id);
    if (!existing) {
      menteeMap.set(mentee.student_id, mentee);
      return;
    }

    menteeMap.set(mentee.student_id, {
      ...existing,
      name: existing.name.startsWith("Student ID:") && !mentee.name.startsWith("Student ID:")
        ? mentee.name
        : existing.name,
      usn: existing.usn || mentee.usn,
      email: existing.email || mentee.email,
      section: existing.section || mentee.section,
    });
  });

  return Array.from(menteeMap.values());
};

const buildCurrentGroupMenteeMap = (mappings: GroupMenteeMapping[]) => {
  const nextCurrentGroupMenteeMap = new Map<number, number[]>();

  mappings.forEach((mentee) => {
    const studentId = Number(mentee.student_id ?? 0);
    const groupMenteeId = Number(mentee.group_mentee_id ?? 0);

    if (studentId <= 0 || groupMenteeId <= 0) {
      return;
    }

    const existingMappingIds = nextCurrentGroupMenteeMap.get(studentId) || [];
    nextCurrentGroupMenteeMap.set(
      studentId,
      existingMappingIds.includes(groupMenteeId)
        ? existingMappingIds
        : [...existingMappingIds, groupMenteeId],
    );
  });

  return nextCurrentGroupMenteeMap;
};

const normalizeUsn = (value?: string | null) => value?.trim().toUpperCase() || "";

const getGroupMenteeUsn = (mentee: GroupMenteeMapping) =>
  normalizeUsn(mentee.usn ?? mentee.usno ?? mentee.student_usn);

const normalizeStudentId = (value: unknown) => {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) {
    return "";
  }

  const numericValue = Number(stringValue);
  return Number.isFinite(numericValue) && numericValue > 0 ? `${numericValue}` : stringValue;
};

const getEligibleMenteeUsn = (mentee: Pick<MenteeRow, "usn">) => normalizeUsn(mentee.usn);

const collectNestedGroupMentees = (value: unknown): GroupMenteeMapping[] => {
  const queue: unknown[] = Array.isArray(value) ? [...value] : value ? [value] : [];
  const mentees: GroupMenteeMapping[] = [];
  const visited = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!current || typeof current !== "object") {
      continue;
    }

    const record = current as Record<string, unknown>;
    if (visited.has(record)) {
      continue;
    }
    visited.add(record);
    const hasMenteeIdentity =
      "student_id" in record ||
      "usn" in record ||
      "usno" in record ||
      "student_usn" in record ||
      "student_name" in record;

    if (hasMenteeIdentity) {
      mentees.push(record as GroupMenteeMapping);
    }

    Object.values(record).forEach((nestedValue) => {
      if (nestedValue && (Array.isArray(nestedValue) || typeof nestedValue === "object")) {
        queue.push(nestedValue);
      }
    });
  }

  return mentees;
};

const buildOtherGroupMappedLookup = (
  groups: GroupListRecord[],
  currentMentorsGroupId: number,
) => {
  const otherGroupMappedStudentIdSet = new Set<string>();
  const otherGroupMappedUsnSet = new Set<string>();

  groups.forEach((group) => {
    if (Number(group.mentors_group_id) === Number(currentMentorsGroupId)) {
      return;
    }

    collectNestedGroupMentees(group).forEach((mentee) => {
      const studentId = normalizeStudentId(mentee.student_id);
      if (studentId) {
        otherGroupMappedStudentIdSet.add(studentId);
      }

      const menteeUsn = getGroupMenteeUsn(mentee);
      if (menteeUsn) {
        otherGroupMappedUsnSet.add(menteeUsn);
      }
    });
  });

  return {
    otherGroupMappedStudentIdSet,
    otherGroupMappedUsnSet,
  };
};

const buildMentorIds = (group: GroupListRecord | null) =>
  Array.from(
    new Set(
      (group?.mentors || [])
        .map((mentor) => Number(mentor.mentor_id ?? 0))
        .filter((mentorId) => Number.isFinite(mentorId) && mentorId > 0),
    ),
  );

const collectDuplicateGroupMenteeIds = (
  groups: GroupListRecord[],
  currentMentorsGroupId: number,
  selectedMentees: Array<Pick<MenteeRow, "student_id" | "usn">>,
) => {
  const selectedStudentIds = new Set(
    selectedMentees
      .map((mentee) => normalizeStudentId(mentee.student_id))
      .filter((studentId) => Boolean(studentId)),
  );
  const selectedUsns = new Set(
    selectedMentees
      .map((mentee) => getEligibleMenteeUsn(mentee))
      .filter((usn) => Boolean(usn)),
  );
  const duplicateGroupMenteeIds = new Set<number>();

  groups.forEach((group) => {
    if (Number(group.mentors_group_id) === Number(currentMentorsGroupId)) {
      return;
    }

    collectNestedGroupMentees(group).forEach((mentee) => {
      const groupMenteeId = Number(mentee.group_mentee_id ?? 0);
      if (groupMenteeId <= 0) {
        return;
      }

      const studentId = normalizeStudentId(mentee.student_id);
      if (studentId && selectedStudentIds.has(studentId)) {
        duplicateGroupMenteeIds.add(groupMenteeId);
        return;
      }

      const menteeUsn = getGroupMenteeUsn(mentee);
      if (menteeUsn && selectedUsns.has(menteeUsn)) {
        duplicateGroupMenteeIds.add(groupMenteeId);
      }
    });
  });

  return Array.from(duplicateGroupMenteeIds);
};

const isMappedInAnotherGroup = (
  mentee: Pick<MenteeRow, "student_id" | "usn">,
  otherGroupMappedStudentIdSet: Set<string>,
  otherGroupMappedUsnSet: Set<string>,
) =>
  otherGroupMappedStudentIdSet.has(normalizeStudentId(mentee.student_id)) ||
  Boolean(getEligibleMenteeUsn(mentee) && otherGroupMappedUsnSet.has(getEligibleMenteeUsn(mentee)));

const MapMenteesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const navigationState = (location.state || {}) as NavigationState;
  const mentorsGroupId =
    Number(navigationState.mentors_group_id) || parseNumericId(params.mentors_group_id);
  const routeAcademicBatchId =
    Number(navigationState.academic_batch_id) || parseNumericId(params.academic_batch_id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRecord[]>([]);
  const [academicBatches, setAcademicBatches] = useState<AcademicBatchRecord[]>([]);
  const [configurationTypes, setConfigurationTypes] = useState<ConfigurationType[]>([]);
  const [semesterRecords, setSemesterRecords] = useState<SemesterRecord[]>([]);
  const [mentorIds, setMentorIds] = useState<number[]>([]);
  const [otherGroupMappedStudentIds, setOtherGroupMappedStudentIds] = useState<string[]>([]);
  const [otherGroupMappedUsns, setOtherGroupMappedUsns] = useState<string[]>([]);
  const [currentGroupMenteeMap, setCurrentGroupMenteeMap] = useState<Map<number, number[]>>(
    () => new Map(),
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [allMentees, setAllMentees] = useState<MenteeRow[]>([]);
  const [formState, setFormState] = useState<FormState>({
    mentors_group_id: mentorsGroupId,
    academic_batch_id: routeAcademicBatchId,
    config_type_id: Number(navigationState.config_type_id ?? 0),
    questionnaire_id: Number(navigationState.questionnaire_id ?? 0),
    mentors_pgm_title: navigationState.mentors_pgm_title ?? "",
    semester_ids: [],
  });
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [isQuestionnaireModalVisible, setIsQuestionnaireModalVisible] = useState(false);
  const [isQuestionnaireModalClosing, setIsQuestionnaireModalClosing] = useState(false);
  const [isQuestionnaireModalLoading, setIsQuestionnaireModalLoading] = useState(false);
  const [questionnaireDetail, setQuestionnaireDetail] = useState<QuestionnaireDetail | null>(
    null,
  );
  const questionnaireModalCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const selectedQuestionnaire = useMemo(
    () =>
      questionnaires.find(
        (questionnaire) => questionnaire.questionnaire_id === formState.questionnaire_id,
      ),
    [formState.questionnaire_id, questionnaires],
  );

  const selectedAcademicBatch = useMemo(
    () =>
      academicBatches.find(
        (academicBatch) =>
          Number(academicBatch.academic_batch_id) === formState.academic_batch_id,
      ),
    [academicBatches, formState.academic_batch_id],
  );

  const selectedConfigurationTypeName = useMemo(
    () =>
      configurationTypes.find(
        (configurationType) =>
          Number(configurationType.config_type_id) === Number(formState.config_type_id),
      )?.config_type_name || "",
    [configurationTypes, formState.config_type_id],
  );

  const applicableTermsText = useMemo(
    () =>
      formState.semester_ids
        .map((semesterId) => {
          const semester = semesterRecords.find(
            (item) => Number(item.semester_id) === semesterId,
          );
          return formatApplicableTerm(semester, semesterId);
        })
        .join(", "),
    [formState.semester_ids, semesterRecords],
  );

  const questionnaireFieldSettingDescription =
    questionnaireDetail?.field_settings?.field_setting_desc ||
    questionnaireDetail?.field_setting_desc ||
    "";

  const questionnaireTypeText =
    questionnaireDetail?.questionnaire_type_name ||
    questionnaireDetail?.questionnaire_type ||
    questionnaireDetail?.questionnaire_title ||
    questionnaireDetail?.questionnaire_name ||
    selectedQuestionnaire?.questionnaire_name ||
    questionnaireDetail?.questions?.find(
      (question) => question.questionnaire_type_name || question.questionnaire_type,
    )?.questionnaire_type_name ||
    questionnaireDetail?.questions?.find(
      (question) => question.questionnaire_type_name || question.questionnaire_type,
    )?.questionnaire_type ||
    "";

  const initialCurrentGroupStudentIds = useMemo(
    () => Array.from(currentGroupMenteeMap.keys()),
    [currentGroupMenteeMap],
  );

  const addedStudentIds = useMemo(
    () => {
      const otherGroupMappedStudentIdSet = new Set(otherGroupMappedStudentIds);
      const otherGroupMappedUsnSet = new Set(otherGroupMappedUsns);
      const currentGroupStudentIdSet = new Set(initialCurrentGroupStudentIds);
      const menteeByStudentId = new Map(
        allMentees.map((mentee) => [mentee.student_id, mentee] as const),
      );

      return Array.from(
        new Set(
          selectedStudentIds.filter((studentId) => {
            if (currentGroupStudentIdSet.has(studentId)) {
              return false;
            }

            const mentee = menteeByStudentId.get(studentId);
            if (!mentee) {
              return false;
            }

            return !isMappedInAnotherGroup(
              mentee,
              otherGroupMappedStudentIdSet,
              otherGroupMappedUsnSet,
            );
          }),
        ),
      );
    },
    [
      allMentees,
      initialCurrentGroupStudentIds,
      otherGroupMappedStudentIds,
      otherGroupMappedUsns,
      selectedStudentIds,
    ],
  );

  const removedStudentIds = useMemo(
    () =>
      initialCurrentGroupStudentIds.filter(
        (studentId) => !selectedStudentIds.includes(studentId),
      ),
    [initialCurrentGroupStudentIds, selectedStudentIds],
  );

  const hasPendingChanges = addedStudentIds.length > 0 || removedStudentIds.length > 0;

  const visibleMentees = useMemo(
    () => allMentees.filter((mentee) => mentee.mappingState !== "other"),
    [allMentees],
  );

  const hasSelectableMentees = useMemo(
    () => visibleMentees.some((mentee) => mentee.mappingState === "unmapped"),
    [visibleMentees],
  );

  const menteeChunks = useMemo(() => {
    const chunkSize = 15;
    const chunks: MenteeRow[][] = [];

    for (let index = 0; index < visibleMentees.length; index += chunkSize) {
      chunks.push(visibleMentees.slice(index, index + chunkSize));
    }

    return chunks;
  }, [visibleMentees]);

  const deleteGroupMenteeIds = useMemo(
    () =>
      Array.from(
        new Set(
          removedStudentIds.flatMap((studentId) => currentGroupMenteeMap.get(studentId) || []),
        ),
      ),
    [currentGroupMenteeMap, removedStudentIds],
  );

  const closeToList = useCallback(() => {
    navigate("..", {
      state: {
        refreshKey: Date.now(),
        academic_batch_id: formState.academic_batch_id || routeAcademicBatchId,
      },
    });
  }, [formState.academic_batch_id, navigate, routeAcademicBatchId]);

  const closeQuestionnaireModal = useCallback(
    (immediate = false) =>
      new Promise<void>((resolve) => {
      if (!isQuestionnaireModalOpen) {
        setIsQuestionnaireModalVisible(false);
        setIsQuestionnaireModalClosing(false);
        resolve();
        return;
      }

      if (questionnaireModalCloseTimeoutRef.current) {
        clearTimeout(questionnaireModalCloseTimeoutRef.current);
        questionnaireModalCloseTimeoutRef.current = null;
      }

      if (immediate) {
        setIsQuestionnaireModalOpen(false);
        setIsQuestionnaireModalVisible(false);
        setIsQuestionnaireModalClosing(false);
        resolve();
        return;
      }

      if (isQuestionnaireModalClosing) {
        resolve();
        return;
      }

      setIsQuestionnaireModalClosing(true);
      setIsQuestionnaireModalVisible(false);
      questionnaireModalCloseTimeoutRef.current = setTimeout(() => {
        setIsQuestionnaireModalOpen(false);
        setIsQuestionnaireModalVisible(false);
        setIsQuestionnaireModalClosing(false);
        questionnaireModalCloseTimeoutRef.current = null;
        resolve();
      }, QUESTIONNAIRE_MODAL_CLOSE_DURATION_MS);
      }),
    [isQuestionnaireModalClosing, isQuestionnaireModalOpen],
  );

  const openQuestionnaireModal = async () => {
    if (!formState.questionnaire_id) {
      return;
    }

    try {
      setIsQuestionnaireModalOpen(true);
      setIsQuestionnaireModalClosing(false);
      setIsQuestionnaireModalVisible(false);
      setIsQuestionnaireModalLoading(true);
      requestAnimationFrame(() => {
        setIsQuestionnaireModalVisible(true);
      });

      const response = await axiosInstance.get<ApiEnvelope<QuestionnaireDetail>>(
        `${ApiEndpoint.questionnaire.questionnaire_full}/${formState.questionnaire_id}`,
      );

      setQuestionnaireDetail(response.data?.data || null);
    } catch (error: any) {
      await closeQuestionnaireModal(true);
      toast.error(getErrorMessage(error, "Unable to load questionnaire data"));
    } finally {
      setIsQuestionnaireModalLoading(false);
    }
  };

  const refreshCurrentGroupMentees = useCallback(async () => {
    const response = await axiosInstance.get<ApiEnvelope<GroupMenteeMapping[]>>(
      `${ApiEndpoint.mentorMentee.mentees}/${mentorsGroupId}`,
    );

    const nextCurrentGroupMenteeMap = buildCurrentGroupMenteeMap(response.data?.data || []);
    const nextMappedStudentIds = Array.from(new Set(nextCurrentGroupMenteeMap.keys()));

    setCurrentGroupMenteeMap(nextCurrentGroupMenteeMap);
    setSelectedStudentIds(nextMappedStudentIds);

    return {
      currentGroupMenteeMap: nextCurrentGroupMenteeMap,
      mappedStudentIds: nextMappedStudentIds,
    };
  }, [mentorsGroupId]);

  const applyGroupListState = useCallback(
    (groups: GroupListRecord[], currentMappedStudentIds: number[]) => {
      const matchingGroup =
        groups.find(
          (group) => Number(group.mentors_group_id) === Number(formState.mentors_group_id),
        ) || null;
      const { otherGroupMappedStudentIdSet, otherGroupMappedUsnSet } =
        buildOtherGroupMappedLookup(groups, formState.mentors_group_id);

      setOtherGroupMappedStudentIds(Array.from(otherGroupMappedStudentIdSet));
      setOtherGroupMappedUsns(Array.from(otherGroupMappedUsnSet));
      setMentorIds(buildMentorIds(matchingGroup));

      if (matchingGroup) {
        setFormState((current) => ({
          ...current,
          academic_batch_id:
            Number(matchingGroup.academic_batch_id) || current.academic_batch_id,
          config_type_id: Number(matchingGroup.config_type_id ?? current.config_type_id ?? 0),
          questionnaire_id:
            Number(matchingGroup.questionnaire_id ?? current.questionnaire_id ?? 0),
          mentors_pgm_title: matchingGroup.mentors_pgm_title?.trim() || current.mentors_pgm_title,
        }));
      }

      setAllMentees((current) =>
        [...current]
          .map((row): MenteeRow => {
            const mappingState: MenteeRow["mappingState"] = currentMappedStudentIds.includes(
              row.student_id,
            )
              ? "current"
              : isMappedInAnotherGroup(
                    row,
                    otherGroupMappedStudentIdSet,
                    otherGroupMappedUsnSet,
                  )
                ? "other"
                : "unmapped";

            return {
              ...row,
              mappingState,
            };
          })
          .sort((left, right) =>
            left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
          ),
      );

      return {
        matchingGroup,
        otherGroupMappedStudentIdSet,
        otherGroupMappedUsnSet,
      };
    },
    [formState.mentors_group_id],
  );

  const refreshGroupMappings = useCallback(
    async (currentMappedStudentIds: number[]) => {
      const response = await axiosInstance.get<ApiEnvelope<GroupListRecord[]>>(
        `${ApiEndpoint.mentorMentee.groups_by_academic_batch}/${formState.academic_batch_id}`,
      );

      return applyGroupListState(response.data?.data || [], currentMappedStudentIds);
    },
    [applyGroupListState, formState.academic_batch_id],
  );

  useEffect(() => {
    if (!isQuestionnaireModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void closeQuestionnaireModal();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeQuestionnaireModal, isQuestionnaireModalOpen]);

  useEffect(() => {
    return () => {
      if (questionnaireModalCloseTimeoutRef.current) {
        clearTimeout(questionnaireModalCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      if (!mentorsGroupId) {
        toast.error("Please select a mentor group");
        closeToList();
        return;
      }

        try {
          setIsLoading(true);
          setLoadError("");
          setMentorIds([]);
          setOtherGroupMappedStudentIds([]);
          setOtherGroupMappedUsns([]);
          setCurrentGroupMenteeMap(new Map());

        const [
          questionnaireResponse,
          academicBatchResponse,
          configurationTypesResponse,
          groupResponse,
          mappedMenteesResponse,
        ] = await Promise.all([
          axiosInstance.get<ApiEnvelope<QuestionnaireRecord[]>>(
            ApiEndpoint.questionnaire.questionnaire_list,
          ),
          axiosInstance.get<ApiEnvelope<AcademicBatchRecord[]>>(
            ApiEndpoint.mentorMentee.academic_batch_list,
          ),
          axiosInstance.get<ApiEnvelope<ConfigurationType[]>>(
            "lms_mentors_group/get_config_types",
          ),
          axiosInstance.get<ApiEnvelope<GroupCompleteResponse>>(
            `${ApiEndpoint.mentorMentee.group_complete}/${mentorsGroupId}`,
          ),
          axiosInstance.get<ApiEnvelope<GroupMenteeMapping[]>>(
            `${ApiEndpoint.mentorMentee.mentees}/${mentorsGroupId}`,
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setQuestionnaires(questionnaireResponse.data?.data || []);
        setAcademicBatches(academicBatchResponse.data?.data || []);
        setConfigurationTypes(configurationTypesResponse.data?.data || []);

        const fullGroup = groupResponse.data?.data?.group;
        const semesterIds = (groupResponse.data?.data?.semester_ids || []).map((value) =>
          Number(value),
        );

        if (!fullGroup?.mentors_group_id) {
          throw new Error("Mentor group details not found");
        }

        const nextFormState = {
          mentors_group_id: Number(fullGroup.mentors_group_id),
          academic_batch_id: Number(fullGroup.academic_batch_id || routeAcademicBatchId),
          config_type_id: Number(fullGroup.config_type_id ?? 0),
          questionnaire_id: Number(fullGroup.questionnaire_id ?? 0),
          mentors_pgm_title: fullGroup.mentors_pgm_title?.trim() || "",
          semester_ids: semesterIds,
        };

        setFormState(nextFormState);

        const nextCurrentGroupMenteeMap = buildCurrentGroupMenteeMap(
          mappedMenteesResponse.data?.data || [],
        );
        const nextMappedStudentIds = Array.from(new Set(nextCurrentGroupMenteeMap.keys()));
        setCurrentGroupMenteeMap(nextCurrentGroupMenteeMap);
        setSelectedStudentIds(nextMappedStudentIds);

        const [
          semesterResponse,
          menteeResponse,
          questionnaireDetailResponse,
          groupListResponse,
        ] = await Promise.allSettled([
          axiosInstance.get<ApiEnvelope<SemesterRecord[]>>(
            `${ApiEndpoint.mentorMentee.semesters_by_academic_batch}/${nextFormState.academic_batch_id}`,
          ),
          axiosInstance.get<ApiEnvelope<EligibleMenteeApi[]>>(
            `lms_mentors_group/get_all_mentees?academic_batch_id=${nextFormState.academic_batch_id}`,
          ),
          nextFormState.questionnaire_id
            ? axiosInstance.get<ApiEnvelope<QuestionnaireDetail>>(
                `${ApiEndpoint.questionnaire.questionnaire_full}/${nextFormState.questionnaire_id}`,
              )
            : Promise.resolve({ data: { data: null } }),
          axiosInstance.get<ApiEnvelope<GroupListRecord[]>>(
            `${ApiEndpoint.mentorMentee.groups_by_academic_batch}/${nextFormState.academic_batch_id}`,
          ),
        ]);

        if (!isMounted) {
          return;
        }

        if (semesterResponse.status === "fulfilled") {
          setSemesterRecords(semesterResponse.value.data?.data || []);
        } else {
          setSemesterRecords([]);
        }

        if (questionnaireDetailResponse.status === "fulfilled") {
          setQuestionnaireDetail(questionnaireDetailResponse.value.data?.data || null);
        } else {
          setQuestionnaireDetail(null);
        }

        if (groupListResponse.status !== "fulfilled") {
          throw groupListResponse.reason;
        }

        const matchingGroup =
          (groupListResponse.value.data?.data || []).find(
            (group) => Number(group.mentors_group_id) === nextFormState.mentors_group_id,
          ) || null;

        const { otherGroupMappedStudentIdSet, otherGroupMappedUsnSet } =
          buildOtherGroupMappedLookup(
            groupListResponse.value.data?.data || [],
            nextFormState.mentors_group_id,
          );

        setOtherGroupMappedStudentIds(Array.from(otherGroupMappedStudentIdSet));
        setOtherGroupMappedUsns(Array.from(otherGroupMappedUsnSet));

          setMentorIds(buildMentorIds(matchingGroup));

        if (matchingGroup) {
          setFormState((current) => ({
            ...current,
            academic_batch_id:
              Number(matchingGroup.academic_batch_id) || current.academic_batch_id,
            config_type_id: Number(matchingGroup.config_type_id ?? current.config_type_id ?? 0),
            questionnaire_id:
              Number(matchingGroup.questionnaire_id ?? current.questionnaire_id ?? 0),
            mentors_pgm_title:
              matchingGroup.mentors_pgm_title?.trim() || current.mentors_pgm_title,
          }));
        }

        if (menteeResponse.status !== "fulfilled") {
          throw menteeResponse.reason;
        }

        const eligibleRows = dedupeMenteesByStudentId(
          (menteeResponse.value.data?.data || [])
          .map(normalizeEligibleMentee)
          .filter((item): item is MenteeRow => item !== null),
        );

        setAllMentees(
          eligibleRows
            .map((row): MenteeRow => {
              const mappingState: MenteeRow["mappingState"] = nextMappedStudentIds.includes(
                row.student_id,
              )
                ? "current"
                : isMappedInAnotherGroup(
                      row,
                      otherGroupMappedStudentIdSet,
                      otherGroupMappedUsnSet,
                    )
                  ? "other"
                  : "unmapped";

              return {
                ...row,
                mappingState,
              };
            })
            .sort((left, right) =>
              left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
            ),
        );
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

          const message = getErrorMessage(error, "Unable to load mentee details");
          setLoadError(message);
          setMentorIds([]);
          setOtherGroupMappedStudentIds([]);
          setOtherGroupMappedUsns([]);
          setCurrentGroupMenteeMap(new Map());
        setSelectedStudentIds([]);
        setAllMentees([]);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, [closeToList, mentorsGroupId, routeAcademicBatchId]);

  const toggleStudent = (studentId: number, checked: boolean) => {
    setSelectedStudentIds((current) => {
      if (checked) {
        const mentee = allMentees.find((item) => item.student_id === studentId);
        if (
          mentee &&
          isMappedInAnotherGroup(
            mentee,
            new Set(otherGroupMappedStudentIds),
            new Set(otherGroupMappedUsns),
          )
        ) {
          return current;
        }

        return Array.from(new Set([...current, studentId]));
      }

      return current.filter((id) => id !== studentId);
    });
  };

  const saveMentees = async () => {
    if (!formState.mentors_group_id) {
      toast.error("Mentor group details are unavailable");
      return;
    }

    if (mentorIds.length === 0) {
      toast.error("Please add mentors before mapping mentees");
      return;
    }

    if (!hasPendingChanges) {
      toast.info("No changes to save");
      return;
    }

    try {
      setIsSaving(true);
      let successMessage = "Mentees mapped successfully";
      const latestGroupList = await refreshGroupMappings(initialCurrentGroupStudentIds);
      const invalidSelectedStudentIds = Array.from(
        new Set(
          selectedStudentIds.filter((studentId) => {
            if (initialCurrentGroupStudentIds.includes(studentId)) {
              return false;
            }

            const mentee = allMentees.find((item) => item.student_id === studentId);
            if (!mentee) {
              return false;
            }

            return isMappedInAnotherGroup(
              mentee,
              latestGroupList.otherGroupMappedStudentIdSet,
              latestGroupList.otherGroupMappedUsnSet,
            );
          }),
        ),
      );

      if (invalidSelectedStudentIds.length > 0) {
        setSelectedStudentIds((current) =>
          current.filter((studentId) => !invalidSelectedStudentIds.includes(studentId)),
        );
        toast.error("Selected mentee is already mapped in another group");
        return;
      }

      if (addedStudentIds.length > 0) {
        const response = await axiosInstance.post<ApiEnvelope<{ records_created: number }>>(
          ApiEndpoint.mentorMentee.save_mentees,
          {
            mentors_group_id: formState.mentors_group_id,
            mentor_ids: mentorIds,
            mentee_ids: Array.from(new Set(addedStudentIds)),
          },
        );

        successMessage = getResponseMessage(response.data?.message, successMessage);
      }

        if (deleteGroupMenteeIds.length > 0) {
          // Duplicate group_mentee_id records can exist for the same student_id,
          // so every mapping ID for a removed student must be deleted.
          await Promise.all(
          deleteGroupMenteeIds.map((groupMenteeId) =>
            axiosInstance.delete(
              `${ApiEndpoint.mentorMentee.delete_mentee}/${groupMenteeId}`,
            ),
          ),
          );
        }

        let { mappedStudentIds } = await refreshCurrentGroupMentees();

        if (addedStudentIds.length > 0) {
          const savedMentees = Array.from(new Set(addedStudentIds))
            .map((studentId) => allMentees.find((mentee) => mentee.student_id === studentId))
            .filter((mentee): mentee is MenteeRow => Boolean(mentee));

          try {
            const latestGroupListResponse = await axiosInstance.get<ApiEnvelope<GroupListRecord[]>>(
              `${ApiEndpoint.mentorMentee.groups_by_academic_batch}/${formState.academic_batch_id}`,
            );
            const duplicateGroupMenteeIds = collectDuplicateGroupMenteeIds(
              latestGroupListResponse.data?.data || [],
              formState.mentors_group_id,
              savedMentees,
            );

            if (duplicateGroupMenteeIds.length > 0) {
              await Promise.all(
                duplicateGroupMenteeIds.map((groupMenteeId) =>
                  axiosInstance.delete(
                    `${ApiEndpoint.mentorMentee.delete_mentee}/${groupMenteeId}`,
                  ),
                ),
              );

                ({ mappedStudentIds } = await refreshCurrentGroupMentees());
              }
            } catch (error: any) {
              try {
                await refreshGroupMappings(mappedStudentIds);
              } catch {
                // Preserve the save result even if the warning-state refresh also fails.
              }
              toast.warn("Mentee saved, but duplicate cleanup failed. Please refresh and verify.");
              return;
            }
          }

        await refreshGroupMappings(mappedStudentIds);

        toast.success(successMessage);
        closeToList();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to map mentees"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!mentorsGroupId) {
    return <div className="p-4">Select a mentor group first.</div>;
  }

  const questionnaireModal = isQuestionnaireModalOpen
    ? createPortal(
        <div
          className={`fixed inset-0 z-[9999] overflow-y-auto bg-black/55 px-4 pt-[72px] transition-opacity motion-reduce:transition-none ${
            isQuestionnaireModalVisible
              ? "opacity-100 duration-[220ms] ease-out"
              : "opacity-0 duration-[180ms] ease-in"
          }`}
          onClick={() => {
            void closeQuestionnaireModal();
          }}
        >
          <div
            className={`mx-auto w-full max-w-[950px] rounded-[4px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-all motion-reduce:transition-none ${
              isQuestionnaireModalVisible
                ? "translate-y-0 scale-100 opacity-100 duration-[220ms] ease-out"
                : "-translate-y-8 scale-[0.98] opacity-0 duration-[180ms] ease-in"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#e5e5e5] px-5 py-3">
              <h3 className="text-[20px] font-normal leading-6 !text-black">
                Questionnaire Details
              </h3>
            </div>

            <div className="max-h-[calc(100vh-230px)] overflow-y-auto px-5 py-4">
              {isQuestionnaireModalLoading ? (
                <div className="py-10 text-center text-[15px] text-gray-600">
                  Loading questionnaire details...
                </div>
              ) : (
                <>
                  <div className="mb-4 grid gap-y-[2px] pl-[2px] text-[15px] leading-7 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-3">
                    <span className="font-semibold text-[#333333]">Questionnaire Type:</span>
                    <span className="text-[#444444]">{questionnaireTypeText}</span>
                    <span className="font-semibold text-[#333333]">Message to Mentees:</span>
                    <span className="text-[#444444]">
                      {questionnaireDetail?.message_to_mentees || ""}
                    </span>
                  </div>

                  <table className="w-full border-collapse border border-[#cfd8e3] text-[15px]">
                    <thead>
                      <tr className="bg-white">
                        <th className="w-[150px] border border-[#cfd8e3] px-3 py-[8px] text-center font-semibold text-[#333333]">
                          Q. No.
                        </th>
                        <th className="border border-[#cfd8e3] px-3 py-[8px] text-left font-semibold text-[#333333]">
                          Questions &amp; Options
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionnaireFieldSettingDescription ? (
                        <tr className="bg-[#d9edf7]">
                          <td
                            colSpan={2}
                            className="border border-[#cfd8e3] px-3 py-[9px] text-[15px] text-[#333333]"
                          >
                            <span className="font-semibold">Field Setting:</span>{" "}
                            {questionnaireFieldSettingDescription}
                          </td>
                        </tr>
                      ) : null}

                      {(questionnaireDetail?.questions || []).map((question, index) => {
                        const visibleOptions = (question.options || []).filter(
                          (option) => Boolean(option.que_option?.trim()) || option.specify_flag,
                        );

                        return (
                          <tr
                            key={
                              question.questionnaire_que_id ||
                              `${question.que_no || index + 1}-${index}`
                            }
                          >
                            <td className="border border-[#cfd8e3] px-3 py-[8px] align-top text-center text-[#333333]">
                              {question.que_no || index + 1}
                            </td>
                            <td className="border border-[#cfd8e3] px-3 py-[8px] align-top text-[#333333]">
                              <div>{question.question || ""}</div>
                              {visibleOptions.length > 0 ? (
                                <div className="mt-1 grid gap-x-14 gap-y-1 pl-5 md:grid-cols-2">
                                  {visibleOptions.map((option, optionIndex) => (
                                    <div
                                      key={
                                        option.questionnaire_options_id ||
                                        `${question.que_no || index + 1}-${optionIndex}`
                                      }
                                      className="whitespace-pre-wrap text-[14px] text-gray-700"
                                    >
                                      {String.fromCharCode(65 + optionIndex)}.{" "}
                                      {option.que_option || ""}
                                      {option.specify_flag ? " __________ (Specify)" : ""}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-[#e5e5e5] px-5 py-4">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded bg-[#d9534f] px-5 py-[9px] text-[15px] text-white hover:bg-[#c74642]"
                onClick={() => {
                  void closeQuestionnaireModal();
                }}
              >
                <FaTimes className="text-[13px]" />
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const questionnaireDisplayTitle =
    selectedQuestionnaire?.questionnaire_name ||
    questionnaireDetail?.questionnaire_name ||
    questionnaireDetail?.questionnaire_title ||
    "-";

  const questionnaireDisplayType =
    questionnaireTypeText && questionnaireTypeText !== questionnaireDisplayTitle
      ? questionnaireTypeText
      : "";

  return (
    <MmpModuleShell title="Add mentees">
      <div className="map-mentees-page">
        <style>
          {`
            section:has(.map-mentees-page) > div:first-child {
              margin-bottom: 0 !important;
              min-height: 32px;
              padding: 4px 20px !important;
            }

            section:has(.map-mentees-page) > div:first-child h2 {
              font-size: 18px !important;
              line-height: 1.2 !important;
              font-weight: 400 !important;
              font-family: inherit !important;
              letter-spacing: 0 !important;
            }

            .map-mentees-page .map-mentees-details {
              margin-top: 21px;
            }

            .map-mentees-page .map-mentees-details-layout {
              display: grid;
              grid-template-columns: minmax(0, 625px) auto;
              align-items: end;
              justify-content: start;
              column-gap: 22px;
              row-gap: 10px;
            }

            .map-mentees-page .map-mentees-details-table-wrap {
              width: 625px;
              max-width: 100%;
              overflow: hidden;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              background: #ffffff;
            }

            .map-mentees-page .map-mentees-details-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 12.75px;
            }

            .map-mentees-page .map-mentees-details-table th {
              width: 140px;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              background: #fafafa;
              color: #1f2937 !important;
              font-size: 13px !important;
              font-weight: 600 !important;
              line-height: 1.3 !important;
              text-align: left;
              vertical-align: top;
              white-space: nowrap;
              min-height: 38px;
            }

            .map-mentees-page .map-mentees-details-table td {
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              color: #1f2937;
              font-size: 13px !important;
              font-weight: 400 !important;
              line-height: 1.3 !important;
              vertical-align: top;
              min-height: 38px;
            }

            .map-mentees-page .map-mentees-questionnaire-link {
              align-self: end;
              margin-bottom: 6px;
              color: #337ab7;
              font-size: 13px;
              line-height: 1.2;
              white-space: nowrap;
            }

            .map-mentees-page .map-mentees-questionnaire-link:hover {
              color: #f0ad4e;
              text-decoration: underline;
            }

            .map-mentees-page .map-mentees-list {
              margin-top: 17px;
            }

            .map-mentees-page .map-mentees-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 16px 24px;
              align-items: flex-start;
            }

            .map-mentees-page .map-mentees-block {
              width: min(398px, 100%);
              max-width: 100%;
              overflow: hidden;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              background: #ffffff;
            }

            .map-mentees-page .map-mentees-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 12.75px;
            }

            .map-mentees-page .map-mentees-table th {
              padding: 8px 12px;
              border-bottom: 1px solid #d1d5db;
              border-right: 1px solid #d1d5db;
              color: #111827;
              font-size: 12.75px;
              font-weight: 600;
              text-align: left;
            }

            .map-mentees-page .map-mentees-table th:last-child,
            .map-mentees-page .map-mentees-table td:last-child {
              border-right: 0;
            }

            .map-mentees-page .map-mentees-table td {
              padding: 8px 12px;
              border-bottom: 1px solid #d1d5db;
              border-right: 1px solid #d1d5db;
              color: #374151;
              font-size: 12.75px;
              font-weight: 400;
              vertical-align: middle;
            }

            .map-mentees-page .map-mentees-table tbody tr:last-child td {
              border-bottom: 0;
            }

            .map-mentees-page .map-mentees-slno-col {
              width: 82px;
            }

            .map-mentees-page .map-mentees-name-cell {
              white-space: nowrap;
            }

            .map-mentees-page .map-mentees-actions {
              margin-top: 18px;
            }

            @media (max-width: 1279px) {
              .map-mentees-page .map-mentees-details-layout {
                grid-template-columns: minmax(0, 625px);
              }

              .map-mentees-page .map-mentees-questionnaire-link {
                margin-bottom: 0;
              }
            }

            @media (max-width: 767px) {
              .map-mentees-page .map-mentees-details-table th,
              .map-mentees-page .map-mentees-details-table td,
              .map-mentees-page .map-mentees-table th,
              .map-mentees-page .map-mentees-table td {
                padding-left: 10px;
                padding-right: 10px;
              }

              .map-mentees-page .map-mentees-name-cell {
                white-space: normal;
              }
            }
          `}
        </style>

        <div className="map-mentees-details text-sm">
          <div className="map-mentees-details-layout">
            <div className="map-mentees-details-table-wrap">
              <table className="map-mentees-details-table">
              <tbody>
                <tr>
                  <th>
                    Curriculum
                  </th>
                  <td>
                    {selectedAcademicBatch?.academic_batch_desc ||
                      formState.academic_batch_id ||
                      routeAcademicBatchId ||
                      "-"}
                  </td>
                </tr>
                <tr>
                  <th>Applicable Terms</th>
                  <td>
                    {applicableTermsText || "-"}
                  </td>
                </tr>
                <tr>
                  <th>
                    Group Title
                  </th>
                  <td>
                    {formState.mentors_pgm_title || "-"}
                  </td>
                </tr>
                <tr>
                  <th>
                    Configuration
                    <br />
                    Type
                  </th>
                  <td>
                    {formState.config_type_id && selectedConfigurationTypeName
                      ? selectedConfigurationTypeName
                      : "Configuration types not available"}
                  </td>
                </tr>
                <tr>
                  <th>
                    Questionnaire
                    <br />
                    Type
                  </th>
                  <td>
                    <div>{questionnaireDisplayTitle}</div>
                    {questionnaireDisplayType ? (
                      <div className="text-[12px] leading-4 text-gray-500">
                        Type: {questionnaireDisplayType}
                      </div>
                    ) : null}
                  </td>
                </tr>
              </tbody>
              </table>
            </div>

            {formState.questionnaire_id ? (
              <button
                type="button"
                className="map-mentees-questionnaire-link"
                onClick={() => void openQuestionnaireModal()}
              >
                View questionnaires
              </button>
            ) : null}
          </div>
        </div>

        <div className="map-mentees-list">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading mentees...</div>
        ) : loadError ? (
          <div className="p-6 text-center text-sm text-red-600">{loadError}</div>
        ) : visibleMentees.length === 0 ? (
          <div className="p-10 text-center text-[16px] font-medium text-gray-700">
            No eligible mentees available
          </div>
        ) : (
            <>
            {!hasSelectableMentees ? (
              <div className="px-6 pt-5 text-center text-sm text-gray-500">
                No eligible mentees available
              </div>
            ) : null}
            <div className="map-mentees-grid">
            {menteeChunks.map((chunk, chunkIndex) => (
              <div
                key={`mentee-chunk-${chunkIndex}`}
                  className="map-mentees-block"
              >
                  <table className="map-mentees-table">
                  <thead className="bg-white">
                    <tr>
                        <th className="map-mentees-slno-col">
                        Sl. No.
                      </th>
                        <th>
                        Mentee Name
                      </th>
                      <th className="w-[74px]">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((mentee, index) => {
                      const globalIndex = chunkIndex * 15 + index;
                      const isMappedToCurrentGroup = mentee.mappingState === "current";
                      const isMappedToAnotherGroup = mentee.mappingState === "other";
                      const isDisabled = isMappedToAnotherGroup;
                      const isChecked = selectedStudentIds.includes(mentee.student_id);
                      const checkboxTitle = isMappedToAnotherGroup
                        ? "Already mapped to another group"
                        : isMappedToCurrentGroup
                          ? "Already mapped to this group"
                          : undefined;

                      return (
                        <tr key={mentee.student_id}>
                            <td>
                            <label className="inline-flex items-center gap-[8px]">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                title={checkboxTitle}
                                onChange={(event) =>
                                  toggleStudent(mentee.student_id, event.target.checked)
                                }
                              />
                                <span className="text-[13.5px] font-normal text-gray-800">
                                {globalIndex + 1}
                              </span>
                            </label>
                          </td>
                            <td>
                            <div
                                className={`map-mentees-name-cell text-[13.5px] font-normal ${
                                isMappedToAnotherGroup ? "text-gray-700" : "text-gray-800"
                              }`}
                              title={getMenteeEmailTooltip(mentee.email)}
                            >
                              {buildMenteeName(mentee)}
                            </div>
                          </td>
                          <td className="text-[13.5px] font-normal text-gray-700">
                            {mentee.section || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          </>
        )}
        </div>

        <div className="map-mentees-actions flex justify-end gap-3">
          <UIButton
            type="button"
            onClick={saveMentees}
            isDisabled={
              isSaving || isLoading || Boolean(loadError) || !hasPendingChanges
            }
            className="bg-[#5cb85c] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#4da64d]"
          >
            <span className="mr-1 inline-flex items-center">
              <FaRegFileAlt className="text-[13px]" />
            </span>
            {isSaving ? "Saving..." : "Save"}
          </UIButton>
          <UIButton
            type="button"
            onClick={closeToList}
            className="bg-[#d9534f] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#c74642]"
          >
            <span className="mr-1 inline-flex items-center">
              <FaTimes className="text-[13px]" />
            </span>
            Close
          </UIButton>
        </div>
      </div>
      {questionnaireModal}
    </MmpModuleShell>
  );
};

export default MapMenteesPage;
