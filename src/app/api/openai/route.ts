import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, bones, description, duration = 2 } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key required" }, { status: 400 });
  }

  const prompt = `You are an expert 3D character animator. Generate keyframe animation data for a humanoid skeleton.

The character should: "${description}"

Available bones in this skeleton:
${(bones as string[]).join(", ")}

Generate a ${duration}-second looping animation at 10 FPS (${duration * 10} keyframes).

RULES:
- Output ONLY valid JSON, nothing else — no markdown, no explanation
- Use Euler angles in RADIANS for rotations (x, y, z)
- Keep values physically realistic:
  - Arms swing ±0.3-0.6 rad for walking
  - Legs swing ±0.5-0.8 rad for walking
  - Spine tilts are subtle, ±0.05-0.15 rad
  - Head turns ±0.3-0.5 rad
- Make the animation smooth — values should interpolate naturally between keyframes
- Only animate bones that need to move for this action
- For locomotion, make it loop seamlessly (first and last keyframe should match)
- Match bone names EXACTLY as provided

JSON format:
{
  "duration": ${duration},
  "tracks": [
    {
      "bone": "ExactBoneName",
      "type": "rotation",
      "times": [0, 0.1, 0.2, ...],
      "values": [
        [x, y, z],
        [x, y, z],
        ...
      ]
    }
  ]
}

Each "values" entry is [x, y, z] Euler rotation in radians. Only use "position" type for root movement.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const text = await res.text();
    process.stdout.write(`[openai] ${res.status}: ${text.slice(0, 300)}\n`);

    if (!res.ok) {
      return NextResponse.json({ error: `OpenAI ${res.status}: ${text.slice(0, 200)}` });
    }

    const json = JSON.parse(text);
    const content = json.choices?.[0]?.message?.content || "";

    // Extract JSON from response (might be in code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No valid JSON in response", raw: content.slice(0, 500) });
    }

    const animation = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ animation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    process.stderr.write(`[openai] error: ${msg}\n`);
    return NextResponse.json({ error: msg });
  }
}
