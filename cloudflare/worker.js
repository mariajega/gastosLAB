const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Content-Type': 'application/json; charset=utf-8' };
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:cors});
const random = n => { const b=new Uint8Array(n); crypto.getRandomValues(b); return [...b].map(x=>x.toString(16).padStart(2,'0')).join(''); };
const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const code = () => { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b=new Uint8Array(8); crypto.getRandomValues(b); const s=[...b].map(x=>chars[x%chars.length]).join(''); return `GL-${s.slice(0,4)}-${s.slice(4)}`; };
export default { async fetch(req, env) {
  if(req.method==='OPTIONS') return new Response(null,{headers:cors});
  const u=new URL(req.url), path=u.pathname;
  try {
    if(path==='/api/health') return json({ok:true,service:'GastosLAB access'});
    if(path==='/api/activate' && req.method==='POST') {
      const body=await req.json(), raw=String(body.code||'').trim().toUpperCase();
      if(!/^GL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(raw)) return json({error:'Código no válido o ya utilizado.'},400);
      const row=await env.DB.prepare('SELECT id,used_at,revoked FROM invites WHERE code_hash=?').bind(await hash(raw)).first();
      if(!row||row.used_at||row.revoked) return json({error:'Código no válido o ya utilizado.'},403);
      const token=random(32), deviceId=random(12), now=new Date().toISOString();
      const result=await env.DB.prepare('UPDATE invites SET used_at=? WHERE id=? AND used_at IS NULL AND revoked=0').bind(now,row.id).run();
      if(!result.meta.changes) return json({error:'Este código ya se ha utilizado.'},409);
      await env.DB.prepare('INSERT INTO devices(id,token_hash,label,created_at,last_seen) VALUES(?,?,?,?,?)').bind(deviceId,await hash(token),String(body.label||'Dispositivo autorizado').slice(0,80),now,now).run();
      return json({token,deviceId});
    }
    if(path==='/api/validate' && req.method==='POST') {
      const token=String((await req.json()).token||''); if(!token) return json({valid:false},401);
      const row=await env.DB.prepare('SELECT id FROM devices WHERE token_hash=? AND revoked=0').bind(await hash(token)).first();
      if(!row) return json({valid:false},401);
      await env.DB.prepare('UPDATE devices SET last_seen=? WHERE id=?').bind(new Date().toISOString(),row.id).run();
      return json({valid:true});
    }
    if(path.startsWith('/api/admin/')) {
      const auth=req.headers.get('Authorization')||'';
      if(!env.ADMIN_KEY || auth!==`Bearer ${env.ADMIN_KEY}`) return json({error:'No autorizado.'},401);
      if(path==='/api/admin/invites' && req.method==='POST') {
        const value=code(), id=random(12); await env.DB.prepare('INSERT INTO invites(id,code_hash,created_at) VALUES(?,?,?)').bind(id,await hash(value),new Date().toISOString()).run();
        return json({id,code:value});
      }
      if(path==='/api/admin/invites' && req.method==='GET') {
        const {results}=await env.DB.prepare('SELECT id,created_at,used_at,revoked FROM invites ORDER BY created_at DESC LIMIT 100').all(); return json({invites:results});
      }
      if(path==='/api/admin/devices' && req.method==='GET') {
        const {results}=await env.DB.prepare('SELECT id,label,created_at,last_seen,revoked FROM devices ORDER BY created_at DESC LIMIT 100').all(); return json({devices:results});
      }
      const revokeInvite=path.match(/^\/api\/admin\/invites\/([a-f0-9]+)\/revoke$/);
      if(revokeInvite && req.method==='POST') { await env.DB.prepare('UPDATE invites SET revoked=1 WHERE id=?').bind(revokeInvite[1]).run(); return json({ok:true}); }
      const revokeDevice=path.match(/^\/api\/admin\/devices\/([a-f0-9]+)\/revoke$/);
      if(revokeDevice && req.method==='POST') { await env.DB.prepare('UPDATE devices SET revoked=1 WHERE id=?').bind(revokeDevice[1]).run(); return json({ok:true}); }
    }
    return json({error:'Ruta no encontrada.'},404);
  } catch(e) { return json({error:'Error interno del servicio.'},500); }
} };
