import {
  QuestionFormValues,
  QuestionOptionFormValues,
  QuestionnaireBuilderFormValues,
} from "./responseInterface";

export const MAX_OPTIONS = 5;

export const createDefaultOption = (): QuestionOptionFormValues => ({
  questionnaire_options_id: null,
  que_option: "",
  specify_flag: false,
});

export const createDefaultQuestion = (): QuestionFormValues => ({
  questionnaire_que_id: null,
  que_type_id: 0,
  que_no: 1,
  question: "",
  questionnaire_type_id: 0,
  que_is_mandatory: true,
  options: [],
});

export const createDefaultBuilderForm = (): QuestionnaireBuilderFormValues => ({
  questionnaire_id: null,
  questionnaire_name: "",
  message_to_mentees: "",
  access_level: 0,
  parent_id: null,
  field_settings: {
    field_setting_id: null,
    field_setting_desc: "",
  },
  questions: [createDefaultQuestion()],
});
