import React from "react";
import { Control, Controller } from "react-hook-form";
import { FIELD_SETTING_PLACEHOLDER } from "../questionnaireConstants";
import {
  FieldSettingOption,
  QuestionnaireBuilderFormValues,
} from "../responseInterface";

interface FieldSettingsPanelProps {
  control: Control<QuestionnaireBuilderFormValues>;
  options: FieldSettingOption[];
}

const FieldSettingsPanel: React.FC<FieldSettingsPanelProps> = ({
  control,
  options,
}) => (
  <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[250px_1fr]">
    <label className="text-sm font-semibold">
      Field Setting: <span className="text-red-500">*</span>
    </label>
    <Controller
      name="field_settings.field_setting_id"
      control={control}
      render={({ field }) => (
        <select
          className="w-full max-w-[750px] rounded border border-gray-300 px-4 py-2"
          value={field.value ?? ""}
          onChange={(e) =>
            field.onChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">{FIELD_SETTING_PLACEHOLDER}</option>
          {options.map((option) => (
            <option
              key={option.field_setting_id}
              value={option.field_setting_id}
            >
              {option.field_setting_desc}
            </option>
          ))}
        </select>
      )}
    />
  </div>
);

export default FieldSettingsPanel;
