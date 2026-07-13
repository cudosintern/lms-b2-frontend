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
  const fieldTextClass = isAddMoreMode ? "text-[13px]" : "text-[15px]";
  const questionnairePrimaryColorClass = "bg-[#337ab7]";
  const questionnaireDangerColorClass = "bg-[#d9534f]";
  const counterTextClass = isEditQuestionLayout ? "text-xs" : "text-xs";
  const questionBodyWidthClass = isEditQuestionLayout
    ? "md:w-[850px] md:max-w-[850px]"
    : isAddMoreMode
      ? "md:w-[960px] md:max-w-[960px]"
    : isCreateMode
      ? "md:!w-[860px] md:!max-w-[860px]"
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

  if (isAddMoreMode) {
    return (
      <div className="border border-[#aeb7c2] px-[18px] pb-[14px] pt-[7px]">
        <div className="flex items-start gap-[22px]">
          <div className="w-[858px] max-w-[858px]">
            <div className="grid grid-cols-[78px_300px_410px] gap-x-[34px]">
              <input
                className={`h-[41px] w-[78px] rounded border border-gray-300 px-3 py-2 text-center ${fieldTextClass}`}
                value={questionNumber || questionIndex + 1}
                readOnly
              />
              <Controller
                name={`questions.${questionIndex}.que_type_id`}
                control={control}
                render={({ field }) => (
                  <div>
                    <select
                      className={`h-[41px] w-[300px] rounded border px-4 py-2 ${
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
                    className={`h-[41px] w-[410px] rounded border border-gray-300 px-4 py-2 ${fieldTextClass}`}
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
            </div>

            <div className="mt-[8px] w-[858px] max-w-[858px]">
              <Controller
                name={`questions.${questionIndex}.question`}
                control={control}
                render={({ field }) => (
                  <div className="w-[858px] max-w-[858px]">
                    <textarea
                      className={`h-[101px] w-[858px] max-w-[858px] rounded border border-gray-300 px-4 py-3 align-top ${fieldTextClass}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter question"
                    />
                    <p className={`mt-1 text-right text-cyan-700 ${counterTextClass}`}>
                      {(questionText || "").length} / 2000 characters
                    </p>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="flex w-[110px] flex-col items-start pt-[6px]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold leading-none">Mandatory:</span>
              <Controller
                name={`questions.${questionIndex}.que_is_mandatory`}
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[15px] w-[15px] shrink-0 accent-[#337ab7]"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>

            {!isQuestionEditMode && (
              <button
                type="button"
                className={`mt-[50px] h-[38px] w-[38px] rounded-full text-[22px] font-bold leading-none text-white ${
                  isFirst ? questionnairePrimaryColorClass : questionnaireDangerColorClass
                }`}
                onClick={isFirst ? onAdd : onRemove}
              >
                {isFirst ? "+" : "-"}
              </button>
            )}
          </div>
        </div>

        {showsOptions && optionFields.length > 0 && (
          <div className="mt-2 w-[858px] max-w-[858px] space-y-1.5">
            {optionFields.slice(0, MAX_OPTIONS).map((field, optionIndex) => (
              <div
                key={field.id}
                className="grid grid-cols-[822px_auto] items-center gap-2"
              >
                <Controller
                  name={`questions.${questionIndex}.options.${optionIndex}.que_option`}
                  control={control}
                  render={({ field }) => (
                    <input
                      className={`h-[38px] rounded border border-gray-300 px-3 py-2 ${fieldTextClass}`}
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
                      className={`flex h-[32px] w-[32px] items-center justify-center rounded text-base font-bold leading-none text-white ${questionnairePrimaryColorClass}`}
                      onClick={handleAddOption}
                    >
                      +
                    </button>
                  ) : optionIndex >= 2 ? (
                    <button
                      type="button"
                      className={`flex h-[32px] w-[32px] items-center justify-center rounded text-base font-bold leading-none text-white ${questionnaireDangerColorClass}`}
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
                    <div className="h-[32px] w-[32px]" />
                  )}
                  <Controller
                    name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        title="Specify"
                        className={`flex h-[32px] w-[32px] items-center justify-center rounded border border-[#337ab7] px-0 py-0 text-[12px] ${
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
          <p className="pt-1 text-sm text-red-600">
            {String(questionErrors.question.message)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border ${
        isQuestionEditMode
          ? "border-[#c4cbd3] px-[16px] pb-[14px] pt-[6px]"
          : isCreateMode
            ? "border-gray-400 px-[16px] pb-[12px] pt-[6px]"
          : "border-gray-400 p-6"
      }`}
    >
      <div
        className={`grid grid-cols-1 items-start gap-3 ${
          isQuestionEditMode
            ? "md:grid-cols-[76px_300px_410px_160px] md:gap-x-[32px]"
            : isCreateMode
            ? "md:grid-cols-[78px_300px_410px_150px] md:gap-x-[34px]"
            : "md:grid-cols-[88px_354px_466px_max-content] md:gap-x-10"
        }`}
      >
        <input
          className={`${
            isQuestionEditMode
              ? "h-[36px] md:w-[76px]"
              : isCreateMode
                ? "h-[36px] md:w-[78px]"
                : "h-9 md:w-[88px]"
          } rounded border border-gray-300 px-3 py-2 text-center ${
            fieldTextClass
          }`}
          value={questionNumber || questionIndex + 1}
          readOnly
        />
        <Controller
          name={`questions.${questionIndex}.que_type_id`}
          control={control}
          render={({ field }) => (
            <div>
              <select
                className={`${
                  isQuestionEditMode
                    ? "h-[36px] w-[300px] px-3"
                    : isCreateMode
                      ? "h-[36px] !w-[300px] !max-w-[300px] !flex-none px-3 text-[13px]"
                      : "h-9 w-full px-3"
                } rounded border py-2 ${
                  questionTypeError ? "border-red-500 text-red-600" : "border-gray-300"
                } ${isQuestionEditMode ? "text-[13px]" : isCreateMode ? "" : "text-[15px]"}`}
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
              className={`rounded border border-gray-300 py-2 ${
                isQuestionEditMode
                  ? "h-[36px] w-[410px] px-3 text-[13px]"
                  : isCreateMode
                    ? "h-[36px] !w-[410px] !max-w-[410px] !flex-none px-3 text-[13px]"
                  : "h-9 w-full px-3 text-[15px]"
              }`}
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
        <div
          className={`flex items-center justify-self-start self-center ${
            isQuestionEditMode ? "gap-2 pl-[8px]" : isCreateMode ? "gap-2 pl-[4px]" : "gap-3"
          }`}
        >
          <span
            className={`${
              isQuestionEditMode ? "text-[13px]" : isCreateMode ? "text-[13px]" : "text-[15px]"
            } font-semibold leading-none`}
          >
            Mandatory:
          </span>

          <Controller
            name={`questions.${questionIndex}.que_is_mandatory`}
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                className={`${
                  isQuestionEditMode ? "h-[14px] w-[14px]" : isCreateMode ? "h-[14px] w-[14px]" : "h-4 w-4"
                } shrink-0 accent-[#337ab7]`}
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
            ? ""
            : isCreateMode
              ? "grid grid-cols-1 md:grid-cols-[856px_40px] md:items-center md:gap-[8px]"
              : "grid grid-cols-1 md:grid-cols-[minmax(0,78%)_48px] md:pl-5"
        }`}
      >
        <Controller
          name={`questions.${questionIndex}.question`}
          control={control}
          render={({ field }) => (
            <div className={questionBodyWidthClass}>
              <textarea
                className={`rounded border border-gray-300 px-3 py-2 align-top ${
                  isQuestionEditMode
                    ? "h-[84px] w-[850px] text-[13px]"
                  : isCreateMode
                      ? "h-[90px] !w-[860px] !max-w-[860px] !flex-none text-[13px]"
                      : "h-24 w-full text-[15px]"
                }`}
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
            className={`${
              isCreateMode
                ? "flex h-[34px] w-[34px] items-center justify-center p-0 text-[22px] leading-none"
                : "h-10 w-10 text-xl"
            } rounded-full font-bold text-white ${
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
            isQuestionEditMode ? "" : isCreateMode ? "" : "md:pl-5"
          } ${questionBodyWidthClass}`}
        >
          {optionFields.slice(0, MAX_OPTIONS).map((field, optionIndex) => (
            <div
              key={field.id}
              className={`grid items-center gap-2 ${
                isQuestionEditMode
                  ? "grid-cols-[740px_auto]"
                : isCreateMode
                  ? "grid-cols-1 md:grid-cols-[824px_auto]"
                  : isAddMoreMode
                    ? "grid-cols-1 md:grid-cols-[938px_auto]"
                  : "grid-cols-[minmax(0,1fr)_auto]"
              }`}
            >
              <Controller
                name={`questions.${questionIndex}.options.${optionIndex}.que_option`}
                control={control}
                render={({ field }) => (
                  <input
                    className={`rounded border border-gray-300 px-3 py-2 ${
                      isQuestionEditMode
                        ? "h-[34px] w-[740px] text-[13px]"
                        : isCreateMode
                          ? "h-[34px] w-[824px] text-[13px]"
                          : "h-9 text-[15px]"
                    }`}
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
                    className={`flex ${isQuestionEditMode ? "h-[30px] w-[30px] text-base" : "h-[34px] w-[34px] text-lg"} items-center justify-center rounded font-bold leading-none text-white ${questionnairePrimaryColorClass}`}
                    onClick={handleAddOption}
                  >
                    +
                  </button>
                ) : optionIndex >= 2 ? (
                  <button
                    type="button"
                    className={`flex ${isQuestionEditMode ? "h-[30px] w-[30px] text-base" : "h-[34px] w-[34px] text-lg"} items-center justify-center rounded font-bold leading-none text-white ${questionnaireDangerColorClass}`}
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
                  <div className={isQuestionEditMode ? "h-[30px] w-[30px]" : "h-[34px] w-[34px]"} />
                )}
                <Controller
                  name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      title="Specify"
                      className={`flex ${isQuestionEditMode ? "h-[30px] w-[30px] text-[12px]" : "h-[34px] w-[34px] text-sm"} items-center justify-center rounded border border-[#337ab7] px-0 py-0 ${
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
        <p className={`${isQuestionEditMode ? "" : "pl-5"} text-sm text-red-600`}>
          {String(questionErrors.question.message)}
        </p>
      )}
    </div>
  );
};

export default QuestionBlock;
