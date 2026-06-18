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
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
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
        <div className="pt-6">
          <UIButton type="button" size="sm" onClick={onRemove} isDisabled={!canRemove}>
            Remove
          </UIButton>
        </div>
      </div>

      <Controller
        name={`questions.${questionIndex}.options.${optionIndex}.specify_flag`}
        control={control}
        render={({ field }) => (
          <div>
            <ToggleSwitch
              label="Specify"
              checked={field.value}
              onChange={field.onChange}
            />
            {field.value && (
              <p className="mt-1 text-xs text-amber-700">
                Student must enter additional description
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default OptionRow;
