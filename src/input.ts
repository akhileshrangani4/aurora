import { InputState } from './types';

export function createInputHandler(): InputState {
  const state: InputState = { w: false, a: false, s: false, d: false };

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in state) (state as any)[key] = true;
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in state) (state as any)[key] = false;
  });

  return state;
}
