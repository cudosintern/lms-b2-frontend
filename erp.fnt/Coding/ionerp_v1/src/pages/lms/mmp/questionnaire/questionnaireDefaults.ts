import {
  QuestionFormValues,
  QuestionOptionFormValues,
  QuestionnaireBuilderFormValues,
} from "./responseInterface";

export const createDefaultOption = (): QuestionOptionFormValues => ({
  option_text: "",
  specify_flag: false,
});

export const createDefaultQuestion = (): QuestionFormValues => ({
  question_text: "",
  question_type: "MCQ",
  questionnaire_type: "general",
  is_mandatory: true,
  options: [createDefaultOption(), createDefaultOption()],
  rating_min: 1,
  rating_max: 5,
  rating_step: 1,
});

export const createDefaultBuilderForm = (): QuestionnaireBuilderFormValues => ({
  quiz_id: null,
  quiz_title: "",
  quiz_description: "",
  quiz_instruction: "",
  duration: 60,
  shuffle_questions: false,
  shuffle_options: false,
  practice_quiz: false,
  field_settings: {
    save_mode: "continue_existing",
  },
  questions: [createDefaultQuestion()],
});
