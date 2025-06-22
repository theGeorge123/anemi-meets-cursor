INSERT INTO public.badges (id, name, description, icon_name) VALUES
('account_created', 'Account Created', 'Awarded when you create your account and complete your profile.', '🎉'),
('first_friend', 'First Friend', 'Awarded when you make your first friend on the platform.', '🤝'),
('first_meetup_created', 'Meetup Initiator', 'Awarded for creating your first meetup.', '📅'),
('first_meetup_joined', 'Social Butterfly', 'Awarded for joining your first meetup.', '🦋'),
('five_meetups_created', 'Community Builder', 'Awarded for creating five meetups.', '🏗️'),
('five_meetups_joined', 'Regular', 'Awarded for joining five meetups.', '☕'),
('verified_supporter', 'Verified Supporter', 'Awarded for visiting a verified café.', '✅');

INSERT INTO public.cafes (name, address, city, gmaps_url, verified) VALUES
('Heilige Boontjes', 'Eendrachtsplein 3, 3015 LA Rotterdam', 'Rotterdam', 'https://maps.app.goo.gl/5V9h6q2ZGLbL4Aew7', true),
('Man met Bril Koffie', 'Vijverhofstraat 70, 3032 SN Rotterdam', 'Rotterdam', 'https://maps.app.goo.gl/VpB2a2kGZ9sJ6qYy7', true),
('Hopper Coffee', 'Schiedamse Vest 146, 3011 BG Rotterdam', 'Rotterdam', 'https://maps.app.goo.gl/Q7t4i3L6E5qQZ8yR8', false),
('Urban Espresso Bar', 'Nieuwe Binnenweg 263, 3021 GD Rotterdam', 'Rotterdam', 'https://maps.app.goo.gl/g6z2vL1vJ8Z3yZk77', false),
('Rolphs Deli', 'Otto Reuchlinweg 974, 3072 MD Rotterdam', 'Rotterdam', 'https://maps.app.goo.gl/HjW7v3fXJ6pB4v7w6', false);
