import type * as THREE from 'three';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { ThemeMode } from './theme';

export interface RoomDef {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: number[][];  // 0=floor, 1=wall, 2=door_trigger, 3=damaged_wall
  cameraCenter: { x: number; y: number };
  cameraZoom: number;
  doors: DoorDef[];
  interactables: InteractableDef[];
  spawnPoint?: { x: number; y: number };
}

export interface DoorDef {
  tileX: number;
  tileY: number;
  leadsTo: string;
  spawnAtX: number;
  spawnAtY: number;
  locked: boolean;
}

export interface InteractableDef {
  tileX: number;
  tileY: number;
  type: string;
  name: string;
}

export interface InputState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface GameEntity {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  type: string;
}

export interface GameSystems {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  world: RAPIER.World;
  characterController: RAPIER.KinematicCharacterController;
  input: InputState;
}

export interface ThemeController {
  mode: ThemeMode;
  applyTheme: (mode: ThemeMode) => void;
}
