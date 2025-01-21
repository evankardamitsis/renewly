

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."begin_transaction"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE 'BEGIN;';
END;
$$;


ALTER FUNCTION "public"."begin_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_team_member_access"("team_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND team_id = $1
    );
END;
$_$;


ALTER FUNCTION "public"."check_team_member_access"("team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."commit_transaction"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE 'COMMIT;';
END;
$$;


ALTER FUNCTION "public"."commit_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_all_notifications"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from notifications
  where user_id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."delete_all_notifications"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_multiple_notifications"("p_notification_ids" "uuid"[], "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from notifications
  where id = any(p_notification_ids)
  and user_id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."delete_multiple_notifications"("p_notification_ids" "uuid"[], "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_notification"("p_notification_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from notifications
  where id = p_notification_id
  and user_id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."delete_notification"("p_notification_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE PROCEDURE "public"."delete_user_data"(IN "target_user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Delete all related data in the correct order
    DELETE FROM team_invitations 
    WHERE email = (SELECT email FROM auth.users WHERE id = target_user_id);

    DELETE FROM team_members_secure 
    WHERE user_id = target_user_id;

    DELETE FROM team_members 
    WHERE user_id = target_user_id;

    UPDATE projects 
    SET created_by = NULL 
    WHERE created_by = target_user_id;

    DELETE FROM profiles 
    WHERE id = target_user_id;

    -- Don't delete from auth.users as Supabase handles that
END;
$$;


ALTER PROCEDURE "public"."delete_user_data"(IN "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_team_members"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "team_id" "uuid", "user_id" "uuid", "role" "text", "is_super_admin" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT tm.*
    FROM team_members tm
    WHERE user_uuid = ANY(tm.accessible_to);
END;
$$;


ALTER FUNCTION "public"."get_user_team_members"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If this is the first member of a team, make them super admin
    IF NOT EXISTS (
        SELECT 1 FROM team_members_secure 
        WHERE team_id = NEW.team_id
    ) THEN
        NEW.is_super_admin := true;
        NEW.role := 'admin';
    END IF;
    
    -- Set initial accessible_to
    NEW.accessible_to := ARRAY[NEW.user_id];
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_onboarding_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if there's a pending invitation
    IF EXISTS (
        SELECT 1 
        FROM team_invitations 
        WHERE email = NEW.email
        AND status = 'pending'
    ) THEN
        -- Don't create team membership yet - it will be handled by invitation acceptance
        RETURN NEW;
    END IF;

    -- If no invitation exists, create a new team and add user as super admin
    WITH new_team AS (
        INSERT INTO teams (
            name,
            created_by  -- Add created_by field
        )
        VALUES (
            'My Team',
            NEW.id      -- Set created_by to the user's ID
        )
        RETURNING id
    )
    INSERT INTO team_members_secure (
        team_id,
        user_id,
        role,
        is_super_admin,
        accessible_to
    )
    SELECT 
        id as team_id,
        NEW.id as user_id,
        'admin' as role,
        true as is_super_admin,
        ARRAY[NEW.id] as accessible_to
    FROM new_team;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_onboarding_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_admin"("check_team_id" "uuid", "check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM team_members
        WHERE team_id = check_team_id
        AND user_id = check_user_id
        AND (role = 'admin' OR is_super_admin = true)
    );
END;
$$;


ALTER FUNCTION "public"."is_team_admin"("check_team_id" "uuid", "check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update notifications
  set read = true
  where user_id = p_user_id
  and read = false;
end;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rollback_transaction"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE 'ROLLBACK;';
END;
$$;


ALTER FUNCTION "public"."rollback_transaction"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "task_id" "uuid",
    "project_id" "uuid",
    "read" boolean DEFAULT false,
    "action_url" "text",
    "email_sent" boolean DEFAULT false
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "display_name" "text",
    "role" "text",
    "has_completed_onboarding" boolean DEFAULT false,
    "current_team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "avatar_url" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."avatar_url" IS 'The URL of the user''s avatar image';



CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "name" "text" NOT NULL,
    "size" integer NOT NULL,
    "type" "text" NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "storage_path" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."project_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "due_date" timestamp with time zone,
    "slug" "text",
    "tasks" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "has_board_enabled" boolean DEFAULT false NOT NULL,
    "status_id" "uuid",
    "owner_id" "uuid"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "due_date" timestamp with time zone,
    "created_by" "uuid",
    "custom_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "is_recurring" boolean DEFAULT false,
    "recurring_interval" "text",
    "assigned_to" "uuid",
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in-progress'::"text", 'done'::"text"]))),
    CONSTRAINT "valid_recurring_interval" CHECK ((("recurring_interval" IS NULL) OR ("recurring_interval" = ANY (ARRAY['annual'::"text", '6month'::"text", '3month'::"text", 'monthly'::"text"]))))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."recurring_interval" IS 'Can only be: annual, 6month, 3month, monthly, or null';



CREATE TABLE IF NOT EXISTS "public"."team_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid",
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", ("now"() + '7 days'::interval)),
    "accepted" boolean DEFAULT false,
    "invited_by" "uuid",
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    CONSTRAINT "team_invitations_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"]))),
    CONSTRAINT "team_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."team_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_invitations" IS 'Stores team membership invitations';



COMMENT ON COLUMN "public"."team_invitations"."created_at" IS 'When the invitation was created';



COMMENT ON COLUMN "public"."team_invitations"."accepted" IS 'Whether the invitation has been accepted';



COMMENT ON COLUMN "public"."team_invitations"."invited_by" IS 'The user who sent the invitation';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "email" "text",
    "is_super_admin" boolean DEFAULT false,
    "accessible_to" "uuid"[] DEFAULT ARRAY["auth"."uid"()],
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."team_members"."email" IS 'The email address of the team member, references profiles.email';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "image_url" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_statuses"
    ADD CONSTRAINT "project_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_team_id_email_key" UNIQUE ("team_id", "email");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_email_sent" ON "public"."notifications" USING "btree" ("email_sent");



CREATE INDEX "idx_notifications_user_id_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_profiles_user_id_team_id" ON "public"."profiles" USING "btree" ("id", "current_team_id");



CREATE INDEX "idx_projects_search" ON "public"."projects" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_projects_team_id_status_id" ON "public"."projects" USING "btree" ("team_id", "status_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_project_id_status" ON "public"."tasks" USING "btree" ("project_id", "status");



CREATE INDEX "idx_tasks_search" ON "public"."tasks" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_team_members_accessible_to" ON "public"."team_members" USING "gin" ("accessible_to");



CREATE INDEX "idx_team_members_user_id_team_id" ON "public"."team_members" USING "btree" ("user_id", "team_id");



CREATE INDEX "idx_unread_notifications" ON "public"."notifications" USING "btree" ("user_id") WHERE ("read" = false);



CREATE UNIQUE INDEX "one_super_admin_per_team" ON "public"."team_members" USING "btree" ("team_id") WHERE ("is_super_admin" = true);



CREATE INDEX "team_invitations_team_id_email_accepted_idx" ON "public"."team_invitations" USING "btree" ("team_id", "email", "accepted");



CREATE INDEX "team_members_email_idx" ON "public"."team_members" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "on_onboarding_completion" AFTER UPDATE OF "has_completed_onboarding" ON "public"."profiles" FOR EACH ROW WHEN ((("new"."has_completed_onboarding" = true) AND ("old"."has_completed_onboarding" = false))) EXECUTE FUNCTION "public"."handle_onboarding_completion"();



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_current_team_id_fkey" FOREIGN KEY ("current_team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."project_statuses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."profiles"("email");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Enable insert access for authenticated users" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Enable insert access for team members" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."projects" ON (("projects"."id" = "tasks"."project_id")))
  WHERE (("team_members"."team_id" = "projects"."team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable insert for authenticated users" ON "public"."tasks" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") OR ("auth"."uid"() = "assigned_to") OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "tasks"."project_id") AND (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members" "tm"
          WHERE (("tm"."team_id" = "p"."team_id") AND ("tm"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."team_invitations"
  WHERE (("team_invitations"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("team_invitations"."status" = 'pending'::"text"))))));



CREATE POLICY "Enable read access for team members" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."projects" ON (("projects"."id" = "tasks"."project_id")))
  WHERE (("team_members"."team_id" = "projects"."team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable read access for team members" ON "public"."teams" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable read for project members" ON "public"."tasks" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "tasks"."project_id") AND (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members" "tm"
          WHERE (("tm"."team_id" = "p"."team_id") AND ("tm"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "Enable select for team members" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "profiles"."current_team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable select for users based on id" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable update access for team admins" ON "public"."teams" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"text")))));



CREATE POLICY "Enable update access for team members" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."projects" ON (("projects"."id" = "tasks"."project_id")))
  WHERE (("team_members"."team_id" = "projects"."team_id") AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable update for authenticated users" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("team_id" IN ( SELECT "team_members"."team_id"
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"())))) WITH CHECK (("team_id" IN ( SELECT "team_members"."team_id"
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "File uploaders and team admins can delete files" ON "public"."project_files" FOR DELETE USING ((("auth"."uid"() = "uploaded_by") OR (EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("p"."id" = "project_files"."project_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'admin'::"text"))))));



CREATE POLICY "Member can perform basic actions" ON "public"."tasks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = ( SELECT "projects"."team_id"
           FROM "public"."projects"
          WHERE ("projects"."id" = "tasks"."project_id"))) AND ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only team admins can update team details" ON "public"."teams" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "team_members"."user_id"
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "team_members"."id") AND ("team_members"."role" = 'admin'::"text")))));



CREATE POLICY "Project statuses are viewable by all authenticated users" ON "public"."project_statuses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Super Admin can delete team" ON "public"."teams" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."is_super_admin" = true)))));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Team admins can manage projects" ON "public"."projects" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."team_id" = "projects"."team_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'admin'::"text")))));



CREATE POLICY "Team admins can update team details" ON "public"."teams" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "created_by") OR ("auth"."uid"() IN ( SELECT "team_members"."user_id"
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "team_members"."id") AND ("team_members"."role" = 'admin'::"text"))))));



CREATE POLICY "Team members can create tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("project_id" IN ( SELECT "p"."id"
   FROM ("public"."projects" "p"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "p"."team_id")))
  WHERE ("tm"."user_id" = "auth"."uid"()))));



CREATE POLICY "Team members can update their team's tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("project_id" IN ( SELECT "p"."id"
   FROM ("public"."projects" "p"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "p"."team_id")))
  WHERE ("tm"."user_id" = "auth"."uid"()))));



CREATE POLICY "Team members can upload files" ON "public"."project_files" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("p"."id" = "project_files"."project_id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Team members can view tasks in their projects" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("project_id" IN ( SELECT "p"."id"
   FROM ("public"."projects" "p"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "p"."team_id")))
  WHERE ("tm"."user_id" = "auth"."uid"()))));



CREATE POLICY "Team members can view their teams" ON "public"."teams" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "team_members"."user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."team_id" = "team_members"."id"))));



CREATE POLICY "Users can access tasks through their team's projects" ON "public"."tasks" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create teams during onboarding" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete project files" ON "public"."project_files" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("p"."id" = "project_files"."project_id")))));



CREATE POLICY "Users can delete their own notifications in batch" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their team's tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert project files" ON "public"."project_files" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("p"."id" = "project_files"."project_id")))));



CREATE POLICY "Users can update their team's tasks" ON "public"."tasks" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view project files" ON "public"."project_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("p"."id" = "project_files"."project_id")))));



CREATE POLICY "Users can view project files if they are team members" ON "public"."project_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."projects" "p" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("p"."id" = "project_files"."project_id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view projects if they are team members" ON "public"."projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."team_id" = "projects"."team_id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their team's tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."team_id" IN ( SELECT "team_members"."team_id"
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "authenticated_access" ON "public"."projects" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."team_invitations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."team_members" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_read_policy" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_policy" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE PUBLICATION "realtime_messages_publication_v2_34_0" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "realtime_messages_publication_v2_34_0" OWNER TO "supabase_admin";




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."begin_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."begin_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."begin_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_team_member_access"("team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_team_member_access"("team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_team_member_access"("team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."commit_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."commit_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."commit_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_all_notifications"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_all_notifications"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_all_notifications"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_multiple_notifications"("p_notification_ids" "uuid"[], "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_multiple_notifications"("p_notification_ids" "uuid"[], "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_multiple_notifications"("p_notification_ids" "uuid"[], "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON PROCEDURE "public"."delete_user_data"(IN "target_user_id" "uuid") TO "anon";
GRANT ALL ON PROCEDURE "public"."delete_user_data"(IN "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."delete_user_data"(IN "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_team_members"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_team_members"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_team_members"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_registration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_onboarding_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_onboarding_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_onboarding_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_admin"("check_team_id" "uuid", "check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_admin"("check_team_id" "uuid", "check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_admin"("check_team_id" "uuid", "check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rollback_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."rollback_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollback_transaction"() TO "service_role";
























GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."project_statuses" TO "anon";
GRANT ALL ON TABLE "public"."project_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."project_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_invitations" TO "anon";
GRANT ALL ON TABLE "public"."team_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."team_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
