import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import TextInput from "../../../../../components/FormBuilder/fields/TextInput";
import TextArea from "../../../../../components/FormBuilder/fields/Textarea";
import NumberInput from "../../../../../components/FormBuilder/fields/NumberInput";
import ToggleSwitch from "../../../../../components/FormBuilder/fields/Switch";
import Checkbox from "../../../../../components/FormBuilder/fields/Checkbox";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface QuestionnaireMetaFormProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
}

const QuestionnaireMetaForm: React.FC<QuestionnaireMetaFormProps> = ({
  control,
  errors,
}) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-color-1">Questionnaire Details</h3>
    <div className="grid grid-cols-1 gap-4">
      <Controller
        name="quiz_title"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Title"
            placeholder="Enter questionnaire title"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.quiz_title}
            required
          />
        )}
      />
      <Controller
        name="quiz_description"
        control={control}
        render={({ field }) => (
          <TextArea
            label="Description"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.quiz_description}
            required
          />
        )}
      />
      <Controller
        name="quiz_instruction"
        control={control}
        render={({ field }) => (
          <TextArea
            label="Instructions"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.quiz_instruction}
          />
        )}
      />
      <Controller
        name="duration"
        control={control}
        render={({ field }) => (
          <NumberInput
            label="Duration (minutes)"
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={480}
            error={errors.duration}
            required
          />
        )}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Controller
          name="shuffle_questions"
          control={control}
          render={({ field }) => (
            <ToggleSwitch
              label="Shuffle Questions"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="shuffle_options"
          control={control}
          render={({ field }) => (
            <ToggleSwitch
              label="Shuffle Options"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="practice_quiz"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Practice Quiz"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>
    </div>
  </section>
);

export default QuestionnaireMetaForm;
