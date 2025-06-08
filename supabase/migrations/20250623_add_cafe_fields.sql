-- Auto-calculate open_morning, open_afternoon, open_evening for existing cafes based on opening_hours
UPDATE cafes
SET
  open_morning = (
    COALESCE((
      SELECT bool_or(
        substring(value from '^(\\d{2})')::int <= 11
        AND substring(value from '^(\\d{2})')::int >= 7
      )
      FROM jsonb_each_text(opening_hours)
    ), FALSE)
  ),
  open_afternoon = (
    COALESCE((
      SELECT bool_or(
        substring(value from '^(\\d{2})')::int >= 12
        AND substring(value from '^(\\d{2})')::int < 20
      )
      FROM jsonb_each_text(opening_hours)
    ), FALSE)
  ),
  open_evening = (
    COALESCE((
      SELECT bool_or(
        substring(value from '^(\\d{2})')::int >= 20
      )
      FROM jsonb_each_text(opening_hours)
    ), FALSE)
  )
WHERE opening_hours IS NOT NULL; 