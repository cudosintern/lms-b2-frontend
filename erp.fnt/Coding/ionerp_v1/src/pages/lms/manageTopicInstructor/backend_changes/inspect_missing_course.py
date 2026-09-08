import sys
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as c:
 print('Database:',c.execute(text('SELECT DATABASE()')).scalar())
 for label,sql in [
 ('Topics','SELECT topic_id,topic_code,topic_title,academic_batch_id,semester_id,crs_id,curriculum_id,term_id,course_id FROM cudos_topic WHERE academic_batch_id=1 AND semester_id=4 ORDER BY topic_id'),
 ('Semester','SELECT semester_id,semester,academic_batch_id FROM iems_semester WHERE semester_id=4'),
 ('Courses','SELECT c.crs_id,c.crs_code,c.crs_title,c.academic_batch_id,c.semester FROM iems_courses c JOIN iems_semester s ON s.academic_batch_id=c.academic_batch_id AND s.semester=c.semester WHERE s.semester_id=4 AND c.academic_batch_id=1 ORDER BY c.crs_id')]:
  print(label)
  for r in c.execute(text(sql)).mappings():print(dict(r))
