-- Add missing taxonomy entries to match the master taxonomy CSV structure
-- This migration adds alternate unit name formats that may be used in CSV imports

INSERT INTO public.question_taxonomy (exam_group, unit_name, macro_topic_name, micro_topic_name)
VALUES
  -- Group 4 alternate unit names (shorter versions without "of India")
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Physical Geography', 'Earth Location, Physical Features, Weather & Climate'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Physical Geography', 'Water Resources, Rivers, Soil, Minerals & Natural Resources'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Economic & Social Geography', 'Forest, Wildlife, Agriculture Pattern, Transport & Communication'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Economic & Social Geography', 'Population Density & Distribution in Tamil Nadu and India'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Disaster & Environment', 'Calamities, Disaster Management, Environment & Climate Change'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Current Affairs', 'Geographical Landmarks & Current Affairs')
ON CONFLICT (exam_group, unit_name, macro_topic_name, micro_topic_name) DO UPDATE
SET active = true;
