import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import EditTopicPage from "./EditTopicPage";
import AssignInstructorModal from "./AssignInstructorModal";
import ManageTopicInstructor from "./ManageTopicInstructor";
import { useTopicService } from "./topicService";
import { extraClassUrl, readTopicCalendarRequest } from "./topicUi";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useNavigate: () => mockNavigate }));
jest.mock("./topicService", () => ({ useTopicService: jest.fn() }));
jest.mock("react-toastify", () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));
const context = { academic_batch_id:1,semester_id:4,course_id:892,section_id:7 };
const portion = { schedule_id:10,session_number:1,portion_to_be_covered:"Basic concepts",actual_delivery_date:null,conduction_date:null,start_time:null,end_time:null };
const topic = { topic_id:101,mapping_id:5,topic_title:"Topic A",topic_code:"DS101",instructor_id:50,instructor_ids:[50],instructor_name:"Teacher One",portions:[portion,{...portion,schedule_id:11,session_number:2,portion_to_be_covered:"Arrays",actual_delivery_date:"2025-10-07"}] };
let service: any;
beforeEach(() => {
  sessionStorage.clear(); mockNavigate.mockClear();
  service = {
    getInstructorList:jest.fn().mockResolvedValue([{value:50,label:"Teacher One"},{value:51,label:"Teacher Two"}]),
    getTopicSchedules:jest.fn().mockResolvedValue([portion]),
    getDeliverySlots:jest.fn().mockResolvedValue([{class_date:"2025-10-07",start_time:"08:00:00",end_time:"09:00:00"},{class_date:"2025-10-08",start_time:"10:00:00",end_time:"11:00:00"}]),
    saveSchedules:jest.fn().mockResolvedValue({success:true,data:[]}),
    getCudosTopics:jest.fn().mockResolvedValue([{...topic,has_portions:true},{topic_id:102,topic_title:"Missing portions",instructor_ids:[],has_portions:false}]),
    assignTopics:jest.fn().mockResolvedValue({success:true}),
    getCurriculumList:jest.fn().mockResolvedValue([{value:1,label:"Batch 1"}]),
    getSemesterList:jest.fn().mockResolvedValue([{value:4,label:"Semester 4"}]),
    getCourseList:jest.fn().mockResolvedValue([{value:892,label:"Algorithms Design and Analysis"}]),
    getSectionList:jest.fn().mockResolvedValue([{value:7,label:"A"}]),
    getTopicList:jest.fn().mockResolvedValue([topic]),
  };
  (useTopicService as jest.Mock).mockReturnValue(service);
});
const renderEditor = () => render(<EditTopicPage topic={topic} academic_batch_id={1} semester_id={4} filters={{course:892,section:7}} close={jest.fn()} refresh={jest.fn()} labels={{curriculum:"Batch 1",semester:"Semester 4",course:"Algorithms Design and Analysis",section:"A"}} />);
test("Add More appends a removable draft while saved rows have no delete action", async () => {
  renderEditor(); await screen.findByDisplayValue("Basic concepts");
  expect(screen.queryByRole("button",{name:/Delete lecture/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Add More"}));
  expect(screen.getByLabelText("Portion for lecture 2")).toHaveValue("");
  fireEvent.click(screen.getByRole("button",{name:"Delete lecture 2"}));
  expect(screen.queryByLabelText("Portion for lecture 2")).not.toBeInTheDocument();
});
test("delivery time options match the selected actual date and save both times", async () => {
  renderEditor(); await screen.findByDisplayValue("Basic concepts");
  fireEvent.change(screen.getByLabelText("Actual date for lecture 1"),{target:{value:"2025-10-07"}});
  const times = screen.getByLabelText("Delivery time for lecture 1");
  expect(within(times).getByRole("option",{name:"8:00 AM"})).toBeInTheDocument();
  expect(within(times).queryByRole("option",{name:"10:00 AM"})).not.toBeInTheDocument();
  fireEvent.change(times,{target:{value:"08:00|09:00"}});
  fireEvent.click(screen.getByRole("button",{name:"Save",exact:true}));
  await waitFor(() => expect(service.saveSchedules).toHaveBeenCalledWith(5,[expect.objectContaining({actual_delivery_date:"2025-10-07",start_time:"08:00",end_time:"09:00"})],[50]));
});
test("Extra Class navigates with the full context and preserves the unsaved draft", async () => {
  renderEditor(); await screen.findByDisplayValue("Basic concepts");
  fireEvent.change(screen.getByLabelText("Portion for lecture 1"),{target:{value:"Unsaved work"}});
  fireEvent.click(screen.getByRole("button",{name:"Extra Class"}));
  expect(mockNavigate).toHaveBeenCalledWith(extraClassUrl(context));
  const draft=JSON.parse(sessionStorage.getItem("lms.topicInstructor.draft.1.4.892.7.101") || "{}");
  expect(draft.schedules[0].portion_to_be_covered).toBe("Unsaved work");
  expect(service.saveSchedules).not.toHaveBeenCalled();
});
test("assignment modal uses the requested title and marks missing portions", async () => {
  render(<AssignInstructorModal filters={{curriculum:1,semester:4,course:892,section:7}} topics={[]} close={jest.fn()} refresh={jest.fn()} />);
  await screen.findByText("1. Topic A");
  expect(screen.getByRole("dialog",{name:"Assign Topic to Course Instructor"})).toBeInTheDocument();
  expect(screen.getByText("Lesson portions have not been added yet.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Submit"}));
  await waitFor(() => expect(service.assignTopics).toHaveBeenCalledWith({...context,assignments:[{topic_id:101,instructor_ids:[50]}]}));
});
test("faculty can be selected and submitted for a topic without portions", async () => {
  const close = jest.fn();
  const refresh = jest.fn();
  render(<AssignInstructorModal filters={{curriculum:1,semester:4,course:892,section:7}} topics={[]} close={close} refresh={refresh} />);
  const faculty = await screen.findByRole("combobox", {name:"Instructors for Missing portions"});
  expect(faculty).toBeEnabled();
  fireEvent.keyDown(faculty, {key:"ArrowDown", code:"ArrowDown"});
  fireEvent.click(await screen.findByText("Teacher Two"));
  fireEvent.click(screen.getByRole("button", {name:"Submit"}));
  await waitFor(() => expect(service.assignTopics).toHaveBeenCalledWith({...context, assignments:[
    {topic_id:101,instructor_ids:[50]},
    {topic_id:102,instructor_ids:[51]},
  ]}));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(refresh).toHaveBeenCalled();
});

test("the topic table groups lesson portions and displays each delivery date", async () => {
  sessionStorage.setItem("lms.topicInstructor.filters",JSON.stringify({curriculum:"1",semester:"4",course:"892",section:"7"}));
  render(<ManageTopicInstructor />);
  const title=await screen.findByText("Topic A");
  expect(title.closest("td")).toHaveAttribute("rowspan","2");
  expect(screen.getByText("Arrays")).toBeInTheDocument();
  expect(screen.getByText("07-10-2025")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Edit Topic A"}));
  await screen.findByLabelText("Portion for lecture 1");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("calendar handoff accepts only a complete positive-ID context", () => {
  expect(readTopicCalendarRequest(extraClassUrl(context).split("?")[1])).toEqual({batch:"1",term:"4",course:"892",section:"7"});
  expect(readTopicCalendarRequest("?open_extra_class=true&academic_batch_id=1")).toBeNull();
});
test("a failed initial load cannot save or open the calendar", async () => {
  service.getTopicSchedules.mockRejectedValue(new Error("Unavailable"));
  renderEditor();
  await screen.findByRole("alert");
  expect(screen.getByRole("button", {name:"Save",exact:true})).toBeDisabled();
  expect(screen.getByRole("button", {name:"Add More"})).toBeDisabled();
  expect(screen.getByRole("button", {name:"Extra Class"})).toBeDisabled();
});
