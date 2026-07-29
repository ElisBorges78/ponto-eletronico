import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isGestor = !!user.tipo_gestor;
    const isAdmin = user.role === 'admin';
    if (!isGestor && !isAdmin) {
      return Response.json(
        { error: 'Apenas gestores ou administradores podem aprovar cadastros' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { professorId, acao } = body;

    if (!professorId || !acao) {
      return Response.json(
        { error: 'professorId e acao são obrigatórios' },
        { status: 400 }
      );
    }
    if (acao !== 'aprovar' && acao !== 'rejeitar') {
      return Response.json(
        { error: 'acao deve ser "aprovar" ou "rejeitar"' },
        { status: 400 }
      );
    }

    const aprovado = acao === 'aprovar';
    await base44.asServiceRole.entities.Professor.update(professorId, {
      status_aprovacao: aprovado ? 'aprovado' : 'rejeitado',
      ativo: aprovado,
      aprovado_por: user.email,
    });

    return Response.json({ success: true, status: aprovado ? 'aprovado' : 'rejeitado' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}