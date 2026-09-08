import sys, importlib.util, types
from pathlib import Path
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.api.v1.lms_module.topic_management import topic_routes as m
from app.core.database import SessionLocal
from sqlalchemy import text
with SessionLocal() as db:
    context=db.execute(text('SELECT academic_batch_id,semester_id,crs_id AS course_id,section_id FROM cudos_map_courseto_course_instructor WHERE section_id IS NOT NULL LIMIT 1')).mappings().first()
    user={'user_id':1}
    for name, request in [('curriculum_list',None),('semester_list',dict(context)),('course_list',dict(context)),('section_list',dict(context)),('instructor_list',dict(context)),('topic_list',m.TopicListRequest(**context)),('cudos_topics',m.TopicContext(**context))]:
        result=getattr(m,name)(db=db,user=user,**({'request':request} if request is not None else {}))
        print(name, result['success'], 'rows',len(result['data']))
    mapping=db.execute(text('SELECT inst_map_id FROM lms_map_instructor_topic LIMIT 1')).scalar()
    if mapping:
        print('topic_schedules',len(m.topic_schedules(mapping,db,user)['data']))
        print('delivery_slots',len(m.get_delivery_slots(mapping,db,user)['data']))
