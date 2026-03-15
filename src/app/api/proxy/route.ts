import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  // Basic validation — must be https
  if (!url.startsWith("https://")) {
    return NextResponse.json({ error: "Only HTTPS URLs" }, { status: 400 });
  }

  try {
    process.stdout.write(`[proxy] fetching: ${url.slice(0, 150)}\n`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      process.stdout.write(`[proxy] upstream ${res.status} for: ${url.slice(0, 100)}\n`);
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }

    let contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    // Fix content type for 3D model files — model-viewer needs correct MIME
    if (url.endsWith(".glb") || url.includes(".glb?")) {
      contentType = "model/gltf-binary";
    } else if (url.endsWith(".gltf") || url.includes(".gltf?")) {
      contentType = "model/gltf+json";
    } else if (url.endsWith(".fbx") || url.includes(".fbx?")) {
      contentType = "application/octet-stream";
    }

    process.stdout.write(`[proxy] OK ${(buffer.byteLength / 1024).toFixed(0)}KB ${contentType}\n`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    process.stderr.write(`[proxy] error: ${msg}\n`);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
