"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  getBalance,
  getTask,
  createTask,
  uploadFile,
  pollTask,
  TaskResult,
  TaskType,
} from "./tripo-client";
import type { ThreeViewerHandle, LLMAnimationData } from "./three-viewer";

const ThreeViewer = dynamic(() => import("./three-viewer"), { ssr: false });

// ── Tabs ──────────────────────────────────────────────────

const GENERATION_TABS = [
  { id: "text_to_model" as TaskType, label: "Text to 3D", icon: "T" },
  { id: "image_to_model" as TaskType, label: "Image to 3D", icon: "I" },
  { id: "multiview_to_model" as TaskType, label: "Multiview to 3D", icon: "M" },
] as const;

const POST_PROCESS_TABS = [
  { id: "refine_model" as TaskType, label: "Refine", icon: "R" },
  { id: "texture_model" as TaskType, label: "Retexture", icon: "X" },
  { id: "stylize_model" as TaskType, label: "Stylize", icon: "S" },
  { id: "animate_rig" as TaskType, label: "Rig", icon: "G" },
  { id: "animate_retarget" as TaskType, label: "Animate", icon: "A" },
  { id: "convert_model" as TaskType, label: "Convert", icon: "C" },
] as const;

// ── Animation presets with keywords for matching ─────────

const ANIM_PRESETS = [
  { value: "preset:idle", label: "Idle", keywords: ["idle", "stand", "still", "wait", "rest", "breathe", "stationary"] },
  { value: "preset:walk", label: "Walk", keywords: ["walk", "stroll", "pace", "move", "step", "wander", "patrol"] },
  { value: "preset:run", label: "Run", keywords: ["run", "sprint", "jog", "rush", "dash", "fast", "chase", "flee", "escape"] },
  { value: "preset:jump", label: "Jump", keywords: ["jump", "leap", "hop", "bounce", "vault"] },
  { value: "preset:climb", label: "Climb", keywords: ["climb", "scale", "ascend", "mount", "ladder"] },
  { value: "preset:turn", label: "Turn", keywords: ["turn", "rotate", "spin", "pivot", "look around"] },
  { value: "preset:fall", label: "Fall", keywords: ["fall", "drop", "tumble", "collapse", "trip", "stumble"] },
  { value: "preset:dive", label: "Dive", keywords: ["dive", "plunge", "swim", "underwater"] },
  { value: "preset:slash", label: "Slash", keywords: ["slash", "swing", "sword", "attack", "melee", "strike", "cut", "chop", "fight", "hit", "punch", "kick", "combat"] },
  { value: "preset:shoot", label: "Shoot", keywords: ["shoot", "fire", "gun", "aim", "bow", "arrow", "ranged", "blast"] },
  { value: "preset:hurt", label: "Hurt", keywords: ["hurt", "pain", "damage", "injured", "hit", "flinch", "stagger", "die", "death", "dead"] },
  { value: "preset:biped:afraid", label: "Afraid", keywords: ["afraid", "fear", "scared", "terrified", "horror", "shock", "surprise"] },
  { value: "preset:biped:agree", label: "Agree", keywords: ["agree", "nod", "yes", "approve", "accept", "okay"] },
  { value: "preset:biped:angry_01", label: "Angry", keywords: ["angry", "rage", "furious", "mad", "frustrat"] },
  { value: "preset:biped:clap", label: "Clap", keywords: ["clap", "applaud", "cheer", "bravo", "celebrate"] },
  { value: "preset:biped:dance_01", label: "Dance 1", keywords: ["dance", "groove", "party", "boogie", "move to music"] },
  { value: "preset:biped:dance_02", label: "Dance 2", keywords: ["dance"] },
  { value: "preset:biped:dance_03", label: "Dance 3", keywords: ["dance"] },
  { value: "preset:biped:excited_01", label: "Excited", keywords: ["excited", "happy", "joy", "thrilled", "pump", "fist"] },
  { value: "preset:biped:laugh_01", label: "Laugh", keywords: ["laugh", "giggle", "funny", "lol", "chuckle"] },
  { value: "preset:biped:sad_01", label: "Sad", keywords: ["sad", "cry", "weep", "depressed", "mourn", "grief", "sorrow"] },
  { value: "preset:biped:wave_goodbye_01", label: "Wave", keywords: ["wave", "goodbye", "hello", "greet", "hi", "bye", "farewell"] },
  { value: "preset:quadruped:walk", label: "Quadruped Walk", keywords: ["quadruped", "four legs", "dog", "cat", "horse", "animal walk"] },
  { value: "preset:avian:fly", label: "Avian Fly", keywords: ["fly", "bird", "wing", "soar", "glide", "avian"] },
  { value: "preset:serpentine:march", label: "Serpentine March", keywords: ["snake", "serpent", "slither", "crawl"] },
  { value: "preset:aquatic:march", label: "Aquatic March", keywords: ["swim", "fish", "aquatic", "water", "ocean"] },
] as const;

function matchAnimations(description: string, maxResults = 5): typeof ANIM_PRESETS[number][] {
  const words = description.toLowerCase().split(/\s+/);
  const scored = ANIM_PRESETS.map((preset) => {
    let score = 0;
    for (const word of words) {
      for (const kw of preset.keywords) {
        if (kw.includes(word) || word.includes(kw)) score++;
      }
    }
    return { preset, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.preset);
}

// ── Helpers ───────────────────────────────────────────────

function proxyUrl(url: string) {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}


// ── Main Page ─────────────────────────────────────────────

// ── Saved item type ──────────────────────────────────────

interface SavedItem {
  id: string;
  name: string;
  task: TaskResult;
  thumbnail?: string; // base64 data URL of rendered image (persists beyond URL expiry)
  savedAt: number;
}

// ── Task Result Panel with AI Animate ────────────────────

function TaskResultPanel({
  task,
  openaiKey,
  onPostProcess,
  onSave,
}: {
  task: TaskResult;
  openaiKey: string;
  onPostProcess: () => void;
  onSave: () => void;
}) {
  const viewerRef = useRef<ThreeViewerHandle>(null);
  const [bones, setBones] = useState<string[]>([]);
  const [aiAnimPrompt, setAiAnimPrompt] = useState("");
  const [aiAnimating, setAiAnimating] = useState(false);
  const [aiAnimError, setAiAnimError] = useState("");

  const handleAiAnimate = async () => {
    if (!aiAnimPrompt.trim() || !openaiKey || bones.length === 0) return;
    setAiAnimating(true);
    setAiAnimError("");

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: openaiKey,
          bones,
          description: aiAnimPrompt,
          duration: 2,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setAiAnimError(typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error));
        return;
      }

      if (data.animation && viewerRef.current) {
        viewerRef.current.applyAnimation(data.animation as LLMAnimationData);
      } else {
        setAiAnimError("No animation data returned");
      }
    } catch (err) {
      setAiAnimError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAiAnimating(false);
    }
  };

  const modelSrc = task.output?.pbr_model || task.output?.model || task.output?.base_model;
  // Only show 3D viewer for GLB/GLTF files (not FBX, OBJ, STL, etc.)
  const isViewable = modelSrc && (modelSrc.includes(".glb") || modelSrc.includes(".gltf"));

  return (
    <div className="p-5 space-y-4">
      {task.output?.rendered_image && (
        <img src={proxyUrl(task.output.rendered_image)} alt="Rendered" className="w-full rounded-lg" />
      )}

      {isViewable && (
        <ThreeViewer
          ref={viewerRef}
          src={modelSrc}
          onBonesLoaded={(b) => setBones(b)}
        />
      )}

      {modelSrc && !isViewable && (
        <div className="w-full h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <p className="text-xs text-zinc-500">Preview not available for this format — use download link below</p>
        </div>
      )}

      {/* AI Animate — only show if model has bones and OpenAI key is set */}
      {bones.length > 0 && openaiKey && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
          <label className="block text-xs text-zinc-400">AI Animate — describe what the character should do</label>
          <div className="flex gap-2">
            <input
              value={aiAnimPrompt}
              onChange={(e) => setAiAnimPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiAnimate()}
              placeholder="e.g. wave hello, do a jumping jack, look around nervously..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAiAnimate}
              disabled={aiAnimating || !aiAnimPrompt.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {aiAnimating ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Animating...
                </>
              ) : (
                "Animate"
              )}
            </button>
          </div>
          {aiAnimError && <p className="text-xs text-red-400">{aiAnimError}</p>}
          <p className="text-xs text-zinc-600">{bones.length} bones detected — GPT-5.4 will generate keyframes</p>
        </div>
      )}

      {/* Download links */}
      <div className="flex flex-wrap gap-2">
        {task.output?.model && (
          <a href={proxyUrl(task.output.model)} download className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            Download Model
          </a>
        )}
        {task.output?.pbr_model && (
          <a href={proxyUrl(task.output.pbr_model)} download className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            Download PBR
          </a>
        )}
        {task.output?.base_model && (
          <a href={proxyUrl(task.output.base_model)} download className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            Download Base
          </a>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onPostProcess} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Use for post-processing
        </button>
        <button onClick={onSave} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          Save to gallery
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [apiKey, setApiKey] = useState("");
  const [byteplusKey, setByteplusKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Generation state
  const [activeGenTab, setActiveGenTab] = useState<TaskType>("text_to_model");
  const [activePostTab, setActivePostTab] = useState<TaskType>("refine_model");

  // Text to model
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  // Image to model
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Multiview
  const [mvFiles, setMvFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [mvPreviews, setMvPreviews] = useState<(string | null)[]>([null, null, null, null]);

  // Post-processing
  const [refTaskId, setRefTaskId] = useState("");

  // Common options
  const [modelVersion, setModelVersion] = useState("v2.5-20250123");
  const [textureQuality, setTextureQuality] = useState("standard");
  const [style, setStyle] = useState("");
  const [outputFormat, setOutputFormat] = useState("GLTF");

  // Animation
  const [animationUrl, setAnimationUrl] = useState("preset:idle");
  const [animateInPlace, setAnimateInPlace] = useState(false);
  const [animOutFormat, setAnimOutFormat] = useState("glb");
  const [animDescription, setAnimDescription] = useState("");
  const [animSequence, setAnimSequence] = useState<string[]>([]);
  const [animMode, setAnimMode] = useState<"describe" | "pick">("describe");
  const [aiMapping, setAiMapping] = useState(false);

  // Task tracking
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState(0);

  // Saved gallery
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  // ── Load API key & saved items from localStorage ──────

  useEffect(() => {
    const storedKey = localStorage.getItem("tripo_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      setKeySet(true);
      // fetch balance
      getBalance(storedKey).then((res) => {
        if (res.code === 0) setBalance(res.data.balance);
      }).catch(() => {});
    }
    const storedSaved = localStorage.getItem("tripo_saved");
    if (storedSaved) {
      try { setSaved(JSON.parse(storedSaved)); } catch { /* ignore */ }
    }
    const storedByteplus = localStorage.getItem("byteplus_api_key");
    if (storedByteplus) setByteplusKey(storedByteplus);
    const storedOpenai = localStorage.getItem("openai_api_key");
    if (storedOpenai) setOpenaiKey(storedOpenai);
  }, []);

  // ── Persist saved items ───────────────────────────────

  const updateSaved = useCallback((items: SavedItem[]) => {
    setSaved(items);
    localStorage.setItem("tripo_saved", JSON.stringify(items));
  }, []);

  const saveTask = useCallback(async (task: TaskResult, name?: string) => {
    // Download rendered image as base64 so it survives URL expiry
    let thumbnail: string | undefined;
    if (task.output?.rendered_image) {
      try {
        const res = await fetch(proxyUrl(task.output.rendered_image));
        const blob = await res.blob();
        thumbnail = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* thumbnail is optional */ }
    }

    const item: SavedItem = {
      id: task.task_id + "-" + Date.now(),
      name: name || task.type.replace(/_/g, " ") + " " + task.task_id.slice(0, 6),
      task,
      thumbnail,
      savedAt: Date.now(),
    };
    updateSaved([item, ...saved]);
  }, [saved, updateSaved]);

  const removeSaved = useCallback((id: string) => {
    updateSaved(saved.filter((s) => s.id !== id));
  }, [saved, updateSaved]);

  const loadSavedItem = useCallback(async (item: SavedItem) => {
    setShowGallery(false);
    setLoading(true);
    setStatusMsg("Loading saved model...");
    try {
      const res = await getTask(apiKey, item.task.task_id);
      if (res.code === 0 && res.data) {
        // Put it at the top of the results with fresh URLs
        setTasks((prev) => [res.data, ...prev.filter((t) => t.task_id !== item.task.task_id)]);
        setStatusMsg("Loaded!");
        // Also update saved item with fresh URLs
        const updated = saved.map((s) =>
          s.id === item.id ? { ...s, task: res.data } : s
        );
        updateSaved(updated);
      } else {
        setStatusMsg(`Error: ${res.message || "Could not load task"}`);
      }
    } catch {
      setStatusMsg("Failed to refresh task data");
    } finally {
      setLoading(false);
    }
  }, [apiKey, saved, updateSaved]);

  // ── API Key & Balance ─────────────────────────────────

  const handleSetKey = useCallback(async () => {
    if (!apiKey.trim()) return;
    setKeySet(true);
    localStorage.setItem("tripo_api_key", apiKey.trim());
    try {
      const res = await getBalance(apiKey);
      if (res.code === 0) setBalance(res.data.balance);
    } catch {
      // balance fetch is best-effort
    }
  }, [apiKey]);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await getBalance(apiKey);
      if (res.code === 0) setBalance(res.data.balance);
    } catch {
      // silent
    }
  }, [apiKey]);

  // ── Submit Generation Task ────────────────────────────

  const submitTask = useCallback(async () => {
    setLoading(true);
    setStatusMsg("Submitting task...");

    try {
      let taskBody: Record<string, unknown> = { type: activeGenTab };

      if (activeGenTab === "text_to_model") {
        if (!prompt.trim()) { setStatusMsg("Please enter a prompt"); setLoading(false); return; }
        taskBody = {
          ...taskBody,
          prompt: prompt.trim(),
          ...(negativePrompt.trim() && { negative_prompt: negativePrompt.trim() }),
          model_version: modelVersion,
          ...(textureQuality !== "standard" && { texture_quality: textureQuality }),
          ...(style && { style }),
        };
      } else if (activeGenTab === "image_to_model") {
        if (!imageFile) { setStatusMsg("Please upload an image"); setLoading(false); return; }
        setStatusMsg("Uploading image...");
        const token = await uploadFile(apiKey, imageFile);
        if (!token) { setStatusMsg("Upload failed"); setLoading(false); return; }
        const ext = imageFile.name.split(".").pop() || "png";
        taskBody = {
          ...taskBody,
          file: { type: ext, file_token: token },
          model_version: modelVersion,
          ...(textureQuality !== "standard" && { texture_quality: textureQuality }),
          ...(style && { style }),
        };
      } else if (activeGenTab === "multiview_to_model") {
        setStatusMsg("Uploading images...");
        const files: Record<string, string>[] = [];
        for (const f of mvFiles) {
          if (f) {
            const token = await uploadFile(apiKey, f);
            const ext = f.name.split(".").pop() || "png";
            files.push({ type: ext, file_token: token });
          } else {
            files.push({});
          }
        }
        taskBody = {
          ...taskBody,
          files,
          model_version: modelVersion,
        };
      }

      setStatusMsg("Creating task...");
      const res = await createTask(apiKey, taskBody);

      if (res.code !== 0) {
        setStatusMsg(`Error: ${res.message || JSON.stringify(res)}`);
        setLoading(false);
        return;
      }

      const taskId = res.data.task_id;
      setStatusMsg(`Task ${taskId} submitted. Polling...`);

      setProgress(0);
      const result = await pollTask(apiKey, taskId, (t) => {
        const pct = t.progress ?? 0;
        setProgress(pct);
        setStatusMsg(`Status: ${t.status} | Progress: ${pct}%`);
      });

      setTasks((prev) => [result, ...prev]);
      setStatusMsg(result.status === "success" ? "Done!" : `Task ${result.status}`);
      setProgress(0);
      refreshBalance();
    } catch (err) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeGenTab, prompt, negativePrompt, imageFile, mvFiles, modelVersion, textureQuality, style, apiKey, refreshBalance]);

  // ── Submit Post-Process Task ──────────────────────────

  const submitPostProcess = useCallback(async () => {
    if (!refTaskId.trim()) { setStatusMsg("Enter an original task ID"); return; }
    setLoading(true);
    setStatusMsg("Submitting post-process task...");

    try {
      // refine_model uses draft_model_task_id, everything else uses original_model_task_id
      const idKey = activePostTab === "refine_model" ? "draft_model_task_id" : "original_model_task_id";
      const taskBody: Record<string, unknown> = {
        type: activePostTab,
        [idKey]: refTaskId,
      };

      if (activePostTab === "convert_model") {
        taskBody.format = outputFormat;
      }
      if (activePostTab === "animate_retarget") {
        if (animSequence.length > 1) {
          taskBody.animations = animSequence;
        } else if (animSequence.length === 1) {
          taskBody.animation = animSequence[0];
        } else {
          taskBody.animation = animationUrl || "preset:idle";
        }
        taskBody.out_format = animOutFormat;
        if (animateInPlace) taskBody.animate_in_place = true;
      }

      const res = await createTask(apiKey, taskBody);

      if (res.code !== 0) {
        setStatusMsg(`Error: ${res.message || JSON.stringify(res)}`);
        setLoading(false);
        return;
      }

      const taskId = res.data.task_id;
      setStatusMsg(`Task ${taskId} submitted. Polling...`);

      setProgress(0);
      const result = await pollTask(apiKey, taskId, (t) => {
        const pct = t.progress ?? 0;
        setProgress(pct);
        setStatusMsg(`Status: ${t.status} | Progress: ${pct}%`);
      });

      setTasks((prev) => [result, ...prev]);
      setStatusMsg(result.status === "success" ? "Done!" : `Task ${result.status}`);
      setProgress(0);
      refreshBalance();
    } catch (err) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activePostTab, refTaskId, outputFormat, animationUrl, apiKey, refreshBalance]);

  // ── Image handlers ────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };

  const handleMvSelect = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setMvFiles((prev) => { const n = [...prev]; n[index] = f; return n; });
      setMvPreviews((prev) => { const n = [...prev]; n[index] = URL.createObjectURL(f); return n; });
    }
  };

  // ── Render ────────────────────────────────────────────

  if (!keySet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Tripo3D Dashboard</h1>
            <p className="text-zinc-400">Enter your API key to get started</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Tripo3D API Key (required)</label>
              <input
                type="password"
                placeholder="tsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetKey()}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">OpenAI API Key (optional — enables AI animation on 3D models)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">BytePlus API Key (optional — AI preset matching)</label>
              <input
                type="password"
                placeholder="ark-..."
                value={byteplusKey}
                onChange={(e) => setByteplusKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                if (openaiKey.trim()) localStorage.setItem("openai_api_key", openaiKey.trim());
                if (byteplusKey.trim()) localStorage.setItem("byteplus_api_key", byteplusKey.trim());
                handleSetKey();
              }}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tripo3D Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          {balance !== null && (
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
              Balance: <span className="text-indigo-400 font-medium">{balance}</span> credits
            </span>
          )}
          <button onClick={() => { setShowGallery(!showGallery); }} className={`text-sm font-medium transition-colors ${showGallery ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"}`}>
            Saved ({saved.length})
          </button>
          <button onClick={() => { setKeySet(false); setApiKey(""); localStorage.removeItem("tripo_api_key"); }} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Disconnect
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Controls */}
        <div className="space-y-6">

          {/* ── Generation Section ────────────────── */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-lg">Generate 3D Model</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {GENERATION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGenTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeGenTab === tab.id
                      ? "text-indigo-400 border-b-2 border-indigo-400 bg-zinc-800/50"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* Text to Model */}
              {activeGenTab === "text_to_model" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-zinc-400">Prompt</label>
                      <span className={`text-xs ${prompt.length > 1024 ? "text-red-400 font-medium" : "text-zinc-500"}`}>
                        {prompt.length}/1024
                      </span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="A majestic dragon with golden scales..."
                      rows={3}
                      maxLength={1024}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    {prompt.length > 900 && (
                      <p className="text-xs text-amber-400 mt-1">Tripo limits prompts to 1024 characters. Keep it concise for best results.</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-zinc-400">Negative Prompt (optional)</label>
                      <span className={`text-xs ${negativePrompt.length > 255 ? "text-red-400 font-medium" : "text-zinc-500"}`}>
                        {negativePrompt.length}/255
                      </span>
                    </div>
                    <input
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="low quality, blurry..."
                      maxLength={255}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Image to Model */}
              {activeGenTab === "image_to_model" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Upload Image</label>
                  <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 cursor-pointer hover:border-indigo-500/50 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <p className="text-zinc-400 text-sm">Click to upload</p>
                        <p className="text-zinc-500 text-xs mt-1">JPG, PNG, WEBP</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              )}

              {/* Multiview to Model */}
              {activeGenTab === "multiview_to_model" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Upload Views (Front, Right, Back, Left)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Front", "Right", "Back", "Left"].map((lbl, i) => (
                      <label
                        key={lbl}
                        className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 cursor-pointer hover:border-indigo-500/50 transition-colors overflow-hidden text-xs"
                      >
                        {mvPreviews[i] ? (
                          <img src={mvPreviews[i]!} alt={lbl} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-zinc-500">{lbl}</span>
                        )}
                        <input type="file" accept="image/*" onChange={handleMvSelect(i)} className="hidden" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Common options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Model Version</label>
                  <select
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="v2.5-20250123">v2.5 (Default)</option>
                    <option value="v2.0-20240919">v2.0</option>
                    <option value="v1.4-20240625">v1.4</option>
                    <option value="Turbo-v1.0-20250506">Turbo v1.0</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Texture Quality</label>
                  <select
                    value={textureQuality}
                    onChange={(e) => setTextureQuality(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Style (optional)</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  <option value="person:person2cartoon">Person to Cartoon</option>
                  <option value="animal:venom">Animal Venom</option>
                  <option value="object:clay">Clay</option>
                  <option value="object:steampunk">Steampunk</option>
                  <option value="object:christmas">Christmas</option>
                  <option value="object:barbie">Barbie</option>
                </select>
              </div>

              <button
                onClick={submitTask}
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Processing..." : "Generate"}
              </button>
            </div>
          </section>

          {/* ── Post-Processing Section ────────────── */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-lg">Post-Processing</h2>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap border-b border-zinc-800">
              {POST_PROCESS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePostTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activePostTab === tab.id
                      ? "text-indigo-400 border-b-2 border-indigo-400 bg-zinc-800/50"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Original Model Task ID</label>
                <input
                  value={refTaskId}
                  onChange={(e) => setRefTaskId(e.target.value)}
                  placeholder="Paste a task ID from a completed generation..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {activePostTab === "convert_model" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Output Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GLTF">GLTF</option>
                    <option value="GLB">GLB</option>
                    <option value="FBX">FBX</option>
                    <option value="OBJ">OBJ</option>
                    <option value="STL">STL</option>
                    <option value="USDZ">USDZ</option>
                  </select>
                </div>
              )}

              {activePostTab === "animate_retarget" && (
                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => setAnimMode("describe")}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${animMode === "describe" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                    >
                      Describe what to do
                    </button>
                    <button
                      onClick={() => setAnimMode("pick")}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${animMode === "pick" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                    >
                      Pick presets
                    </button>
                  </div>

                  {animMode === "describe" ? (
                    <>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Describe what the character should do</label>
                        <textarea
                          value={animDescription}
                          onChange={(e) => setAnimDescription(e.target.value)}
                          placeholder="e.g. walk cautiously, then draw sword and slash twice, look around afraid, then run away"
                          rows={3}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      {/* AI mapping button */}
                      {byteplusKey ? (
                        <button
                          onClick={async () => {
                            if (!animDescription.trim()) return;
                            setAiMapping(true);
                            try {
                              const res = await fetch("/api/byteplus", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "map_animation",
                                  apiKey: byteplusKey,
                                  description: animDescription,
                                  presets: ANIM_PRESETS.map((p) => p.value),
                                }),
                              });
                              const data = await res.json();
                              if (data.presets?.length > 0) {
                                setAnimSequence(data.presets);
                              } else {
                                // Fallback to keyword matching
                                const matches = matchAnimations(animDescription);
                                setAnimSequence(matches.map((m) => m.value));
                              }
                            } catch {
                              const matches = matchAnimations(animDescription);
                              setAnimSequence(matches.map((m) => m.value));
                            } finally {
                              setAiMapping(false);
                            }
                          }}
                          disabled={aiMapping || !animDescription.trim()}
                          className="w-full rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {aiMapping ? (
                            <>
                              <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              AI is picking animations...
                            </>
                          ) : (
                            "Let AI pick the best animations"
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const matches = matchAnimations(animDescription);
                            setAnimSequence(matches.map((m) => m.value));
                          }}
                          disabled={!animDescription.trim()}
                          className="w-full rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                        >
                          Match to presets (add BytePlus key for AI matching)
                        </button>
                      )}

                      {/* Matched sequence */}
                      {animSequence.length > 0 && (
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1.5">
                            Animation sequence ({animSequence.length}/5):
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {animSequence.map((preset, i) => {
                              const info = ANIM_PRESETS.find((p) => p.value === preset);
                              return (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300">
                                  <span className="text-zinc-500">{i + 1}.</span> {info?.label || preset}
                                  <button
                                    onClick={() => setAnimSequence((s) => s.filter((_, j) => j !== i))}
                                    className="ml-0.5 text-indigo-400 hover:text-red-400"
                                  >
                                    &times;
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Explain the flow */}
                      {animSequence.length > 0 && (
                        <p className="text-xs text-emerald-400">Hit &quot;Run Animate&quot; below to apply this sequence to your rigged 3D model.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Pick a preset (or build a sequence)</label>
                        <select
                          value={animationUrl}
                          onChange={(e) => setAnimationUrl(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <optgroup label="Movement">
                            {ANIM_PRESETS.filter((p) => ["Idle","Walk","Run","Jump","Climb","Turn","Fall","Dive"].includes(p.label)).map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Combat">
                            {ANIM_PRESETS.filter((p) => ["Slash","Shoot","Hurt"].includes(p.label)).map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Expressions">
                            {ANIM_PRESETS.filter((p) => ["Afraid","Agree","Angry","Clap","Dance 1","Dance 2","Dance 3","Excited","Laugh","Sad","Wave"].includes(p.label)).map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Non-Biped">
                            {ANIM_PRESETS.filter((p) => p.value.includes("quadruped") || p.value.includes("avian") || p.value.includes("serpentine") || p.value.includes("aquatic")).map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                        </select>
                        <button
                          onClick={() => {
                            if (animSequence.length < 5 && !animSequence.includes(animationUrl)) {
                              setAnimSequence((s) => [...s, animationUrl]);
                            }
                          }}
                          disabled={animSequence.length >= 5}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600 transition-colors"
                        >
                          + Add to sequence ({animSequence.length}/5)
                        </button>
                      </div>

                      {/* Sequence chips */}
                      {animSequence.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {animSequence.map((preset, i) => {
                            const info = ANIM_PRESETS.find((p) => p.value === preset);
                            return (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300">
                                <span className="text-zinc-500">{i + 1}.</span> {info?.label || preset}
                                <button
                                  onClick={() => setAnimSequence((s) => s.filter((_, j) => j !== i))}
                                  className="ml-0.5 text-indigo-400 hover:text-red-400"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                          <button
                            onClick={() => setAnimSequence([])}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Options row */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animateInPlace}
                        onChange={(e) => setAnimateInPlace(e.target.checked)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      Animate in place
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400">Format:</label>
                      <select
                        value={animOutFormat}
                        onChange={(e) => setAnimOutFormat(e.target.value)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="glb">GLB</option>
                        <option value="fbx">FBX</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-zinc-500 space-y-1">
                {activePostTab === "refine_model" && (
                  <p className="text-amber-400">Refine only works with v1.4 draft models. v2.0+ models are already high quality and don&apos;t support refinement.</p>
                )}
                {activePostTab === "texture_model" && <p>Regenerates textures on an existing model.</p>}
                {activePostTab === "stylize_model" && <p>Applies an artistic style to a model.</p>}
                {activePostTab === "animate_rig" && (
                  <p>Automatically rigs a model for animation. <span className="text-amber-400">Run this first before using Animate.</span></p>
                )}
                {activePostTab === "animate_retarget" && (
                  <p className="text-amber-400">Requires a <strong>rigged</strong> model. Use the task ID from a completed Rig task, not a generation task.</p>
                )}
                {activePostTab === "convert_model" && <p>Converts the model to a different format.</p>}
              </div>

              <button
                onClick={submitPostProcess}
                disabled={loading}
                className="w-full rounded-lg bg-zinc-700 px-4 py-3 font-medium text-white hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Processing..." : `Run ${POST_PROCESS_TABS.find((t) => t.id === activePostTab)?.label}`}
              </button>
            </div>
          </section>
        </div>

        {/* Right column: Status + Results */}
        <div className="space-y-6">
          {/* Status */}
          {statusMsg && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                {loading && (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                )}
                <p className="text-sm text-zinc-300">{statusMsg}</p>
              </div>
              {loading && progress > 0 && (
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Task Results */}
          {tasks.length === 0 && !statusMsg && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-16 text-center">
              <p className="text-zinc-500 text-lg">No tasks yet</p>
              <p className="text-zinc-600 text-sm mt-1">Generate a 3D model to see results here</p>
            </div>
          )}

          {tasks.map((task, i) => (
            <div key={task.task_id + i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    task.status === "success" ? "bg-green-500" : task.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                  }`} />
                  <span className="text-sm font-medium">{task.type.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(task.task_id); }}
                    title="Copy task ID"
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
                  >
                    {task.task_id.slice(0, 8)}...
                  </button>
                </div>
              </div>

              {task.status === "success" && task.output && (
                <TaskResultPanel
                  task={task}
                  openaiKey={openaiKey}
                  onPostProcess={() => setRefTaskId(task.task_id)}
                  onSave={() => saveTask(task)}
                />
              )}

              {task.status === "failed" && (
                <div className="px-5 py-4">
                  <p className="text-sm text-red-400">Task failed</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Saved Gallery Overlay ──────────────────────── */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden mb-16">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Saved Models ({saved.length})</h2>
              <button onClick={() => setShowGallery(false)} className="text-zinc-400 hover:text-zinc-200 text-xl leading-none">&times;</button>
            </div>

            {saved.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-zinc-500">No saved models yet</p>
                <p className="text-zinc-600 text-sm mt-1">Click &quot;Save to gallery&quot; on any completed task</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {saved.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                    {/* Thumbnail — persisted base64, falls back to proxied URL */}
                    {(item.thumbnail || item.task.output?.rendered_image) && (
                      <img
                        src={item.thumbnail || proxyUrl(item.task.output!.rendered_image!)}
                        alt={item.name}
                        className="w-full h-48 object-contain bg-zinc-900"
                      />
                    )}

                    {/* Placeholder if no image at all */}
                    {!item.thumbnail && !item.task.output?.rendered_image && (
                      <div className="w-full h-48 bg-zinc-900 flex items-center justify-center">
                        <span className="text-zinc-600 text-3xl">3D</span>
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <span className="text-xs text-zinc-500">{new Date(item.savedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">{item.task.task_id}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => loadSavedItem(item)}
                          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => { setRefTaskId(item.task.task_id); setShowGallery(false); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Post-process
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await getTask(apiKey, item.task.task_id);
                              if (res.code === 0 && res.data) {
                                const updated = saved.map((s) =>
                                  s.id === item.id ? { ...s, task: res.data } : s
                                );
                                updateSaved(updated);
                                const model = res.data.output?.pbr_model || res.data.output?.model;
                                if (model) window.open(proxyUrl(model), "_blank");
                              }
                            } catch { /* silent */ }
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => removeSaved(item.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
