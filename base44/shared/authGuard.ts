/**
 * Authorizes a backend function call.
 *
 * Allows:
 *   1. Authenticated admin users (direct HTTP call from admin dashboard)
 *   2. Internal workflow invocations (service-level auth, no user)
 *
 * Rejects:
 *   - Anonymous requests (no auth token at all)
 *   - Authenticated non-admin users
 *
 * The key distinction between a workflow call and an anonymous attack is
 * `base44.auth.isAuthenticated()`: the platform's workflow engine includes
 * service-level auth when invoking functions, so isAuthenticated() returns
 * true for workflow calls but false for anonymous external requests.
 */
export async function authorizeAdminOrWorkflow(base44: any): Promise<{
  allowed: boolean;
  isWorkflowCall: boolean;
  response?: Response;
}> {
  const isAuth = await base44.auth.isAuthenticated();
  if (!isAuth) {
    return {
      allowed: false,
      isWorkflowCall: false,
      response: Response.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      ),
    };
  }

  let user: any = null;
  try {
    user = await base44.auth.me();
  } catch {
    // auth.me() throws when the request has service-level auth but no user
    // (e.g., internal workflow invocation) — expected for workflow calls.
  }

  if (user && user.role !== 'admin') {
    return {
      allowed: false,
      isWorkflowCall: false,
      response: Response.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, isWorkflowCall: !user };
}