import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import TextInput from "../../../../../components/FormBuilder/fields/TextInput";
import ToggleSwitch from "../../../../../components/FormBuilder/fields/Switch";
import UIButton from "../../../../../components/FormBuilder/fields/Button";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface OptionRowProps {
  control: Control<QuestionnaireBuilderFormValues>;
  questionIndex: number;
  optionIndex: number;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

const OptionRow: React.FC<OptionRowProps> = ({
  control,
  questionIndex,
  optionIndex,
  errors,
  onRemove,
  canRemove,
}) => {
  const optionErrors = errors.questions?.[questionIndex]?.options?.[optionIndex];

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Controller
            name={`questions.${questionIndex}.options.${optionIndex}.que_option`}
            control={control}
            render={({ field }) => (
              <TextInput
                label={`Option ${optionIndex + 1}`}
                placeholder="Enter option text"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={optionErrors?.que_option}
                required
              />
            )}
          />
        </div>
        <Controller
          name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
          control={control}
          render={({ field }) => (
            <div className="flex shrink-0 items-center gap-2 pt-6">
              <ToggleSwitch
                label="Specify"
                checked={field.value}
                onChange={field.onChange}
              />
              <UIButton
                type="button"
                size="sm"
                onClick={onRemove}
                isDisabled={!canRemove}
                className="bg-red-500 px-3 text-white"
              >
                -
              </UIButton>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default OptionRow;
