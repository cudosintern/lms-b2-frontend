import React from "react";
import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
  useFieldArray,
} from "react-hook-form";
import UIButton from "../../../../../components/FormBuilder/fields/Button";
import QuestionBlock from "./QuestionBlock";
import { createDefaultQuestion } from "../questionnaireDefaults";
import { QuestionnaireBuilderFormValues, LookupOption } from "../responseInterface";

interface QuestionBlockListProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  setValue: UseFormSetValue<QuestionnaireBuilderFormValues>;
  clearErrors: UseFormClearErrors<QuestionnaireBuilderFormValues>;
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

const QuestionBlockList: React.FC<QuestionBlockListProps> = ({
  control,
  errors,
  setValue,
  clearErrors,
  questionTypes,
  questionnaireTypes,
  isQuestionEditMode = false,
  isCreateMode = false,
  isAddMoreMode = false,
  onDeleteSavedOption,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });
  const nextQuestion = () => ({
    ...createDefaultQuestion(),
    que_no:
      fields.reduce(
        (highest, question) => Math.max(highest, Number(question.que_no) || 0),
        0,
      ) + 1,
  });

  return (
    <section className="space-y-4">
      {errors.questions?.message && (
        <p className="text-sm text-red-600">{String(errors.questions.message)}</p>
      )}

      {fields.map((field, index) => (
        <QuestionBlock
          key={field.id}
          control={control}
          questionIndex={index}
          errors={errors}
          setValue={setValue}
          clearErrors={clearErrors}
          onAdd={() => append(nextQuestion())}
          onRemove={() => remove(index)}
          isFirst={index === 0}
          questionTypes={questionTypes}
          questionnaireTypes={questionnaireTypes}
          isQuestionEditMode={isQuestionEditMode}
          isCreateMode={isCreateMode}
          isAddMoreMode={isAddMoreMode}
          onDeleteSavedOption={onDeleteSavedOption}
        />
      ))}

      {!isQuestionEditMode && (
        <div className="flex justify-end">
          <UIButton
            type="button"
            className={
              isCreateMode || isAddMoreMode ? "bg-[#337ab7] text-white" : undefined
            }
            onClick={() => append(nextQuestion())}
          >
            + Add Question
          </UIButton>
        </div>
      )}
    </section>
  );
};

export default QuestionBlockList;
