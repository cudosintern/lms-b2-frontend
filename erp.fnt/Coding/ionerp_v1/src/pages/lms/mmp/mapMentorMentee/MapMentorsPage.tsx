import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaChevronDown,
  FaInfoCircle,
  FaRegFileAlt,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import MmpModuleShell from "../components/MmpModuleShell";

type MentorMapping = {
  map_mentor_id?: number;
  mentor_id: number;
  mentors_group_id?: number;
  mentor_name?: string;
  user_name?: string;
  email?: string;
};

type GroupCompleteResponse = {
  group: {
    mentors_group_id: number;
    academic_batch_id: number;
    config_type_id: number;
    questionnaire_id: number;
    mentors_pgm_title: string;
  };
  semester_ids: number[];
};

type QuestionnaireRecord = {
  questionnaire_id: number;
  questionnaire_name: string;
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
  questionnaire_type_id?: number;
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

type ApiEnvelope<T> = {
  data?: T;
};

type QuestionnaireListResponse = ApiEnvelope<QuestionnaireRecord[]>;
type AcademicBatchListResponse = ApiEnvelope<AcademicBatchRecord[]>;

type GroupCompleteApiResponse = ApiEnvelope<GroupCompleteResponse>;

type MentorMappingsApiResponse = ApiEnvelope<MentorMapping[]>;

type SemesterOptionRecord = {
  semester_id?: number;
  semester?: number | string;
  semester_code?: string;
  term_name?: string;
  semester_desc?: string;
  program_year?: number | string;
  academic_start_year?: number | string;
  academic_end_year?: number | string;
};

type MentorCandidate = {
  mentor_id: number;
  mentor_name: string;
  email?: string;
  is_cross_department: boolean;
  mapped_groups: MentorGroupDisplay[];
};

type MentorLookupEntry = {
  mentor_id: number;
  mentor_name?: string;
  email?: string;
  is_cross_department?: boolean;
  mapped_groups: MentorGroupDisplay[];
};

type MentorGroupDisplay = {
  key: string;
  curriculum: string;
  groupName: string;
};

type MentorCandidateApiRecord = {
  mentor_id?: number;
  mentor_name?: string;
  email?: string;
  title?: string;
  mobile?: string;
  department?: string;
  is_cross_department?: boolean;
  mapped_groups?: Array<{
    mentor_group_id?: number;
    mentor_group_name?: string;
    group_name?: string;
    mentors_pgm_title?: string;
    curriculum_name?: string;
    academic_batch_desc?: string;
    academic_batch_name?: string;
    mapped_groups?: Array<Record<string, unknown>>;
  }>;
};

type GroupByAcademicBatchMentorRecord = {
  group_mentor_id?: number;
  mentor_id?: number;
  mentor_name?: string;
  user_name?: string;
  email?: string;
  is_cross_department?: boolean;
};

type GroupByAcademicBatchRecord = {
  mentors_group_id?: number;
  academic_batch_id?: number;
  academic_batch_desc?: string;
  curriculum_name?: string;
  mentors_pgm_title?: string;
  group_name?: string;
  mentors?: GroupByAcademicBatchMentorRecord[];
};

type ConfigurationType = {
  config_type_id: number;
  config_type_name: string;
  min_mentees_per_mentor?: number;
  max_mentees_per_mentor?: number;
};

type TermOption = {
  semester_id: number;
  label: string;
};

type SemesterOptionsResponse = ApiEnvelope<SemesterOptionRecord[]>;
type QuestionnaireDetailResponse = ApiEnvelope<QuestionnaireDetail>;
type MentorCandidatesResponse = ApiEnvelope<MentorCandidateApiRecord[]>;
type GroupsByAcademicBatchResponse = ApiEnvelope<GroupByAcademicBatchRecord[]>;

type MentorGroupSaveResponse = {
  message?: string;
  mentors_group_id?: number;
  data?: {
    mentors_group_id?: number;
  };
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const normalizeTermOption = (term: SemesterOptionRecord): TermOption | null => {
  const semester_id = Number(term.semester_id ?? 0);
  if (!semester_id) {
    return null;
  }

  return {
    semester_id,
    label: term.semester_desc?.trim() || term.term_name?.trim() || `${semester_id}`,
  };
};

const getResponseMessage = (message?: string, fallback = "Completed") =>
  message?.trim() || fallback;

const getErrorMessage = (error: ApiError, fallback: string) =>
  error.response?.data?.message || fallback;

const getAllMentorsEndpoint = (academicBatchId: number) =>
  `lms_mentors_group/get_all_mentors/${academicBatchId}`;

const getMentorEmailTooltip = (email?: string) =>
  email?.trim() ? `Email: ${email.trim()}` : "Email not available";

const normalizeMentorId = (value: unknown) => {
  const mentorId = Number(value ?? 0);
  return Number.isFinite(mentorId) && mentorId > 0 ? mentorId : 0;
};

const normalizeMentorName = (value?: string) => value?.trim() || undefined;

const flattenMappedGroups = (value: unknown): Record<string, unknown>[] => {
  const queue = Array.isArray(value) ? [...value] : value ? [value] : [];
  const flattened: Record<string, unknown>[] = [];

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
    const hasMappingFields = [
      "mentor_group_id",
      "mentor_group_name",
      "group_name",
      "mentors_pgm_title",
      "curriculum_name",
      "academic_batch_desc",
      "academic_batch_name",
    ].some((field) => field in record);

    if (hasMappingFields) {
      flattened.push(record);
    }

    ["mapped_groups", "groups", "mappings", "group_mappings", "group_details"].forEach(
      (field) => {
        if (field in record && record[field]) {
          queue.push(record[field]);
        }
      },
    );
  }

  return flattened;
};

const mergeMappedGroups = (...groupLists: MentorGroupDisplay[][]) => {
  const merged = new Map<string, MentorGroupDisplay>();

  groupLists.flat().forEach((group) => {
    const curriculum = group.curriculum?.trim() || "";
    const groupName = group.groupName?.trim() || "";

    if (!curriculum && !groupName) {
      return;
    }

    const dedupeKey = `${curriculum.toLowerCase()}::${groupName.toLowerCase()}`;
    merged.set(dedupeKey, {
      key: group.key || dedupeKey,
      curriculum,
      groupName,
    });
  });

  return Array.from(merged.values());
};

const mergeMentorLookupEntry = (
  lookup: Map<number, MentorLookupEntry>,
  incoming: MentorLookupEntry,
) => {
  const mentorId = normalizeMentorId(incoming.mentor_id);
  if (!mentorId) {
    return;
  }

  const existing = lookup.get(mentorId);
  lookup.set(mentorId, {
    mentor_id: mentorId,
    mentor_name: existing?.mentor_name || normalizeMentorName(incoming.mentor_name),
    email: existing?.email || incoming.email?.trim() || undefined,
    is_cross_department: Boolean(
      existing?.is_cross_department || incoming.is_cross_department,
    ),
    mapped_groups: mergeMappedGroups(existing?.mapped_groups || [], incoming.mapped_groups),
  });
};

const buildMentorCandidates = (
  lookup: Map<number, MentorLookupEntry>,
  baseMentorIds: number[],
  selectedMentorIds: number[],
  includeSelectedFallback: boolean,
) => {
  const orderedIds = Array.from(
    new Set([
      ...baseMentorIds.filter((mentorId) => normalizeMentorId(mentorId) > 0),
      ...(includeSelectedFallback ? selectedMentorIds : []),
    ]),
  );

  return orderedIds
    .map((mentorId) => {
      const mentor = lookup.get(mentorId);
      return {
        mentor_id: mentorId,
        mentor_name: mentor?.mentor_name || `Mentor ID: ${mentorId}`,
        email: mentor?.email,
        is_cross_department: Boolean(mentor?.is_cross_department),
        mapped_groups: mentor?.mapped_groups || [],
      };
    })
    .sort((left, right) => left.mentor_id - right.mentor_id);
};

const normalizeMappedGroups = (
  mappedGroups: MentorCandidateApiRecord["mapped_groups"],
  fallbackCurriculum: string,
) => {
  const normalized = new Map<string, MentorGroupDisplay>();

  flattenMappedGroups(mappedGroups).forEach((group, index) => {
    const groupName =
      String(
        group.mentor_group_name ??
          group.group_name ??
          group.mentors_pgm_title ??
          "",
      ).trim();
    const curriculum =
      String(
        group.curriculum_name ??
          group.academic_batch_desc ??
          group.academic_batch_name ??
          fallbackCurriculum ??
          "",
      ).trim();
    const groupId = Number(group.mentor_group_id ?? 0);

    if (!groupName && !curriculum) {
      return;
    }

    const key = `${groupId || "group"}-${groupName || "name"}-${curriculum || "curriculum"}-${index}`;
    normalized.set(key, {
      key,
      curriculum,
      groupName,
    });
  });

  return Array.from(normalized.values());
};

const getRealMappedGroups = (mappedGroups: MentorGroupDisplay[]) =>
  mappedGroups.filter(
    (mappedGroup) =>
      Boolean(mappedGroup.curriculum?.trim()) || Boolean(mappedGroup.groupName?.trim()),
  );

const hasRealMappedGroups = (mappedGroups: MentorGroupDisplay[]) =>
  getRealMappedGroups(mappedGroups).length > 0;

const normalizeMentorCandidate = (
  mentor: MentorCandidateApiRecord,
  fallbackCurriculum: string,
): MentorLookupEntry | null => {
  const mentor_id = normalizeMentorId(mentor.mentor_id);
  if (!mentor_id) {
    return null;
  }

  return {
    mentor_id,
    mentor_name: normalizeMentorName(mentor.mentor_name),
    email: mentor.email?.trim() || undefined,
    is_cross_department: Boolean(mentor.is_cross_department),
    mapped_groups: normalizeMappedGroups(mentor.mapped_groups, fallbackCurriculum),
  };
};

const mergeMentorLookupFromAcademicBatchGroups = (
  lookup: Map<number, MentorLookupEntry>,
  groups: GroupByAcademicBatchRecord[],
  academicBatchLabelById: Map<number, string>,
  fallbackCurriculum: string,
  allowedMentorIds?: Set<number>,
) => {
  groups.forEach((group) => {
    const academicBatchId = normalizeMentorId(group.academic_batch_id);
    const curriculum =
      group.academic_batch_desc?.trim() ||
      group.curriculum_name?.trim() ||
      academicBatchLabelById.get(academicBatchId) ||
      fallbackCurriculum;
    const groupName =
      group.mentors_pgm_title?.trim() || group.group_name?.trim() || "";

    (group.mentors || []).forEach((mentor) => {
      const mentorId = normalizeMentorId(mentor.mentor_id);
      if (!mentorId || (allowedMentorIds && !allowedMentorIds.has(mentorId))) {
        return;
      }

      const existingMentor = lookup.get(mentorId);
      if (existingMentor && hasRealMappedGroups(existingMentor.mapped_groups)) {
        return;
      }

      mergeMentorLookupEntry(lookup, {
        mentor_id: mentorId,
        mentor_name: normalizeMentorName(mentor.mentor_name) || normalizeMentorName(mentor.user_name),
        email: mentor.email?.trim() || undefined,
        is_cross_department: mentor.is_cross_department,
        // Info icon depends on real mapped_groups or exact mentor_id matched group data only.
        // If mapped_groups is empty, the icon will not appear for that mentor.
        mapped_groups:
          groupName || curriculum
            ? [
                {
                  key: `${group.mentors_group_id || "group"}-${mentorId}-${groupName || "group-name"}`,
                  curriculum: curriculum || "",
                  groupName,
                },
              ]
            : [],
      });
    });
  });
};

const QUESTIONNAIRE_MODAL_CLOSE_DURATION_MS = 180;

const MapMentorsPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const navigationState = (state || {}) as {
    academic_batch_id?: number;
    academic_batch_desc?: string;
    mentors_group_id?: number;
    mentors_pgm_title?: string;
    config_type_id?: number;
    questionnaire_id?: number;
  };

  const isEditMode = Boolean(navigationState.mentors_group_id);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRecord[]>([]);
  const [academicBatches, setAcademicBatches] = useState<AcademicBatchRecord[]>([]);
  const [mentorCandidates, setMentorCandidates] = useState<MentorCandidate[]>([]);
  const [mentorLoadError, setMentorLoadError] = useState("");
  const [configurationTypes] = useState<ConfigurationType[]>([]);
  const [termOptions, setTermOptions] = useState<TermOption[]>([]);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsSearch, setTermsSearch] = useState("");
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [isQuestionnaireModalVisible, setIsQuestionnaireModalVisible] = useState(false);
  const [isQuestionnaireModalClosing, setIsQuestionnaireModalClosing] = useState(false);
  const [isQuestionnaireModalLoading, setIsQuestionnaireModalLoading] = useState(false);
  const [questionnaireDetail, setQuestionnaireDetail] = useState<QuestionnaireDetail | null>(
    null,
  );
  const termsDropdownRef = useRef<HTMLDivElement | null>(null);
  const questionnaireModalCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [formState, setFormState] = useState({
    mentors_group_id: navigationState.mentors_group_id ?? null,
    academic_batch_id: navigationState.academic_batch_id ?? 0,
    config_type_id: navigationState.config_type_id ?? 0,
    questionnaire_id: navigationState.questionnaire_id ?? 0,
    mentors_pgm_title: navigationState.mentors_pgm_title ?? "",
    semester_ids: [] as number[],
  });

  const selectedQuestionnaire = useMemo(
    () =>
      questionnaires.find(
        (questionnaire) =>
          questionnaire.questionnaire_id === formState.questionnaire_id,
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

  const selectedTerms = useMemo(
    () =>
      formState.semester_ids.map((semesterId) => {
        const matchedTerm = termOptions.find(
          (term) => term.semester_id === semesterId,
        );

        return matchedTerm || { semester_id: semesterId, label: `${semesterId}` };
      }),
    [formState.semester_ids, termOptions],
  );

  const applicableTermsText = useMemo(() => {
    if (selectedTerms.length === 0) {
      return "";
    }

    return selectedTerms.map((term) => term.label).join(", ");
  }, [selectedTerms]);

  const filteredTermOptions = useMemo(() => {
    const normalizedSearch = termsSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return termOptions;
    }

    return termOptions.filter((term) =>
      term.label.toLowerCase().includes(normalizedSearch),
    );
  }, [termOptions, termsSearch]);

  const areAllTermsSelected =
    termOptions.length > 0 && formState.semester_ids.length === termOptions.length;

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

  const displayedMentors = useMemo(() => mentorCandidates, [mentorCandidates]);

  const mentorColumns = useMemo(() => {
    if (displayedMentors.length === 0) {
      return [] as MentorCandidate[][];
    }

    const columnCount = 3;
    const columnSize = Math.ceil(displayedMentors.length / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
      displayedMentors.slice(index * columnSize, (index + 1) * columnSize),
    ).filter((column) => column.length > 0);
  }, [displayedMentors]);

  const hasCrossDepartmentMentor = useMemo(
    () => displayedMentors.some((mentor) => mentor.is_cross_department),
    [displayedMentors],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        termsDropdownRef.current &&
        !termsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTermsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
  }, [isQuestionnaireModalOpen]);

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
      if (!navigationState.academic_batch_id && !navigationState.mentors_group_id) {
        toast.error("Please select curriculum");
        navigate("..");
        return;
      }

      try {
        setIsLoading(true);
        setMentorLoadError("");
        let editGroupData: GroupCompleteResponse | null = null;

        const questionnaireResponse =
          await axiosInstance.get<QuestionnaireListResponse>(
            ApiEndpoint.questionnaire.questionnaire_list,
          );
        if (!isMounted) return;

        setQuestionnaires(questionnaireResponse.data?.data || []);

        const academicBatchResponse =
          await axiosInstance.get<AcademicBatchListResponse>(
            ApiEndpoint.mentorMentee.academic_batch_list,
          );
        if (!isMounted) return;

        setAcademicBatches(academicBatchResponse.data?.data || []);

        if (!isMounted) return;
        setMentorCandidates([]);
        setSelected([]);

        if (navigationState.mentors_group_id) {
          const groupResponse = await axiosInstance.get<GroupCompleteApiResponse>(
            `${ApiEndpoint.mentorMentee.group_complete}/${navigationState.mentors_group_id}`,
          );
          if (!isMounted) return;

          editGroupData = groupResponse.data?.data || null;
          if (editGroupData?.group) {
            setFormState({
              mentors_group_id: Number(editGroupData.group.mentors_group_id),
              academic_batch_id: Number(editGroupData.group.academic_batch_id),
              config_type_id: Number(editGroupData.group.config_type_id),
              questionnaire_id: Number(editGroupData.group.questionnaire_id),
              mentors_pgm_title: editGroupData.group.mentors_pgm_title,
              semester_ids: (editGroupData.semester_ids || []).map((semesterId) =>
                Number(semesterId),
              ),
            });
          }
        }

        const academicBatchId =
          editGroupData?.group?.academic_batch_id ??
          navigationState.academic_batch_id ??
          0;
        const academicBatchLabel =
          (academicBatchResponse.data?.data || [])
            .find((batch) => Number(batch.academic_batch_id) === Number(academicBatchId))
            ?.academic_batch_desc?.trim() ||
          navigationState.academic_batch_desc?.trim() ||
          "";
        const academicBatchLabelById = new Map(
          (academicBatchResponse.data?.data || []).map((batch) => [
            Number(batch.academic_batch_id ?? 0),
            batch.academic_batch_desc?.trim() || "",
          ]),
        );
        const mentorLookup = new Map<number, MentorLookupEntry>();
        let mentorCandidateIds: number[] = [];

        try {
          const termResponse = await axiosInstance.get<SemesterOptionsResponse>(
            `${ApiEndpoint.mentorMentee.semesters_by_academic_batch}/${academicBatchId}`,
          );
          if (!isMounted) return;

          const normalizedTerms = (termResponse.data?.data ?? [])
            .map(normalizeTermOption)
            .filter((term): term is TermOption => term !== null);

          setTermOptions(normalizedTerms);

          if (!navigationState.mentors_group_id) {
            setFormState((current) => ({
              ...current,
              academic_batch_id: academicBatchId,
              semester_ids: normalizedTerms.map((term) => term.semester_id),
            }));
          }
        } catch (error) {
          if (!isMounted) return;
          setTermOptions([]);
          toast.error("Unable to load applicable terms");
        }

        try {
          const mentorCandidatesResponse =
            await axiosInstance.get<MentorCandidatesResponse>(
              getAllMentorsEndpoint(academicBatchId),
            );
          if (!isMounted) return;

          const normalizedMentors = (mentorCandidatesResponse.data?.data || [])
            .map((mentor) => normalizeMentorCandidate(mentor, academicBatchLabel))
            .filter((mentor): mentor is MentorLookupEntry => mentor !== null);

          mentorCandidateIds = normalizedMentors.map((mentor) => mentor.mentor_id);
          normalizedMentors.forEach((mentor) => {
            mergeMentorLookupEntry(mentorLookup, mentor);
          });
        } catch (error: any) {
          if (!isMounted) return;
          setMentorLoadError(getErrorMessage(error, "Unable to load mentors"));
          toast.error(getErrorMessage(error, "Unable to load mentors"));
        }

        try {
          const groupsByBatchResponse =
            await axiosInstance.get<GroupsByAcademicBatchResponse>(
              `${ApiEndpoint.mentorMentee.groups_by_academic_batch}/${academicBatchId}`,
            );
          if (!isMounted) return;

          mergeMentorLookupFromAcademicBatchGroups(
            mentorLookup,
            groupsByBatchResponse.data?.data || [],
            academicBatchLabelById,
            academicBatchLabel,
            new Set(mentorCandidateIds),
          );
        } catch {
          if (!isMounted) return;
        }

        if (navigationState.mentors_group_id) {
          try {
            const mappedMentorResponse =
              await axiosInstance.get<MentorMappingsApiResponse>(
                `${ApiEndpoint.mentorMentee.mentors}/${navigationState.mentors_group_id}`,
                {
                  validateStatus: () => true,
                },
              );
            if (!isMounted) return;

            const mappedMentors =
              mappedMentorResponse.status === 200
                ? mappedMentorResponse.data?.data || []
                : [];
            const mappedMentorIds = Array.from(
              new Set(
                mappedMentors
                  .map((mentor: MentorMapping) => mentor.mentor_id)
                  .filter(
                    (mentorId: number | undefined): mentorId is number =>
                      typeof mentorId === "number",
                  ),
              ),
            );

            mappedMentors.forEach((mentor: MentorMapping) => {
              mergeMentorLookupEntry(mentorLookup, {
                mentor_id: mentor.mentor_id,
                mentor_name:
                  normalizeMentorName(mentor.mentor_name) ||
                  normalizeMentorName(mentor.user_name),
                email: mentor.email?.trim() || undefined,
                mapped_groups: [],
              });
            });
            const nextMentorCandidates = buildMentorCandidates(
              mentorLookup,
              mentorCandidateIds,
              mappedMentorIds,
              true,
            );
            setSelected(mappedMentorIds);
            if (nextMentorCandidates.length > 0) {
              setMentorLoadError("");
            }
            setMentorCandidates(nextMentorCandidates);
          } catch {
            if (!isMounted) return;
            const nextMentorCandidates = buildMentorCandidates(
              mentorLookup,
              mentorCandidateIds,
              [],
              true,
            );
            setSelected([]);
            if (nextMentorCandidates.length > 0) {
              setMentorLoadError("");
            }
            setMentorCandidates(nextMentorCandidates);
          }
        } else {
          const nextMentorCandidates = buildMentorCandidates(
            mentorLookup,
            mentorCandidateIds,
            [],
            false,
          );
          if (nextMentorCandidates.length > 0) {
            setMentorLoadError("");
          }
          setMentorCandidates(nextMentorCandidates);
        }
      } catch (error) {
        console.error("Unable to load mentor group page data", error);
        toast.error("Unable to load mentor group data");
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
  }, [navigate, navigationState.academic_batch_id, navigationState.mentors_group_id]);

  const toggleSemester = (semesterId: number) => {
    setFormState((current) => ({
      ...current,
      semester_ids: current.semester_ids.includes(semesterId)
        ? current.semester_ids.filter((id) => id !== semesterId)
        : [...current.semester_ids, semesterId],
    }));
  };

  const toggleAllSemesters = () => {
    setFormState((current) => ({
      ...current,
      semester_ids:
        current.semester_ids.length === termOptions.length
          ? []
          : termOptions.map((term) => term.semester_id),
    }));
  };

  const closeQuestionnaireModal = (immediate = false) =>
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
    });

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

      const response = await axiosInstance.get<QuestionnaireDetailResponse>(
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

  const save = async () => {
    if (isEditMode) {
      if (!formState.mentors_group_id) {
        toast.error("Unable to save mentor mappings");
        return;
      }

      try {
        setIsSaving(true);
        const response = await axiosInstance.post<MentorGroupSaveResponse>(
          ApiEndpoint.mentorMentee.save_mentors,
          {
            mentors_group_id: formState.mentors_group_id,
            mentor_ids: Array.from(new Set(selected)),
          },
        );

        toast.success(getResponseMessage(response.data?.message));
        navigate("..", {
          state: {
            refreshKey: Date.now(),
            academic_batch_id: formState.academic_batch_id,
          },
        });
      } catch (error: any) {
        console.error("Unable to save mentor mappings", error);
        toast.error(getErrorMessage(error, "Unable to save mentor mappings"));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!formState.academic_batch_id) {
      toast.error("Curriculum is required");
      return;
    }
    if (!formState.mentors_pgm_title.trim()) {
      toast.error("Group title is required");
      return;
    }
    if (!formState.questionnaire_id) {
      toast.error("Questionnaire is required");
      return;
    }
    if (formState.semester_ids.length === 0) {
      toast.error("Applicable terms are unavailable");
      return;
    }
    if (selected.length === 0) {
      toast.error("Mentor selection is unavailable");
      return;
    }

    try {
      setIsSaving(true);
      const savePayload = {
        mentors_group_id: formState.mentors_group_id,
        academic_batch_id: formState.academic_batch_id,
        config_type_id: formState.config_type_id,
        questionnaire_id: formState.questionnaire_id,
        mentors_pgm_title: formState.mentors_pgm_title.trim(),
        semester_ids: formState.semester_ids,
      };

      const saveResponse = await axiosInstance.post<MentorGroupSaveResponse>(
        ApiEndpoint.mentorMentee.save_group,
        savePayload,
      );
      const mentors_group_id =
        saveResponse.data?.mentors_group_id ??
        saveResponse.data?.data?.mentors_group_id ??
        formState.mentors_group_id;

      if (!mentors_group_id) {
        throw new Error("Mentor group ID missing from save response");
      }

      const mapResponse = await axiosInstance.post<MentorGroupSaveResponse>(
        ApiEndpoint.mentorMentee.save_mentors,
        {
          mentors_group_id,
          mentor_ids: Array.from(new Set(selected)),
        },
      );

      toast.success(
        getResponseMessage(
          mapResponse.data?.message || saveResponse.data?.message,
          "Completed",
        ),
      );

      if (isEditMode) {
        navigate("..", {
          state: {
            refreshKey: Date.now(),
            academic_batch_id: formState.academic_batch_id,
          },
        });
        return;
      }

      navigate(`../map-mentees/${mentors_group_id}/${formState.academic_batch_id}`, {
        state: {
          mentors_group_id,
          academic_batch_id: formState.academic_batch_id,
          mentors_pgm_title: formState.mentors_pgm_title.trim(),
          config_type_id: formState.config_type_id,
          questionnaire_id: formState.questionnaire_id,
        },
      });
    } catch (error: any) {
      console.error("Unable to save mentor group", error);
      toast.error(getErrorMessage(error, "Unable to save mentor group"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!navigationState.academic_batch_id && !navigationState.mentors_group_id) {
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
                          (option) =>
                            Boolean(option.que_option?.trim()) || option.specify_flag,
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

  return (
    <MmpModuleShell title={isEditMode ? "Add More Mentors" : "Add Mentors"}>
      <div className="-mt-1 mb-2">
        <style>
          {`
            .map-mentors-form .mentor-name-content {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              min-width: 0;
            }

            .map-mentors-form .mentor-name-text {
              display: inline-block;
              min-width: 0;
            }

            .map-mentors-form .mentor-name-text--cross-department {
              color: #7a1f1f;
            }

            .map-mentors-form .mentor-info-tooltip {
              position: relative;
              display: inline-flex;
              align-items: center;
            }

            .map-mentors-form .mentor-info-trigger {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              border: 0;
              background: transparent;
              color: #374151;
              cursor: help;
              line-height: 1;
            }

            .map-mentors-form .mentor-info-trigger:focus-visible {
              outline: 2px solid #2563eb;
              outline-offset: 2px;
              border-radius: 999px;
            }

            .map-mentors-form .mentor-info-popup {
              position: absolute;
              left: 18px;
              top: calc(100% + 6px);
              z-index: 20;
              display: block;
              min-width: 220px;
              max-width: 280px;
              padding: 8px 10px;
              border: 1px solid #4b5563;
              background: #ffffff;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
              color: #1f2937;
              font-size: 12.5px;
              line-height: 1.35;
              opacity: 0;
              visibility: hidden;
              pointer-events: none;
              white-space: normal;
            }

            .map-mentors-form .mentor-info-tooltip:hover .mentor-info-popup,
            .map-mentors-form .mentor-info-tooltip:focus-within .mentor-info-popup {
              opacity: 1;
              visibility: visible;
            }

            .map-mentors-form .mentor-info-popup-entry + .mentor-info-popup-entry {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #e5e7eb;
            }

            .mentor-cross-department-note {
              margin-top: 10px;
              color: #7a1f1f;
              font-size: 14px;
            }

            section:has(.map-mentors-form) > div:first-child {
              margin-bottom: 14px;
              padding: 8px 20px;
            }

            section:has(.map-mentors-form) > div:first-child h2 {
              font-size: 18px;
              line-height: 1.2;
              font-weight: 600;
            }
          `}
        </style>
      </div>

      <div className="map-mentors-form space-y-5 text-sm">
        <div className="text-[15px] text-gray-900">
          <span className="font-semibold">Curriculum:</span>{" "}
          <span className="font-normal">
            {selectedAcademicBatch?.academic_batch_desc ||
              navigationState.academic_batch_desc ||
              formState.academic_batch_id ||
              ""}
          </span>
        </div>

        <div className="grid gap-y-5 md:grid-cols-[205px_minmax(0,560px)] md:items-center md:gap-x-10">
          {isEditMode ? (
            <>
              <label className="text-[16px] font-normal text-gray-900">Group Title:</label>
              <div className="text-[16px] text-gray-800">{formState.mentors_pgm_title}</div>

              <label className="text-[16px] font-normal text-gray-900">
                Applicable Terms:<span className="text-red-500">*</span>
              </label>
              <div className="min-h-[38px] rounded border border-gray-300 bg-gray-50 px-3 py-2 text-[15px] text-gray-700">
                {applicableTermsText}
              </div>

              <label className="text-[16px] font-normal text-gray-900">
                Configuration Type:<span className="text-red-500">*</span>
              </label>
              <div className="text-[16px] text-gray-800">
                {configurationTypes.find(
                  (configuration) =>
                    configuration.config_type_id === formState.config_type_id,
                )?.config_type_name || "Configuration types not available"}
              </div>

              <label className="text-[16px] font-normal text-gray-900">
                Questionnaire Title:<span className="text-red-500">*</span>
              </label>
              <div className="flex min-h-[38px] items-center gap-3 text-[15px] text-gray-800">
                <span>{selectedQuestionnaire?.questionnaire_name || ""}</span>
                {selectedQuestionnaire ? (
                  <button
                    type="button"
                    className="text-[14px] text-[#337ab7] hover:text-[#f0ad4e] hover:underline"
                    onClick={() => void openQuestionnaireModal()}
                  >
                    View questionnaires
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <label className="text-[16px] font-normal text-gray-900">
                Group Title:<span className="text-red-500">*</span>
              </label>
              <input
                className="h-[38px] w-full max-w-[420px] rounded border border-gray-300 px-3 text-[16px] text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none"
                value={formState.mentors_pgm_title}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    mentors_pgm_title: event.target.value,
                  }))
                }
                placeholder="Enter Group Title"
              />

              <label className="text-[16px] font-normal text-gray-900">
                Applicable Terms:<span className="text-red-500">*</span>
              </label>
              <div className="relative w-full max-w-[420px]" ref={termsDropdownRef}>
                <button
                  type="button"
                  className="flex h-[38px] w-full items-center justify-between rounded border border-gray-300 bg-white px-3 text-left text-[15px] text-gray-800 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                  onClick={() => setIsTermsOpen((current) => !current)}
                  disabled={termOptions.length === 0}
                >
                  <span className="truncate">
                    {selectedTerms.length === termOptions.length && termOptions.length > 0
                      ? "All selected"
                      : applicableTermsText || "Select applicable terms"}
                  </span>
                  <FaChevronDown className="ml-3 text-[12px] text-gray-500" />
                </button>
                {isTermsOpen ? (
                  <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg">
                    <div className="border-b border-gray-200 p-2">
                      <div className="flex h-[38px] items-center overflow-hidden rounded border border-gray-300 bg-white">
                        <span className="flex h-full items-center border-r border-gray-300 px-3 text-gray-500">
                          <FaSearch className="text-[14px]" />
                        </span>
                        <input
                          type="text"
                          value={termsSearch}
                          onChange={(event) => setTermsSearch(event.target.value)}
                          placeholder="Search"
                          className="h-full flex-1 px-3 text-[14px] text-gray-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setTermsSearch("")}
                          className="px-3 text-gray-500 hover:text-gray-700"
                          aria-label="Clear search"
                        >
                          <FaTimesCircle className="text-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto bg-[#337ab7] text-white">
                      <label className="flex cursor-pointer items-center gap-2 px-4 py-2.5 font-semibold">
                        <input
                          type="checkbox"
                          checked={areAllTermsSelected}
                          onChange={toggleAllSemesters}
                        />
                        <span>Select All</span>
                      </label>
                      {filteredTermOptions.map((term) => {
                      const checked = formState.semester_ids.includes(term.semester_id);
                      return (
                        <label
                          key={term.semester_id}
                          className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 ${
                            checked ? "bg-[#337ab7] text-white" : "bg-white text-gray-800"
                          } hover:bg-[#337ab7] hover:text-white`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSemester(term.semester_id)}
                          />
                          <span>{term.label}</span>
                        </label>
                      );
                    })}
                      {filteredTermOptions.length === 0 ? (
                        <div className="px-4 py-3 text-[14px] text-gray-600">
                          No terms found.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="text-[16px] font-normal text-gray-900">
                Configuration Type:<span className="text-red-500">*</span>
              </label>
              <select
                className="h-[38px] w-full max-w-[420px] rounded border border-gray-300 bg-white px-3 text-[15px] text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                value={formState.config_type_id || ""}
                disabled
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    config_type_id: Number(event.target.value) || 0,
                  }))
                }
              >
                <option value="">Configuration types not available</option>
                {configurationTypes.map((configuration) => (
                  <option
                    key={configuration.config_type_id}
                    value={configuration.config_type_id}
                  >
                    {configuration.config_type_name}
                  </option>
                ))}
              </select>

              <label className="text-[16px] font-normal text-gray-900">
                Questionnaire Title:<span className="text-red-500">*</span>
              </label>
              <div className="flex w-full items-center gap-3">
                <div className="w-full max-w-[420px] flex-none">
                  <select
                    className="h-[38px] w-full rounded border border-gray-300 bg-white px-3 text-[15px] text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    value={formState.questionnaire_id || ""}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        questionnaire_id: Number(event.target.value) || 0,
                      }))
                    }
                  >
                    <option value="">Select questionnaire title</option>
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
                {selectedQuestionnaire ? (
                  <button
                    type="button"
                    className="shrink-0 self-center text-[14px] leading-[38px] text-[#337ab7] hover:text-[#f0ad4e] hover:underline"
                    onClick={() => void openQuestionnaireModal()}
                  >
                    View questionnaires
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-3">
        {isLoading ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-500 xl:col-span-3">
            Loading mentor mappings...
          </div>
        ) : !isEditMode && mentorLoadError ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600 xl:col-span-3">
            {mentorLoadError}
          </div>
        ) : mentorColumns.length > 0 ? (
          mentorColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="overflow-hidden rounded border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="w-24 border-b border-r border-gray-200 px-4 py-3 text-left font-semibold">
                      Sl. No.
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold">
                      Mentor Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {column.map((mentor, index) => {
                    const serialNumber =
                      columnIndex * Math.ceil(displayedMentors.length / mentorColumns.length) +
                      index +
                      1;
                    const checked = selected.includes(mentor.mentor_id);
                    const mappedGroupsForTooltip = getRealMappedGroups(mentor.mapped_groups);

                    return (
                      <tr key={mentor.mentor_id}>
                        <td className="border-b border-r border-gray-200 px-4 py-3 align-middle">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                setSelected((current) => {
                                  if (event.target.checked) {
                                    return Array.from(
                                      new Set([...current, mentor.mentor_id]),
                                    );
                                  }

                                  return current.filter(
                                    (mentorId) => mentorId !== mentor.mentor_id,
                                  );
                                })
                              }
                            />
                            <span>{serialNumber}</span>
                          </label>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3">
                          <div className="mentor-name-content">
                            <span
                              className={`mentor-name-text ${
                                mentor.is_cross_department
                                  ? "mentor-name-text--cross-department"
                                  : ""
                              }`}
                              title={getMentorEmailTooltip(mentor.email)}
                            >
                              {mentor.mentor_name}
                            </span>
                            {!isEditMode && mappedGroupsForTooltip.length > 0 ? (
                              <span className="mentor-info-tooltip">
                                <button
                                  type="button"
                                  className="mentor-info-trigger"
                                  aria-label={`View mapped groups for ${mentor.mentor_name}`}
                                  onClick={(event) => event.preventDefault()}
                                >
                                  <FaInfoCircle className="text-[12px]" />
                                </button>
                                <span className="mentor-info-popup" role="tooltip">
                                  {mappedGroupsForTooltip.map((mappedGroup) => (
                                    <span
                                      key={mappedGroup.key}
                                      className="mentor-info-popup-entry block"
                                    >
                                      {mappedGroup.curriculum?.trim() ? (
                                        <span className="block">
                                          Curriculum: {mappedGroup.curriculum.trim()}
                                        </span>
                                      ) : null}
                                      {mappedGroup.groupName?.trim() ? (
                                        <span className="block">
                                          Group Name: {mappedGroup.groupName.trim()}
                                        </span>
                                      ) : null}
                                    </span>
                                  ))}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <div className="px-1 py-1 text-sm text-gray-500 xl:col-span-3">
            No mentors available.
          </div>
        )}
      </div>

      {hasCrossDepartmentMentor ? (
        <div className="mentor-cross-department-note">
          Note: Mentors imported from another department are marked in maroon.
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <UIButton
          type="button"
          onClick={save}
          disabled={isSaving || isLoading}
          className="bg-[#5cb85c] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#4da64d]"
        >
          <span className="mr-1 inline-flex items-center">
            <FaRegFileAlt className="text-[13px]" />
          </span>
          {isSaving
            ? "Saving..."
            : isEditMode
              ? "Save"
              : "Save & Proceed to Add Mentee"}
        </UIButton>
        <UIButton
          type="button"
          onClick={() => navigate("..")}
          className="bg-[#d9534f] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#c74642]"
        >
          <span className="mr-1 inline-flex items-center">
            <FaTimes className="text-[13px]" />
          </span>
          Close
        </UIButton>
      </div>
      {questionnaireModal}
    </MmpModuleShell>
  );
};

export default MapMentorsPage;
