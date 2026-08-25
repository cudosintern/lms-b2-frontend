import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";
import type { CreateQuizPayload } from "./quiz";
import { useAxios } from "../../../hooks/useAxios";

export const useManageQuizService = () => {
  const { customApiCall } = useAxios("", {
    method: "post",
    shouldFetch: false,
    loader: false,
  });

  // Quiz CRUD
  const getQuizList = async (params?: any) => {
    try {
      const res: any = await axiosInstance.get(ApiEndpoint.quiz.list, { params });
      return res.data?.data?.items || res.data?.items || [];
    } catch (error) {
      console.error("Error fetching quiz list:", error);
      return [];
    }
  };

  const createQuiz = async (payload: CreateQuizPayload) => {
    const res: any = await axiosInstance.post(ApiEndpoint.quiz.create, payload);
    return res.data;
  };

  const deleteQuiz = async (id: number) => {
    const res: any = await axiosInstance.delete(ApiEndpoint.quiz.delete(id));
    return res.data;
  };

  // Meta dropdowns with proper error handling
  const getMetaCurriculums = async () => {
    try {
      const res: any = await axiosInstance.get('/api/v1/manage-quiz/meta/curriculums');
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching curriculums:", error);
      return [];
    }
  };

  const getMetaTerms = async (academic_batch_id?: number) => {
    try {
      const params: any = {};
      if (academic_batch_id) params.academic_batch_id = academic_batch_id;
      const res: any = await axiosInstance.get('/api/v1/manage-quiz/meta/terms', { params });
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching terms:", error);
      return [];
    }
  };

  const getMetaCourses = async (academic_batch_id?: number, semester_id?: number) => {
    try {
      const params: any = {};
      if (academic_batch_id) params.academic_batch_id = academic_batch_id;
      if (semester_id) params.semester_id = semester_id;
      const res: any = await axiosInstance.get('/api/v1/manage-quiz/meta/courses', { params });
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  };

  const getMetaSections = async (academic_batch_id?: number, semester_id?: number, course_id?: number) => {
    try {
      const params: any = {};
      if (academic_batch_id) params.academic_batch_id = academic_batch_id;
      if (semester_id) params.semester_id = semester_id;
      if (course_id) params.course_id = course_id;
      const res: any = await axiosInstance.get('/api/v1/manage-quiz/meta/sections', { params });
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching sections:", error);
      return [];
    }
  };

  const getMetaTopics = async (academic_batch_id: number, semester_id: number, crs_id: number) => {
    try {
      const params = { academic_batch_id, semester_id, crs_id };
      const res: any = await axiosInstance.get('/api/v1/manage-quiz/meta/topics', { params });
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error("Error fetching topics:", error);
      return [];
    }
  };

  // Detail methods
  const getQuizDetails = async (id: number) => {
    try {
      const res: any = await axiosInstance.get(`/api/v1/manage-quiz/${id}`);
      return res.data?.data || res.data || null;
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      return null;
    }
  };

  // const getQuizStudents = async (quizId: number, params?: any) => {
  //   try {
  //     const res: any = await axiosInstance.get(`/api/v1/manage-quiz/${quizId}/students`, { params });
  //     return res.data?.data || res.data || [];
  //   } catch (error) {
  //     console.error('Error fetching students:', error);
  //     return [];
  //   }
  // };

  const getStudents = async (quizId: number) => {
    return getQuizStudents(quizId);
  };

  const assignStudents = async (payload: any) => {
    const res = await axiosInstance.post(ApiEndpoint.quiz.assignStudents, payload);
    return res.data;
  };

  const shareQuiz = async (id: number, payload: any) => {
    try {
      const res: any = await axiosInstance.post(`/api/v1/manage-quiz/${id}/share`, payload);
      return res.data;
    } catch (error) {
      console.error("Error sharing quiz:", error);
      throw error;
    }
  };

  const getQuizQuestions = async (quizId: number) => {
    try {
      const res: any = await axiosInstance.get(`/api/v1/manage-quiz/${quizId}`);
      return res.data?.data?.questions || res.data?.questions || [];
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  };

  const getQuizStudents = async (quizId: number, params?: any) => {
  try {
    // Ensure all required params are passed
    const queryParams = {
      academic_batch_id: params?.academic_batch_id,
      semester_id: params?.semester_id,
      crs_id: params?.crs_id
    };
    
    const res: any = await axiosInstance.get(
      `/api/v1/manage-quiz/${quizId}/students`, 
      { params: queryParams }
    );
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

  const addQuizQuestion = async (quizId: number, payload: any) => {
    const res = await axiosInstance.post(`/api/v1/manage-quiz/${quizId}/question`, payload);
    return res.data;
  };

  const updateQuiz = async (quizId: number, payload: any) => {
    const res: any = await axiosInstance.put(`/api/v1/manage-quiz/${quizId}`, payload);
    return res.data;
  };

  const deleteQuestion = async (qqId: number) => {
    const res: any = await axiosInstance.delete(`/api/v1/manage-quiz/question/${qqId}`);
    return res.data;
  };

  const getAssignedStudents = async (quizId: number) => {
    const res = await axiosInstance.get(`/api/v1/manage-quiz/${quizId}/assigned-students`);
    return res.data;
  };

  return {
    getQuizList,
    createQuiz,
    deleteQuiz,
    getMetaCurriculums,
    getMetaTerms,
    getMetaCourses,
    getMetaSections,
    getMetaTopics,
    getQuizDetails,
    getStudents,
    getQuizStudents,
    shareQuiz,
    assignStudents,
    addQuizQuestion,
    getQuizQuestions,
    updateQuiz,
    deleteQuestion,
    getAssignedStudents
  };
};