import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCheck, FaPencilAlt, FaPlus, FaPlusCircle, FaTimes, FaTrash } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

interface SelectOption {
  label: string;
  value: number;
}

interface CurriculumApiItem {
  academic_batch_id: number;
  academic_batch_desc: string;
}

interface GroupMenteeApi {
  group_mentee_id: number;
  student_id: number;
}

interface GroupMentorApi {
  group_mentor_id: number;
  mentor_id: number;
  mentors_group_terms_id: number;
  mentor_name?: string;
  name?: string;
  employee_name?: string;
  faculty_name?: string;
  staff_name?: string;
  user_name?: string;
  full_name?: string;
  email?: string;
  mentees: GroupMenteeApi[];
}

interface GroupApiItem {
  mentors_group_id: number;
  academic_batch_id: number;
  mentors_pgm_title: string;
  config_type_id: number | null;
  questionnaire_id: number | null;
  mentors: GroupMentorApi[];
  mentoring_sessions?: GroupMentoringSessionApi[];
  sub_groups?: GroupSubGroupApi[];
}

interface GroupSessionDateApi {
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status?: string | number | null;
}

interface GroupSubGroupApi {
  dates?: GroupSessionDateApi[];
}

interface GroupMentoringSessionApi {
  sub_groups?: GroupSubGroupApi[];
}

interface CurrentGroupMentorApi {
  map_mentor_id?: number;
  group_mentor_id?: number;
  mentor_id?: number;
  mentor_name?: string;
  name?: string;
  employee_name?: string;
  faculty_name?: string;
  staff_name?: string;
  user_name?: string;
  full_name?: string;
}

interface GroupCompleteResponse {
  group?: {
    mentors_group_id?: number;
    academic_batch_id?: number;
    config_type_id?: number | null;
    questionnaire_id?: number | null;
    mentors_pgm_title?: string;
  };
  semester_ids?: number[];
}

interface EditGroupFormState {
  mentors_group_id: number;
  academic_batch_id: number;
  config_type_id: number;
  questionnaire_id: number;
  mentors_pgm_title: string;
  semester_ids: number[];
}

interface TableRow {
  originalSlNo: number;
  mentors_group_id: number;
  academic_batch_id: number;
  mentors_pgm_title: string;
  config_type_id: number | null;
  questionnaire_id: number | null;
  mentors: { id: number; name: string; mentors_group_terms_id: number }[];
  mentees: { id: number; name: string }[];
  sessionDate: string;
  sessionStatus: string;
  groupTitleSortKey: string;
  mentorSortKey: string;
  menteeSortKey: string;
  sessionDateSortKey: number | null;
  sessionStatusSortKey: string;
  actionSortKey: string;
}

const buildNormalizedSortKey = (values: Array<string | number | null | undefined>) => {
  const uniqueValues = new Set<string>();

  values.forEach((value) => {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();

    if (normalized) {
      uniqueValues.add(normalized);
    }
  });

  return Array.from(uniqueValues).join(" | ");
};

interface ListPageNavigationState {
  academic_batch_id?: number;
  refreshKey?: number;
}

interface MentorLookupApiRecord {
  mentor_id?: number;
  mentor_name?: string;
  name?: string;
  employee_name?: string;
  faculty_name?: string;
  staff_name?: string;
  user_name?: string;
  full_name?: string;
  email?: string;
}

interface MenteeLookupApiRecord {
  student_id?: number;
  usn?: string;
  name?: string;
}

interface ApiStatusResponse {
  status?: boolean;
  message?: string;
}

type SortKey =
  | "serial"
  | "groupTitle"
  | "mentor"
  | "mentee"
  | "sessionDate"
  | "sessionStatus"
  | "action";

const DEFAULT_SORT_KEY: SortKey = "serial";
const DEFAULT_SORT_DIRECTION: "asc" | "desc" = "asc";

const getAllMentorsEndpoint = (academicBatchId: number) =>
  `lms_mentors_group/get_all_mentors/${academicBatchId}`;

const getAllMenteesEndpoint = (academicBatchId: number) =>
  `lms_mentors_group/get_all_mentees?academic_batch_id=${academicBatchId}`;

const deleteMentorsGroupEndpoint = "lms_mentors_group/delete_mentors_group";

const normalizeMentorId = (value: unknown) => {
  const mentorId = Number(value ?? 0);
  return Number.isFinite(mentorId) && mentorId > 0 ? mentorId : 0;
};

const pickRealMentorName = (
  mentor:
    | MentorLookupApiRecord
    | GroupMentorApi
    | CurrentGroupMentorApi
    | undefined
    | null,
) => {
  if (!mentor) {
    return "";
  }

  const possibleNames = [
    mentor.mentor_name,
    mentor.name,
    mentor.employee_name,
    mentor.faculty_name,
    mentor.staff_name,
    mentor.user_name,
    mentor.full_name,
  ];

  return (
    possibleNames
      .map((value) => value?.trim() || "")
      .find((value) => value.length > 0) || ""
  );
};

const buildMentorDisplaySummary = (names: string[]) => {
  const uniqueNames = Array.from(
    new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)),
  );

  const fullText = uniqueNames.join(", ");
  if (uniqueNames.length <= 1 || fullText.length <= 34) {
    return {
      text: fullText,
      tooltip: uniqueNames.length > 1 ? `${fullText} (${uniqueNames.length})` : fullText,
    };
  }

  return {
    text: `${fullText.slice(0, 31).trimEnd()}...`,
    tooltip: `${fullText} (${uniqueNames.length})`,
  };
};

const getFirstSessionDateRecord = (group: GroupApiItem) => {
  for (const mentoringSession of group.mentoring_sessions || []) {
    for (const subGroup of mentoringSession.sub_groups || []) {
      for (const dateRecord of subGroup.dates || []) {
        if (dateRecord && typeof dateRecord === "object") {
          return dateRecord;
        }
      }
    }
  }

  for (const subGroup of group.sub_groups || []) {
    for (const dateRecord of subGroup.dates || []) {
      if (dateRecord && typeof dateRecord === "object") {
        return dateRecord;
      }
    }
  }

  return null;
};

const buildSessionDateText = (dateRecord: GroupSessionDateApi | null) => {
  const startDate = dateRecord?.start_date?.trim() || "";
  const startTime = dateRecord?.start_time?.trim() || "";
  const sessionDateText = [startDate, startTime].filter((value) => value.length > 0).join(" ");

  return sessionDateText || "-";
};

const buildSessionDateSortKey = (dateRecord: GroupSessionDateApi | null) => {
  const startDate = dateRecord?.start_date?.trim() || "";
  const startTime = dateRecord?.start_time?.trim() || "";
  const dateTimeText = [startDate, startTime].filter((value) => value.length > 0).join(" ");

  if (!dateTimeText) {
    return null;
  }

  const parsedTimestamp = Date.parse(dateTimeText.replace(" ", "T"));
  return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
};

const buildSessionStatusText = (dateRecord: GroupSessionDateApi | null) => {
  if (!dateRecord || dateRecord.status === null || dateRecord.status === undefined) {
    return "-";
  }

  const statusText = String(dateRecord.status).trim();
  return statusText.length > 0 ? statusText : "-";
};

const formatGroupRows = (
  groups: GroupApiItem[],
  currentMentorsByGroupId: Map<number, CurrentGroupMentorApi[]>,
  mentorLookup: Map<number, string>,
  menteeLookup: Map<number, string>,
): TableRow[] =>
  (Array.isArray(groups) ? groups : []).map((group, index) => {
    const mentorDisplayMap = new Map<
      number,
      { id: number; name: string; mentors_group_terms_id: number }
    >();

    const currentMappedMentors = currentMentorsByGroupId.get(group.mentors_group_id) || [];

    currentMappedMentors.forEach((mentor) => {
      const mentorId = normalizeMentorId(mentor.mentor_id);
      if (!mentorId || mentorDisplayMap.has(mentorId)) {
        return;
      }

      const mentorName =
        pickRealMentorName(mentor) ||
        mentorLookup.get(mentorId) ||
        `Mentor ID: ${mentorId}`;
      const matchingGroupMentor = (group.mentors || []).find(
        (groupMentor) => normalizeMentorId(groupMentor.mentor_id) === mentorId,
      );

      mentorDisplayMap.set(mentorId, {
        id: mentorId,
        name: mentorName,
        mentors_group_terms_id: Number(matchingGroupMentor?.mentors_group_terms_id ?? 0),
      });
    });

    const mentors = Array.from(mentorDisplayMap.values());
    const firstSessionDateRecord = getFirstSessionDateRecord(group);
    const sessionDate = buildSessionDateText(firstSessionDateRecord);
    const sessionStatus = buildSessionStatusText(firstSessionDateRecord);

    const menteeMap = new Map<number, string>();
    (group.mentors || []).forEach((mentor) => {
      (mentor.mentees || []).forEach((mentee) => {
        if (!menteeMap.has(mentee.student_id)) {
          menteeMap.set(
            mentee.student_id,
            menteeLookup.get(mentee.student_id) ?? `Student ID: ${mentee.student_id}`,
          );
        }
      });
    });

    return {
      originalSlNo: index + 1,
      mentors_group_id: group.mentors_group_id,
      academic_batch_id: group.academic_batch_id,
      mentors_pgm_title: group.mentors_pgm_title,
      config_type_id: group.config_type_id,
      questionnaire_id: group.questionnaire_id,
      mentors,
      mentees: Array.from(menteeMap.entries()).map(([id, name]) => ({ id, name })),
      sessionDate,
      sessionStatus,
      groupTitleSortKey: buildNormalizedSortKey([group.mentors_pgm_title]),
      mentorSortKey: buildNormalizedSortKey(mentors.map((mentor) => mentor.name)),
      menteeSortKey: buildNormalizedSortKey(
        Array.from(menteeMap.entries()).map(([, name]) => name),
      ),
      sessionDateSortKey: buildSessionDateSortKey(firstSessionDateRecord),
      sessionStatusSortKey: sessionStatus === "-" ? "" : sessionStatus,
      actionSortKey: buildNormalizedSortKey(["Edit"]),
    };
  });

const fetchFormattedGroups = async (
  curriculumId: number,
  mentorLookup: Map<number, string>,
  menteeLookup: Map<number, string>,
) => {
  const response = await axiosInstance.get<any>(
    `${ApiEndpoint.mentorMentee.groups_by_academic_batch}/${curriculumId}`,
    {
      validateStatus: () => true,
    },
  );

  if (response.status === 404 || response.data?.status === false) {
    return {
      notFound: true,
      rows: [] as TableRow[],
    };
  }

  const items = Array.isArray(response.data?.data) ? response.data.data : [];
  const currentMentorsByGroupId = new Map<number, CurrentGroupMentorApi[]>();
  const currentMappedMentorResponses = await Promise.all(
    items.map(async (group: GroupApiItem) => {
      try {
        const mappedMentorResponse =
          await axiosInstance.get<{ data?: CurrentGroupMentorApi[] }>(
            `${ApiEndpoint.mentorMentee.mentors}/${group.mentors_group_id}`,
            {
              validateStatus: () => true,
            },
          );

        const mappedMentors =
          mappedMentorResponse.status === 200
            ? Array.isArray(mappedMentorResponse.data?.data)
              ? mappedMentorResponse.data.data
              : []
            : [];

        return [group.mentors_group_id, mappedMentors] as const;
      } catch {
        return [group.mentors_group_id, [] as CurrentGroupMentorApi[]] as const;
      }
    }),
  );

  currentMappedMentorResponses.forEach(([groupId, mappedMentors]) => {
    currentMentorsByGroupId.set(groupId, mappedMentors);
  });

  const resolvedMentorLookup = new Map(mentorLookup);
  currentMentorsByGroupId.forEach((mappedMentors) => {
    mappedMentors.forEach((mentor) => {
      const mentorId = normalizeMentorId(mentor.mentor_id);
      const mentorName = pickRealMentorName(mentor);

      if (mentorId && mentorName && !resolvedMentorLookup.has(mentorId)) {
        resolvedMentorLookup.set(mentorId, mentorName);
      }
    });
  });

  return {
    notFound: false,
    rows: formatGroupRows(items, currentMentorsByGroupId, resolvedMentorLookup, menteeLookup),
  };
};

const fetchMentorLookup = async (academicBatchId: number) => {
  try {
    const response = await axiosInstance.get<{ data?: MentorLookupApiRecord[] }>(
      getAllMentorsEndpoint(academicBatchId),
    );

    const lookup = new Map<number, string>();
    (response.data?.data || []).forEach((mentor) => {
      const mentorId = normalizeMentorId(mentor.mentor_id);
      const mentorName = pickRealMentorName(mentor);

      if (mentorId && mentorName) {
        lookup.set(mentorId, mentorName);
      }
    });

    return lookup;
  } catch (error: any) {
    toast.error(getErrorMessage(error, "Unable to load mentor lookup"));
    return new Map<number, string>();
  }
};

const fetchMenteeLookup = async (academicBatchId: number) => {
  try {
    const response = await axiosInstance.get<{ data?: MenteeLookupApiRecord[] }>(
      getAllMenteesEndpoint(academicBatchId),
    );

    const lookup = new Map<number, string>();
    (response.data?.data || []).forEach((mentee) => {
      const studentId = Number(mentee.student_id ?? 0);
      const menteeName = mentee.name?.trim();
      const usn = mentee.usn?.trim();

      if (studentId && menteeName) {
        lookup.set(studentId, usn ? `${menteeName} (${usn})` : menteeName);
      }
    });

    return lookup;
  } catch (error: any) {
    toast.error(getErrorMessage(error, "Unable to load mentee lookup"));
    return new Map<number, string>();
  }
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const EDIT_SUCCESS_TOAST_ID = "map-mentor-mentee-edit-success";
const DELETE_SUCCESS_TOAST_ID = "map-mentor-mentee-delete-success";
const SUCCESS_TOAST_DURATION = 4000;
const EDIT_MODAL_CLOSE_DURATION_MS = 180;

const SuccessToastContent: React.FC<{
  closeToast?: () => void;
  message: string;
}> = ({ closeToast, message }) => {
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasClosedRef = useRef(false);

  useEffect(() => {
    fallbackTimeoutRef.current = setTimeout(() => {
      if (!hasClosedRef.current) {
        hasClosedRef.current = true;
        closeToast?.();
      }
    }, SUCCESS_TOAST_DURATION);

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };
  }, [closeToast]);

  const handleClose = () => {
    if (hasClosedRef.current) {
      return;
    }

    hasClosedRef.current = true;
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    closeToast?.();
  };

  return (
    <div className="relative flex w-[280px] overflow-hidden rounded-sm bg-[#3d8b3d] text-white shadow-lg">
      <div
        className="absolute left-0 top-0 h-[3px] bg-[#9be27f]"
        style={{
          width: "0%",
          animation: `mapMentorMenteeToastTimeline ${SUCCESS_TOAST_DURATION}ms linear forwards`,
        }}
        onAnimationEnd={handleClose}
      />
      <div className="flex items-center px-4 py-4">
        <FaCheck className="text-[26px]" />
      </div>
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3 py-3 pr-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-5">Success</div>
          <div className="mt-1 text-[13px] leading-5 text-white/95">
            {message}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="mt-[1px] text-white/90 hover:text-white"
          aria-label="Close"
        >
          <FaTimes className="text-[12px]" />
        </button>
      </div>
    </div>
  );
};

const showEditSuccessToast = () => {
  toast.dismiss(EDIT_SUCCESS_TOAST_ID);

  toast(
    ({ closeToast }) => (
      <SuccessToastContent
        closeToast={closeToast}
        message="Data updated successfully"
      />
    ),
    {
      toastId: EDIT_SUCCESS_TOAST_ID,
      position: "bottom-left",
      autoClose: false,
      hideProgressBar: true,
      closeButton: false,
      icon: false,
      className: "!bg-transparent !p-0 !shadow-none !min-h-0",
      bodyClassName: "!p-0",
      progressClassName: "!hidden",
    },
  );
};

const showDeleteSuccessToast = () => {
  toast.dismiss(DELETE_SUCCESS_TOAST_ID);

  toast(
    ({ closeToast }) => (
      <SuccessToastContent
        closeToast={closeToast}
        message="Mentoring group deleted successfully."
      />
    ),
    {
      toastId: DELETE_SUCCESS_TOAST_ID,
      position: "bottom-left",
      autoClose: false,
      hideProgressBar: true,
      closeButton: false,
      icon: false,
      className: "!bg-transparent !p-0 !shadow-none !min-h-0",
      bodyClassName: "!p-0",
      progressClassName: "!hidden",
    },
  );
};

const MapMentorMenteeListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = (location.state || {}) as ListPageNavigationState;
  const [curricula, setCurricula] = useState<SelectOption[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | "">("");
  const [groups, setGroups] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [curriculaLoading, setCurriculaLoading] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(DEFAULT_SORT_DIRECTION);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isEditModalClosing, setIsEditModalClosing] = useState(false);
  const [editForm, setEditForm] = useState<EditGroupFormState | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const dropdownsLoadedRef = useRef(false);
  const editModalCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menteeLookupCacheRef = useRef<Map<number, Map<number, string>>>(new Map());

  const resetSortState = () => {
    setSortKey(DEFAULT_SORT_KEY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setCurrentPage(1);
    setSelectedGroupIds([]);
  };

  const resetEditModalState = () => {
    if (editModalCloseTimeoutRef.current) {
      clearTimeout(editModalCloseTimeoutRef.current);
      editModalCloseTimeoutRef.current = null;
    }

    setIsEditModalOpen(false);
    setIsEditModalVisible(false);
    setIsEditModalClosing(false);
    setEditForm(null);
    setEditTitleValue("");
    setEditLoading(false);
    setEditSaving(false);
  };

  const closeEditModal = (immediate = false) =>
    new Promise<void>((resolve) => {
      if (!isEditModalOpen) {
        resetEditModalState();
        resolve();
        return;
      }

      if (editModalCloseTimeoutRef.current) {
        clearTimeout(editModalCloseTimeoutRef.current);
        editModalCloseTimeoutRef.current = null;
      }

      if (immediate || prefersReducedMotion) {
        resetEditModalState();
        resolve();
        return;
      }

      if (isEditModalClosing) {
        resolve();
        return;
      }

      setIsEditModalClosing(true);
      setIsEditModalVisible(false);
      editModalCloseTimeoutRef.current = setTimeout(() => {
        resetEditModalState();
        resolve();
      }, EDIT_MODAL_CLOSE_DURATION_MS);
    });

  useEffect(() => {
    if (dropdownsLoadedRef.current) {
      return;
    }
    dropdownsLoadedRef.current = true;

    const loadCurricula = async () => {
      setCurriculaLoading(true);
      try {
        const response = await axiosInstance.get<any>(
          ApiEndpoint.mentorMentee.academic_batch_list,
        );
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        const options = items
          .map((item: CurriculumApiItem) => ({
            value: Number(item.academic_batch_id),
            label: item.academic_batch_desc,
          }))
          .filter(
            (item: SelectOption) =>
              Number.isFinite(item.value) && item.label.trim().length > 0,
          );
        setCurricula(options);
      } catch (error: any) {
        setCurricula([]);
        toast.error(
          error?.response?.data?.message || "Unable to load curriculum options.",
        );
      } finally {
        setCurriculaLoading(false);
      }
    };

    loadCurricula().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isEditModalOpen && !isDeleteModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDeleteModalOpen, isEditModalOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (editModalCloseTimeoutRef.current) {
        clearTimeout(editModalCloseTimeoutRef.current);
      }
      toast.dismiss(EDIT_SUCCESS_TOAST_ID);
      toast.dismiss(DELETE_SUCCESS_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (typeof navigationState.academic_batch_id !== "number") {
      return;
    }

    resetSortState();
    resetEditModalState();
    setSelectedCurriculumId(navigationState.academic_batch_id);
  }, [navigationState.academic_batch_id]);

  useEffect(() => {
    if (selectedCurriculumId === "") {
      resetEditModalState();
      setGroups([]);
      setSelectedGroupIds([]);
      setCurrentPage(1);
      setLoading(false);
      return;
    }

    loadGroupsForCurriculum(selectedCurriculumId).catch(() => undefined);
  }, [location.state, selectedCurriculumId]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return groups;
    }

    return groups.filter((group) => {
      const haystack = [
        group.mentors_pgm_title,
        group.mentors.map((mentor) => mentor.name).join(" "),
        group.mentees.map((mentee) => mentee.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [groups, search]);

  const sortedGroups = useMemo(() => {
    const items = [...filteredGroups];
    const factor = sortDirection === "asc" ? 1 : -1;

    const getValue = (group: TableRow): number | string | null => {
      switch (sortKey) {
        case "serial":
          return group.originalSlNo;
        case "groupTitle":
          return group.groupTitleSortKey;
        case "mentor":
          return group.mentorSortKey;
        case "mentee":
          return group.menteeSortKey;
        case "sessionDate":
          return group.sessionDateSortKey;
        case "sessionStatus":
          return group.sessionStatusSortKey;
        case "action":
          return group.actionSortKey;
        default:
          return group.originalSlNo;
      }
    };

    return items.sort((left, right) => {
      const leftValue = getValue(left);
      const rightValue = getValue(right);

      if (leftValue === null && rightValue !== null) {
        return 1;
      }

      if (leftValue !== null && rightValue === null) {
        return -1;
      }

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        const comparison = (leftValue - rightValue) * factor;
        return comparison !== 0 ? comparison : left.originalSlNo - right.originalSlNo;
      }

      const leftText = String(leftValue ?? "");
      const rightText = String(rightValue ?? "");
      const leftEmpty = leftText.length === 0;
      const rightEmpty = rightText.length === 0;

      if (leftEmpty && !rightEmpty) {
        return 1;
      }

      if (!leftEmpty && rightEmpty) {
        return -1;
      }

      const comparison =
        leftText.localeCompare(rightText, undefined, { sensitivity: "base" }) * factor;

      return comparison !== 0 ? comparison : left.originalSlNo - right.originalSlNo;
    });
  }, [filteredGroups, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedGroups.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGroups.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedGroups]);

  const selectedCurriculum = useMemo(
    () => curricula.find((item) => item.value === selectedCurriculumId),
    [curricula, selectedCurriculumId],
  );

  const hasSelection = selectedCurriculumId !== "";
  const showEmptyState = hasSelection && !loading && sortedGroups.length === 0;
  const hasSelectedRows = selectedGroupIds.length > 0;

  const loadGroupsForCurriculum = async (curriculumId: number) => {
    setLoading(true);
    try {
      let menteeLookup = menteeLookupCacheRef.current.get(curriculumId);

      if (!menteeLookup) {
        menteeLookup = await fetchMenteeLookup(curriculumId);
        menteeLookupCacheRef.current.set(curriculumId, menteeLookup);
      }

      const mentorLookup = await fetchMentorLookup(curriculumId);

      const result = await fetchFormattedGroups(curriculumId, mentorLookup, menteeLookup);
      setGroups(result.rows);
      setSelectedGroupIds((current) =>
        current.filter((groupId) =>
          result.rows.some((group) => group.mentors_group_id === groupId),
        ),
      );
      setCurrentPage(1);
    } catch (error: any) {
      setGroups([]);
      setSelectedGroupIds([]);
      if (error?.response?.status !== 404) {
        toast.error(
          error?.response?.data?.message || "Unable to load mentor-mentee groups.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (!hasSelection) {
      return;
    }

    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      setCurrentPage(1);
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
    setCurrentPage(1);
  };

  const renderSortIndicator = (key: SortKey) => {
    if (!hasSelection) {
      return null;
    }

    const isActive = sortKey === key;
    return (
      <span className="ml-1 inline-flex flex-col leading-[8px]">
        <span
          className={`text-[8px] ${
            isActive && sortDirection === "asc" ? "text-gray-600" : "text-gray-300"
          }`}
        >
          {"\u25B2"}
        </span>
        <span
          className={`text-[8px] ${
            isActive && sortDirection === "desc" ? "text-gray-600" : "text-gray-300"
          }`}
        >
          {"\u25BC"}
        </span>
      </span>
    );
  };

  const handleCurriculumChange = (value: string) => {
    resetSortState();
    closeEditModal();

    if (!value) {
      setSelectedCurriculumId("");
      setSearch("");
      return;
    }

    setSelectedCurriculumId(Number(value));
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((selectedId) => selectedId !== groupId)
        : [...current, groupId],
    );
  };

  const openDeleteModal = () => {
    if (!hasSelectedRows) {
      return;
    }

    setIsDeleteModalOpen(true);
    setIsDeleteModalVisible(prefersReducedMotion);

    if (!prefersReducedMotion) {
      requestAnimationFrame(() => {
        setIsDeleteModalVisible(true);
      });
    }
  };

  const closeDeleteModal = () => {
    if (loading) {
      return;
    }

    setIsDeleteModalVisible(false);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteSelectedGroups = async () => {
    if (!hasSelectedRows) {
      return;
    }

    try {
      setLoading(true);

      const responses = await Promise.all(
        selectedGroupIds.map((groupId) =>
          axiosInstance.delete<ApiStatusResponse>(`${deleteMentorsGroupEndpoint}/${groupId}`, {
            validateStatus: () => true,
          }),
        ),
      );

      const failedResponse = responses.find(
        (response) => response.status >= 400 || response.data?.status === false,
      );

      if (failedResponse) {
        throw new Error(
          failedResponse.data?.message || "Unable to delete selected mentor-mentee groups.",
        );
      }

      setSelectedGroupIds([]);
      setIsDeleteModalVisible(false);
      setIsDeleteModalOpen(false);
      showDeleteSuccessToast();

      if (selectedCurriculumId !== "") {
        await loadGroupsForCurriculum(selectedCurriculumId);
      }
    } catch (error: any) {
      setIsDeleteModalVisible(false);
      setIsDeleteModalOpen(false);
      toast.error(getErrorMessage(error, "Unable to delete selected mentor-mentee groups."));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentorMentee = () => {
    if (!hasSelection) {
      toast.error("Please select curriculum");
      return;
    }
    navigate("map-mentors", {
      state: {
        academic_batch_id: selectedCurriculumId,
        academic_batch_desc: selectedCurriculum?.label,
      },
    });
  };

  const handleAddMentor = (group: TableRow) => {
    navigate("map-mentors", {
      state: {
        mentors_group_id: group.mentors_group_id,
        academic_batch_id: group.academic_batch_id,
        mentors_pgm_title: group.mentors_pgm_title,
        config_type_id: group.config_type_id,
        questionnaire_id: group.questionnaire_id,
        mentors_group_terms_id: group.mentors[0]?.mentors_group_terms_id,
      },
    });
  };

  const handleAddMentee = (group: TableRow) => {
    navigate(`map-mentees/${group.mentors_group_id}/${group.academic_batch_id}`, {
      state: {
        mentors_group_id: group.mentors_group_id,
        academic_batch_id: group.academic_batch_id,
        mentors_pgm_title: group.mentors_pgm_title,
        config_type_id: group.config_type_id,
        questionnaire_id: group.questionnaire_id,
        mentors_group_terms_id: group.mentors[0]?.mentors_group_terms_id,
      },
    });
  };

  const handleOpenEditModal = async (group: TableRow) => {
    if (isEditModalOpen || isEditModalClosing) {
      return;
    }

    if (editModalCloseTimeoutRef.current) {
      clearTimeout(editModalCloseTimeoutRef.current);
      editModalCloseTimeoutRef.current = null;
    }

    setIsEditModalOpen(true);
    setIsEditModalClosing(false);
    setEditLoading(true);
    setEditSaving(false);
    setEditForm(null);
    setEditTitleValue(group.mentors_pgm_title || "");
    setIsEditModalVisible(prefersReducedMotion);

    if (!prefersReducedMotion) {
      requestAnimationFrame(() => {
        setIsEditModalVisible(true);
      });
    }

    try {
      const response = await axiosInstance.get<any>(
        `${ApiEndpoint.mentorMentee.group_complete}/${group.mentors_group_id}`,
      );
      const data = (response.data?.data || response.data) as GroupCompleteResponse;
      const fullGroup = data?.group;
      const semesterIds = Array.isArray(data?.semester_ids) ? data.semester_ids : [];

      if (
        !fullGroup?.mentors_group_id ||
        !fullGroup.academic_batch_id ||
        fullGroup.config_type_id == null ||
        fullGroup.questionnaire_id == null ||
        semesterIds.length === 0
      ) {
        throw new Error("Required mentor group fields are unavailable for editing");
      }

      setEditForm({
        mentors_group_id: fullGroup.mentors_group_id,
        academic_batch_id: fullGroup.academic_batch_id,
        config_type_id: Number(fullGroup.config_type_id),
        questionnaire_id: Number(fullGroup.questionnaire_id),
        mentors_pgm_title: fullGroup.mentors_pgm_title || "",
        semester_ids: semesterIds.map((value) => Number(value)).filter(Number.isFinite),
      });
      setEditTitleValue(fullGroup.mentors_pgm_title || "");
    } catch (error: any) {
      void closeEditModal(true);
      toast.error(getErrorMessage(error, "Unable to load group details for editing"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateGroupTitle = async () => {
    if (!editForm) {
      toast.error("Group details are unavailable");
      return;
    }

    const trimmedTitle = editTitleValue.trim();
    if (!trimmedTitle) {
      toast.error("Group Title is required");
      return;
    }

    try {
      setEditSaving(true);
      await axiosInstance.post<any>(
        ApiEndpoint.mentorMentee.save_group,
        {
          mentors_group_id: editForm.mentors_group_id,
          academic_batch_id: editForm.academic_batch_id,
          config_type_id: editForm.config_type_id,
          questionnaire_id: editForm.questionnaire_id,
          mentors_pgm_title: trimmedTitle,
          semester_ids: editForm.semester_ids,
        },
      );

      showEditSuccessToast();
      await closeEditModal();

      if (selectedCurriculumId !== "") {
        setLoading(true);
        try {
          let menteeLookup = menteeLookupCacheRef.current.get(selectedCurriculumId);

          if (!menteeLookup) {
            menteeLookup = await fetchMenteeLookup(selectedCurriculumId);
            menteeLookupCacheRef.current.set(selectedCurriculumId, menteeLookup);
          }

          await loadGroupsForCurriculum(selectedCurriculumId);
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            toast.error(
              error?.response?.data?.message || "Unable to load mentor-mentee groups.",
            );
          }
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Unable to update group title"));
    } finally {
      setEditSaving(false);
    }
  };

  const actionCellClassName =
    "border border-gray-300 px-[10px] py-[7px] align-top text-center";
  const linkClassName =
    "inline-flex items-center gap-[5px] text-[13px] font-normal leading-5 text-[#2c78c4] hover:underline";
  const linkIconClassName = "text-[13px] text-[#2c78c4]";
  const deleteModalContent = isDeleteModalOpen ? (
    <div
      className={`fixed inset-0 z-[1100] bg-black/45 px-4 pt-[7.5vh] transition-opacity motion-reduce:transition-none ${
        isDeleteModalVisible
          ? "opacity-100 duration-[220ms] ease-out"
          : "opacity-0 duration-[180ms] ease-in"
      }`}
    >
      <div
        className={`mx-auto w-full max-w-[820px] overflow-hidden rounded-md bg-white shadow-2xl transition-all motion-reduce:transition-none ${
          isDeleteModalVisible
            ? "translate-y-0 opacity-100 duration-[220ms] ease-out"
            : "-translate-y-[25px] opacity-0 duration-[180ms] ease-in"
        }`}
      >
        <div className="border-b border-gray-200 px-5 py-[15px] text-[17px] font-normal text-[#3a3a3a]">
          Delete mentoring group
        </div>
        <div className="border-b border-gray-200 px-5 py-[18px] text-[15px] text-[#444]">
          Are you sure you want to delete?
        </div>
        <div className="flex justify-end gap-3 px-5 py-[17px]">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded bg-[#d9534f] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#c74642] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={closeDeleteModal}
            disabled={loading}
          >
            <FaTimes className="text-[13px]" />
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded bg-[#337ab7] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#2b669a] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => {
              void handleDeleteSelectedGroups();
            }}
            disabled={loading}
          >
            <FaCheck className="text-[13px]" />
            Ok
          </button>
        </div>
      </div>
    </div>
  ) : null;
  const editModalContent = isEditModalOpen ? (
    <div
      className={`fixed inset-0 z-[1000] overflow-y-auto bg-black/45 px-4 pt-[8vh] transition-opacity motion-reduce:transition-none ${
        isEditModalVisible
          ? "opacity-100 duration-[220ms] ease-out"
          : "opacity-0 duration-[180ms] ease-in"
      }`}
    >
      <div
        className={`mx-auto w-full max-w-[920px] rounded-md bg-white shadow-2xl transition-all motion-reduce:transition-none md:w-[60vw] ${
          isEditModalVisible
            ? "translate-y-0 scale-100 opacity-100 duration-[220ms] ease-out"
            : "-translate-y-8 scale-[0.98] opacity-0 duration-[180ms] ease-in"
        }`}
      >
        <div className="border-b border-gray-200 px-4 py-3 text-[18px] font-normal text-gray-700">
          Edit group title
        </div>
        <div className="border-b border-gray-200 px-6 py-5">
          {editLoading ? (
            <p className="text-[14px] text-gray-600">Loading group details...</p>
          ) : (
            <div className="mx-auto flex w-full max-w-[780px] flex-col gap-2 md:flex-row md:items-center md:gap-6">
              <label className="text-[15px] font-semibold text-gray-700 md:w-[150px] md:flex-none">
                Group Title: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full max-w-[560px] rounded border border-gray-300 px-4 py-[8px] text-[15px] text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={editTitleValue}
                onChange={(event) => setEditTitleValue(event.target.value)}
                disabled={editSaving || isEditModalClosing}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded bg-[#5cb85c] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#4da64d] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => handleUpdateGroupTitle()}
            disabled={editLoading || editSaving || !editForm || isEditModalClosing}
          >
            <HiDocumentText className="text-[14px]" />
            Update
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded bg-[#d9534f] px-4 py-[9px] text-[14px] font-medium text-white hover:bg-[#c74642] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => {
              void closeEditModal();
            }}
            disabled={editSaving || isEditModalClosing}
          >
            <FaTimes className="text-[13px]" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className="min-h-[590px] w-full min-w-0 overflow-x-hidden rounded-md border border-gray-200 bg-white p-4 shadow-md md:p-6">
      <style>
        {`
          @keyframes mapMentorMenteeToastTimeline {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
     <div className="mb-3 rounded-tl-[22px] rounded-tr-none rounded-br-[22px] rounded-bl-none border border-[#253246] bg-[#253246] px-5 py-[5px] text-white">
  <h2 className="text-[18px] leading-[18px] font-normal tracking-[0.01em] text-white/90">
    Map Mentor Mentee
  </h2>
</div>

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="w-full max-w-[320px]">
          <label className="mb-1 block text-[16px] font-normal text-gray-800">
             Curriculum:<span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-[6px] border border-gray-300 bg-white px-3 py-[9px] text-[13px] text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
            value={selectedCurriculumId}
            onChange={(event) => handleCurriculumChange(event.target.value)}
            disabled={curriculaLoading}
          >
            <option value="">Select curriculum</option>
            {curricula.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end md:pt-1">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasSelectedRows && (
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[#d9534f] px-4 py-[9px] text-[14px] font-medium text-white shadow-sm transition hover:bg-[#c74642]"
              >
                <FaTrash className="text-[12px]" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAddMentorMentee}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-[#3f7fc1] px-[14px] py-[7px] text-[13px] font-medium text-white shadow-sm transition hover:bg-[#356fa8]"
            >
              <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white text-[9px] text-[#3f7fc1]">
                <FaPlus />
              </span>
              <span>Add Mentor Mentee</span>
            </button>
          </div>
        </div>
      </div>

      {hasSelection && (
        <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[14px] text-gray-800">
            <span>Show</span>
            <select
              className="rounded-[4px] border border-gray-300 px-3 py-[6px] text-[14px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <label className="flex items-center gap-2 text-[16px] font-normal text-gray-800">
            <span>Search:</span>
            <input
              type="text"
              className="w-full rounded-[4px] border border-gray-300 px-3 py-[6px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-[182px]"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>
      )}

      <div className="w-full overflow-x-auto md:pl-3">
        <table className="w-full table-fixed border-collapse text-[13px] md:w-[98%]">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[17%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[17%]" />
            <col className="w-[16%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr className="bg-white">
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("serial")}
                  disabled={!hasSelection}
                >
                  <span>Sl. No.</span>
                  {renderSortIndicator("serial")}
                </button>
              </th>
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("groupTitle")}
                  disabled={!hasSelection}
                >
                  <span>Group Title</span>
                  {renderSortIndicator("groupTitle")}
                </button>
              </th>
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("mentor")}
                  disabled={!hasSelection}
                >
                  <span>Mentor</span>
                  {renderSortIndicator("mentor")}
                </button>
              </th>
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("mentee")}
                  disabled={!hasSelection}
                >
                  <span>Mentee</span>
                  {renderSortIndicator("mentee")}
                </button>
              </th>
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("sessionDate")}
                  disabled={!hasSelection}
                >
                  <span>Session Date</span>
                  {renderSortIndicator("sessionDate")}
                </button>
              </th>
              <th className="border border-gray-300 px-[8px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] whitespace-nowrap leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("sessionStatus")}
                  disabled={!hasSelection}
                >
                  <span>Session Status</span>
                  {renderSortIndicator("sessionStatus")}
                </button>
              </th>
              <th className="border border-gray-300 px-[6px] py-[5px] text-center align-middle font-semibold leading-[1.05]">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[3px] leading-[1.05] font-semibold disabled:cursor-default"
                  onClick={() => handleSort("action")}
                  disabled={!hasSelection}
                >
                  <span>Action</span>
                  {renderSortIndicator("action")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasSelection ? null : loading ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 p-6 text-center text-sm text-gray-500">
                  Loading mentor-mentee groups...
                </td>
              </tr>
            ) : showEmptyState ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 p-6 text-center text-sm text-gray-500">
                  No mentor-mentee groups found for the selected curriculum.
                </td>
              </tr>
            ) : (
              paginatedGroups.map((group) => (
                <tr key={group.mentors_group_id}>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top">
                    <label className="inline-flex items-start gap-[10px]">
                      <input
                        type="checkbox"
                        className="mt-[2px]"
                        checked={selectedGroupIds.includes(group.mentors_group_id)}
                        onChange={() => toggleGroupSelection(group.mentors_group_id)}
                      />
                      <span>{group.originalSlNo}</span>
                    </label>
                  </td>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top break-words">
                    {group.mentors_pgm_title || ""}
                  </td>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top">
                    {group.mentors.length > 0 ? (
                      <>
                        {(() => {
                          const mentorSummary = buildMentorDisplaySummary(
                            group.mentors.map((mentor) => mentor.name),
                          );

                          return (
                            <div
                              className="break-words leading-[22px]"
                              title={mentorSummary.tooltip}
                            >
                              {mentorSummary.text}
                            </div>
                          );
                        })()}
                        <button
                          type="button"
                          className="mt-[5px] inline-flex items-center gap-[5px] text-[13px] leading-5 text-[#2c78c4] hover:underline"
                          onClick={() => handleAddMentor(group)}
                        >
                          <FaPlusCircle className={linkIconClassName} />
                          Add mentor
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={linkClassName}
                        onClick={() => handleAddMentor(group)}
                      >
                        <FaPlusCircle className={linkIconClassName} />
                        Add mentor
                      </button>
                    )}
                  </td>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top">
                    {group.mentees.length > 0 ? (
                      <>
                        <div className="space-y-[2px] leading-[22px]">
                          {group.mentees.map((mentee) => (
                            <div key={mentee.id} className="break-words">
                              {mentee.name}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="mt-[5px] inline-flex items-center gap-[5px] text-[13px] leading-5 text-[#2c78c4] hover:underline"
                          onClick={() => handleAddMentee(group)}
                        >
                          <FaPlusCircle className={linkIconClassName} />
                          Add mentee
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={linkClassName}
                        onClick={() => handleAddMentee(group)}
                      >
                        <FaPlusCircle className={linkIconClassName} />
                        Add mentee
                      </button>
                    )}
                  </td>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top text-gray-700">
                    {group.sessionDate}
                  </td>
                  <td className="border border-gray-300 px-[10px] py-[7px] align-top text-gray-700">
                    {group.sessionStatus}
                  </td>
                  <td className={actionCellClassName}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-0 text-[#2c78c4] hover:text-[#2567a8]"
                      onClick={() => handleOpenEditModal(group)}
                      aria-label="Edit group title"
                    >
                      <FaPencilAlt className="text-[11px]" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasSelection && !loading && filteredGroups.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-[14px] md:flex-row md:items-center md:justify-between">
          <p className="text-gray-800">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredGroups.length)} of{" "}
            {sortedGroups.length} entries
          </p>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {hasSelectedRows && (
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[#d9534f] px-4 py-[8px] text-[14px] font-medium text-white shadow-sm transition hover:bg-[#c74642]"
              >
                <FaTrash className="text-[12px]" />
                <span>Delete</span>
              </button>
            )}
            <div className="flex items-center gap-0">
              <button
                type="button"
                className="rounded-l-[4px] border border-gray-300 bg-white px-4 py-[7px] text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <span className="border-y border-gray-300 bg-[#3f7fc1] px-4 py-[7px] text-white">
                {currentPage}
              </span>
              <button
                type="button"
                className="rounded-r-[4px] border border-gray-300 bg-white px-4 py-[7px] text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalContent && createPortal(deleteModalContent, document.body)}
      {editModalContent && createPortal(editModalContent, document.body)}
    </section>
  );
};

export default MapMentorMenteeListPage;
