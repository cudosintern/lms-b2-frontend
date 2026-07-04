import React, { useEffect, useState } from "react";
import { type DeepPartial, FieldErrors, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import QuestionnaireMetaForm from "./components/QuestionnaireMetaForm";
import QuestionBlockList from "./components/QuestionBlockList";
import QuestionnairePreviewModal from "./components/QuestionnairePreviewModal";
import FieldSettingsPanel, {
  FIELD_SETTING_FORM_NAME,
} from "./components/FieldSettingsPanel";
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
  const questionnairePrimaryColorClass = "bg-[#337ab7]";
  const questionnaireDangerColorClass = "bg-[#d9534f]";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const questionnaireId = id ? Number(id) : null;
  const isEditMode = Number.isInteger(questionnaireId) && Number(questionnaireId) > 0;
  const questionIdParam = searchParams.get("questionId");
  const editingQuestionId = questionIdParam ? Number(questionIdParam) : null;
  const isQuestionEditMode =
    Number.isInteger(editingQuestionId) && Number(editingQuestionId) > 0;
  const isCreateMode = !isEditMode && !isQuestionEditMode;
  const isAddMoreMode = isEditMode && !isQuestionEditMode;
  const [questionTypes, setQuestionTypes] = useState<LookupOption[]>([]);
  const [questionnaireTypes, setQuestionnaireTypes] = useState<LookupOption[]>([]);
  const [fieldSettings, setFieldSettings] = useState<FieldSettingOption[]>([]);
  const [existingQuestions, setExistingQuestions] = useState<QuestionFormValues[]>([]);
  const [questionnaireName, setQuestionnaireName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPreviewAfterSave, setShowPreviewAfterSave] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    getValues,
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
  const watchedValues = useWatch({
    control,
  });
  const normalizeQuestionTypeLabel = React.useCallback(
    (questionTypeId: number) =>
      (questionTypes.find((item) => item.value === questionTypeId)?.label || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, " "),
    [questionTypes],
  );
  const requiresOptions = React.useCallback(
    (questionTypeId: number) => {
      const normalizedTypeLabel = normalizeQuestionTypeLabel(questionTypeId);
      return (
        normalizedTypeLabel === "single select" ||
        normalizedTypeLabel === "multiple select"
      );
    },
    [normalizeQuestionTypeLabel],
  );
  const isEmptyFieldSettingValue = React.useCallback(
    (value: unknown) => value === "" || value === null || value === undefined,
    [],
  );
  const toSelectFieldSettingValue = React.useCallback(
    (value: unknown) => (isEmptyFieldSettingValue(value) ? "" : String(value)),
    [isEmptyFieldSettingValue],
  );
  const normalizePreviewQuestion = React.useCallback(
    (question: DeepPartial<QuestionFormValues>, index: number): QuestionFormValues => ({
      questionnaire_que_id: question.questionnaire_que_id ?? null,
      que_type_id: question.que_type_id ?? 0,
      que_no: question.que_no ?? index + 1,
      question: question.question ?? "",
      questionnaire_type_id: question.questionnaire_type_id ?? 0,
      que_is_mandatory: question.que_is_mandatory ?? false,
      options: question.options?.map((option) => ({
        questionnaire_options_id: option?.questionnaire_options_id ?? null,
        que_option: option?.que_option ?? "",
        specify_flag: option?.specify_flag ?? false,
      })) ?? [],
    }),
    [],
  );
  const loadQuestionnaireData = React.useCallback(
    async (targetQuestionnaireId: number, options: FieldSettingOption[]) => {
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
      const savedFieldSettingId =
        detail.field_settings?.field_setting_id ?? detail.field_setting_id;
      const detailFieldSettingValue = toSelectFieldSettingValue(savedFieldSettingId);
      const resolvedFieldSettingDescription =
        detail.field_settings?.field_setting_desc ??
        detail.field_setting_desc ??
        options.find(
          (option) =>
            String(option.field_setting_id) === detailFieldSettingValue,
        )?.field_setting_desc ??
        "";
      const matchedFieldSettingValue =
        options.find(
          (option) =>
            String(option.field_setting_id) === detailFieldSettingValue,
        )?.field_setting_id ?? savedFieldSettingId;
      const nextFormValues = {
        ...detail,
        field_settings: {
          field_setting_id: "",
          field_setting_desc: resolvedFieldSettingDescription,
        },
        questions: questionToEdit
          ? [questionToEdit]
          : [
              {
                ...createDefaultQuestion(),
                que_no: nextQuestionNumber,
              },
            ],
      };
      reset(nextFormValues);
      if (!isEmptyFieldSettingValue(matchedFieldSettingValue)) {
        setValue(
          FIELD_SETTING_FORM_NAME,
          String(matchedFieldSettingValue),
          {
            shouldDirty: false,
            shouldValidate: true,
          },
        );
      }
      if (isQuestionEditMode && !questionToEdit) {
        toast.error("Unable to load questionnaire data");
        navigate("/lms_mmp/questionnaire");
      }
    },
    [
      editingQuestionId,
      isQuestionEditMode,
      isEmptyFieldSettingValue,
      navigate,
      reset,
      setValue,
      toSelectFieldSettingValue,
    ],
  );

  useEffect(() => {
    setIsPreviewOpen(false);
    setShowPreviewAfterSave(false);
  }, [editingQuestionId, isEditMode, isQuestionEditMode, questionnaireId]);

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
        (questionnaireTypeResponse.data.data || []).map((item: any) => ({
          label: item.questionnaire_type_name,
          value: item.questionnaire_type_id,
        })),
      );
      const nextFieldSettings = (
        (Array.isArray(fieldSettingResponse.data)
          ? fieldSettingResponse.data
          : fieldSettingResponse.data?.data || []
        )
          .filter((item: any) => item.field_setting_id !== undefined)
      );
      setFieldSettings(nextFieldSettings);
      if (isEditMode && questionnaireId) {
        await loadQuestionnaireData(questionnaireId, nextFieldSettings);
      } else {
        reset({
          ...createDefaultBuilderForm(),
          field_settings: {
            field_setting_id: "",
            field_setting_desc: "",
          },
        });
        setExistingQuestions([]);
        setQuestionnaireName("");
      }
    };
    load().catch(() => toast.error("Unable to load field setting options"));
  }, [isEditMode, loadQuestionnaireData, questionnaireId, reset]);

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
      await loadQuestionnaireData(questionnaireId, fieldSettings);
      toast.success("Option deleted successfully");
    } catch {
      toast.error("Unable to delete option");
    }
  };

  const onSubmit = async (data: QuestionnaireBuilderFormValues) => {
    const selectedFieldSettingValue = getValues(FIELD_SETTING_FORM_NAME);
    if (isEmptyFieldSettingValue(selectedFieldSettingValue)) {
      setError(FIELD_SETTING_FORM_NAME, {
        type: "manual",
        message: "Field Setting is required",
      });
      return;
    }

    const selectedFieldSettingOption = fieldSettings.find(
      (option) =>
        String(option.field_setting_id) ===
        String(selectedFieldSettingValue),
    );
    if (!selectedFieldSettingOption) {
      setError(FIELD_SETTING_FORM_NAME, {
        type: "manual",
        message: "Field Setting is required",
      });
      return;
    }

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
      field_setting_id: Number(selectedFieldSettingValue),
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
      setShowPreviewAfterSave(true);
    }
  };

  const getFirstValidationMessage = React.useCallback(
    (
      formData: QuestionnaireBuilderFormValues,
      formErrors: FieldErrors<QuestionnaireBuilderFormValues>,
    ) => {
      for (const question of formData.questions) {
        if (!question.que_type_id) {
          return null;
        }
      }

      for (const question of formData.questions) {
        if (!question.questionnaire_type_id) {
          return "Please select the questionnaire type.";
        }
      }

      for (const question of formData.questions) {
        if (!requiresOptions(question.que_type_id)) {
          continue;
        }

        const hasEmptyOption = question.options.some(
          (option) => option.que_option.trim().length === 0,
        );
        if (hasEmptyOption) {
          return "Option fields should not be empty.";
        }
      }

      return (
        (formErrors.questionnaire_name?.message as string | undefined) ||
        (formErrors.message_to_mentees?.message as string | undefined) ||
        (formErrors.field_settings?.field_setting_id?.message as string | undefined) ||
        (formErrors.questions?.message as string | undefined) ||
        "Please correct the highlighted errors."
      );
    },
    [requiresOptions],
  );

  const onInvalidSubmit = React.useCallback(
    (formErrors: FieldErrors<QuestionnaireBuilderFormValues>) => {
      const validationMessage = getFirstValidationMessage(getValues(), formErrors);
      if (!validationMessage) {
        return;
      }
      toast.error(validationMessage);
    },
    [getFirstValidationMessage, getValues],
  );

  const previewFieldSettingDescription = React.useMemo(() => {
    const selectedFieldSettingValue = watchedValues?.field_settings?.field_setting_id;
    return (
      fieldSettings.find(
        (option) =>
          String(option.field_setting_id) === String(selectedFieldSettingValue || ""),
      )?.field_setting_desc ||
      watchedValues?.field_settings?.field_setting_desc ||
      ""
    );
  }, [
    fieldSettings,
    watchedValues?.field_settings?.field_setting_desc,
    watchedValues?.field_settings?.field_setting_id,
  ]);

  const previewQuestions = React.useMemo(() => {
    const draftQuestions = (watchedValues?.questions || []).map(normalizePreviewQuestion);

    if (isQuestionEditMode) {
      return existingQuestions
        .map((question, index) =>
          question.questionnaire_que_id === editingQuestionId
            ? normalizePreviewQuestion(
                {
                  ...(draftQuestions[0] || question),
                  questionnaire_que_id: question.questionnaire_que_id,
                  que_no: question.que_no,
                },
                index,
              )
            : normalizePreviewQuestion(question, index),
        )
        .sort((left, right) => left.que_no - right.que_no);
    }

    if (isAddMoreMode) {
      return [...existingQuestions, ...draftQuestions]
        .map(normalizePreviewQuestion)
        .sort((left, right) => left.que_no - right.que_no);
    }

    return draftQuestions
      .map(normalizePreviewQuestion)
      .sort((left, right) => left.que_no - right.que_no);
  }, [
    editingQuestionId,
    existingQuestions,
    isAddMoreMode,
    isQuestionEditMode,
    normalizePreviewQuestion,
    watchedValues?.questions,
  ]);

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      className="space-y-4"
    >
      {isQuestionEditMode ? (
        <>
          <div className="[&_label]:text-[17px] [&_label]:font-semibold [&_select]:text-[15px] [&_textarea]:text-[15px]">
            <QuestionnaireMetaForm control={control} errors={errors} compact />
            <FieldSettingsPanel
              control={control}
              clearErrors={clearErrors}
              errors={errors}
              options={fieldSettings}
              compact
            />
          </div>
          <div className="rounded-tl-[22px] rounded-tr-none rounded-br-[22px] rounded-bl-none bg-slate-800 px-5 py-2 text-xl font-semibold text-white">
            Questionnaires
          </div>
        </>
      ) : isEditMode ? (
        <section className="space-y-3 text-sm [&_label]:text-[17px] [&_label]:font-semibold [&_select]:text-[15px] [&_textarea]:text-[15px]">
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[200px_760px]">
            <span className="text-[13px] font-semibold">Questionnaire Title:</span>
            <span>{questionnaireName}</span>
          </div>
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[200px_760px]">
            <span className="text-[13px] font-semibold">Message to Mentees:</span>
            <span>{messageToMentees || ""}</span>
          </div>
          <FieldSettingsPanel
            control={control}
            clearErrors={clearErrors}
            errors={errors}
            options={fieldSettings}
            compact
          />
        </section>
      ) : (
        <div className="[&_label]:text-[17px] [&_label]:font-semibold [&_select]:text-[15px] [&_textarea]:text-[15px]">
          <QuestionnaireMetaForm control={control} errors={errors} createMode={isCreateMode} />
          <FieldSettingsPanel
            control={control}
            clearErrors={clearErrors}
            errors={errors}
            options={fieldSettings}
            createMode={isCreateMode}
          />
        </div>
      )}
      <QuestionBlockList
        control={control}
        errors={errors}
        setValue={setValue}
        clearErrors={clearErrors}
        questionTypes={questionTypes}
        questionnaireTypes={questionnaireTypes}
        onDeleteSavedOption={handleDeleteSavedOption}
        isQuestionEditMode={isQuestionEditMode}
        isCreateMode={isCreateMode}
        isAddMoreMode={isAddMoreMode}
      />

      <div className="flex justify-end gap-2">
        {showPreviewAfterSave && (
          <UIButton
            type="button"
            className="bg-[#5cb85c] text-[17px] font-semibold text-white"
            onClick={() => setIsPreviewOpen(true)}
          >
            Preview
          </UIButton>
        )}
        <UIButton
          type="button"
          className={`${questionnaireDangerColorClass} text-[17px] font-semibold text-white`}
          onClick={() => navigate("/lms_mmp/questionnaire")}
        >
          Close
        </UIButton>
        <UIButton
          type="submit"
          className={`${questionnairePrimaryColorClass} text-[17px] font-semibold text-white`}
          isLoading={isSubmitting}
        >
          Save
        </UIButton>
      </div>
      <QuestionnairePreviewModal
        open={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setShowPreviewAfterSave(false);
          navigate("/lms_mmp/questionnaire");
        }}
        questionnaireName={
          watchedValues?.questionnaire_name || questionnaireName || ""
        }
        messageToMentees={messageToMentees || ""}
        fieldSettingDescription={previewFieldSettingDescription}
        questions={previewQuestions}
      />
    </form>
  );

  if (isQuestionEditMode) {
    return (
      <section className="min-h-[590px] w-full min-w-0 overflow-x-hidden rounded-md border border-gray-200 bg-white p-4 shadow-md md:p-6">
        <h2 className="mb-4 text-[18px] font-semibold text-slate-800">
          Edit Questionnaires
        </h2>
        {formContent}
      </section>
    );
  }

  return (
    <MmpModuleShell
      title={
        isEditMode
            ? "Add More Questions"
            : "Add Questionnaires"
      }
    >
      {formContent}
    </MmpModuleShell>
  );
};

export default QuestionnaireCreatePage;
