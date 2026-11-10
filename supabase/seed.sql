truncate action_queue, patients;

insert into patients (id, name, current_status, current_location) values
  ('11111111-1111-1111-1111-111111111111', 'Jane Doe',     'Admitted',   'Mercy'),
  ('22222222-2222-2222-2222-222222222222', 'Robert Chen',  'Admitted',   'Mercy'),
  ('33333333-3333-3333-3333-333333333333', 'Maria Garcia', 'Admitted',   'Mercy'),
  ('44444444-4444-4444-4444-444444444444', 'Mario Garcia', 'Admitted',   'St. Luke''s'),
  ('55555555-5555-5555-5555-555555555555', 'Emily Brown',  'Outpatient', 'Riverside'),
  ('66666666-6666-6666-6666-666666666666', 'David Lee',    'Discharged', 'Mercy');

insert into action_queue (action_type, patient_id, raw_transcript, ai_payload, status, confidence_flag) values
  ('billing', '22222222-2222-2222-2222-222222222222',
   'Saw Robert Chen at Mercy, follow-up visit, bill 99232',
   '{"patient_name":"Robert Chen","hospital":"Mercy","billing_code":"99232","insurance_provider":null,"missing_fields":["insurance_provider"]}',
   'pending', true),

  ('emr_update', '66666666-6666-6666-6666-666666666666',
   'Discharged David Lee from Mercy',
   '{"patient_name":"David Lee","new_status":"Discharged","location":"Mercy","missing_fields":[]}',
   'completed', false),

  ('patient_comms', '55555555-5555-5555-5555-555555555555',
   'Have someone call Emily about her results',
   '{"patient_name":"Emily Brown","recipient":"front_desk","message":"Call Emily Brown about her lab results","missing_fields":[]}',
   'flagged', false);
