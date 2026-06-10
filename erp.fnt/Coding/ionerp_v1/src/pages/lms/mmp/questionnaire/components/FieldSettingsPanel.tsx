import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { FIELD_SETTINGS_MODES } from "../questionnaireConstants";
import { QuestionnaireBuilderFormValues } from "../responseInterface";

interface FieldSettingsPanelProps {
  control: Control<QuestionnaireBuilderFormValues>;
  errors: FieldErrors<QuestionnaireBuilderFormValues>;
}

const FieldSettingsPanel: React.FC<FieldSettingsPanelProps> = ({
  control,
  errors,
}) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-color-1">Field Settings</h3>
    <Controller
      name="field_settings.save_mode"
      control={control}
      render={({ field }) => (
        <div className="space-y-3">
          {FIELD_SETTINGS_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                field.value === mode.value
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                className="mt-1"
                checked={field.value === mode.value}
                onChange={() => field.onChange(mode.value)}
              />
              <div>
                <p className="font-medium text-gray-800">{mode.label}</p>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
            </label>
          ))}
          {errors.field_settings?.save_mode && (
            <p className="text-sm text-red-600">
              {errors.field_settings.save_mode.message}
            </p>
          )}
        </div>
      )}
    />
  </section>
);

export default FieldSettingsPanel;
