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
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionBlockListProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  setValue: UseFormSetValue<QuestionnaireBuilderFormValues>;
}

const QuestionBlockList: React.FC<QuestionBlockListProps> = ({
  control,
  errors,
  setValue,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-color-1">Questions</h3>
        <UIButton type="button" onClick={() => append(createDefaultQuestion())}>
          + Add Question
        </UIButton>
      </div>

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
          onRemove={() => remove(index)}
          canRemove={fields.length > 1}
        />
      ))}
    </section>
  );
};

export default QuestionBlockList;
