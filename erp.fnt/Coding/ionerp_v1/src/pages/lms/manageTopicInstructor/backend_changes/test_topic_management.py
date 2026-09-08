"""Regression tests use an isolated SQLite DB, never the configured LMS DB."""
import sys, types, importlib, unittest
from pathlib import Path
from datetime import date, datetime, time
from sqlalchemy import create_engine, Column, Integer, String, Text, Date, DateTime, Time, Float, text
from sqlalchemy.orm import declarative_base, sessionmaker
from fastapi import HTTPException
sys.path.insert(0,r'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend')
from app.db import models as actual
Base=declarative_base()
models=types.ModuleType('app.db.models')
# Keep the exact ORM column names/attributes used by the implementation; unrelated
# required fields and relationships are unnecessary for these isolated fixtures.
for name in ['CudosTopic','CudosTopicLessonSchedule','IEMSAcademicBatch','IEMSemester','IEMSCourses','MasterTypeDetails','CudosMapCoursetoCourseInstructor','IEMSUsers','LMSMapInstructorTopic','LMSMapPortionLS']:
    original=getattr(actual,name)
    attrs={'__tablename__':original.__tablename__}
    for prop in original.__mapper__.column_attrs:
        c=prop.columns[0]
        typ=c.type
        if 'INT' in type(typ).__name__.upper(): typ=Integer()
        elif isinstance(typ, String): typ=String()
        attrs[prop.key]=Column(c.name,typ,primary_key=c.primary_key,nullable=not c.primary_key)
    setattr(models,name,type(name,(Base,),attrs))
sys.modules['app.db.models']=models
package=types.ModuleType('candidate');package.__path__=[str(Path(__file__).parent.resolve())];sys.modules['candidate']=package
m=importlib.import_module('candidate.topic_routes')
from candidate.topic_schema import *

class TopicTests(unittest.TestCase):
    def setUp(self):
        self.engine=create_engine('sqlite://')
        Base.metadata.create_all(self.engine)
        self.db=sessionmaker(bind=self.engine)()
        for sql in [
            'CREATE TABLE topic_lesson_schedule (lesson_schedule_id INTEGER PRIMARY KEY, topic_id INTEGER,academic_batch_id INTEGER,course_id INTEGER,portion_ref TEXT,portion_per_hour TEXT,conduction_date DATE,actual_delivery_date DATE)',
            'CREATE TABLE lms_lesson_schedule (lls_id INTEGER PRIMARY KEY,academic_batch_id INTEGER,semester_id INTEGER,crs_id INTEGER,section_id INTEGER,topic_id INTEGER,plan_date DATE,completion_date DATE,start_time TEXT,end_time TEXT,status INTEGER,portion_ref TEXT,portion_per_hour TEXT,created_by INTEGER,modified_by INTEGER)',
            'CREATE TABLE lms_ls_lesson_schedule_map (lls_map_id INTEGER PRIMARY KEY,lls_id INTEGER,lesson_schedule_id INTEGER,mtp_id INTEGER,created_by INTEGER,modified_by INTEGER)',
            'CREATE TABLE lms_ls_topic_map (lls_topic_map_id INTEGER PRIMARY KEY,lls_id INTEGER,topic_id INTEGER,created_by INTEGER,modified_by INTEGER)',
            'CREATE TABLE lms_ls_student_map (lls_st_map_id INTEGER PRIMARY KEY,lls_id INTEGER,ssd_id INTEGER,student_usn TEXT,created_by INTEGER,modified_by INTEGER)',
            'CREATE TABLE iems_students (student_id INTEGER PRIMARY KEY,usno TEXT,status INTEGER)',
            'CREATE TABLE cudos_map_courseto_student (student_id INTEGER,academic_batch_id INTEGER,semester_id INTEGER,crs_id INTEGER,section_id INTEGER,batch_id INTEGER)',
        ]: self.db.execute(text(sql))
        self.db.add_all([models.IEMSemester(semester_id=11,semester=1,academic_batch_id=1),
            models.IEMSCourses(crs_id=20,academic_batch_id=1,semester=1,crs_code='CS',crs_title='Course'),
            models.MasterTypeDetails(mt_details_id=30,parent_id=0,mt_details_name='A'),
            models.MasterTypeDetails(mt_details_id=31,parent_id=0,mt_details_name='B'),
            models.CudosTopic(topic_id=40,crs_id=20,academic_batch_id=1,semester_id=11,topic_code='T1',topic_title='Topic',topic_content='Portion',num_of_sessions=2),
            models.IEMSUsers(id=50,first_name='One'),models.IEMSUsers(id=51,first_name='Two')])
        for section in [30,31]:
            for instructor in [50,51]: self.db.add(models.CudosMapCoursetoCourseInstructor(academic_batch_id=1,semester_id=11,crs_id=20,section_id=section,course_instructor_id=instructor))
        self.db.execute(text("INSERT INTO iems_students VALUES (1,'USN1',1),(2,'USN2',1)"))
        self.db.execute(text('INSERT INTO cudos_map_courseto_student VALUES (1,1,11,20,30,NULL),(2,1,11,20,31,NULL)'))
        self.db.commit()
        self.context=dict(academic_batch_id=1,semester_id=11,course_id=20,section_id=30)
        self.user={'user_id':50}
    def tearDown(self): self.db.close();self.engine.dispose()
    def assign(self,section=30,instructors=None):
        result=m.assign_topics(AssignTopicsRequest(**{**self.context,'section_id':section},assignments=[TopicAssignment(topic_id=40,instructor_ids=instructors or [50])]),self.db,self.user)
        return result['data'][0]['mapping_id']
    def count(self,table): return self.db.execute(text('SELECT COUNT(*) FROM '+table)).scalar()
    def test_multiple_instructors_and_repeated_import(self):
        self.assign(instructors=[50,51]);self.assign(instructors=[50,51])
        self.assertEqual(self.count('lms_map_instructor_topic'),2)
        self.assertEqual(self.count('lms_map_portion_ls'),2)
        self.assertEqual(len(m.topic_list(TopicListRequest(**self.context),self.db,self.user)['data'][0]['instructor_ids']),2)
    def test_wrong_instructor_rolls_back_whole_assignment(self):
        with self.assertRaises(HTTPException): self.assign(instructors=[50,999])
        self.assertEqual(self.count('lms_map_instructor_topic'),0)
    def test_course_uses_semester_number(self):
        self.assertEqual(len(m.course_list(self.context,self.db,self.user)['data']),1)
    def test_section_dates_are_isolated_and_clearable(self):
        a=self.assign();b=self.assign(31)
        p=m.portions(self.db,m.get_mapping(self.db,a))[0]
        m.update_schedule(p.portion_id,{'mapping_id':a,'actual_delivery_date':'2026-09-06'},self.db,self.user)
        other=m.topic_schedules(b,self.db,self.user)['data']
        self.assertTrue(all(row['actual_delivery_date'] is None for row in other))
        m.update_schedule(p.portion_id,{'mapping_id':a,'actual_delivery_date':None},self.db,self.user)
        self.assertIsNone(self.db.get(models.LMSMapPortionLS,p.portion_id).delivery_date)
    def test_wrong_section_schedule_rejected(self):
        a=self.assign();b=self.assign(31)
        p=m.portions(self.db,m.get_mapping(self.db,a))[0]
        with self.assertRaises(HTTPException): m.update_schedule(p.portion_id,{'mapping_id':b,'portion_to_be_covered':'Wrong'},self.db,self.user)
        self.assertEqual(self.db.get(models.LMSMapPortionLS,p.portion_id).portion_per_hour,'Portion')
    def test_batch_save_rolls_back_on_invalid_row(self):
        mid=self.assign();p=m.portions(self.db,m.get_mapping(self.db,mid))[0]
        with self.assertRaises(HTTPException):
            m.save_schedules(SaveSchedulesRequest(mapping_id=mid,schedules=[SavedSchedule(schedule_id=p.portion_id,session_number=1,portion_to_be_covered='Changed'),SavedSchedule(schedule_id=9999,session_number=2)]),self.db,self.user)
        self.assertEqual(self.db.get(models.LMSMapPortionLS,p.portion_id).portion_per_hour,'Portion')
    def test_calendar_links_and_students_idempotent(self):
        mid=self.assign();p=m.portions(self.db,m.get_mapping(self.db,mid))[0]
        data={'mapping_id':mid,'actual_delivery_date':'2026-09-06','start_time':'09:00','end_time':'10:00'}
        m.update_schedule(p.portion_id,data,self.db,self.user)
        m.update_schedule(p.portion_id,data,self.db,self.user)
        self.assertEqual(self.count('lms_lesson_schedule'),1)
        self.assertEqual(self.count('lms_ls_lesson_schedule_map'),1)
        self.assertEqual(self.count('lms_ls_student_map'),1)
        self.assertEqual(self.db.execute(text('SELECT ssd_id FROM lms_ls_student_map')).scalar(),1)
        m.update_schedule(p.portion_id,{'mapping_id':mid,'actual_delivery_date':None},self.db,self.user)
        self.assertEqual(self.count('lms_ls_lesson_schedule_map'),0)
    def test_delete_preserves_shared_topic_and_other_section(self):
        self.assign();self.assign(31)
        m.delete_topic(40,TopicContext(**self.context),self.db,self.user)
        self.assertEqual(self.count('cudos_topic'),1)
        self.assertEqual(self.count('lms_map_instructor_topic'),1)
        self.assertEqual(self.count('lms_map_portion_ls'),4)
    def test_new_topic_is_created_and_assigned_atomically(self):
        result=m.add_new_topic(NewTopicRequest(**self.context,topic_title='New',topic_code='T2',instructor_id=50,num_of_sessions=3,delivery_date=date(2026,9,6)),self.db,self.user)
        self.assertTrue(result['mapping_id'])
        self.assertEqual(m.portions(self.db,m.get_mapping(self.db,result['mapping_id']))[0].delivery_date,date(2026,9,6))
        self.assertEqual(len(m.portions(self.db,m.get_mapping(self.db,result['mapping_id']))),3)
    def test_extra_class_persists_times_notes_and_calendar(self):
        mid=self.assign()
        result=m.add_extra_class(ExtraClassRequest(mapping_id=mid,class_date=date(2026,9,6),start_time=time(14),end_time=time(15),notes='Revision'),self.db,self.user)
        p=self.db.get(models.LMSMapPortionLS,result['schedule_id'])
        self.assertEqual(p.portion_per_hour,'Revision')
        self.assertEqual(p.start_time,time(14))
        self.assertEqual(self.count('lms_lesson_schedule'),1)

if __name__=='__main__': unittest.main(verbosity=2)
