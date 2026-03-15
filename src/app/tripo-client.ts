export type TaskType =
  | "text_to_model"
  | "image_to_model"
  | "multiview_to_model"
  | "refine_model"
  | "texture_model"
  | "animate_prerigcheck"
  | "animate_rig"
  | "animate_retarget"
  | "stylize_model"
  | "convert_model";

export interface TaskResult {
  task_id: string;
  type: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled" | "unknown" | "banned";
  input: Record<string, unknown>;
  output?: {
    model?: string;
    base_model?: string;
    pbr_model?: string;
    rendered_image?: string;
    generated_image?: string;
    riggable?: boolean;
  };
  progress?: number;
  create_time?: number;
}

async function tripoFetch(body: Record<string, unknown>) {
  const res = await fetch("/api/tripo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getBalance(apiKey: string) {
  return tripoFetch({ action: "get_balance", apiKey });
}

export async function getTask(apiKey: string, taskId: string) {
  return tripoFetch({ action: "get_task", apiKey, taskId });
}

export async function createTask(apiKey: string, taskBody: Record<string, unknown>) {
  return tripoFetch({ action: "create_task", apiKey, taskBody });
}

export async function uploadFile(apiKey: string, file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  const res = await tripoFetch({
    action: "upload",
    apiKey,
    fileBase64: base64,
    mimeType: file.type,
    fileName: file.name,
  });
  return res.data?.image_token || "";
}

export async function pollTask(
  apiKey: string,
  taskId: string,
  onProgress?: (task: TaskResult) => void,
  intervalMs = 3000
): Promise<TaskResult> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const res = await getTask(apiKey, taskId);
        const task: TaskResult = res.data;
        onProgress?.(task);

        if (task.status === "success" || task.status === "failed" || task.status === "cancelled" || task.status === "banned") {
          resolve(task);
        } else {
          setTimeout(poll, intervalMs);
        }
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
}
