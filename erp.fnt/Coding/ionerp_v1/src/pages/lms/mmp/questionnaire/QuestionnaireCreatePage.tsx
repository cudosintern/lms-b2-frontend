import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import QuestionnaireMetaForm from "./components/QuestionnaireMetaForm";
import QuestionBlockList from "./components/QuestionBlockList";
import FieldSettingsPanel from "./components/FieldSettingsPanel";
import { questionnaireBuilderSchema } from "./questionnaireSchema";
import { createDefaultBuilderForm } from "./questionnaireDefaults";
import { QuestionnaireBuilderFormValues } from "./responseInterface";

const QuestionnaireCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireBuilderFormValues>({
    resolver: zodResolver(questionnaireBuilderSchema),
    defaultValues: createDefaultBuilderForm(),
    mode: "onBlur",
  });

  useEffect(() => {
    if (isEditMode && id) {
      // TODO: replace with API fetch when backend is ready
      const mockData = createDefaultBuilderForm();
      mockData.quiz_id = Number(id);
      mockData.quiz_title = `Sample Questionnaire #${id}`;
      reset(mockData);
    }
  }, [id, isEditMode, reset]);

  const onSubmit = (data: QuestionnaireBuilderFormValues) => {
    // TODO: integrate POST questionnaire/save_questionnaire
    console.log("Questionnaire payload:", data);
    toast.success(
      isEditMode
        ? "Questionnaire updated (UI only)"
        : "Questionnaire saved (UI only)",
    );
    navigate("/lms/questionnaire");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-color-1">
          {isEditMode ? "Edit Questionnaire" : "Create Questionnaire"}
        </h2>
        <UIButton type="button" onClick={() => navigate("/lms/questionnaire")}>
          Back to List
        </UIButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <QuestionnaireMetaForm control={control} errors={errors} />
        <QuestionBlockList control={control} errors={errors} setValue={setValue} />
        <FieldSettingsPanel control={control} errors={errors} />

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <UIButton type="button" onClick={() => navigate("/lms/questionnaire")}>
            Cancel
          </UIButton>
          <UIButton type="submit" isLoading={isSubmitting}>
            Save Questionnaire
          </UIButton>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireCreatePage;
