// MMHC — Gravação de leads da Maya (Cloudflare Pages Function)
// Rota automática: /api/lead
// Grava no banco D1 e, se configurado, envia também para a planilha Google Sheets

export async function onRequestPost(context) {
  try {
    const { nome, email, whatsapp } = await context.request.json();

    if (!nome && !email && !whatsapp) {
      return json({ ok: false, erro: 'lead vazio' }, 400);
    }

    // 1. Gravar no banco D1
    await context.env.DB.prepare(
      'INSERT INTO leads (nome, email, whatsapp) VALUES (?, ?, ?)'
    ).bind(nome || '', email || '', whatsapp || '').run();

    // 2. (Opcional) Enviar também para a planilha Google Sheets
    const webhook = context.env.SHEETS_WEBHOOK;
    if (webhook) {
      context.waitUntil(
        fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, whatsapp, origem: 'Maya — mmhc-ia.com' })
        }).catch(() => {})
      );
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, erro: 'falha ao gravar' }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
