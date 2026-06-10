import { FieldSettingsMode, QuestionType } from "./questionnaireConstants";

/**
 * FILE: responseInterface.ts
 * PURPOSE: Define TypeScript types/interfaces for the questionnaire module
 * 
 * WHY THIS FILE?
 * - Ensures type safety across the questionnaire module
 * - Prevents runtime errors by catching type mismatches at compile time
 * - Makes code more maintainable and self-documenting
 * - Helps IDE provide autocomplete suggestions
 */

/**
 * Interface: getQuestionnaireList
 * PURPOSE: Define the structure of a questionnaire object from the server
 * 
 * Fields explanation:
 * - quiz_id: Unique identifier for the quiz (from database primary key)
 * - quiz_title: Name/title of the questionnaire
 * - quiz_description: Detailed description of what the quiz covers
 * - quiz_instruction: Instructions to display to students taking the quiz
 * - duration: Time limit for quiz in minutes
 * - shuffle_questions: Whether to randomize question order (0=no, 1=yes)
 * - shuffle_options: Whether to randomize answer options (0=no, 1=yes)
 * - practice_quiz: Is this a practice/sample quiz? (0=no, 1=yes)
 * - status: Record status (1=active, 0=inactive, 2=deleted)
 * - created_date: When the quiz was created
 * - created_by: User ID of creator
 * - modified_date: When quiz was last updated
 * - modified_by: User ID of last person who edited
 */
export interface getQuestionnaireList {
  quiz_id: number;
  quiz_title: string;
  quiz_description: string;
  quiz_instruction?: string;
  duration: number;
  shuffle_questions?: number;
  shuffle_options?: number;
  practice_quiz?: number;
  status: number;
  created_date?: string;
  created_by?: number;
  modified_date?: string;
  modified_by?: number;
}

/**
 * Interface: CreateQuestionnairePayload
 * PURPOSE: Define the structure of data sent to the server when creating/updating a quiz
 * 
 * This is different from getQuestionnaireList because:
 * - We don't send IDs, dates, or user info (server handles these)
 * - We only send the fields the user actually fills in the form
 * - This payload goes into the request body when calling the API
 * 
 * Note: quiz_id is optional
 * - If quiz_id is NULL: Create new quiz
 * - If quiz_id is provided: Update existing quiz
 */
export interface CreateQuestionnairePayload {
  quiz_title: string;
  quiz_description: string;
  quiz_instruction?: string;
  duration: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  practice_quiz?: boolean;
  quiz_id?: number | null; // Optional because new records don't have ID yet
}

export interface QuestionOptionFormValues {
  option_text: string;
  specify_flag: boolean;
}

export interface QuestionFormValues {
  question_text: string;
  question_type: QuestionType;
  questionnaire_type: string;
  is_mandatory: boolean;
  options: QuestionOptionFormValues[];
  rating_min: number;
  rating_max: number;
  rating_step: number;
}

export interface FieldSettingsFormValues {
  save_mode: FieldSettingsMode;
}

export interface QuestionnaireBuilderFormValues {
  quiz_id: number | null;
  quiz_title: string;
  quiz_description: string;
  quiz_instruction?: string;
  duration: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  practice_quiz: boolean;
  field_settings: FieldSettingsFormValues;
  questions: QuestionFormValues[];
}
