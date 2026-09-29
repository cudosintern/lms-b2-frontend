import { Batch, Report, Semester } from './studentReportsService';

// Preserve mapped labels and include IDs referenced by existing student reports.
export function reportBatches(mapped: Batch[], reports: Report[]): Batch[] {
  const options = new Map(mapped.map(item => [item.academic_batch_id, item]));
  reports.forEach(report => {
    const id = report.academic_batch_id;
    if (Number.isSafeInteger(id) && id > 0 && !options.has(id)) {
      options.set(id, { academic_batch_id: id, academic_batch_code: String(id), academic_batch_desc: `Curriculum ID ${id}` });
    }
  });
  return Array.from(options.values());
}

export function reportTerms(mapped: Semester[], reports: Report[], batch: string): Semester[] {
  const options = new Map(mapped.map(item => [item.semester_id, item]));
  reports.filter(report => String(report.academic_batch_id) === batch).forEach(report => {
    const id = report.semester_id;
    if (Number.isSafeInteger(id) && id > 0 && !options.has(id)) {
      options.set(id, { semester_id: id, semester: `Term ID ${id}` });
    }
  });
  return Array.from(options.values());
}
