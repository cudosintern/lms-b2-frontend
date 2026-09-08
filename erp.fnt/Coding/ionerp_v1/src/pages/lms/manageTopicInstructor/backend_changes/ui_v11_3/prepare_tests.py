from pathlib import Path
root=Path('backend_changes/ui_v11_3')
s=Path('backend_changes/test_topic_management.py').read_text(encoding='utf-8-sig')
marker="if __name__=='__main__': unittest.main(verbosity=2)"
extra='''    def test_topic_list_returns_individual_portions(self):
        mid=self.assign()
        rows=m.topic_list(TopicListRequest(**self.context),self.db,self.user)['data']
        self.assertEqual(len(rows[0]['portions']),2)
        self.assertEqual(rows[0]['portions'][0]['portion_to_be_covered'],'Portion')
    def test_assignment_modal_reports_missing_and_existing_portions(self):
        before=m.cudos_topics(TopicContext(**self.context),self.db,self.user)['data']
        self.assertFalse(before[0]['has_portions'])
        self.assertEqual(before[0]['default_instructor_id'],50)
        self.assign()
        after=m.cudos_topics(TopicContext(**self.context),self.db,self.user)['data']
        self.assertTrue(after[0]['has_portions'])
    def test_instructors_and_schedules_rollback_together(self):
        mid=self.assign()
        with self.assertRaises(HTTPException):
            m.save_schedules(SaveSchedulesRequest(mapping_id=mid,instructor_ids=[50,51],schedules=[SavedSchedule(schedule_id=9999,session_number=1)]),self.db,self.user)
        self.assertEqual(self.count('lms_map_instructor_topic'),1)
    def test_save_schedule_adds_instructor_without_removing_existing(self):
        mid=self.assign()
        m.save_schedules(SaveSchedulesRequest(mapping_id=mid,instructor_ids=[51],schedules=[]),self.db,self.user)
        self.assertEqual(self.count('lms_map_instructor_topic'),2)

'''
s=s.replace(marker,extra+marker)
(root/'test_topic_management.py').write_text(s,encoding='utf-8')
