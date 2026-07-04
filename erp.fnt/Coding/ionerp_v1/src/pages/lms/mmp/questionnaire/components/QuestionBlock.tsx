import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { createDefaultOption, MAX_OPTIONS } from "../questionnaireDefaults";
import { LookupOption, QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionBlockProps {
  control: Control<QuestionnaireBuilderFormValues>;
  questionIndex: number;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  setValue: UseFormSetValue<QuestionnaireBuilderFormValues>;
  clearErrors: UseFormClearErrors<QuestionnaireBuilderFormValues>;
  onAdd: () => void;
  onRemove: () => void;
  isFirst: boolean;
  questionTypes: LookupOption[];
  questionnaireTypes: LookupOption[];
  isQuestionEditMode?: boolean;
  isCreateMode?: boolean;
  isAddMoreMode?: boolean;
  onDeleteSavedOption?: (
    questionIndex: number,
    optionIndex: number,
    questionnaireOptionsId: number,
  ) => void;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({
  control,
  questionIndex,
  errors,
  setValue,
  clearErrors,
  onAdd,
  onRemove,
  isFirst,
  questionTypes,
  questionnaireTypes,
  isQuestionEditMode = false,
  isCreateMode = false,
  isAddMoreMode = false,
  onDeleteSavedOption,
}) => {
  const isEditQuestionLayout = isQuestionEditMode;
  const fieldTextClass = "text-[15px]";
  const questionnairePrimaryColorClass = "bg-[#337ab7]";
  const questionnaireDangerColorClass = "bg-[#d9534f]";
  const counterTextClass = isEditQuestionLayout ? "text-sm" : "text-xs";
  const questionBodyWidthClass = isEditQuestionLayout
    ? "md:w-[64%] md:max-w-[64%]"
    : isAddMoreMode
      ? "md:w-[986px] md:max-w-[986px]"
    : isCreateMode
      ? "md:w-[905px] md:max-w-[905px]"
      : "md:w-[78%] md:max-w-[78%]";
  const selectedTypeId = useWatch({
    control,
    name: `questions.${questionIndex}.que_type_id`,
  });
  const questionText = useWatch({
    control,
    name: `questions.${questionIndex}.question`,
  });
  const questionNumber = useWatch({
    control,
    name: `questions.${questionIndex}.que_no`,
  });
  const selectedTypeLabel =
    questionTypes.find((item) => item.value === selectedTypeId)?.label || "";
  const normalizedTypeLabel = selectedTypeLabel
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, " ");
  const showsOptions =
    normalizedTypeLabel === "single select" || normalizedTypeLabel === "multiple select";
  const questionErrors = errors.questions?.[questionIndex];
  const questionTypeError = questionErrors?.que_type_id;

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });
  const canAddOption = optionFields.length < MAX_OPTIONS;

  React.useEffect(() => {
    if (!selectedTypeId) return;
    if (!showsOptions) {
      setValue(`questions.${questionIndex}.options`, [], { shouldValidate: true });
      return;
    }
    if (optionFields.length === 0) {
      setValue(
        `questions.${questionIndex}.options`,
        [createDefaultOption(), createDefaultOption()],
        { shouldValidate: true },
      );
    }
  }, [optionFields.length, questionIndex, selectedTypeId, setValue, showsOptions]);

  const handleAddOption = React.useCallback(() => {
    if (!canAddOption) {
      return;
    }
    appendOption(createDefaultOption());
  }, [appendOption, canAddOption]);

  return (
    <div className="border border-gray-400 p-6">
      <div
        className={`grid grid-cols-1 items-start gap-3 ${
          isCreateMode
            ? "md:grid-cols-[80px_305px_420px_max-content] md:gap-x-8"
            : isAddMoreMode
              ? "md:grid-cols-[96px_352px_476px_max-content] md:gap-x-8"
            : "md:grid-cols-[88px_354px_466px_max-content] md:gap-x-10"
        }`}
      >
        <input
          className={`h-9 rounded border border-gray-300 px-3 py-2 text-center ${
            isCreateMode ? "md:w-[80px]" : "md:w-[88px]"
          } ${fieldTextClass}`}
          value={questionNumber || questionIndex + 1}
          readOnly
        />
        <Controller
          name={`questions.${questionIndex}.que_type_id`}
          control={control}
          render={({ field }) => (
            <div>
              <select
                className={`h-9 w-full rounded border px-3 py-2 ${
                  questionTypeError ? "border-red-500 text-red-600" : "border-gray-300"
                } ${fieldTextClass}`}
                value={field.value || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  field.onChange(value);
                  if (value > 0) {
                    clearErrors(`questions.${questionIndex}.que_type_id`);
                  }
                }}
              >
                <option value={0}>Select question type</option>
                {questionTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              {questionTypeError && (
                <p className="mt-1 text-sm text-red-600">
                  {String(questionTypeError.message)}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          name={`questions.${questionIndex}.questionnaire_type_id`}
          control={control}
          render={({ field }) => (
            <select
              className={`h-9 w-full rounded border border-gray-300 px-3 py-2 ${fieldTextClass}`}
              value={field.value || 0}
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <option value={0}>Select questionnaire type</option>
              {questionnaireTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          )}
        />
        <div className="flex items-center justify-self-start gap-3 self-center">
          <span className="text-[15px] font-semibold leading-none">
            Mandatory:
          </span>

          <Controller
            name={`questions.${questionIndex}.que_is_mandatory`}
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-[#337ab7]"
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>

      <div
        className={`mt-2 items-start gap-3 ${
          isQuestionEditMode
            ? "md:pl-6"
            : isAddMoreMode
              ? "grid grid-cols-1 md:grid-cols-[986px_48px] md:items-center md:gap-4 md:pl-[19px]"
            : isCreateMode
              ? "grid grid-cols-1 md:grid-cols-[905px_48px] md:items-center md:gap-4 md:pl-[19px]"
              : "grid grid-cols-1 md:grid-cols-[minmax(0,78%)_48px] md:pl-5"
        }`}
      >
        <Controller
          name={`questions.${questionIndex}.question`}
          control={control}
          render={({ field }) => (
            <div className={questionBodyWidthClass}>
              <textarea
                className={`w-full rounded border border-gray-300 px-4 py-3 align-top ${
                  isCreateMode || isAddMoreMode ? "h-[90px]" : "h-24"
                } ${fieldTextClass}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Enter question"
              />
              <p className={`text-right text-cyan-700 ${counterTextClass}`}>
                {(questionText || "").length} / 2000 characters
              </p>
            </div>
          )}
        />

        {!isQuestionEditMode && (
          <button
            type="button"
            className={`h-10 w-10 rounded-full text-xl font-bold text-white ${
              isFirst ? questionnairePrimaryColorClass : questionnaireDangerColorClass
            }`}
            onClick={isFirst ? onAdd : onRemove}
          >
            {isFirst ? "+" : "-"}
          </button>
        )}
      </div>

      {showsOptions && optionFields.length > 0 && (
        <div
          className={`mt-2 space-y-2 ${
            isCreateMode || isAddMoreMode ? "md:pl-[19px]" : "md:pl-5"
          } ${questionBodyWidthClass}`}
        >
          {optionFields.slice(0, MAX_OPTIONS).map((field, optionIndex) => (
            <div
              key={field.id}
              className={`grid items-center gap-2 ${
                isCreateMode
                  ? "grid-cols-1 md:grid-cols-[860px_auto]"
                  : isAddMoreMode
                    ? "grid-cols-1 md:grid-cols-[940px_auto]"
                  : "grid-cols-[minmax(0,1fr)_auto]"
              }`}
            >
              <Controller
                name={`questions.${questionIndex}.options.${optionIndex}.que_option`}
                control={control}
                render={({ field }) => (
                  <input
                    className={`h-9 rounded border border-gray-300 px-3 py-2 ${fieldTextClass}`}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                )}
              />
              <div className="flex shrink-0 items-center gap-2">
                {optionIndex === 0 && canAddOption ? (
                  <button
                    type="button"
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded text-lg font-bold leading-none text-white ${questionnairePrimaryColorClass}`}
                    onClick={handleAddOption}
                  >
                    +
                  </button>
                ) : optionIndex >= 2 ? (
                  <button
                    type="button"
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded text-lg font-bold leading-none text-white ${questionnaireDangerColorClass}`}
                    onClick={() => {
                      const savedOptionId =
                        typeof field.questionnaire_options_id === "number"
                          ? field.questionnaire_options_id
                          : null;
                      if (savedOptionId && onDeleteSavedOption) {
                        onDeleteSavedOption(questionIndex, optionIndex, savedOptionId);
                        return;
                      }
                      removeOption(optionIndex);
                    }}
                  >
                    -
                  </button>
                ) : (
                  <div className="h-[34px] w-[34px]" />
                )}
                <Controller
                  name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      title="Specify"
                      className={`flex h-[34px] w-[34px] items-center justify-center rounded border border-[#337ab7] px-0 py-0 text-sm ${
                        field.value ? "bg-[#337ab7] text-white" : "bg-white text-[#337ab7]"
                      }`}
                      onClick={() => field.onChange(!field.value)}
                    >
                      ...
                    </button>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {questionErrors?.question && (
        <p className="pl-5 text-sm text-red-600">
          {String(questionErrors.question.message)}
        </p>
      )}
    </div>
  );
};

export default QuestionBlock;
