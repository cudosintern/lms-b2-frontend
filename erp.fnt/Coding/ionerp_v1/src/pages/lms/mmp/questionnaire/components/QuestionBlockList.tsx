import React from "react";
import {
  Control,
  FieldErrors,
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
  questionTypes: LookupOption[];
  questionnaireTypes: LookupOption[];
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
  questionTypes,
  questionnaireTypes,
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
          onAdd={() => append(nextQuestion())}
          onRemove={() => remove(index)}
          isFirst={index === 0}
          questionTypes={questionTypes}
          questionnaireTypes={questionnaireTypes}
          onDeleteSavedOption={onDeleteSavedOption}
        />
      ))}

      <div className="flex justify-end">
        <UIButton type="button" onClick={() => append(nextQuestion())}>
          + Add Question
        </UIButton>
      </div>
    </section>
  );
};

export default QuestionBlockList;
