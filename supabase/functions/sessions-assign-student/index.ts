import { getAuthedUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface AssignRequest {
  sessionId: string;
  studentUserId?: string; // Optional: for manager assigning a student
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate user
    const { user, supabase } = await getAuthedUser(req);
    const admin = supabaseAdmin();

    // Parse request body
    const body: AssignRequest = await req.json();
    const { sessionId, studentUserId } = body;

    if (!sessionId) {
      return errorResponse('Missing required field: sessionId');
    }

    // Get user profile to check role
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = profile?.role || 'student';
    const targetUserId = studentUserId && ['admin', 'manager'].includes(userRole)
      ? studentUserId
      : user.id;

    // Get session details
    const { data: session, error: sessionError } = await admin
      .from('sessions')
      .select('*, site:sites(name)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return errorResponse('Session not found', 404);
    }

    // Check if session is in the future
    const sessionDate = new Date(session.date);
    if (sessionDate < new Date()) {
      return errorResponse('Cannot enroll in past sessions', 400);
    }

    // Check if session has available spots
    const { count: currentEnrollments } = await admin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .in('status', ['pending', 'confirmed']);

    if (session.max_students && currentEnrollments && currentEnrollments >= session.max_students) {
      return errorResponse('Session is full', 400);
    }

    // Check if user has valid entitlement for this site
    const { data: entitlement } = await admin
      .from('entitlements')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('site_id', session.site_id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!entitlement && userRole === 'student') {
      return errorResponse('No valid subscription found. Please purchase a product first.', 403);
    }

    // Check if user has student record for this site
    const { data: student } = await admin
      .from('students')
      .select('id, document_status')
      .eq('user_id', targetUserId)
      .eq('site_id', session.site_id)
      .single();

    if (!student) {
      return errorResponse('Student record not found for this site', 404);
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('student_user_id', targetUserId)
      .eq('session_id', sessionId)
      .single();

    if (existingEnrollment) {
      if (existingEnrollment.status === 'cancelled') {
        // Re-enroll cancelled enrollment
        const { error: updateError } = await admin
          .from('enrollments')
          .update({ status: 'pending' })
          .eq('id', existingEnrollment.id);

        if (updateError) {
          return errorResponse('Failed to re-enroll', 500);
        }

        return jsonResponse({
          message: 'Re-enrolled successfully',
          enrollmentId: existingEnrollment.id,
        });
      }
      return errorResponse('Already enrolled in this session', 400);
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await admin
      .from('enrollments')
      .insert({
        student_user_id: targetUserId,
        session_id: sessionId,
        site_id: session.site_id,
        status: 'pending',
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Failed to create enrollment:', enrollmentError);
      return errorResponse('Failed to create enrollment', 500);
    }

    // Create notification for the student
    await admin.from('notifications').insert({
      user_id: targetUserId,
      type: 'session_reminder',
      title: 'Inscription confirmee',
      body: `Vous etes inscrit a la session du ${sessionDate.toLocaleDateString('fr-FR')}`,
      data: { session_id: sessionId, enrollment_id: enrollment.id },
    });

    // If manager is assigning, also notify
    if (studentUserId && studentUserId !== user.id) {
      console.log(`Manager ${user.id} assigned student ${studentUserId} to session ${sessionId}`);
    }

    return jsonResponse({
      message: 'Enrolled successfully',
      enrollment,
    });
  } catch (error) {
    console.error('Enrollment error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }

    return errorResponse('Internal server error', 500);
  }
});
