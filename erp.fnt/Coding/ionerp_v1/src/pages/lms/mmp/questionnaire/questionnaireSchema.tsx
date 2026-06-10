/**
 * FILE: questionnaireSchema.tsx
 * PURPOSE: Define form validation rules, field configuration, and table column definitions
 * 
 * WHY THIS FILE?
 * - Centralized place for ALL questionnaire form/table configuration
 * - Validation logic is reusable across create and edit operations
 * - Easy to modify form fields without touching component logic
 * - Follows existing Bloom Domain pattern (keeping consistency)
 * 
 * WHAT'S IN THIS FILE?
 * 1. Schema - Zod validation rules (what data is valid)
 * 2. SchemaFields - Form field configuration (how form looks)
 * 3. SchemaColumnDefs - Table column definitions (how table looks)
 */

import { z } from "zod";
import { OPTION_QUESTION_TYPES } from "./questionnaireConstants";

/**
 * ════════════════════════════════════════════════════════════════
 * 1️⃣ SCHEMA - VALIDATION RULES (Using Zod)
 * ════════════════════════════════════════════════════════════════
 * 
 * This defines WHAT data is valid.
 * When user clicks Save, DynamicFormBuilder uses this schema to validate.
 * If validation fails, form won't submit and shows error messages.
 * 
 * The field names here MUST match the field 'name' properties below!
 * Example: "quiz_title" in Schema must match "name: quiz_title" in SchemaFields
 */
export const Schema = z.object({
  // Quiz Title - Required, must be at least 1 character
  quiz_title: z
    .string()
    .min(1, { message: "Quiz Title is required" })
    .min(3, { message: "Quiz Title must be at least 3 characters" })
    .max(200, { message: "Quiz Title cannot exceed 200 characters" }),

  // Quiz Description - Required, must be at least 1 character
  quiz_description: z
    .string()
    .min(1, { message: "Description is required" })
    .min(10, { message: "Description must be at least 10 characters" })
    .max(2000, { message: "Description cannot exceed 2000 characters" }),

  // Quiz Instructions - Optional, can be empty
  quiz_instruction: z
    .string()
    .max(2000, { message: "Instructions cannot exceed 2000 characters" })
    .optional(),

  // Duration in minutes - Required, must be a positive number
  duration: z
    .number()
    .min(1, { message: "Duration must be at least 1 minute" })
    .max(480, { message: "Duration cannot exceed 480 minutes (8 hours)" }),

  // Shuffle Questions - Optional boolean
  shuffle_questions: z.boolean().optional(),

  // Shuffle Options - Optional boolean
  shuffle_options: z.boolean().optional(),

  // Practice Quiz - Optional boolean
  practice_quiz: z.boolean().optional(),
});

/**
 * ════════════════════════════════════════════════════════════════
 * 2️⃣ SCHEMA FIELDS - FORM CONFIGURATION
 * ════════════════════════════════════════════════════════════════
 * 
 * This defines HOW the form looks and what fields appear.
 * 
 * Structure:
 * - group: Section name (groups related fields together)
 * - fields: Array of field objects
 * 
 * Field properties:
 * - type: What kind of input (text, textarea, number, switch, etc.)
 * - name: Variable name (MUST match Schema field name above!)
 * - label: Display text above the input
 * - placeholder: Hint text inside the input box
 * - required: Whether user MUST fill this field
 * 
 * IMPORTANT: field.name MUST match a key in Schema object above!
 */
export const SchemaFields = [
  {
    // Group 1: Basic Information about the quiz
    group: "Basic Information",
    fields: [
      {
        type: "text", // Single-line text input
        name: "quiz_title", // MUST match Schema key
        label: "Quiz Title",
        placeholder: "Enter quiz title (e.g., Python Fundamentals)",
        required: true,
      },
      {
        type: "textarea", // Multi-line text area
        name: "quiz_description",
        label: "Description",
        placeholder: "Describe what this quiz covers (e.g., Basic Python concepts for beginners)",
        required: true,
      },
      {
        type: "textarea", // Multi-line text area
        name: "quiz_instruction",
        label: "Instructions to Students",
        placeholder: "Enter instructions (e.g., Answer all 20 questions. You have 60 minutes)",
        required: false,
      },
      {
        type: "number", // Numeric input
        name: "duration",
        label: "Duration (minutes)",
        placeholder: "Enter duration in minutes (e.g., 60)",
        required: true,
        min: 1,
        max: 480,
      },
    ],
  },

  {
    // Group 2: Quiz settings/options
    group: "Quiz Settings",
    fields: [
      {
        type: "switch", // Toggle switch (on/off)
        name: "shuffle_questions",
        label: "Shuffle Questions",
        required: false,
      },
      {
        type: "switch",
        name: "shuffle_options",
        label: "Shuffle Answer Options",
        required: false,
      },
      {
        type: "checkbox", // Checkbox (true/false)
        name: "practice_quiz",
        label: "This is a Practice Quiz",
        required: false,
      },
    ],
  },
];

/**
 * ════════════════════════════════════════════════════════════════
 * 3️⃣ SCHEMA COLUMN DEFS - TABLE CONFIGURATION
 * ════════════════════════════════════════════════════════════════
 * 
 * This defines what columns appear in the table.
 * AG-Grid uses this to render the data table.
 * 
 * Column properties:
 * - headerName: Column title in table header
 * - field: Which data field to display (must match API response field)
 * - sortable: Can user click to sort?
 * - filter: Can user filter this column?
 * - editable: Can user edit in table? (usually false for display-only)
 * - width/flex: How wide is the column?
 * - cellStyle: CSS styling for cells in this column
 * 
 * Common widths:
 * - width: Fixed width in pixels (e.g., width: 100)
 * - flex: Flexible width that grows with table (e.g., flex: 1)
 */
export const SchemaColumnDefs = [
  {
    headerName: "SL No.", // Serial number
    field: "sl_no",
    valueGetter: "node.rowIndex + 1", // Auto-calculated row number
    sortable: false,
    filter: false,
    editable: false,
    width: 55, // Fixed small width for serial number
    maxWidth: 80,
    cellStyle: { textAlign: "center", padding: "0 5px" },
  },
  {
    headerName: "Quiz Title", // Column title in table header
    field: "quiz_title", // Matches API response field name
    sortable: true, // User can sort by clicking header
    filter: true, // User can search/filter this column
    editable: false, // Display only, user can't edit in table
    width: 180, // Fixed width
    maxWidth: 200,
  },
  {
    headerName: "Description",
    field: "quiz_description",
    sortable: true,
    filter: true,
    editable: false,
    flex: 2, // Takes 2x space compared to flex: 1 columns
    minWidth: 300, // Won't shrink below this width
    wrapText: true, // Wrap long text across multiple lines
    cellStyle: {
      lineHeight: "1.5",
      paddingTop: "10px",
      paddingBottom: "10px",
      whiteSpace: "normal",
      wordBreak: "break-word",
    },
  },
  {
    headerName: "Duration (min)",
    field: "duration",
    sortable: true,
    filter: true,
    editable: false,
    width: 120,
    cellStyle: { textAlign: "center" },
  },
  {
    headerName: "Shuffle Q",
    field: "shuffle_questions",
    sortable: true,
    filter: true,
    editable: false,
    width: 100,
    cellStyle: { textAlign: "center" },
  },
];

const optionSchema = z.object({
  option_text: z.string().min(1, { message: "Option text is required" }),
  specify_flag: z.boolean(),
});

const questionSchema = z
  .object({
    question_text: z.string().min(1, { message: "Question text is required" }),
    question_type: z.enum(["MCQ", "Checkbox", "Descriptive", "Rating"]),
    questionnaire_type: z
      .string()
      .min(1, { message: "Questionnaire type is required" }),
    is_mandatory: z.boolean(),
    options: z.array(optionSchema),
    rating_min: z.number().min(1),
    rating_max: z.number().min(2),
    rating_step: z.number().min(1),
  })
  .superRefine((data, ctx) => {
    if (OPTION_QUESTION_TYPES.includes(data.question_type)) {
      if (data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 options are required",
          path: ["options"],
        });
      }
    }
    if (data.question_type === "Rating" && data.rating_max <= data.rating_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max rating must be greater than min rating",
        path: ["rating_max"],
      });
    }
  });

export const questionnaireBuilderSchema = z.object({
  quiz_id: z.number().nullable(),
  quiz_title: z
    .string()
    .min(3, { message: "Title is required (min 3 characters)" }),
  quiz_description: z
    .string()
    .min(10, { message: "Description is required (min 10 characters)" }),
  quiz_instruction: z.string().optional(),
  duration: z.number().min(1).max(480),
  shuffle_questions: z.boolean(),
  shuffle_options: z.boolean(),
  practice_quiz: z.boolean(),
  field_settings: z.object({
    save_mode: z.enum(["create_copy", "continue_existing"]),
  }),
  questions: z
    .array(questionSchema)
    .min(1, { message: "At least one question is required" }),
});
