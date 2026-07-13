import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionnaireMetaFormProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  compact?: boolean;
  createMode?: boolean;
  editMode?: boolean;
}

const QuestionnaireMetaForm: React.FC<QuestionnaireMetaFormProps> = ({
  control,
  errors,
  compact = false,
  createMode = false,
  editMode = false,
}) => (
  <section
    className={
      editMode
        ? "space-y-[14px]"
        : createMode
          ? "space-y-[12px]"
          : compact
            ? "space-y-3"
            : "space-y-4"
    }
  >
    <div
      className={`grid grid-cols-1 items-center gap-2 ${
        editMode
          ? "md:grid-cols-[190px_425px] md:gap-x-[16px]"
          : createMode
          ? "md:grid-cols-[200px_430px] md:gap-x-[28px]"
          : "md:grid-cols-[200px_minmax(0,40%)]"
      }`}
    >
      <Controller
        name="questionnaire_name"
        control={control}
        render={({ field }) => (
          <>
            <label
              className={`${
                editMode
                  ? "text-[14px] leading-[18px]"
                  : createMode
                    ? "text-[13px] leading-[18px]"
                    : "!text-[15px]"
              } font-semibold`}
            >
              Questionnaire Title: <span className="text-red-500">*</span>
            </label>
            <input
              className={`rounded border border-gray-300 px-3 py-2 ${
                editMode
                  ? "h-[34px] w-[425px] text-[13px]"
                  : createMode
                    ? "h-[36px] !w-[430px] !max-w-[430px] !flex-none text-[13px]"
                    : "h-10 text-sm md:max-w-full"
              }`}
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
        editMode
          ? "md:grid-cols-[190px_650px] md:gap-x-[16px]"
          : createMode
          ? "md:grid-cols-[200px_660px] md:gap-x-[28px]"
          : "md:grid-cols-[200px_minmax(0,58%)]"
      }`}
    >
      <Controller
        name="message_to_mentees"
        control={control}
        render={({ field }) => (
          <>
            <label
              className={`${
                editMode
                  ? "pt-[2px] text-[14px] leading-[18px]"
                  : createMode
                    ? "pt-[2px] text-[13px] leading-[18px]"
                    : "!text-[15px]"
              } font-semibold`}
            >
              Message to Mentees:
            </label>
            <div>
              <textarea
                className={`rounded border border-gray-300 px-3 py-2 ${
                  editMode
                    ? "h-[50px] w-[650px] text-[13px]"
                  : createMode
                      ? "h-[58px] !w-[660px] !max-w-[660px] !flex-none text-[13px]"
                      : `w-full text-sm ${compact ? "h-16" : "h-16"}`
                }`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Enter message to mentees"
              />
              <p
                className={`${
                  editMode ? "pt-[1px] text-[11px]" : createMode ? "pt-[1px] text-[11px]" : "text-xs"
                } text-right text-cyan-700`}
              >
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
