/*
  # Add User Template Preferences

  1. New Table
    - `user_template_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `template_key` (text, the template identifier like 'minimal', 'modern')
      - `is_favorite` (boolean, whether user marked template as favorite)
      - `is_default` (boolean, whether this is the user's default template)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Unique constraint on (user_id, template_key) to prevent duplicates
    - Check constraint to ensure only one default template per user

  3. Security
    - Enable RLS
    - Users can only read and modify their own preferences
*/

CREATE TABLE IF NOT EXISTS user_template_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  is_favorite boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_user_template_preferences_user_id ON user_template_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_preferences_default ON user_template_preferences(user_id, is_default) WHERE is_default = true;

ALTER TABLE user_template_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own template preferences"
  ON user_template_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template preferences"
  ON user_template_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template preferences"
  ON user_template_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template preferences"
  ON user_template_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_template_preferences
    SET is_default = false, updated_at = now()
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default
  BEFORE INSERT OR UPDATE ON user_template_preferences
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();
