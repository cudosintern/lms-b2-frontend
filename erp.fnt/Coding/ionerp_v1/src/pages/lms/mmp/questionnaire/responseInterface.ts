export interface getQuestionnaireList {
  questionnaire_id: number;
  questionnaire_name: string;
  message_to_mentees?: string;
  access_level: number;
  parent_id?: number | null;
  field_setting_id?: number | string | null;
  field_setting_desc?: string;
  field_settings?: {
    field_setting_id?: number | string | null;
    field_setting_desc?: string;
  };
}

export interface QuestionOptionFormValues {
  questionnaire_options_id?: number | null;
  que_option: string;
  specify_flag: boolean;
}

export interface QuestionFormValues {
  questionnaire_que_id?: number | null;
  que_type_id: number;
  que_no: number;
  question: string;
  questionnaire_type_id: number;
  que_is_mandatory: boolean;
  options: QuestionOptionFormValues[];
}

export interface QuestionnaireBuilderFormValues {
  questionnaire_id: number | null;
  questionnaire_name: string;
  message_to_mentees?: string;
  access_level: number;
  parent_id: number | null;
  field_settings: {
    field_setting_id: string | null;
    field_setting_desc?: string;
  };
  questions: QuestionFormValues[];
}

export interface LookupOption {
  label: string;
  value: number;
}

export interface FieldSettingOption {
  field_setting_id: number | string;
  field_setting_desc: string;
  status: number;
}
