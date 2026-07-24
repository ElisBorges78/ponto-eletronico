import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { gerarRelatorioHTML, nomeMesAno } from '../../shared/relatorioUtils.ts';

function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawMime(fromName, fromEmail, toEmail, subject, html) {
  const boundary = 'ponto_relatorio_' + Date.now();
  const hasNonAscii = /[^\x00-\x7F]/.test(subject);
  const encodedSubject = hasNonAscii
    ? `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`
    : subject;
  const htmlB64 = btoa(unescape(encodeURIComponent(html)));

  const lines = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `MIME-Version: 1.0`,
  ];
  if (fromEmail) {
    lines.push(`From: ${fromName ? `${fromName} ` : ''}<${fromEmail}>`);
  }
  lines.push(
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlB64,
    `--${boundary}--`,
    ``,
  );

  return toBase64Url(lines.join('\r\n'));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow direct invocation only by admins; scheduled workflow runs without a user.
    let isWorkflowCall = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
      }
      if (!user) isWorkflowCall = true;
    } catch {
      isWorkflowCall = true;
    }

    // Determine the reference month: previous month (default), or from request body.
    const now = new Date();
    let dataRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let body = {};
    try {
      body = await req.json();
      if (body.ano && body.mes) {
        dataRef = new Date(body.ano, body.mes - 1, 1);
      }
    } catch {
      // No JSON body (e.g. workflow invocation) — use default previous month.
    }

    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth(); // 0-indexed
    const mesStr = `${ano}-${(mes + 1).toString().padStart(2, '0')}`;

    // Fetch all RegistroPonto records for the target month (service role bypasses RLS).
    const todosRegistros = await base44.asServiceRole.entities.RegistroPonto.list('-data', 1000);
    const registrosMes = todosRegistros.filter((r) => {
      if (!r.data) return false;
      const parts = r.data.split('-');
      return parts[0] === ano.toString() && parts[1] === (mes + 1).toString().padStart(2, '0');
    });

    // Fetch professors for richer data.
    const professores = await base44.asServiceRole.entities.Professor.list();

    // Get admin users to send the report to.
    const usuarios = await base44.asServiceRole.entities.User.list();
    const adminEmails = usuarios
      .filter((u) => u.role === 'admin' && u.email)
      .map((u) => u.email);

    if (adminEmails.length === 0) {
      return Response.json({ error: 'Nenhum administrador encontrado para receber o relatório' }, { status: 400 });
    }

    // Generate the report HTML.
    const { html, nomeMes } = gerarRelatorioHTML(registrosMes, dataRef);

    // Get the Gmail OAuth access token (SHARED connector — builder's account).
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Resolve the sender's Gmail address.
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let senderEmail = '';
    if (profileRes.ok) {
      const profile = await profileRes.json();
      senderEmail = profile.emailAddress || '';
    }

    // Build and send the MIME message to each admin.
    const subject = `Relatório de Ponto - ${nomeMes}`;
    const results = [];

    for (const destinatario of adminEmails) {
      const raw = buildRawMime('Ponto Eletrônico', senderEmail, destinatario, subject, html);

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        results.push({ destinatario, success: false, error: errText });
      } else {
        results.push({ destinatario, success: true });
      }
    }

    return Response.json({
      success: true,
      mes: mesStr,
      nomeMes,
      totalRegistros: registrosMes.length,
      totalProfessores: professores.length,
      enviados: results,
      workflow: isWorkflowCall,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});