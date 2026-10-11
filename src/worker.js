export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, service: "yakton-daily" }, {
        headers: { "Cache-Control": "no-store" }
      });
    }
    if (url.pathname === "/api/today") {
      const date = new Date().toISOString().slice(0, 10);
      return Response.json({ date, timezone: "UTC", algorithmVersion: 1 }, {
        headers: { "Cache-Control": "no-store" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
