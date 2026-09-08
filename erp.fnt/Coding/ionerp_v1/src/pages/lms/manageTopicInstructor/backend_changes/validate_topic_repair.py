import sys
from pathlib import Path
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.core.database import engine
source=Path('sql/03_fix_existing_topic_crs_id.sql').read_text(encoding='utf-8-sig')
source='\n'.join(line.split('--')[0] for line in source.splitlines())
with engine.connect() as c:
 for statement in source.split(';'):
  statement=statement.strip()
  if not statement or statement.upper() in ('START TRANSACTION','COMMIT'):continue
  if statement.startswith('SET '): c.exec_driver_sql(statement)
  else: c.exec_driver_sql('EXPLAIN '+statement.replace('%', '%%')).fetchall()
print('SQL validated using EXPLAIN only. No topic records updated.')

