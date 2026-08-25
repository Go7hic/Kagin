export class LicenseDO {
  state: DurableObjectState;
  env: Cloudflare.Env;

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      if (!(await this.state.storage.get("sessions"))) await this.state.storage.put("sessions", {});
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/heartbeat" && request.method === "POST") {
      const { seat_limit, heartbeat_timeout, now, session_id, machine_id } = await request.json() as {
        seat_limit: number; heartbeat_timeout: number; now: number; session_id: string; machine_id: string;
      };
      const sessions: Record<string, { machine_id: string; last_heartbeat: number }> =
        (await this.state.storage.get("sessions")) || {};
      for (const [sid, s] of Object.entries(sessions)) {
        if (now - s.last_heartbeat > heartbeat_timeout) delete sessions[sid];
      }
      if (!sessions[session_id]) {
        if (seat_limit && Object.keys(sessions).length >= seat_limit) {
          return Response.json({ error: "no_seats" }, { status: 429 });
        }
      }
      sessions[session_id] = { machine_id, last_heartbeat: now };
      await this.state.storage.put("sessions", sessions);
      return Response.json({
        ok: true,
        active_sessions: Object.entries(sessions).map(([sid, s]) => ({ session_id: sid, ...s })),
      });
    }
    if (url.pathname === "/admin/kick" && request.method === "POST") {
      const { session_id } = await request.json() as { session_id: string };
      const sessions: Record<string, { machine_id: string; last_heartbeat: number }> =
        (await this.state.storage.get("sessions")) || {};
      if (!sessions[session_id]) return Response.json({ error: "not_found" }, { status: 404 });
      delete sessions[session_id];
      await this.state.storage.put("sessions", sessions);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "not_found" }, { status: 404 });
  }
}

export function licenseDOId(env: { LicenseDO: DurableObjectNamespace }, licenseKey: string) {
  return env.LicenseDO.idFromName(licenseKey);
}
