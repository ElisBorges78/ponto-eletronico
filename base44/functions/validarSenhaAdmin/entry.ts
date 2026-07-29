import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const senha = body.senha;

    if (!senha) {
      return Response.json({ valid: false }, { status: 400 });
    }

    let storedPassword: string | null = null;
    try {
      const configs = await base44.asServiceRole.entities.Configuracao.list();
      if (configs.length > 0 && configs[0].senha_admin) {
        storedPassword = configs[0].senha_admin;
      }
    } catch {
      // Entity might not have records yet
    }

    if (!storedPassword) {
      storedPassword = Deno.env.get('ADMIN_PASSWORD') || null;
    }

    const valid = !!storedPassword && senha === storedPassword;

    return Response.json({ valid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});