export const QUESTION_TYPES = [
  { label: "MCQ", value: "MCQ" },
  { label: "Checkbox", value: "Checkbox" },
  { label: "Descriptive", value: "Descriptive" },
  { label: "Rating", value: "Rating" },
] as const;

export const QUESTIONNAIRE_TYPES = [
  { label: "General", value: "general" },
  { label: "Feedback", value: "feedback" },
  { label: "Assessment", value: "assessment" },
  { label: "Survey", value: "survey" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export const OPTION_QUESTION_TYPES: QuestionType[] = ["MCQ", "Checkbox"];

export const FIELD_SETTINGS_MODES = [
  {
    label: "Create Copy",
    value: "create_copy",
    description: "Save as a new copy of this questionnaire",
  },
  {
    label: "Continue Existing",
    value: "continue_existing",
    description: "Update the same questionnaire without creating a copy",
  },
] as const;

export type FieldSettingsMode = (typeof FIELD_SETTINGS_MODES)[number]["value"];
