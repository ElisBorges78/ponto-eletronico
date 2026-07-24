import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const senha = body.senha;

    if (!senha) {
      return Response.json({ valid: false }, { status: 400 });
    }

    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    const valid = !!adminPassword && senha === adminPassword;

    return Response.json({ valid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});