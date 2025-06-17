-- Award badges for friend requests
CREATE OR REPLACE FUNCTION award_friend_badges()
RETURNS TRIGGER AS $$
DECLARE
    friend_count INTEGER;
BEGIN
    -- First friend badge
    IF NOT EXISTS (
        SELECT 1 FROM user_badges WHERE user_id = NEW.requester_id AND badge_key = 'add_friend'
    ) THEN
        INSERT INTO user_badges (user_id, badge_key) VALUES (NEW.requester_id, 'add_friend');
    END IF;

    -- Five friends badge
    SELECT COUNT(*) INTO friend_count
    FROM friend_requests
    WHERE (requester_id = NEW.requester_id OR addressee_id = NEW.requester_id)
      AND status = 'accepted';

    IF friend_count >= 5 AND NOT EXISTS (
        SELECT 1 FROM user_badges WHERE user_id = NEW.requester_id AND badge_key = 'five_friends'
    ) THEN
        INSERT INTO user_badges (user_id, badge_key) VALUES (NEW.requester_id, 'five_friends');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS friend_badge_trigger ON friend_requests;
CREATE TRIGGER friend_badge_trigger
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
    EXECUTE FUNCTION award_friend_badges();

-- RLS for badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- RLS for user_badges
CREATE POLICY "Users can delete their own badges" ON user_badges FOR DELETE USING (auth.uid() = user_id);

-- Analytics view
CREATE OR REPLACE VIEW badge_analytics AS
SELECT 
    b.key,
    b.label,
    COUNT(ub.id) as total_awarded,
    COUNT(DISTINCT ub.user_id) as unique_users,
    ROUND(
        COUNT(ub.id)::decimal / (SELECT COUNT(*) FROM auth.users) * 100, 2
    ) as completion_percentage
FROM badges b
LEFT JOIN user_badges ub ON b.key = ub.badge_key
GROUP BY b.key, b.label
ORDER BY total_awarded DESC; 