import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionnaireMetaFormProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  compact?: boolean;
  createMode?: boolean;
}

const QuestionnaireMetaForm: React.FC<QuestionnaireMetaFormProps> = ({
  control,
  errors,
  compact = false,
  createMode = false,
}) => (
  <section className={compact ? "space-y-3" : "space-y-4"}>
    <div
      className={`grid grid-cols-1 items-center gap-2 ${
        createMode
          ? "md:grid-cols-[200px_540px]"
          : "md:grid-cols-[200px_minmax(0,40%)]"
      }`}
    >
      <Controller
        name="questionnaire_name"
        control={control}
        render={({ field }) => (
          <>
            <label className="!text-[15px] font-semibold">
              Questionnaire Title: <span className="text-red-500">*</span>
            </label>
            <input
              className="h-10 rounded border border-gray-300 px-4 py-2 text-sm md:max-w-full"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Enter questionnaire title"
            />
            {errors.questionnaire_name && (
              <p className="col-start-2 text-sm text-red-600">
                {String(errors.questionnaire_name.message)}
              </p>
            )}
          </>
        )}
      />
    </div>

    <div
      className={`grid grid-cols-1 items-start gap-2 ${
        createMode
          ? "md:grid-cols-[200px_760px]"
          : "md:grid-cols-[200px_minmax(0,58%)]"
      }`}
    >
      <Controller
        name="message_to_mentees"
        control={control}
        render={({ field }) => (
          <>
            <label className="!text-[15px] font-semibold">
              Message to Mentees:
            </label>
            <div>
              <textarea
                className={`w-full rounded border border-gray-300 px-4 py-2 text-sm ${
                  compact ? "h-16" : "h-16"
                }`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Enter message to mentees"
              />
              <p className="text-right text-xs text-cyan-700">
                {(field.value || "").length} / 2000 characters
              </p>
            </div>
          </>
        )}
      />
    </div>

    <Controller
      name="access_level"
      control={control}
      render={({ field }) => (
        <input type="hidden" value={field.value} onChange={field.onChange} />
      )}
    />
  </section>
);

export default QuestionnaireMetaForm;
