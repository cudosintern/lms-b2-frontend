import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionnaireMetaFormProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
}

const QuestionnaireMetaForm: React.FC<QuestionnaireMetaFormProps> = ({
  control,
  errors,
}) => (
  <section className="space-y-5">
    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[250px_minmax(0,490px)]">
      <Controller
        name="questionnaire_name"
        control={control}
        render={({ field }) => (
          <>
            <label className="text-sm font-semibold">
              Questionnaire Title: <span className="text-red-500">*</span>
            </label>
            <input
              className="rounded border border-gray-300 px-4 py-2"
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

    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[250px_minmax(0,750px)]">
      <Controller
        name="message_to_mentees"
        control={control}
        render={({ field }) => (
          <>
            <label className="pt-1 text-sm font-semibold">
              Message to Mentees:
            </label>
            <div>
              <textarea
                className="h-16 w-full rounded border border-gray-300 px-4 py-2"
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
