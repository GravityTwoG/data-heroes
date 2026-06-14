-- Idempotent seed: INSERT ON CONFLICT DO NOTHING

-- Default preferences: all type × channel combinations enabled
INSERT INTO default_preferences (notification_type, notification_channel, enabled)
VALUES
  ('marketing', 'email', true),
  ('marketing', 'sms', true),
  ('marketing', 'telegram', true),
  ('marketing', 'whatsapp', true),
  ('marketing', 'max', true),

  ('transaction', 'email', true),
  ('transaction', 'sms', true),
  ('transaction', 'telegram', true),
  ('transaction', 'whatsapp', true),
  ('transaction', 'max', true),
  ('transaction', 'push', true)
ON CONFLICT (notification_type, notification_channel) DO NOTHING;

-- Global policies: region-level overrides
INSERT INTO global_policies (notification_type, notification_channel, region, enabled)
VALUES
  ('marketing', 'sms', 'EU', false)
ON CONFLICT (notification_type, notification_channel, region) DO NOTHING;
