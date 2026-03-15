"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Animation data format from LLM
export interface LLMAnimationData {
  duration: number;
  tracks: {
    bone: string;
    type: "rotation" | "position";
    times: number[];
    values: number[][];
  }[];
}

export interface ThreeViewerHandle {
  getBoneNames: () => string[];
  applyAnimation: (data: LLMAnimationData) => void;
}

interface Props {
  src: string;
  onBonesLoaded?: (bones: string[]) => void;
}

const ThreeViewer = forwardRef<ThreeViewerHandle, Props>(function ThreeViewer({ src, onBonesLoaded }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasAnimation, setHasAnimation] = useState(false);
  const [animPlaying, setAnimPlaying] = useState(true);
  const [animLabel, setAnimLabel] = useState("Animated");

  // Refs for scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boneNamesRef = useRef<string[]>([]);

  // Extract bone names from a model
  function extractBones(object: THREE.Object3D): string[] {
    const bones: string[] = [];
    object.traverse((child) => {
      if (child instanceof THREE.Bone) {
        bones.push(child.name);
      }
    });
    return bones;
  }

  // Build animation clip from LLM data
  function buildClip(data: LLMAnimationData, model: THREE.Object3D): THREE.AnimationClip | null {
    const tracks: THREE.KeyframeTrack[] = [];

    for (const track of data.tracks) {
      // Find the bone
      let bone: THREE.Object3D | undefined;
      model.traverse((child) => {
        if (child.name === track.bone) bone = child;
      });

      // Try fuzzy match if exact match fails
      if (!bone) {
        model.traverse((child) => {
          if (child instanceof THREE.Bone && child.name.toLowerCase().includes(track.bone.toLowerCase())) {
            bone = child;
          }
        });
      }

      if (!bone) continue;

      if (track.type === "rotation") {
        // Convert Euler [x,y,z] arrays to flat quaternion array
        const flatQuats: number[] = [];
        const euler = new THREE.Euler();
        const quat = new THREE.Quaternion();

        for (const v of track.values) {
          euler.set(v[0], v[1], v[2]);
          quat.setFromEuler(euler);
          flatQuats.push(quat.x, quat.y, quat.z, quat.w);
        }

        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${bone.name}.quaternion`,
            track.times,
            flatQuats
          )
        );
      } else if (track.type === "position") {
        const flatPositions: number[] = [];
        for (const v of track.values) {
          flatPositions.push(v[0], v[1], v[2]);
        }

        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${bone.name}.position`,
            track.times,
            flatPositions
          )
        );
      }
    }

    if (tracks.length === 0) return null;

    return new THREE.AnimationClip("LLM_Animation", data.duration, tracks);
  }

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getBoneNames: () => boneNamesRef.current,
    applyAnimation: (data: LLMAnimationData) => {
      const model = modelRef.current;
      if (!model) return;

      const clip = buildClip(data, model);
      if (!clip) return;

      // Stop existing animations
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;

      const action = mixer.clipAction(clip);
      action.play();
      actionsRef.current = [action];

      setHasAnimation(true);
      setAnimPlaying(true);
      setAnimLabel("AI Animated");

      if (gridRef.current) gridRef.current.visible = true;
      if (controlsRef.current) controlsRef.current.autoRotate = false;
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    setErrorMsg("");
    setHasAnimation(false);
    setAnimPlaying(true);
    setAnimLabel("Animated");
    mixerRef.current = null;
    actionsRef.current = [];
    clockRef.current = new THREE.Clock();
    boneNamesRef.current = [];

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 1, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    const grid = new THREE.GridHelper(10, 20, 0x333333, 0x222222);
    grid.visible = false;
    scene.add(grid);
    gridRef.current = grid;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controlsRef.current = controls;

    const loader = new GLTFLoader();
    const proxied = `/api/proxy?url=${encodeURIComponent(src)}`;

    loader.load(
      proxied,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        modelRef.current = model;

        // Center and fit
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        camera.position.set(0, size.y * 0.5, maxDim * 2);
        controls.target.set(0, 0, 0);
        controls.update();

        // Extract bones
        const bones = extractBones(model);
        boneNamesRef.current = bones;
        if (bones.length > 0) {
          onBonesLoaded?.(bones);
        }

        // Play existing animations
        if (gltf.animations && gltf.animations.length > 0) {
          setHasAnimation(true);
          controls.autoRotate = false;
          grid.visible = true;

          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const actions: THREE.AnimationAction[] = [];
          for (const clip of gltf.animations) {
            const action = mixer.clipAction(clip);
            action.play();
            actions.push(action);
          }
          actionsRef.current = actions;
        }

        setStatus("ready");
      },
      undefined,
      (err) => {
        console.error("GLTFLoader error:", err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    );

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const toggleAnimation = () => {
    for (const action of actionsRef.current) {
      action.paused = animPlaying;
    }
    setAnimPlaying(!animPlaying);
  };

  if (status === "error") {
    return (
      <div className="w-full h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <p className="text-xs text-zinc-500">3D preview failed{errorMsg ? `: ${errorMsg}` : ""}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {hasAnimation && status === "ready" && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          <button
            onClick={toggleAnimation}
            className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-xs font-medium text-white hover:bg-black/80 transition-colors"
          >
            {animPlaying ? "Pause" : "Play"}
          </button>
          <span className="px-2 py-1 rounded-lg bg-black/40 text-xs text-emerald-400">
            {animLabel}
          </span>
        </div>
      )}
    </div>
  );
});

export default ThreeViewer;
