import { useMemo, useCallback } from "react";
import axios from "axios";
import axiosInstance from "../../../utils/api";
import { useAxios } from "../../../hooks/useAxios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

// ✅ Named export - this is the key fix
export const useTopicService = () => {
  const axiosOptions = useMemo(() => ({
    method: "post" as const,
    shouldFetch: false,
    loader: false,
  }), []);

  const { customApiCall } = useAxios<any, any>("", axiosOptions);

  // =====================================================
  // ✅ Get Curriculum List
  // =====================================================
  const getCurriculumList = useCallback(async () => {
    try {
      console.log("DEBUG: topicService.getCurriculumList called");
      const response = await customApiCall<{}, any[]>(
        ApiEndpoint.topic.curriculumList,
        "post",
        {}
      );
      console.log("✅ Curriculum List fetched:", response);
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching curriculum list:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Semester List
  // =====================================================
  const getSemesterList = useCallback(async (
    payload?: { academic_batch_id?: number }
  ) => {
    try {
      console.log("DEBUG: getSemesterList called with payload:", payload);
      
      const requestPayload = payload && Object.keys(payload).length > 0 ? payload : {};
      
      const response = await customApiCall<{}, any[]>(
        ApiEndpoint.topic.semesterList,
        "post",
        requestPayload
      );
      console.log("✅ Semester List fetched:", response);
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching semester list:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Course List
  // =====================================================
  const getCourseList = useCallback(async (
    payload?: { 
      academic_batch_id?: number;
      curriculum_id?: number;
      semester_id?: number;
    }
  ) => {
    try {
      console.log("DEBUG: getCourseList called with payload:", payload);
      
      const requestPayload: any = {};
      
      if (payload?.academic_batch_id) {
        requestPayload.academic_batch_id = payload.academic_batch_id;
      } else if (payload?.curriculum_id) {
        requestPayload.curriculum_id = payload.curriculum_id;
      }
      
      if (payload?.semester_id) {
        requestPayload.semester_id = payload.semester_id;
      }
      
      console.log("DEBUG: Request Payload:", requestPayload);

      const response = await customApiCall<any, any[]>(
        ApiEndpoint.topic.courseList,
        "post",
        requestPayload
      );
      
      console.log("✅ Course List fetched:", response);
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching course list:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Section List
  // =====================================================
  const getSectionList = useCallback(async (
    payload: {
      course_id?: number;
      semester_id?: number;
      academic_batch_id?: number;
    } = {}
  ) => {
    try {
      const response = await customApiCall<any, any>(
        ApiEndpoint.topic.sectionList,
        "post",
        payload
      );

      console.log("✅ Section List raw response:", response);
      
      if (response?.success && response?.data) {
        console.log("Section List data:", response.data);
        return response.data;
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      
      console.warn("Unexpected response format:", response);
      return [];
    } catch (error) {
      console.error("❌ Error fetching section list:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Cudos Topics (for import modal)
  // =====================================================
  const getCudosTopics = useCallback(async (payload: {
    academic_batch_id: number;
    course_id: number;
    semester_id: number;
    section_id: number;
  }) => {
    try {
      console.log("🔍 getCudosTopics called with payload:", payload);
      
      const response = await customApiCall<any, any>(
        ApiEndpoint.topic.cudosTopics,
        "post",
        payload
      );
      console.log("✅ Cudos Topics fetched:", response);
      
      const data = Array.isArray(response) ? response : (response?.data ?? []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching cudos topics:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Import Selected Cudos Topics with Instructor
  // =====================================================
  const importCudosTopics = useCallback(async (payload: {
    course_id: number;
    semester_id: number;
    section_id: number;
    topic_ids: number[];
    instructor_id: number;
    academic_batch_id: number;
  }) => {
    try {
      const response = await customApiCall(
        ApiEndpoint.topic.importCudosTopics,
        "post",
        payload
      );
      console.log("✅ Cudos Topics imported:", response);
      return response;
    } catch (error) {
      console.error("❌ Error importing cudos topics:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Instructor List
  // =====================================================
  const getInstructorList = async (payload: { course_id: number }) => {
    try {
      const res: any = await axiosInstance.post(
        ApiEndpoint.topic.instructorList,
        payload
      );

      console.log("🔥 Instructor API raw:", res.data);

      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("❌ Instructor API error:", err);
      return [];
    }
  };

  // =====================================================
  // ✅ Get Topic List
  // =====================================================
  const getTopicList = useCallback(async (payload: {
    academic_batch_id: number;
    course_id: number;
    semester_id: number;
    section_id?: number;
    instructor_id?: number;
  }) => {
    try {
      const response = await customApiCall<any, any>(
        ApiEndpoint.topic.topicList,
        "post",
        payload
      );
      console.log("✅ Topic List fetched:", response);
      const data = Array.isArray(response) ? response : (response?.data ?? []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("❌ Error fetching topic list:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Update Topic
  // =====================================================
  const updateTopic = useCallback(async (topicId: number, payload: any) => {
    try {
      const response = await customApiCall(
        `${ApiEndpoint.topic.updateTopic}/${topicId}`,
        "put",
        payload
      );
      console.log("✅ Topic updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Error updating topic:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Delete Topic
  // =====================================================
  const deleteTopic = useCallback(async (topicId: number) => {
    try {
      const response = await customApiCall(
        `${ApiEndpoint.topic.deleteTopic}/${topicId}`,
        "delete"
      );
      console.log("✅ Topic deleted:", response);
      return response;
    } catch (error) {
      console.error("❌ Error deleting topic:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Update Instructor
  // =====================================================
  const updateInstructor = useCallback(async (mappingId: number, payload: { course_instructor_id: number }) => {
    try {
      const response = await customApiCall(
        `${ApiEndpoint.topic.updateInstructor}/${mappingId}`,
        "put",
        payload
      );
      console.log("✅ Instructor updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Error updating instructor:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Unmapped CUDOS Topics
  // =====================================================
  const getUnmappedCudosTopics = useCallback(async (payload: {
    course_id: number;
    semester_id: number;
    section_id: number;
  }) => {
    try {
      const response = await customApiCall<any, any[]>(
        ApiEndpoint.topic.cudosTopics,
        "post",
        payload
      );
      console.log("✅ Unmapped CUDOS Topics fetched:", response);
      return response || [];
    } catch (error) {
      console.error("❌ Error fetching unmapped cudos topics:", error);
      return [];
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Get Topic Schedules
  // =====================================================
  const getTopicSchedules = useCallback(async (payload: { mapping_id: number }) => {
    try {
      const response = await axiosInstance.post(
        ApiEndpoint.topic.topicSchedules,
        payload.mapping_id
      );
      console.log("✅ Topic Schedules fetched:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching topic schedules:", error);
      return [];
    }
  }, []);

  // =====================================================
  // ✅ Update Schedule
  // =====================================================
  const updateSchedule = useCallback(async (
    scheduleId: number,
    payload: { conduction_date?: string; actual_delivery_date?: string; portion_to_be_covered?: string }
  ) => {
    try {
      const response = await customApiCall(
        `${ApiEndpoint.topic.updateSchedule}/${scheduleId}`,
        "put",
        payload
      );
      console.log("✅ Schedule updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Error updating schedule:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Add Schedule
  // =====================================================
  const addSchedule = useCallback(async (payload: {
    mapping_id: number;
    session_number: number;
    portion_to_be_covered?: string;
    conduction_date?: string;
    actual_delivery_date?: string;
  }) => {
    try {
      const response = await axiosInstance.post(
        ApiEndpoint.topic.addSchedule,
        {
          mapping_id: payload.mapping_id,
          session_number: payload.session_number,
          portion_to_be_covered: payload.portion_to_be_covered || "",
          conduction_date: payload.conduction_date || null,
          actual_delivery_date: payload.actual_delivery_date || null
        }
      );
      console.log("✅ Schedule added:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error adding schedule:", error);
      throw error;
    }
  }, []);

  // =====================================================
  // ✅ Add Extra Class
  // =====================================================
  const addExtraClass = useCallback(async (payload: {
    mapping_id: number;
    class_date: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }) => {
    try {
      const response = await customApiCall(
        ApiEndpoint.topic.addExtraClass,
        "post",
        payload
      );
      console.log("✅ Extra class added:", response);
      return response;
    } catch (error) {
      console.error("❌ Error adding extra class:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Update Mapping (Assign Instructor)
  // =====================================================
  const updateMapping = useCallback(async (
    mappingId: number,
    payload: {
      instructor_id: number;
      mapping_id?: number;
      course_id?: number;
      section_id?: number;
      topic_id?: number;
    }
  ) => {
    try {
      const response = await customApiCall(
        `${ApiEndpoint.topic.updateMapping}/${mappingId}`,
        "put",
        payload
      );
      console.log("✅ Mapping updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Error updating mapping:", error);
      throw error;
    }
  }, [customApiCall]);

  // =====================================================
  // ✅ Add New Topic
  // =====================================================
  const addNewTopic = async (payload: any) => {
    try {
      const res = await axiosInstance.post(
        ApiEndpoint.topic.addNewTopic,
        payload
      );

      console.log("✅ API SUCCESS:", res.data);
      return res.data;

    } catch (error: any) {
      console.error("❌ API ERROR:", error?.response?.data || error.message);
      throw error;
    }
  };

  // =====================================================
  // ✅ Import Topics
  // =====================================================
  const importTopics = async (payload: any) => {
    try {
      const res = await axiosInstance.post(
        ApiEndpoint.topic.importCudosTopics,
        payload
      );
      return res.data;
    } catch (error) {
      console.error("❌ Error importing topics:", error);
      throw error;
    }
  };

  // ✅ Return all methods
  return useMemo(() => ({
    getCurriculumList,
    getSemesterList,
    getCourseList,
    getSectionList,
    importTopics,
    getTopicList,
    updateTopic,
    deleteTopic,
    getInstructorList,
    updateInstructor,
    getCudosTopics,
    getUnmappedCudosTopics,
    importCudosTopics,
    getTopicSchedules,
    updateSchedule,
    addSchedule,
    addExtraClass,
    updateMapping,
    addNewTopic,
  }), [
    getCurriculumList,
    getSemesterList,
    getCourseList,
    getSectionList,
    importTopics,
    getTopicList,
    updateTopic,
    deleteTopic,
    getInstructorList,
    updateInstructor,
    getCudosTopics,
    getUnmappedCudosTopics,
    importCudosTopics,
    getTopicSchedules,
    updateSchedule,
    addSchedule,
    addExtraClass,
    updateMapping,
    addNewTopic,
  ]);
};

// ✅ Make sure there's NO default export at the bottom
// Remove any "export default" statement if present