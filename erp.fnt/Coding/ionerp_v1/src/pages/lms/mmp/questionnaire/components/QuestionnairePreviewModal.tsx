import React from "react";
import {
  QuestionFormValues,
  QuestionOptionFormValues,
} from "../responseInterface";

interface QuestionnairePreviewModalProps {
  open: boolean;
  onClose: () => void;
  questionnaireName: string;
  messageToMentees?: string;
  fieldSettingDescription: string;
  questions: QuestionFormValues[];
}

const getVisibleOptions = (options: QuestionOptionFormValues[]) =>
  (options || []).filter(
    (option) => option.que_option.trim().length > 0 || option.specify_flag,
  );

const QuestionnairePreviewModal: React.FC<QuestionnairePreviewModalProps> = ({
  open,
  onClose,
  questionnaireName,
  messageToMentees,
  fieldSettingDescription,
  questions,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-6 pt-6 md:pt-8">
      <div className="max-h-[90vh] w-full max-w-[960px] overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[20px] font-normal text-gray-700">
            Preview Questionnaire
          </h3>
          <button
            type="button"
            className="text-3xl leading-none text-gray-400"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
          <div className="space-y-4 px-4 py-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
              <span className="text-[15px] font-semibold">
                Questionnaire Type:
              </span>
              <span className="text-[15px]">{questionnaireName}</span>
              <span className="text-[15px] font-semibold">
                Message to Mentees:
              </span>
              <span className="text-[15px]">{messageToMentees || ""}</span>
            </div>

            <table className="w-full border-collapse border border-gray-300 text-[15px]">
              <thead>
                <tr>
                  <th className="w-[148px] border border-gray-300 px-4 py-2 text-center font-semibold">
                    Q. No.
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Questions &amp; Options
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-sky-100">
                  <td
                    className="border border-gray-300 px-4 py-2 text-left"
                    colSpan={2}
                  >
                    <span className="font-semibold">Field Setting:</span>{" "}
                    {fieldSettingDescription}
                  </td>
                </tr>
                {questions.map((question, index) => {
                  const visibleOptions = getVisibleOptions(question.options);

                  return (
                    <tr key={question.questionnaire_que_id || `${question.que_no}-${index}`}>
                      <td className="border border-gray-300 px-4 py-2 align-top text-center">
                        {question.que_no || index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 align-top">
                        <div>{question.question}</div>
                        {visibleOptions.length > 0 && (
                          <div className="mt-1 grid grid-cols-1 gap-x-16 gap-y-1 pl-5 md:grid-cols-2">
                            {visibleOptions.map((option, optionIndex) => (
                              <div
                                key={
                                  option.questionnaire_options_id ||
                                  `${question.que_no}-${optionIndex}`
                                }
                                className="whitespace-nowrap"
                              >
                                <span>
                                  {String.fromCharCode(65 + optionIndex)}.{" "}
                                  {option.que_option}
                                </span>
                                {option.specify_flag && (
                                  <>
                                    {" "}
                                    <span className="inline-block min-w-[76px] border-b border-black align-middle" />
                                    <span className="ml-1">(Specify)</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-4 py-4">
            <button
              type="button"
              className="rounded bg-[#d9534f] px-5 py-2 text-[15px] text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairePreviewModal;
