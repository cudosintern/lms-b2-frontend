import sys
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.core.database import engine
from sqlalchemy import inspect
for table in ('cudos_topic','cudos_topic_lesson_schedule'):
    print(table)
    for c in inspect(engine).get_columns(table):
        print(c['name'],str(c['type']), 'nullable='+str(c['nullable']), 'default='+str(c.get('default')), 'auto='+str(c.get('autoincrement')))
