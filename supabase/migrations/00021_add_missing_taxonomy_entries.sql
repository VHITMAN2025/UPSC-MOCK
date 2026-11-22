-- Add missing taxonomy entries to match the master taxonomy CSV structure
-- This migration adds alternate unit name formats that may be used in CSV imports
-- Supporting both "Unit II: Geography" and "Unit II: Geography of India" for flexibility

INSERT INTO public.question_taxonomy (exam_group, unit_name, macro_topic_name, micro_topic_name)
VALUES
  -- Group 4 alternate unit names (shorter versions without "of India")
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Physical Geography', 'Earth Location, Physical Features, Weather & Climate'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Physical Geography', 'Water Resources, Rivers, Soil, Minerals & Natural Resources'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Economic & Social Geography', 'Forest, Wildlife, Agriculture Pattern, Transport & Communication'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Economic & Social Geography', 'Population Density & Distribution in Tamil Nadu and India'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Disaster & Environment', 'Calamities, Disaster Management, Environment & Climate Change'),
  ('TNPSC_GROUP_4', 'Unit II: Geography', 'Current Affairs', 'Geographical Landmarks & Current Affairs'),
  
  -- Group 2 alternate unit names (for consistency, though master CSV uses full names)
  ('TNPSC_GROUP_2', 'Unit II: Geography', 'Physical & Economic Geography', 'Location, Physiography, Climate, Water Resources, Soils & Minerals'),
  ('TNPSC_GROUP_2', 'Unit II: Geography', 'Social & Disaster Geography', 'Population Distribution, Tribes, Disaster Management, Pollution & Climate Change'),
  
  -- Group 1 alternate unit names (for consistency, though master CSV uses full names)
  ('TNPSC_GROUP_1', 'Unit II: Geography', 'Comprehensive India & World Geography', 'Advanced Physical, Economic, Social Geography, Geopolitics & Disaster Management')
ON CONFLICT (exam_group, unit_name, macro_topic_name, micro_topic_name) DO UPDATE
SET active = true;
