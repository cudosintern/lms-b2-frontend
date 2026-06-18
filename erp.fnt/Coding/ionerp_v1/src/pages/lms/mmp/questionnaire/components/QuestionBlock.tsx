import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { createDefaultOption } from "../questionnaireDefaults";
import { LookupOption, QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionBlockProps {
  control: Control<QuestionnaireBuilderFormValues>;
  questionIndex: number;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  setValue: UseFormSetValue<QuestionnaireBuilderFormValues>;
  onAdd: () => void;
  onRemove: () => void;
  isFirst: boolean;
  questionTypes: LookupOption[];
  questionnaireTypes: LookupOption[];
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
  onAdd,
  onRemove,
  isFirst,
  questionTypes,
  questionnaireTypes,
  onDeleteSavedOption,
}) => {
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

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

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

  return (
    <div className="border border-gray-400 p-3">
      <div className="grid grid-cols-1 items-center gap-3 xl:grid-cols-[90px_minmax(220px,345px)_minmax(260px,470px)_120px_60px]">
        <input
          className="rounded border border-gray-300 px-3 py-2 text-center"
          value={questionNumber || questionIndex + 1}
          readOnly
        />
        <Controller
          name={`questions.${questionIndex}.que_type_id`}
          control={control}
          render={({ field }) => (
            <select
              className="rounded border border-gray-300 px-4 py-2"
              value={field.value || 0}
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <option value={0}>Select question type</option>
              {questionTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          )}
        />
        <Controller
          name={`questions.${questionIndex}.questionnaire_type_id`}
          control={control}
          render={({ field }) => (
            <select
              className="rounded border border-gray-300 px-4 py-2"
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
        <span className="text-sm font-semibold">Mandatory:</span>
        <Controller
          name={`questions.${questionIndex}.que_is_mandatory`}
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      <div className="mt-2 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_70px] md:pl-5">
        <Controller
          name={`questions.${questionIndex}.question`}
          control={control}
          render={({ field }) => (
            <div>
              <textarea
                className="h-24 w-full rounded border border-gray-300 px-4 py-2"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Enter question"
              />
              <p className="text-right text-xs text-cyan-700">
                {(questionText || "").length} / 2000 characters
              </p>
            </div>
          )}
        />

        <button
          type="button"
          className={`mx-auto h-10 w-10 rounded-full text-xl font-bold text-white ${
            isFirst ? "bg-blue-600" : "bg-red-500"
          }`}
          onClick={isFirst ? onAdd : onRemove}
        >
          {isFirst ? "+" : "-"}
        </button>
      </div>

      {showsOptions && optionFields.length > 0 && (
        <div className="mt-3 space-y-2 md:pl-5">
          {optionFields.map((field, optionIndex) => (
            <div
              key={field.id}
              className="grid grid-cols-[minmax(0,1fr)_40px_40px] items-center gap-3 md:grid-cols-[minmax(0,1fr)_40px_40px_auto]"
            >
              <Controller
                name={`questions.${questionIndex}.options.${optionIndex}.que_option`}
                control={control}
                render={({ field }) => (
                  <input
                    className="rounded border border-gray-300 px-3 py-2"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                )}
              />
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-2 text-lg font-bold text-white"
                onClick={() => appendOption(createDefaultOption())}
              >
                +
              </button>
              <Controller
                name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    title="Specify"
                    className={`rounded border px-3 py-2 ${
                      field.value ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                    onClick={() => field.onChange(!field.value)}
                  >
                    ...
                  </button>
                )}
              />
              {optionFields.length > 2 && (
                <button
                  type="button"
                  className="w-24 rounded bg-red-500 px-3 py-2 text-white"
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
                  Remove
                </button>
              )}
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
