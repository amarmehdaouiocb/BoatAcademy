-- =====================================================
-- Boat Academy - RLS Policies
-- =====================================================

-- =====================================================
-- SITES
-- =====================================================
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_read_active"
  ON public.sites FOR SELECT
  USING (is_active = true);

CREATE POLICY "sites_admin_manage"
  ON public.sites FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- PROFILES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_self_or_staff"
  ON public.profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.current_role() IN ('admin', 'manager', 'instructor')
  );

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_manage"
  ON public.profiles FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- PROFILE_SITES
-- =====================================================
ALTER TABLE public.profile_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_sites_read_admin"
  ON public.profile_sites FOR SELECT
  USING (public.current_role() = 'admin');

CREATE POLICY "profile_sites_read_self"
  ON public.profile_sites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profile_sites_admin_manage"
  ON public.profile_sites FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- STUDENTS
-- =====================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_read"
  ON public.students FOR SELECT
  USING (
    user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager', 'instructor') AND public.has_site_access(site_id))
  );

CREATE POLICY "students_insert_self"
  ON public.students FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_manager_update"
  ON public.students FOR UPDATE
  USING (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id));

-- =====================================================
-- DOCUMENT_TYPES
-- =====================================================
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_types_read_all"
  ON public.document_types FOR SELECT
  USING (true);

CREATE POLICY "document_types_admin_manage"
  ON public.document_types FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- SITE_REQUIRED_DOCUMENTS
-- =====================================================
ALTER TABLE public.site_required_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_required_documents_read"
  ON public.site_required_documents FOR SELECT
  USING (public.has_site_access(site_id));

CREATE POLICY "site_required_documents_admin_manage"
  ON public.site_required_documents FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- STUDENT_DOCUMENTS
-- =====================================================
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_documents_read"
  ON public.student_documents FOR SELECT
  USING (
    student_user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  );

CREATE POLICY "student_documents_insert_student"
  ON public.student_documents FOR INSERT
  WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "student_documents_update_manager"
  ON public.student_documents FOR UPDATE
  USING (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id));

-- =====================================================
-- PRODUCTS
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read_active"
  ON public.products FOR SELECT
  USING (is_active = true AND public.has_site_access(site_id));

CREATE POLICY "products_admin_manage"
  ON public.products FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "products_manager_manage"
  ON public.products FOR ALL
  USING (public.current_role() = 'manager' AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() = 'manager' AND public.has_site_access(site_id));

-- =====================================================
-- ORDERS
-- =====================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read_own"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  );

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- ENTITLEMENTS
-- =====================================================
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entitlements_read_own"
  ON public.entitlements FOR SELECT
  USING (
    user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  );

CREATE POLICY "entitlements_admin_manage"
  ON public.entitlements FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

-- =====================================================
-- SESSIONS
-- =====================================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_read_site"
  ON public.sessions FOR SELECT
  USING (public.has_site_access(site_id));

CREATE POLICY "sessions_manage_admin_manager"
  ON public.sessions FOR ALL
  USING (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id));

-- =====================================================
-- ENROLLMENTS
-- =====================================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_read"
  ON public.enrollments FOR SELECT
  USING (
    student_user_id = auth.uid()
    OR public.has_site_access(site_id)
  );

CREATE POLICY "enrollments_manage_admin_manager"
  ON public.enrollments FOR ALL
  USING (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id));

-- =====================================================
-- PENALTIES
-- =====================================================
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "penalties_read"
  ON public.penalties FOR SELECT
  USING (
    student_user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  );

CREATE POLICY "penalties_manage_admin_manager"
  ON public.penalties FOR ALL
  USING (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  WITH CHECK (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id));

-- =====================================================
-- EXAM_CENTERS
-- =====================================================
ALTER TABLE public.exam_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_centers_read_all"
  ON public.exam_centers FOR SELECT
  USING (true);

CREATE POLICY "exam_centers_admin_manage"
  ON public.exam_centers FOR ALL
  USING (public.current_role() = 'admin')
  WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "exam_centers_manager_manage"
  ON public.exam_centers FOR ALL
  USING (public.current_role() = 'manager' AND (site_id IS NULL OR public.has_site_access(site_id)))
  WITH CHECK (public.current_role() = 'manager' AND (site_id IS NULL OR public.has_site_access(site_id)));

-- =====================================================
-- EXTERNAL_LEARNING_LINKS
-- =====================================================
ALTER TABLE public.external_learning_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_learning_links_read"
  ON public.external_learning_links FOR SELECT
  USING (
    student_user_id = auth.uid()
    OR public.current_role() IN ('admin', 'manager')
  );

CREATE POLICY "external_learning_links_manage_manager"
  ON public.external_learning_links FOR ALL
  USING (public.current_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_role() IN ('admin', 'manager'));

-- =====================================================
-- CONVERSATIONS
-- =====================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_read"
  ON public.conversations FOR SELECT
  USING (
    student_user_id = auth.uid()
    OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(site_id))
  );

CREATE POLICY "conversations_insert_student"
  ON public.conversations FOR INSERT
  WITH CHECK (
    student_user_id = auth.uid()
    OR public.current_role() IN ('admin', 'manager')
  );

-- =====================================================
-- MESSAGES
-- =====================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read"
  ON public.messages FOR SELECT
  USING (
    EXISTS(SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.student_user_id = auth.uid()
          OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(c.site_id))
        )
    )
  );

CREATE POLICY "messages_insert_sender_in_conversation"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS(SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.student_user_id = auth.uid()
          OR (public.current_role() IN ('admin', 'manager') AND public.has_site_access(c.site_id))
        )
    )
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- DEVICE_TOKENS
-- =====================================================
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens_read_own"
  ON public.device_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "device_tokens_manage_own"
  ON public.device_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- AUDIT_LOG
-- =====================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read_admin"
  ON public.audit_log FOR SELECT
  USING (public.current_role() = 'admin');

CREATE POLICY "audit_log_read_manager_site"
  ON public.audit_log FOR SELECT
  USING (
    public.current_role() = 'manager'
    AND (site_id IS NULL OR public.has_site_access(site_id))
  );
