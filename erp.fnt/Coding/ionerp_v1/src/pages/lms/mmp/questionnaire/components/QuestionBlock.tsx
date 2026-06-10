import React, { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import TextArea from "../../../../../components/FormBuilder/fields/Textarea";
import Select from "../../../../../components/FormBuilder/fields/Select";
import Checkbox from "../../../../../components/FormBuilder/fields/Checkbox";
import NumberInput from "../../../../../components/FormBuilder/fields/NumberInput";
import UIButton from "../../../../../components/FormBuilder/fields/Button";
import OptionRow from "./OptionRow";
import {
  OPTION_QUESTION_TYPES,
  QUESTION_TYPES,
  QUESTIONNAIRE_TYPES,
  QuestionType,
} from "../questionnaireConstants";
import { createDefaultOption } from "../questionnaireDefaults";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionBlockProps {
  control: Control<QuestionnaireBuilderFormValues>;
  questionIndex: number;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  setValue: UseFormSetValue<QuestionnaireBuilderFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({
  control,
  questionIndex,
  errors,
  setValue,
  onRemove,
  canRemove,
}) => {
  const questionType = useWatch({
    control,
    name: `questions.${questionIndex}.question_type`,
  }) as QuestionType;

  const questionErrors = errors.questions?.[questionIndex];

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  const showOptions = OPTION_QUESTION_TYPES.includes(questionType);
  const showRating = questionType === "Rating";

  useEffect(() => {
    if (showOptions && optionFields.length === 0) {
      setValue(`questions.${questionIndex}.options`, [
        createDefaultOption(),
        createDefaultOption(),
      ]);
    }
    if (!showOptions) {
      setValue(`questions.${questionIndex}.options`, []);
    }
  }, [questionType, showOptions, questionIndex, setValue, optionFields.length]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-base font-semibold text-color-1">
          Question {questionIndex + 1}
        </h4>
        <UIButton type="button" size="sm" onClick={onRemove} isDisabled={!canRemove}>
          Remove Question
        </UIButton>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name={`questions.${questionIndex}.question_type`}
          control={control}
          render={({ field }) => (
            <Select
              label="Question Type"
              options={[...QUESTION_TYPES]}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              error={questionErrors?.question_type}
              required
            />
          )}
        />
        <Controller
          name={`questions.${questionIndex}.questionnaire_type`}
          control={control}
          render={({ field }) => (
            <Select
              label="Questionnaire Type"
              options={[...QUESTIONNAIRE_TYPES]}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              error={questionErrors?.questionnaire_type}
              required
            />
          )}
        />
      </div>

      <div className="mt-4">
        <Controller
          name={`questions.${questionIndex}.question_text`}
          control={control}
          render={({ field }) => (
            <TextArea
              label="Question Text"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={questionErrors?.question_text}
              required
            />
          )}
        />
      </div>

      <div className="mt-3">
        <Controller
          name={`questions.${questionIndex}.is_mandatory`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Mandatory"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>

      {showRating && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Controller
            name={`questions.${questionIndex}.rating_min`}
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Rating Min"
                value={field.value}
                onChange={field.onChange}
                min={1}
                error={questionErrors?.rating_min}
                required
              />
            )}
          />
          <Controller
            name={`questions.${questionIndex}.rating_max`}
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Rating Max"
                value={field.value}
                onChange={field.onChange}
                min={2}
                error={questionErrors?.rating_max}
                required
              />
            )}
          />
          <Controller
            name={`questions.${questionIndex}.rating_step`}
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Rating Step"
                value={field.value}
                onChange={field.onChange}
                min={1}
                error={questionErrors?.rating_step}
                required
              />
            )}
          />
        </div>
      )}

      {showOptions && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Options</p>
            <UIButton
              type="button"
              size="sm"
              onClick={() => appendOption(createDefaultOption())}
            >
              + Add Option
            </UIButton>
          </div>
          {typeof questionErrors?.options?.message === "string" && (
            <p className="text-sm text-red-600">{questionErrors.options.message}</p>
          )}
          {optionFields.map((field, optionIndex) => (
            <OptionRow
              key={field.id}
              control={control}
              questionIndex={questionIndex}
              optionIndex={optionIndex}
              errors={errors}
              onRemove={() => removeOption(optionIndex)}
              canRemove={optionFields.length > 2}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBlock;
