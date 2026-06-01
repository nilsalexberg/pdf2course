CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_pdfs_course_id_idx" ON "course_pdfs" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "courses_producer_id_idx" ON "courses" USING btree ("producer_id");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_chunks_course_id_idx" ON "document_chunks" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "document_chunks_course_pdf_id_idx" ON "document_chunks" USING btree ("course_pdf_id");--> statement-breakpoint
CREATE INDEX "lesson_completions_user_course_idx" ON "lesson_completions" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "lessons_module_id_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lessons_course_id_idx" ON "lessons" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "modules_course_id_idx" ON "modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_user_lesson_unique" UNIQUE("user_id","lesson_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_check" CHECK ("profiles"."role" IN ('user', 'admin'));