import ExcelJS from "exceljs";

export function normaliseList(response: any): any[] {
  if (response?.status === false || response?.success === false) {
    throw new Error(response.message || "Unable to load quiz report");
  }
  if (Array.isArray(response)) return response;
  if (response?.data != null) return normaliseList(response.data);
  if (Array.isArray(response?.items)) return response.items;
  throw new Error("Invalid quiz report response");
}

export async function createQuizWorkbook(rows: { sl: number; usn: string; name: string; marks: string | number }[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Student Quiz Report");
  sheet.columns = [
    { header: "Sl No.", key: "sl", width: 10 },
    { header: "Student USN", key: "usn", width: 24 },
    { header: "Student Name", key: "name", width: 40 },
    { header: "Marks", key: "marks", width: 15 },
  ];
  // Strings are text cells, including names beginning with '='.
  rows.forEach(row => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return new Blob([await workbook.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
