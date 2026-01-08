import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface ValidateRequest {
  documentId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user
    const { user } = await getAuthedUser(req);
    const admin = supabaseAdmin();

    // Check if user is admin or manager
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return errorResponse('Only admin and manager can validate documents', 403);
    }

    // Parse request body
    const body: ValidateRequest = await req.json();
    const { documentId, action, rejectionReason } = body;

    if (!documentId || !action) {
      return errorResponse('Missing required fields: documentId, action');
    }

    if (action !== 'approve' && action !== 'reject') {
      return errorResponse('Invalid action. Must be "approve" or "reject"');
    }

    if (action === 'reject' && !rejectionReason) {
      return errorResponse('Rejection reason is required when rejecting a document');
    }

    // Get document details
    const { data: document, error: docError } = await admin
      .from('student_documents')
      .select('*, student:students!student_user_id(*)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return errorResponse('Document not found', 404);
    }

    // Check site access for manager
    if (profile.role === 'manager') {
      const { data: siteAccess } = await admin
        .from('profile_sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('site_id', document.site_id)
        .single();

      if (!siteAccess) {
        return errorResponse('No access to this site', 403);
      }
    }

    // Update document status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await admin
      .from('student_documents')
      .update({
        status: newStatus,
        rejection_reason: action === 'reject' ? rejectionReason : null,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      return errorResponse('Failed to update document', 500);
    }

    // Check if all required documents are now approved
    await updateStudentDocumentStatus(admin, document.student_user_id, document.site_id);

    // Notify the student
    const notificationTitle = action === 'approve'
      ? 'Document approuve'
      : 'Document refuse';
    const notificationBody = action === 'approve'
      ? 'Votre document a ete approuve.'
      : `Votre document a ete refuse : ${rejectionReason}`;

    await admin.from('notifications').insert({
      user_id: document.student_user_id,
      type: 'document_status',
      title: notificationTitle,
      body: notificationBody,
      data: { document_id: documentId, status: newStatus },
    });

    // Log the action
    await admin.from('audit_log').insert({
      user_id: user.id,
      site_id: document.site_id,
      action: `document_${action}`,
      table_name: 'student_documents',
      record_id: documentId,
      old_data: { status: document.status },
      new_data: { status: newStatus, rejection_reason: rejectionReason },
    });

    return jsonResponse({
      message: `Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      documentId,
      status: newStatus,
    });
  } catch (error) {
    console.error('Document validation error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});

/**
 * Update student's overall document status based on their documents
 */
async function updateStudentDocumentStatus(
  admin: ReturnType<typeof supabaseAdmin>,
  studentUserId: string,
  siteId: string
) {
  // Get required documents for the site
  const { data: requiredDocs } = await admin
    .from('site_required_documents')
    .select('document_type_id')
    .eq('site_id', siteId)
    .eq('is_required', true);

  if (!requiredDocs || requiredDocs.length === 0) {
    return;
  }

  const requiredTypeIds = requiredDocs.map(d => d.document_type_id);

  // Get student's documents
  const { data: studentDocs } = await admin
    .from('student_documents')
    .select('document_type_id, status')
    .eq('student_user_id', studentUserId)
    .eq('site_id', siteId);

  if (!studentDocs) {
    return;
  }

  // Check if all required documents are approved
  const approvedTypeIds = studentDocs
    .filter(d => d.status === 'approved')
    .map(d => d.document_type_id);

  const allApproved = requiredTypeIds.every(id => approvedTypeIds.includes(id));

  // Check if any required document is rejected
  const rejectedTypeIds = studentDocs
    .filter(d => d.status === 'rejected')
    .map(d => d.document_type_id);

  const hasRejected = requiredTypeIds.some(id => rejectedTypeIds.includes(id));

  // Determine overall status
  let documentStatus: 'incomplete' | 'pending' | 'complete' | 'rejected';

  if (allApproved) {
    documentStatus = 'complete';
  } else if (hasRejected) {
    documentStatus = 'rejected';
  } else {
    // Check if all required docs are at least submitted
    const submittedTypeIds = studentDocs.map(d => d.document_type_id);
    const allSubmitted = requiredTypeIds.every(id => submittedTypeIds.includes(id));
    documentStatus = allSubmitted ? 'pending' : 'incomplete';
  }

  // Update student record
  await admin
    .from('students')
    .update({ document_status: documentStatus })
    .eq('user_id', studentUserId)
    .eq('site_id', siteId);
}
