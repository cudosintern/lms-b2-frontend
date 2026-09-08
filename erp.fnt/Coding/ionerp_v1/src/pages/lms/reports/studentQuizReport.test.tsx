import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StudentQuizReport from "./student_StudentQuiz";
import api from "../../../utils/api";
import { normaliseList } from "./studentQuizReportService";

jest.mock("../../../utils/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("exceljs", () => ({ __esModule: true, default: {} }));
const get = api.get as jest.Mock;
const response = (data: unknown) => ({ data: { status: true, data } });

beforeEach(() => get.mockReset());

test("rejects failed and malformed responses rather than showing an empty report", () => {
  expect(() => normaliseList({ success: false, data: [] })).toThrow();
  expect(() => normaliseList({ unrelated: [] })).toThrow();
  expect(normaliseList({ data: { items: [{ quiz_id: 1 }] } })).toEqual([{ quiz_id: 1 }]);
});

test("uses course-specific sections and numeric section IDs with complete report context", async () => {
  get.mockImplementation((url: string) => {
    if (url.includes('/curriculums')) return Promise.resolve(response([{ academic_batch_id: 1, academic_batch_desc: 'CSE' }]));
    if (url.includes('/terms')) return Promise.resolve(response([{ semester_id: 2, semester: 4 }]));
    if (url.includes('/courses')) return Promise.resolve(response([{ crs_id: 3, crs_code: 'CS', crs_title: 'Computer' }]));
    if (url.includes('/sections')) return Promise.resolve(response([{ value: 42, label: 'A' }]));
    if (url.includes('/quizzes')) return Promise.resolve(response([{ quiz_id: 5, quiz_title: 'Quiz One' }]));
    return Promise.resolve(response([{ student_usn: 'USN001', student_name: 'Student One', secured_marks: 0 }]));
  });
  render(<StudentQuizReport />);
  for (const [label, option, value] of [['Curriculum', 'CSE', '1'], ['Term', '4', '2'], ['Course', 'CS - Computer', '3'], ['Section', 'A', '42'], ['Quiz', 'Quiz One', '5']]) {
    await screen.findByRole('option', { name: option });
    fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
  }
  await screen.findByText('USN001');
  expect(get).toHaveBeenCalledWith('/api/v1/manage-quiz/meta/sections?academic_batch_id=1&semester_id=2&course_id=3');
  expect(get).toHaveBeenCalledWith('/api/v1/quiz-report/students?academic_batch_id=1&semester_id=2&crs_id=3&section_id=42&quiz_id=5');
  expect(screen.getByText('0')).toBeTruthy();
});

test("ignores an old term response after the curriculum changes", async () => {
  let resolveOld!: (value: unknown) => void;
  get.mockImplementation((url: string) => {
    if (url.includes('/curriculums')) return Promise.resolve(response([{ academic_batch_id: 1, academic_batch_desc: 'Old' }, { academic_batch_id: 2, academic_batch_desc: 'New' }]));
    if (url.endsWith('=1')) return new Promise(resolve => { resolveOld = resolve; });
    return Promise.resolve(response([{ semester_id: 20, semester: 'New term' }]));
  });
  render(<StudentQuizReport />);
  await screen.findByRole('option', { name: 'Old' });
  fireEvent.change(screen.getByLabelText(/Curriculum/), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText(/Curriculum/), { target: { value: '2' } });
  await screen.findByRole('option', { name: 'New term' });
  await act(async () => resolveOld(response([{ semester_id: 10, semester: 'Old term' }])));
  await waitFor(() => expect(screen.queryByRole('option', { name: 'Old term' })).toBeNull());
  expect(screen.getByRole('option', { name: 'New term' })).toBeTruthy();
});
