-- Part 4: Constraints and Indexes

ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_email_key" UNIQUE ("email");
ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."cafes"
    ADD CONSTRAINT "cafes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");
ALTER TABLE ONLY "public"."profile_badges"
    ADD CONSTRAINT "profile_badges_pkey" PRIMARY KEY ("id");

CREATE INDEX "cafes_city_idx" ON "public"."cafes" USING "btree" ("city");

ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES "public"."profiles"("id");

ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES "public"."profiles"("id");

ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id");
ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profile_badges"
    ADD CONSTRAINT "profile_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id");
ALTER TABLE ONLY "public"."profile_badges"
    ADD CONSTRAINT "profile_badges_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");
