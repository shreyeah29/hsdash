import { useEffect, useRef, type CSSProperties } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PMREMGenerator,
  PointLight,
  Raycaster,
  Scene,
  ShaderChunk,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type SizeInfo = {
  width: number;
  height: number;
  wWidth: number;
  wHeight: number;
  ratio: number;
  pixelRatio: number;
};

type RenderClock = { elapsed: number; delta: number };

type ThreeViewportOptions = {
  canvas?: HTMLCanvasElement;
  id?: string;
  size?: "parent" | { width: number; height: number };
  rendererOptions?: WebGLRenderer["domElement"] extends never ? Record<string, unknown> : ConstructorParameters<typeof WebGLRenderer>[0];
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
};

class ThreeViewport {
  #options: ThreeViewportOptions;
  canvas!: HTMLCanvasElement;
  camera: PerspectiveCamera;
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  cameraFov: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scene: Scene;
  renderer!: WebGLRenderer;
  #postprocessing: { render: () => void; dispose: () => void } | null = null;
  size: SizeInfo = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#renderFrame;
  onBeforeRender: (clock: RenderClock) => void = () => {};
  onAfterRender: (clock: RenderClock) => void = () => {};
  onAfterResize: (size: SizeInfo) => void = () => {};
  #isVisible = false;
  #isAnimating = false;
  isDisposed = false;
  #resizeTimer: ReturnType<typeof setTimeout> | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #intersectionObserver: IntersectionObserver | undefined;
  #timer = new Timer();
  #clock = { elapsed: 0, delta: 0 };
  #animationId = 0;

  constructor(options: ThreeViewportOptions) {
    this.#options = { ...options };
    this.camera = new PerspectiveCamera();
    this.cameraFov = this.camera.fov;
    this.scene = new Scene();
    this.#initCanvas();
    this.#initRenderer();
    this.#bindLifecycle();
    this.resize();
    this.#observe();
  }

  #initCanvas() {
    if (this.#options.canvas) {
      this.canvas = this.#options.canvas;
    } else if (this.#options.id) {
      const el = document.getElementById(this.#options.id);
      if (!el || !(el instanceof HTMLCanvasElement)) {
        throw new Error("Three: canvas id not found");
      }
      this.canvas = el;
    } else {
      throw new Error("Three: Missing canvas or id parameter");
    }
    this.canvas.style.display = "block";
  }

  #initRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      powerPreference: "high-performance",
      ...(this.#options.rendererOptions ?? {}),
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
  }

  #bindLifecycle() {
    this.cameraMinAspect = this.#options.cameraMinAspect;
    this.cameraMaxAspect = this.#options.cameraMaxAspect;
    this.maxPixelRatio = this.#options.maxPixelRatio;
    this.minPixelRatio = this.#options.minPixelRatio;
  }

  #observe() {
    if (!(this.#options.size instanceof Object)) {
      window.addEventListener("resize", this.#scheduleResize);
      if (this.#options.size === "parent" && this.canvas.parentNode instanceof Element) {
        this.#resizeObserver = new ResizeObserver(this.#scheduleResize);
        this.#resizeObserver.observe(this.canvas.parentNode);
      }
    }
    this.#intersectionObserver = new IntersectionObserver(this.#onIntersect, {
      root: null,
      rootMargin: "0px",
      threshold: 0,
    });
    this.#intersectionObserver.observe(this.canvas);
    document.addEventListener("visibilitychange", this.#onVisibility);
  }

  #teardownObservers() {
    window.removeEventListener("resize", this.#scheduleResize);
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.#onVisibility);
  }

  #onIntersect = (entries: IntersectionObserverEntry[]) => {
    this.#isVisible = entries[0]?.isIntersecting ?? false;
    if (this.#isVisible) this.#start();
    else this.#stop();
  };

  #onVisibility = () => {
    if (!this.#isVisible) return;
    if (document.hidden) this.#stop();
    else this.#start();
  };

  #scheduleResize = () => {
    if (this.#resizeTimer) clearTimeout(this.#resizeTimer);
    this.#resizeTimer = setTimeout(() => this.resize(), 100);
  };

  resize() {
    let width: number;
    let height: number;
    if (this.#options.size instanceof Object) {
      width = this.#options.size.width;
      height = this.#options.size.height;
    } else if (this.#options.size === "parent" && this.canvas.parentNode instanceof HTMLElement) {
      width = this.canvas.parentNode.offsetWidth;
      height = this.canvas.parentNode.offsetHeight;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    this.size.width = width;
    this.size.height = height;
    this.size.ratio = width / height;
    this.#updateCamera();
    this.#updateRendererSize();
    this.onAfterResize(this.size);
  }

  #updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
      this.#setFovForAspect(this.cameraMinAspect);
    } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
      this.#setFovForAspect(this.cameraMaxAspect);
    } else {
      this.camera.fov = this.cameraFov;
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }

  #setFovForAspect(targetAspect: number) {
    const slope = Math.tan(MathUtils.degToRad(this.cameraFov / 2)) / (this.camera.aspect / targetAspect);
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(slope));
  }

  updateWorldSize() {
    const fovRad = (this.camera.fov * Math.PI) / 180;
    this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
    this.size.wWidth = this.size.wHeight * this.camera.aspect;
  }

  #updateRendererSize() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#postprocessing?.render();
    let ratio = window.devicePixelRatio;
    if (this.maxPixelRatio && ratio > this.maxPixelRatio) ratio = this.maxPixelRatio;
    else if (this.minPixelRatio && ratio < this.minPixelRatio) ratio = this.minPixelRatio;
    this.renderer.setPixelRatio(ratio);
    this.size.pixelRatio = ratio;
  }

  get postprocessing() {
    return this.#postprocessing;
  }

  set postprocessing(value: { render: () => void; dispose: () => void } | null) {
    this.#postprocessing = value;
    if (value) this.render = value.render.bind(value);
  }

  #start() {
    if (this.#isAnimating) return;
    const tick = () => {
      this.#animationId = requestAnimationFrame(tick);
      this.#timer.update();
      this.#clock.delta = this.#timer.getDelta();
      this.#clock.elapsed += this.#clock.delta;
      this.onBeforeRender(this.#clock);
      this.render();
      this.onAfterRender(this.#clock);
    };
    this.#isAnimating = true;
    this.#timer.reset();
    tick();
  }

  #stop() {
    if (!this.#isAnimating) return;
    cancelAnimationFrame(this.#animationId);
    this.#isAnimating = false;
  }

  #renderFrame() {
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    this.scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      if (mat && typeof mat === "object") {
        const record = mat as Record<string, unknown>;
        Object.keys(record).forEach((key) => {
          const value = record[key];
          if (value && typeof value === "object" && "dispose" in value && typeof value.dispose === "function") {
            value.dispose();
          }
        });
        if ("dispose" in mat && typeof mat.dispose === "function") mat.dispose();
      }
      obj.geometry.dispose();
    });
    this.scene.clear();
  }

  dispose() {
    this.#teardownObservers();
    this.#stop();
    this.#timer.dispose();
    this.clear();
    this.#postprocessing?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.isDisposed = true;
  }
}

const pointerRegistry = new Map<HTMLElement, PointerTracker>();
const globalPointer = new Vector2();
let pointerListenersAttached = false;

type PointerTracker = {
  position: Vector2;
  nPosition: Vector2;
  hover: boolean;
  touching: boolean;
  onEnter: (self: PointerTracker) => void;
  onMove: (self: PointerTracker) => void;
  onClick: (self: PointerTracker) => void;
  onLeave: (self: PointerTracker) => void;
  dispose?: () => void;
};

function attachPointer(domElement: HTMLElement, tracker: PointerTracker) {
  pointerRegistry.set(domElement, tracker);
  if (!pointerListenersAttached) {
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerleave", onPointerLeave);
    document.body.addEventListener("click", onPointerClick);
    document.body.addEventListener("touchstart", onTouchStart, { passive: false });
    document.body.addEventListener("touchmove", onTouchMove, { passive: false });
    document.body.addEventListener("touchend", onTouchEnd, { passive: false });
    document.body.addEventListener("touchcancel", onTouchEnd, { passive: false });
    pointerListenersAttached = true;
  }
  tracker.dispose = () => {
    pointerRegistry.delete(domElement);
    if (pointerRegistry.size === 0) {
      document.body.removeEventListener("pointermove", onPointerMove);
      document.body.removeEventListener("pointerleave", onPointerLeave);
      document.body.removeEventListener("click", onPointerClick);
      document.body.removeEventListener("touchstart", onTouchStart);
      document.body.removeEventListener("touchmove", onTouchMove);
      document.body.removeEventListener("touchend", onTouchEnd);
      document.body.removeEventListener("touchcancel", onTouchEnd);
      pointerListenersAttached = false;
    }
  };
}

function updatePointerPosition(tracker: PointerTracker, rect: DOMRect) {
  tracker.position.x = globalPointer.x - rect.left;
  tracker.position.y = globalPointer.y - rect.top;
  tracker.nPosition.x = (tracker.position.x / rect.width) * 2 - 1;
  tracker.nPosition.y = (-tracker.position.y / rect.height) * 2 + 1;
}

function pointerInside(rect: DOMRect) {
  const { x, y } = globalPointer;
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

function processPointerInteractions() {
  for (const [element, tracker] of pointerRegistry) {
    const rect = element.getBoundingClientRect();
    if (pointerInside(rect)) {
      updatePointerPosition(tracker, rect);
      if (!tracker.hover) {
        tracker.hover = true;
        tracker.onEnter(tracker);
      }
      tracker.onMove(tracker);
    } else if (tracker.hover && !tracker.touching) {
      tracker.hover = false;
      tracker.onLeave(tracker);
    }
  }
}

function onPointerMove(event: PointerEvent) {
  globalPointer.x = event.clientX;
  globalPointer.y = event.clientY;
  processPointerInteractions();
}

function onPointerClick(event: MouseEvent) {
  globalPointer.x = event.clientX;
  globalPointer.y = event.clientY;
  for (const [element, tracker] of pointerRegistry) {
    const rect = element.getBoundingClientRect();
    updatePointerPosition(tracker, rect);
    if (pointerInside(rect)) tracker.onClick(tracker);
  }
}

function onPointerLeave() {
  for (const tracker of pointerRegistry.values()) {
    if (tracker.hover) {
      tracker.hover = false;
      tracker.onLeave(tracker);
    }
  }
}

function onTouchStart(event: TouchEvent) {
  if (!event.touches.length) return;
  event.preventDefault();
  globalPointer.x = event.touches[0].clientX;
  globalPointer.y = event.touches[0].clientY;
  for (const [element, tracker] of pointerRegistry) {
    const rect = element.getBoundingClientRect();
    if (pointerInside(rect)) {
      tracker.touching = true;
      updatePointerPosition(tracker, rect);
      if (!tracker.hover) {
        tracker.hover = true;
        tracker.onEnter(tracker);
      }
      tracker.onMove(tracker);
    }
  }
}

function onTouchMove(event: TouchEvent) {
  if (!event.touches.length) return;
  event.preventDefault();
  globalPointer.x = event.touches[0].clientX;
  globalPointer.y = event.touches[0].clientY;
  for (const [element, tracker] of pointerRegistry) {
    const rect = element.getBoundingClientRect();
    updatePointerPosition(tracker, rect);
    if (pointerInside(rect)) {
      if (!tracker.hover) {
        tracker.hover = true;
        tracker.touching = true;
        tracker.onEnter(tracker);
      }
      tracker.onMove(tracker);
    } else if (tracker.hover && tracker.touching) {
      tracker.onMove(tracker);
    }
  }
}

function onTouchEnd() {
  for (const tracker of pointerRegistry.values()) {
    if (tracker.touching) {
      tracker.touching = false;
      if (tracker.hover) {
        tracker.hover = false;
        tracker.onLeave(tracker);
      }
    }
  }
}

const { randFloat, randFloatSpread } = MathUtils;
const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpC = new Vector3();
const tmpD = new Vector3();
const tmpE = new Vector3();
const tmpF = new Vector3();
const tmpG = new Vector3();
const tmpH = new Vector3();
const tmpI = new Vector3();
const tmpJ = new Vector3();

type BallPhysicsConfig = {
  count: number;
  gravity: number;
  friction: number;
  wallBounce: number;
  maxVelocity: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  maxSize: number;
  minSize: number;
  size0: number;
  controlSphere0: boolean;
  followCursor: boolean;
};

class BallPhysics {
  config: BallPhysicsConfig;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center = new Vector3();

  constructor(config: BallPhysicsConfig) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.resetPositions();
    this.setSizes();
  }

  resetPositions() {
    const { config, positionData, center } = this;
    center.toArray(positionData, 0);
    for (let i = 1; i < config.count; i++) {
      const base = 3 * i;
      positionData[base] = randFloatSpread(2 * config.maxX);
      positionData[base + 1] = randFloatSpread(2 * config.maxY);
      positionData[base + 2] = randFloatSpread(2 * config.maxZ);
    }
  }

  setSizes() {
    const { config, sizeData } = this;
    sizeData[0] = config.size0;
    for (let i = 1; i < config.count; i++) {
      sizeData[i] = randFloat(config.minSize, config.maxSize);
    }
  }

  update(clock: RenderClock) {
    const { config, center, positionData, sizeData, velocityData } = this;
    let start = 0;
    if (config.controlSphere0) {
      start = 1;
      tmpA.fromArray(positionData, 0);
      tmpA.lerp(center, 0.1).toArray(positionData, 0);
      tmpE.set(0, 0, 0).toArray(velocityData, 0);
    }
    for (let idx = start; idx < config.count; idx++) {
      const base = 3 * idx;
      tmpB.fromArray(positionData, base);
      tmpF.fromArray(velocityData, base);
      tmpF.y -= clock.delta * config.gravity * sizeData[idx];
      tmpF.multiplyScalar(config.friction);
      tmpF.clampLength(0, config.maxVelocity);
      tmpB.add(tmpF);
      tmpB.toArray(positionData, base);
      tmpF.toArray(velocityData, base);
    }
    for (let idx = start; idx < config.count; idx++) {
      const base = 3 * idx;
      tmpB.fromArray(positionData, base);
      tmpF.fromArray(velocityData, base);
      const radius = sizeData[idx];
      for (let j = idx + 1; j < config.count; j++) {
        const otherBase = 3 * j;
        tmpC.fromArray(positionData, otherBase);
        tmpG.fromArray(velocityData, otherBase);
        const otherRadius = sizeData[j];
        tmpH.copy(tmpC).sub(tmpB);
        const dist = tmpH.length();
        const sumRadius = radius + otherRadius;
        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          tmpI.copy(tmpH).normalize().multiplyScalar(0.5 * overlap);
          tmpJ.copy(tmpI).multiplyScalar(Math.max(tmpF.length(), 1));
          tmpD.copy(tmpI).multiplyScalar(Math.max(tmpG.length(), 1));
          tmpB.sub(tmpI);
          tmpF.sub(tmpJ);
          tmpB.toArray(positionData, base);
          tmpF.toArray(velocityData, base);
          tmpC.add(tmpI);
          tmpG.add(tmpD);
          tmpC.toArray(positionData, otherBase);
          tmpG.toArray(velocityData, otherBase);
        }
      }
      if (config.controlSphere0) {
        tmpH.copy(tmpA).sub(tmpB);
        const dist = tmpH.length();
        const sumRadius0 = radius + sizeData[0];
        if (dist < sumRadius0) {
          const diff = sumRadius0 - dist;
          tmpI.copy(tmpH.normalize()).multiplyScalar(diff);
          tmpJ.copy(tmpI).multiplyScalar(Math.max(tmpF.length(), 2));
          tmpB.sub(tmpI);
          tmpF.sub(tmpJ);
        }
      }
      if (Math.abs(tmpB.x) + radius > config.maxX) {
        tmpB.x = Math.sign(tmpB.x) * (config.maxX - radius);
        tmpF.x = -tmpF.x * config.wallBounce;
      }
      if (config.gravity === 0) {
        if (Math.abs(tmpB.y) + radius > config.maxY) {
          tmpB.y = Math.sign(tmpB.y) * (config.maxY - radius);
          tmpF.y = -tmpF.y * config.wallBounce;
        }
      } else if (tmpB.y - radius < -config.maxY) {
        tmpB.y = -config.maxY + radius;
        tmpF.y = -tmpF.y * config.wallBounce;
      }
      const maxBoundary = Math.max(config.maxZ, config.maxSize);
      if (Math.abs(tmpB.z) + radius > maxBoundary) {
        tmpB.z = Math.sign(tmpB.z) * (config.maxZ - radius);
        tmpF.z = -tmpF.z * config.wallBounce;
      }
      tmpB.toArray(positionData, base);
      tmpF.toArray(velocityData, base);
    }
  }
}

class BallMaterial extends MeshPhysicalMaterial {
  uniforms: Record<string, { value: number }>;
  onBeforeCompile2?: (shader: { uniforms: Record<string, unknown>; fragmentShader: string }) => void;

  constructor(params: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) {
    super(params);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 },
    };
    this.defines = { ...this.defines, USE_UV: "" };
    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader =
        "\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      " + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        "\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      ",
      );
      const lights = ShaderChunk.lights_fragment_begin.replaceAll(
        "RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",
        "\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        ",
      );
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_begin>", lights);
      this.onBeforeCompile2?.(shader);
    };
  }
}

type BallpitMeshConfig = BallPhysicsConfig & {
  colors: number[];
  ambientColor: number;
  ambientIntensity: number;
  lightIntensity: number;
  materialParams: {
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
  };
  followCursor: boolean;
};

const DEFAULT_CONFIG: BallpitMeshConfig = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true,
};

const dummy = new Object3D();

class BallpitMesh extends InstancedMesh {
  config: BallpitMeshConfig;
  physics: BallPhysics;
  ambientLight: AmbientLight;
  light: PointLight;

  constructor(renderer: WebGLRenderer, config: Partial<BallpitMeshConfig> = {}) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    const envScene = new RoomEnvironment();
    const envMap = new PMREMGenerator(renderer).fromScene(envScene).texture;
    const geometry = new SphereGeometry();
    const material = new BallMaterial({ envMap, ...merged.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    super(geometry, material, merged.count);
    this.config = merged;
    this.physics = new BallPhysics(merged);
    this.ambientLight = new AmbientLight(merged.ambientColor, merged.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new PointLight(merged.colors[0] ?? 0xffffff, merged.lightIntensity);
    this.add(this.light);
    this.setColors(merged.colors);
  }

  setColors(colors: number[]) {
    if (!Array.isArray(colors) || colors.length < 2) return;
    const palette = colors.map((hex) => new Color(hex));
    for (let idx = 0; idx < this.count; idx++) {
      const ratio = idx / this.count;
      const scaled = Math.max(0, Math.min(1, ratio)) * (palette.length - 1);
      const startIdx = Math.floor(scaled);
      const start = palette[startIdx];
      const out = start.clone();
      if (startIdx < palette.length - 1) {
        const alpha = scaled - startIdx;
        const end = palette[startIdx + 1];
        out.r = start.r + alpha * (end.r - start.r);
        out.g = start.g + alpha * (end.g - start.g);
        out.b = start.b + alpha * (end.b - start.b);
      }
      this.setColorAt(idx, out);
      if (idx === 0) this.light.color.copy(out);
    }
    if (this.instanceColor) this.instanceColor.needsUpdate = true;
  }

  update(clock: RenderClock) {
    this.physics.update(clock);
    for (let idx = 0; idx < this.count; idx++) {
      dummy.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        dummy.scale.setScalar(0);
      } else {
        dummy.scale.setScalar(this.physics.sizeData[idx]);
      }
      dummy.updateMatrix();
      this.setMatrixAt(idx, dummy.matrix);
      if (idx === 0) this.light.position.copy(dummy.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

type BallpitInstance = {
  three: ThreeViewport;
  spheres: BallpitMesh;
  setCount: (count: number) => void;
  togglePause: () => void;
  dispose: () => void;
};

function createBallpit(canvas: HTMLCanvasElement, config: Partial<BallpitMeshConfig> = {}): BallpitInstance {
  const viewport = new ThreeViewport({
    canvas,
    size: "parent",
    rendererOptions: { antialias: true, alpha: true },
  });
  viewport.renderer.toneMapping = ACESFilmicToneMapping;
  viewport.camera.position.set(0, 0, 20);
  viewport.camera.lookAt(0, 0, 0);
  viewport.cameraMaxAspect = 1.5;
  viewport.resize();

  let spheres: BallpitMesh;
  let paused = false;

  const initialize = (next: Partial<BallpitMeshConfig>) => {
    if (spheres) {
      viewport.clear();
      viewport.scene.remove(spheres);
    }
    spheres = new BallpitMesh(viewport.renderer, next);
    viewport.scene.add(spheres);
  };

  initialize(config);

  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const hit = new Vector3();

  canvas.style.touchAction = "none";
  canvas.style.userSelect = "none";
  canvas.style.webkitUserSelect = "none";

  const tracker: PointerTracker = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    touching: false,
    onEnter: () => {},
    onMove: () => {},
    onClick: () => {},
    onLeave: () => {},
  };

  tracker.onMove = () => {
    raycaster.setFromCamera(tracker.nPosition, viewport.camera);
    viewport.camera.getWorldDirection(plane.normal);
    raycaster.ray.intersectPlane(plane, hit);
    spheres.physics.center.copy(hit);
    spheres.config.controlSphere0 = true;
  };
  tracker.onLeave = () => {
    spheres.config.controlSphere0 = false;
  };

  attachPointer(canvas, tracker);

  viewport.onBeforeRender = (clock) => {
    if (!paused) spheres.update(clock);
  };
  viewport.onAfterResize = (size) => {
    spheres.config.maxX = size.wWidth / 2;
    spheres.config.maxY = size.wHeight / 2;
  };

  return {
    three: viewport,
    get spheres() {
      return spheres;
    },
    setCount(count: number) {
      initialize({ ...spheres.config, count });
    },
    togglePause() {
      paused = !paused;
    },
    dispose() {
      tracker.dispose?.();
      viewport.dispose();
    },
  };
}

export type BallpitProps = {
  className?: string;
  followCursor?: boolean;
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  colors?: number[];
  ambientColor?: number;
  ambientIntensity?: number;
  lightIntensity?: number;
  minSize?: number;
  maxSize?: number;
  size0?: number;
  maxVelocity?: number;
  maxX?: number;
  maxY?: number;
  maxZ?: number;
  style?: CSSProperties;
};

export function Ballpit({ className = "", followCursor = true, style, ...props }: BallpitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<BallpitInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
    // Ballpit is intentionally initialized once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas className={className} ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", ...style }} />;
}

export default Ballpit;
