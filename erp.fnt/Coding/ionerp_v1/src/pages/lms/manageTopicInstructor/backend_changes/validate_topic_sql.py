import sys
from pathlib import Path
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.core.database import engine
with engine.connect() as conn:
    for name in ('01_find_topic_context.sql','02_insert_cudos_topics.sql'):
        content=Path('sql',name).read_text(encoding='utf-8-sig')
        sql='\n'.join(line.split('--')[0] for line in content.splitlines())
        checked=0
        for part in sql.split(';'):
            statement=part.strip()
            if not statement or statement.upper() in ('START TRANSACTION','COMMIT'):
                continue
            if statement.upper().startswith('SET '):
                conn.exec_driver_sql(statement)
            else:
                conn.exec_driver_sql('EXPLAIN '+statement).fetchall()
                checked+=1
        print(name, 'validated',checked,'query plans, no inserts executed')
