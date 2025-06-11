INSERT INTO badges (key, label, description, emoji) VALUES
  ('account', 'Welcome Aboard!', 'You created your Anemi Meets account. Let the coffee adventures begin!', '🚀'),
  ('add_friend', 'First Coffee Buddy!', 'You added your first friend. Coffee tastes better together!', '☕️'),
  ('first_meetup', 'First Sip!', 'You attended your first meetup. Cheers to new connections!', '🥤'),
  ('report_bug', 'Bug Buster!', 'You reported a bug or idea. Thanks for making Anemi Meets better!', '🐞'),
  ('five_friends', 'Social Butterfly!', 'You added 5 friends. Your network is growing!', '🦋'),
  ('five_meetups', 'Meetup Master!', 'You attended 5 meetups. You're a true coffee hero!', '🎉')
ON CONFLICT (key) DO NOTHING; 