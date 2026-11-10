create table patients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  current_status   text not null,          -- 'Admitted' | 'Discharged' | 'Outpatient'
  current_location text                    -- e.g. 'Mercy'
);

create table action_queue (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  action_type     text not null,           -- 'billing' | 'emr_update' | 'patient_comms'
  patient_id      uuid references patients(id),
  raw_transcript  text not null,
  ai_payload      jsonb not null,          -- what the AI extracted; never changed after insert (audit trail)
  edited_payload  jsonb,                   -- staff's corrected version; null until staff saves or executes
  status          text not null default 'pending',   -- 'pending' | 'completed' | 'flagged'
  confidence_flag boolean not null default false
);

-- Demo app with no login: let the app's publishable key read and write these tables.
alter table patients     disable row level security;
alter table action_queue disable row level security;
grant select, insert, update on patients, action_queue to anon;
