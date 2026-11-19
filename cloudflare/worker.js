const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });
const randomHex = (n) => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const sha256 = async (value) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const value = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `GL-${value.slice(0, 4)}-${value.slice(4)}`;
};
const unauthorized = () => json({ error: 'No autorizado.' }, 401);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === '/api/health' && request.method === 'GET') {
        return json({ ok: true, service: 'GastosLAB access' });
      }

      if (path === '/api/activate' && request.method === 'POST') {
        const body = await request.json();
        const inviteCode = String(body.code || '').trim().toUpperCase();
        if (!/^GL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(inviteCode)) {
          return json({ error: 'Código no válido o ya utilizado.' }, 400);
        }
        const invite = await env.DB.prepare(
          'SELECT id, expires_at FROM invites WHERE code_hash = ? AND used_at IS NULL AND revoked_at IS NULL'
        ).bind(await sha256(inviteCode)).first();
        if (!invite || (invite.expires_at && invite.expires_at <= new Date().toISOString())) {
          return json({ error: 'Código no válido, caducado o ya utilizado.' }, 403);
        }
        const token = randomHex(32);
        const deviceId = randomHex(12);
        const now = new Date().toISOString();
        const claim = await env.DB.prepare(
          'UPDATE invites SET used_at = ?, used_by_device = ? WHERE id = ? AND used_at IS NULL AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)'
        ).bind(now, deviceId, invite.id, now).run();
        if (!claim.meta || claim.meta.changes !== 1) {
          return json({ error: 'Este código ya se ha utilizado o ha caducado.' }, 409);
        }
        const label = String(body.label || 'Dispositivo autorizado').slice(0, 80);
        await env.DB.prepare(
          'INSERT INTO devices (id, token_hash, device_name, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(deviceId, await sha256(token), label, now, now).run();
        return json({ token, deviceId });
      }

      if (path === '/api/validate' && request.method === 'POST') {
        const body = await request.json();
        const token = String(body.token || '');
        if (!token || token.length > 256) return json({ valid: false }, 401);
        const row = await env.DB.prepare(
          'SELECT id FROM devices WHERE token_hash = ? AND revoked_at IS NULL'
        ).bind(await sha256(token)).first();
        if (!row) return json({ valid: false }, 401);
        await env.DB.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?')
          .bind(new Date().toISOString(), row.id).run();
        return json({ valid: true });
      }

      if (path.startsWith('/api/admin/')) {
        const authorization = request.headers.get('Authorization') || '';
        const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
        if (!env.ADMIN_KEY || supplied.length !== env.ADMIN_KEY.length || supplied !== env.ADMIN_KEY) {
          return unauthorized();
        }

        if (path === '/api/admin/invites' && request.method === 'POST') {
          const inviteCode = makeCode();
          const id = randomHex(12);
          const now = new Date().toISOString();
          await env.DB.prepare(
            'INSERT INTO invites (id, code_hash, created_at) VALUES (?, ?, ?)'
          ).bind(id, await sha256(inviteCode), now).run();
          return json({ id, code: inviteCode, created_at: now });
        }

        if (path === '/api/admin/invites' && request.method === 'GET') {
          const result = await env.DB.prepare(
            'SELECT id, created_at, expires_at, used_at, used_by_device, revoked_at FROM invites ORDER BY created_at DESC LIMIT 100'
          ).all();
          return json({ invites: result.results || [] });
        }

        if (path === '/api/admin/devices' && request.method === 'GET') {
          const result = await env.DB.prepare(
            'SELECT id, device_name, created_at, last_seen_at, revoked_at FROM devices ORDER BY created_at DESC LIMIT 100'
          ).all();
          return json({ devices: result.results || [] });
        }

        const revokeInvite = path.match(/^\/api\/admin\/invites\/([a-f0-9]+)\/revoke$/);
        if (revokeInvite && request.method === 'POST') {
          await env.DB.prepare('UPDATE invites SET revoked_at = ? WHERE id = ? AND used_at IS NULL')
            .bind(new Date().toISOString(), revokeInvite[1]).run();
          return json({ ok: true });
        }

        const revokeDevice = path.match(/^\/api\/admin\/devices\/([a-f0-9]+)\/revoke$/);
        if (revokeDevice && request.method === 'POST') {
          await env.DB.prepare('UPDATE devices SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
            .bind(new Date().toISOString(), revokeDevice[1]).run();
          return json({ ok: true });
        }
      }
      return json({ error: 'Ruta no encontrada.' }, 404);
    } catch (error) {
      console.error('GastosLAB access error:', error);
      return json({ error: 'Error interno del servicio. Comprueba el binding D1 y las columnas de la base de datos.' }, 500);
    }
  },
};
