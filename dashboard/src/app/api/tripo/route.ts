import { NextRequest, NextResponse } from "next/server";

const TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi";
const TIMEOUT_MS = 30_000;

function authHeader(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}` };
}

function jsonHeaders(apiKey: string) {
  return { "Content-Type": "application/json", ...authHeader(apiKey) };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const { action, apiKey, ...body } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 400 });
  }

  try {
    switch (action) {
      case "create_task": {
        const payload = JSON.stringify(body.taskBody);
        process.stdout.write(`[tripo] create_task body: ${payload}\n`);
        const res = await fetchWithTimeout(`${TRIPO_BASE}/task`, {
          method: "POST",
          headers: jsonHeaders(apiKey),
          body: payload,
        });
        const json = await res.json();
        process.stdout.write(`[tripo] create_task response: ${JSON.stringify(json)}\n`);
        return NextResponse.json(json);
      }

      case "get_task": {
        const res = await fetchWithTimeout(`${TRIPO_BASE}/task/${body.taskId}`, {
          headers: authHeader(apiKey),
        });
        return NextResponse.json(await res.json());
      }

      case "get_balance": {
        const res = await fetchWithTimeout(`${TRIPO_BASE}/user/balance`, {
          headers: authHeader(apiKey),
        });
        const json = await res.json();
        process.stdout.write(`[tripo] balance: ${JSON.stringify(json)}\n`);
        return NextResponse.json(json);
      }

      case "upload": {
        const formData = new FormData();
        const fileBuffer = Buffer.from(body.fileBase64, "base64");
        const blob = new Blob([fileBuffer], { type: body.mimeType });
        formData.append("file", blob, body.fileName);

        process.stdout.write(`[tripo] uploading: ${body.fileName}\n`);
        const res = await fetchWithTimeout(`${TRIPO_BASE}/upload`, {
          method: "POST",
          headers: authHeader(apiKey),
          body: formData,
        });
        const json = await res.json();
        process.stdout.write(`[tripo] upload response: ${JSON.stringify(json)}\n`);
        return NextResponse.json(json);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    process.stderr.write(`[tripo] error: ${message}\n`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
