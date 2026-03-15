const FIXED_DT = 1 / 60;
const MAX_DELTA = 0.1; // cap to prevent spiral of death

export interface LoopCallbacks {
  processInput: () => void;
  fixedUpdate: (dt: number) => void;
  render: () => void;
}

export function startGameLoop(callbacks: LoopCallbacks): void {
  let lastTime = performance.now();
  let accumulator = 0;

  function tick(currentTime: number) {
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    accumulator += Math.min(delta, MAX_DELTA);

    callbacks.processInput();

    while (accumulator >= FIXED_DT) {
      callbacks.fixedUpdate(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    callbacks.render();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export { FIXED_DT };
