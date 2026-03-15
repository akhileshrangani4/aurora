import { NextRequest, NextResponse } from "next/server";

const ARK_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

async function arkFetch(url: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });

  const text = await res.text();
  process.stdout.write(`[byteplus] ${res.status} ${url.replace(ARK_BASE, "")}: ${text.slice(0, 500)}\n`);

  if (!text) return { error: `Empty response (HTTP ${res.status})` };
  try { return JSON.parse(text); } catch { return { error: `Invalid JSON (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
}

export async function POST(req: NextRequest) {
  const { action, apiKey, ...body } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "BytePlus API key required" }, { status: 400 });
  }

  try {
    switch (action) {
      case "map_animation": {
        const presetList = body.presets as string[];
        const prompt = `You are a 3D animation director. Pick the best matching animation presets from this list for the user's description. Return ONLY a JSON array of preset strings, 1-5 items, in chronological order.

Available presets:
${presetList.join("\n")}

User description: "${body.description}"

JSON array:`;

        const json = await arkFetch(`${ARK_BASE}/chat/completions`, apiKey, {
          method: "POST",
          body: JSON.stringify({
            model: "seed-2-0-lite-260228",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 200,
          }),
        });

        if (json.error) return NextResponse.json({ presets: [], error: json.error });

        const content = json.choices?.[0]?.message?.content || "[]";
        const match = content.match(/\[[\s\S]*?\]/);
        let presets: string[] = [];
        if (match) { try { presets = JSON.parse(match[0]); } catch { /* */ } }
        return NextResponse.json({ presets });
      }

      // Generate bone keyframe animation from text description
      case "generate_animation": {
        const bones = body.bones as string[];
        const description = body.description as string;
        const duration = body.duration || 2;

        const prompt = `You are a 3D character animator. Generate keyframe animation data for a humanoid skeleton.

The character should: "${description}"

Available bones in this skeleton:
${bones.join(", ")}

Generate a ${duration}-second animation at 10 FPS (${duration * 10} keyframes).

IMPORTANT RULES:
- Output ONLY valid JSON, no explanation
- Use Euler angles in RADIANS for rotations (x, y, z)
- Keep values realistic: arms swing ~0.5 rad, legs ~0.8 rad for walking
- A full walk cycle is ~1 second
- Only animate bones that need to move for this action
- Root bone position changes should be in the "position" track

Output this exact JSON format:
{
  "duration": ${duration},
  "tracks": [
    {
      "bone": "BoneName",
      "type": "rotation",
      "times": [0, 0.1, 0.2, ...],
      "values": [
        [0, 0, 0],
        [0.1, 0, 0],
        ...
      ]
    },
    {
      "bone": "BoneName",
      "type": "position",
      "times": [0, 0.1, 0.2, ...],
      "values": [
        [0, 0, 0],
        [0, 0, 0.01],
        ...
      ]
    }
  ]
}

Each "values" entry is [x, y, z] Euler rotation in radians or position offset.
Only output the JSON:`;

        const json = await arkFetch(`${ARK_BASE}/chat/completions`, apiKey, {
          method: "POST",
          body: JSON.stringify({
            model: "seed-2-0-lite-260228",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 16000,
          }),
        });

        if (json.error) return NextResponse.json({ error: json.error });

        const content = json.choices?.[0]?.message?.content || "";
        // Extract JSON from response (might be wrapped in markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return NextResponse.json({ error: "LLM did not return valid animation JSON" });
        }

        try {
          const animData = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ animation: animData });
        } catch {
          return NextResponse.json({ error: "Failed to parse animation JSON from LLM" });
        }
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    process.stderr.write(`[byteplus] error: ${message}\n`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
