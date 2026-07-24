export interface Question {
  id: number;
  qno: number;
  questionText: string;
  options: string[];
}

export const MOCK_MMP_QUESTIONS: Question[] = [
  {
    id: 1,
    qno: 1,
    questionText: "Are you satisfied with the teaching staff and their teaching methods",
    options: [
      "A. Extremely satisfied", "B. Satisfied",
      "C. Dissatisfied________(Specify)", "D. Extremely dissatisfied________(Specify)"
    ]
  },
  {
    id: 2,
    qno: 2,
    questionText: "Was it easy to obtain necessary resources from college library?",
    options: [
      "A. Yes", "B. No________(Specify)"
    ]
  }
];

export const FIELD_SETTING_OPTIONS = [
  "Allow to add / modify / delete Questionnaire",
  "Allow to modify / delete Questionnaire only",
  "Do not allow to add / modify / delete Questionnaire",
  "Do not allow to modify / delete questions added by higher authority"
];
