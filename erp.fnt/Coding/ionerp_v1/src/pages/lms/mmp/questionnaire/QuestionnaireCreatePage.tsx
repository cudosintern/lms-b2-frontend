import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import QuestionnaireMetaForm from "./components/QuestionnaireMetaForm";
import QuestionBlockList from "./components/QuestionBlockList";
import FieldSettingsPanel from "./components/FieldSettingsPanel";
import { questionnaireBuilderSchema } from "./questionnaireSchema";
import {
  createDefaultBuilderForm,
  createDefaultQuestion,
} from "./questionnaireDefaults";
import {
  FieldSettingOption,
  LookupOption,
  QuestionFormValues,
  QuestionnaireBuilderFormValues,
} from "./responseInterface";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import MmpModuleShell from "../components/MmpModuleShell";

const QuestionnaireCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const questionnaireId = id ? Number(id) : null;
  const isEditMode = Number.isInteger(questionnaireId) && Number(questionnaireId) > 0;
  const questionIdParam = searchParams.get("questionId");
  const editingQuestionId = questionIdParam ? Number(questionIdParam) : null;
  const isQuestionEditMode =
    Number.isInteger(editingQuestionId) && Number(editingQuestionId) > 0;
  const [questionTypes, setQuestionTypes] = useState<LookupOption[]>([]);
  const [questionnaireTypes, setQuestionnaireTypes] = useState<LookupOption[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettingOption[]>([]);
  const [existingQuestions, setExistingQuestions] = useState<QuestionFormValues[]>([]);
  const [questionnaireName, setQuestionnaireName] = useState("");

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
  const messageToMentees = useWatch({
    control,
    name: "message_to_mentees",
  });
  const selectedFieldSettingId = useWatch({
    control,
    name: "field_settings.field_setting_id",
  });
  const selectedFieldSettingDesc =
    fieldSettings.find(
      (item) => item.field_setting_id === selectedFieldSettingId,
    )?.field_setting_desc || "";

  const loadQuestionnaireData = React.useCallback(
    async (targetQuestionnaireId: number) => {
      const detailResponse = await axiosInstance.get<any>(
        `${ApiEndpoint.questionnaire.questionnaire_full}/${targetQuestionnaireId}`,
      );
      const detail = detailResponse.data.data;
      const savedQuestions = detail.questions || [];
      const nextQuestionNumber =
        savedQuestions.reduce(
          (highest: number, question: QuestionFormValues) =>
            Math.max(highest, question.que_no || 0),
          0,
        ) + 1;
      const questionToEdit = isQuestionEditMode
        ? savedQuestions.find(
            (question: QuestionFormValues) =>
              question.questionnaire_que_id === editingQuestionId,
          )
        : null;

      setExistingQuestions(savedQuestions);
      setQuestionnaireName(detail.questionnaire_name || "");
      const detailFieldSettingId =
        detail.field_settings?.field_setting_id ??
        detail.field_setting_id ??
        null;
      reset({
        ...detail,
        field_settings: {
          field_setting_id:
            typeof detailFieldSettingId === "number"
              ? detailFieldSettingId
              : null,
          field_setting_desc:
            detail.field_settings?.field_setting_desc ??
            detail.field_setting_desc ??
            "",
        },
        questions: questionToEdit
          ? [questionToEdit]
          : [
              {
                ...createDefaultQuestion(),
                que_no: nextQuestionNumber,
              },
            ],
      });
      if (isQuestionEditMode && !questionToEdit) {
        toast.error("Unable to load questionnaire data");
        navigate("/lms_mmp/questionnaire");
      }
    },
    [editingQuestionId, isQuestionEditMode, navigate, reset],
  );

  useEffect(() => {
    const load = async () => {
      const [
        questionTypeResponse,
        questionnaireTypeResponse,
        fieldSettingResponse,
      ] = await Promise.all([
        axiosInstance.get<any>(ApiEndpoint.question_type.get_question_type_list),
        axiosInstance.get<any>(ApiEndpoint.question_type.get_questionnaire_type_list),
        axiosInstance.get<any>(ApiEndpoint.questionnaire.field_setting_list),
      ]);

      setQuestionTypes(
        (questionTypeResponse.data.data || []).map((item: any) => ({
          label: item.que_type_name,
          value: item.que_type_id,
        })),
      );
      setQuestionnaireTypes(
        questionnaireTypeResponse.data.data.map((item: any) => ({
          label: item.questionnaire_type_name,
          value: item.questionnaire_type_id,
        })),
      );
      setFieldSettings(
        (Array.isArray(fieldSettingResponse.data)
          ? fieldSettingResponse.data
          : fieldSettingResponse.data?.data || []
        ).filter((item: any) => item.status === 1),
      );
      if (isEditMode && questionnaireId) {
        await loadQuestionnaireData(questionnaireId);
      } else {
        setExistingQuestions([]);
        setQuestionnaireName("");
      }
    };
    load().catch(() => toast.error("Unable to load field setting options"));
  }, [isEditMode, loadQuestionnaireData, questionnaireId]);

  const handleDeleteSavedOption = async (
    _questionIndex: number,
    _optionIndex: number,
    questionnaireOptionsId: number,
  ) => {
    if (!questionnaireId) {
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this option?");
    if (!confirmed) {
      return;
    }
    try {
      const response = await axiosInstance.delete<any>(
        `${ApiEndpoint.questionnaire.delete_option}/${questionnaireOptionsId}`,
      );
      if (!response.data.status) {
        throw new Error(response.data.message || "Unable to delete option");
      }
      await loadQuestionnaireData(questionnaireId);
      toast.success("Option deleted successfully");
    } catch {
      toast.error("Unable to delete option");
    }
  };

  const onSubmit = async (data: QuestionnaireBuilderFormValues) => {
    const questionsToSave = isQuestionEditMode
      ? existingQuestions.map((question) =>
          question.questionnaire_que_id === editingQuestionId
            ? data.questions[0]
            : question,
        )
      : isEditMode
        ? [...existingQuestions, ...data.questions]
        : data.questions;
    const { field_settings: _fieldSettings, ...questionnaireData } = data;
    const payload = {
      ...questionnaireData,
      questionnaire_id: data.questionnaire_id,
      parent_id: data.parent_id,
      questions: questionsToSave.map((question, index) => ({
        ...question,
        questionnaire_que_id: question.questionnaire_que_id,
        que_no: index + 1,
        options: question.options.map((option) => ({
          ...option,
          questionnaire_options_id: option.questionnaire_options_id,
        })),
      })),
    };
    const response = await axiosInstance.post<any>(
      ApiEndpoint.questionnaire.save_questionnaire,
      payload,
    );
    if (response.data.status) {
      toast.success(
        isEditMode ? "Questionnaire updated" : "Questionnaire saved",
      );
      navigate("/lms_mmp/questionnaire");
    }
  };

  return (
    <MmpModuleShell
      title={
        isQuestionEditMode
          ? "Edit Question"
          : isEditMode
            ? "Add More Questions"
            : "Add Questionnaires"
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {isQuestionEditMode ? (
          <>
            <QuestionnaireMetaForm control={control} errors={errors} />
            <section className="space-y-6">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-[250px_minmax(0,1fr)]">
                <span className="font-semibold">field setting:</span>
                <span>{selectedFieldSettingDesc}</span>
              </div>
            </section>
          </>
        ) : isEditMode ? (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-[250px_minmax(0,1fr)]">
              <span className="font-semibold">Questionnaire Title:</span>
              <span>{questionnaireName}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-[250px_minmax(0,1fr)]">
              <span className="font-semibold">Message to Mentees:</span>
              <span>{messageToMentees || ""}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-[250px_minmax(0,1fr)]">
              <span className="font-semibold">field setting:</span>
              <span>{selectedFieldSettingDesc}</span>
            </div>
          </section>
        ) : (
          <>
            <QuestionnaireMetaForm control={control} errors={errors} />
            <FieldSettingsPanel control={control} options={fieldSettings} />
          </>
        )}
        <QuestionBlockList
          control={control}
          errors={errors}
          setValue={setValue}
          questionTypes={questionTypes}
          questionnaireTypes={questionnaireTypes}
          onDeleteSavedOption={handleDeleteSavedOption}
        />

        <div className="flex justify-end gap-2">
          <UIButton type="button" onClick={() => navigate("/lms_mmp/questionnaire")}>
            Close
          </UIButton>
          <UIButton type="submit" isLoading={isSubmitting}>
            Save
          </UIButton>
        </div>
      </form>
    </MmpModuleShell>
  );
};

export default QuestionnaireCreatePage;
