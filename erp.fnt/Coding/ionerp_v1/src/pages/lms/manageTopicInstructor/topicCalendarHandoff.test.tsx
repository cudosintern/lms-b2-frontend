import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Calendar from "../timetableCalendar/TimetableCalendarPage";
import axiosInstance from "../../../utils/api";
jest.mock("../../../utils/api", () => ({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
test("calendar restores topic filters and automatically opens its own extra-class form", async () => {
  window.history.replaceState({},"","/lms/timetable-calendar?open_extra_class=true&academic_batch_id=1&semester_id=4&course_id=892&section_id=7");
  (axiosInstance.get as jest.Mock).mockImplementation((url:string) => {
    const data = url.endsWith("/meta/curriculums") ? [{academic_batch_id:1,academic_batch_desc:"Batch 1"}]
      : url.endsWith("/meta/terms") ? [{semester_id:4,semester:4,semester_desc:"Semester 4"}]
      : url.endsWith("/meta/courses") ? [{crs_id:892,crs_code:"BIC402",crs_title:"Algorithms Design and Analysis"}]
      : url.endsWith("/meta/sections") ? [{section_id:7,section:"A"}]
      : url.endsWith("/meta/batches-sections") ? {time_slots:[]}
      : url.endsWith("/list") ? {items:[]} : [];
    return Promise.resolve({data:{data}});
  });
  render(<Calendar />);
  await screen.findByText("Add Extra Class");
  const selects=screen.getAllByRole("combobox");
  expect(selects.slice(0,4).map(select => (select as HTMLSelectElement).value)).toEqual(["1","4","892","7"]);
  fireEvent.click(screen.getAllByRole("button",{name:"Close",exact:true})[0]);
  await waitFor(() => expect(screen.queryByText("Add Extra Class")).not.toBeInTheDocument());
  expect(axiosInstance.post).not.toHaveBeenCalled();
});

