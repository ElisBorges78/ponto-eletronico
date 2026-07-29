import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { hashPassword, verifyPassword } from '../../shared/passwordUtils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { senhaAtual, novaSenha } = body;

    if (!senhaAtual || !novaSenha) {
      return Response.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (novaSenha.length < 4) {
      return Response.json(
        { error: 'A nova senha deve ter pelo menos 4 caracteres' },
        { status: 400 }
      );
    }

    let storedPassword: string | null = null;
    let configId: string | null = null;
    try {
      const configs = await base44.asServiceRole.entities.Configuracao.list();
      if (configs.length > 0) {
        storedPassword = configs[0].senha_admin || null;
        configId = configs[0].id;
      }
    } catch {
      // Entity might not have records yet
    }

    if (!storedPassword) {
      storedPassword = Deno.env.get('ADMIN_PASSWORD') || null;
    }

    if (!(await verifyPassword(senhaAtual, storedPassword))) {
      return Response.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(novaSenha);

    if (configId) {
      await base44.asServiceRole.entities.Configuracao.update(configId, {
        senha_admin: hashedPassword,
      });
    } else {
      await base44.asServiceRole.entities.Configuracao.create({
        senha_admin: hashedPassword,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});