// 3D product view for the shop product pages. Bundled into
// js/shop-3d.bundle.js (scripts/lib/bundles.mjs) and loaded only when a
// shopper opens the 3D view, so the product page itself stays light.
// Models are built from the product dimensions (millimetres, 1 unit = 1 mm).
import {
  ACESFilmicToneMapping,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  BoxGeometry,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  TextureLoader,
  WebGLRenderer,
  PCFShadowMap,
  Box3,
  Sphere,
  Spherical,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const loader = new TextureLoader();

function loadTexture(url) {
  return new Promise((resolve, reject) => loader.load(url, (texture) => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    resolve(texture);
  }, undefined, reject));
}

// A Phillips screw head: a domed metal disc with a cross recess.
function screw(radius) {
  const group = new Group();
  const metal = new MeshStandardMaterial({ color: 0x8c8f93, metalness: 0.85, roughness: 0.32 });
  const head = new Mesh(new CylinderGeometry(radius, radius * 1.04, radius * 0.5, 32), metal);
  head.rotation.x = Math.PI / 2;
  group.add(head);
  const recess = new MeshStandardMaterial({ color: 0x2a2c2f, metalness: 0.4, roughness: 0.6 });
  for (const angle of [0, Math.PI / 2]) {
    const slot = new Mesh(new BoxGeometry(radius * 1.25, radius * 0.24, radius * 0.2), recess);
    slot.rotation.z = angle;
    slot.position.z = radius * 0.2;
    group.add(slot);
  }
  return group;
}

// WIFIGATE: the sealed ABS enclosure, 83 x 81 x 56 mm, its lid facing the
// viewer with four corner screws and the round WIFIGATE label.
async function buildEnclosure(assets) {
  const group = new Group();
  const plastic = new MeshPhysicalMaterial({ color: 0xa9adb1, roughness: 0.6, clearcoat: 0.08 });
  const width = 83, height = 81, depth = 56, lidDepth = 13, seam = 0.7;
  const body = new Mesh(new RoundedBoxGeometry(width, height, depth - lidDepth - seam, 6, 4), plastic);
  body.position.z = -(lidDepth + seam) / 2;
  const gap = new Mesh(new RoundedBoxGeometry(width - 2.4, height - 2.4, seam + 1, 4, 3),
    new MeshStandardMaterial({ color: 0x8f9396, roughness: 0.8 }));
  gap.position.z = depth / 2 - lidDepth - seam / 2;
  const lid = new Mesh(new RoundedBoxGeometry(width, height, lidDepth, 6, 4.5), plastic);
  lid.position.z = depth / 2 - lidDepth / 2;
  group.add(body, gap, lid);
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const head = screw(4.2);
    head.position.set(x * (width / 2 - 8.5), y * (height / 2 - 8.5), depth / 2 + 0.6);
    group.add(head);
  }
  const label = await loadTexture(assets.label);
  const sticker = new Mesh(new CircleGeometry(27.5, 96), new MeshStandardMaterial({ map: label, transparent: true, roughness: 0.55 }));
  sticker.position.z = depth / 2 + 0.08;
  group.add(sticker);
  group.rotation.set(0, -0.5, 0);
  return { group, size: Math.max(width, height, depth) };
}

// WIFIGATE Roller shutter: the 18-module surface panel, 370 x 155 x 70 mm,
// white polycarbonate, its front taken from the shop photo of the panel.
async function buildRollerPanel(assets) {
  const group = new Group();
  const width = 370, height = 155, depth = 70, radius = 4;
  const white = new MeshPhysicalMaterial({ color: 0xeceef0, roughness: 0.45, clearcoat: 0.18, clearcoatRoughness: 0.4 });
  const body = new Mesh(new RoundedBoxGeometry(width, height, depth, 6, radius), white);
  group.add(body);
  const front = await loadTexture(assets.front);
  const face = new Mesh(new PlaneGeometry(width - radius * 2, height - radius * 2),
    new MeshStandardMaterial({ map: front, roughness: 0.5 }));
  face.position.z = depth / 2 + 0.06;
  group.add(face);
  group.rotation.set(0, -0.42, 0);
  return { group, size: width };
}

const MODELS = { "wifigate": buildEnclosure, "wifigate-roller-shutter": buildRollerPanel };

// Frees every mesh's geometry, material and texture in a scene or group.
function release(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    for (const material of [node.material].flat()) { material.map?.dispose(); material.dispose(); }
  });
}

// Mounts the 3D view of a product into a container and returns a controller
// with reset() and dispose(). The model and its textures load before any GPU
// resource exists, so a failed download leaves nothing behind. Missing WebGL
// throws an error whose code is "webgl-unavailable"; anything else is a load
// failure the shopper can retry.
export async function mountProduct3D(container, { product, assets, label, reducedMotion = false }) {
  const build = MODELS[product];
  if (!build) throw new Error(`No 3D model for ${product}`);
  const { group, size } = await build(assets);
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (cause) {
    release(group);
    throw Object.assign(new Error("WebGL is unavailable", { cause }), { code: "webgl-unavailable" });
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.className = "shop-3d__canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  if (label) canvas.setAttribute("aria-label", label);

  const scene = new Scene();
  const environment = new PMREMGenerator(renderer);
  scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new HemisphereLight(0xffffff, new Color(0xd9dde2), 0.6));
  const key = new DirectionalLight(0xffffff, 1.6);
  scene.add(key);

  // Centre the model on the origin and rest it on a soft contact shadow.
  const bounds = new Box3().setFromObject(group);
  const centre = bounds.getCenter(new Vector3());
  group.position.sub(centre);
  group.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  scene.add(group);
  const floorY = bounds.min.y - centre.y - 0.5;
  const floor = new Mesh(new PlaneGeometry(size * 6, size * 6), new ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  scene.add(floor);
  key.position.set(size * 0.8, size * 2.2, size * 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: size * 6 });

  // The camera keeps the whole model in frame for the viewer's shape: the
  // distance fits the model's bounding sphere to the narrower field of view.
  const radius = bounds.getBoundingSphere(new Sphere()).radius;
  const camera = new PerspectiveCamera(30, 1, radius / 20, radius * 40);
  const view = new Vector3(0, 0.3, 1).normalize();
  const home = new Vector3();
  const fit = (aspect) => {
    const half = (camera.fov * Math.PI) / 360;
    const narrow = Math.min(half, Math.atan(Math.tan(half) * aspect));
    return (radius / Math.sin(narrow)) * 1.08;
  };
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = radius * 1.25;
  controls.maxDistance = fit(1) * 2.2;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 1.1;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  // Keyboard: arrows orbit, + and - zoom, within the same limits as the mouse.
  const orbit = new Spherical();
  const turn = (theta, phi, scale = 1) => {
    controls.autoRotate = false;
    const offset = camera.position.clone().sub(controls.target);
    orbit.setFromVector3(offset);
    orbit.theta += theta;
    orbit.phi = Math.min(controls.maxPolarAngle, Math.max(0.15, orbit.phi + phi));
    orbit.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, orbit.radius * scale));
    camera.position.copy(controls.target).add(offset.setFromSpherical(orbit));
    controls.update();
  };
  const step = Math.PI / 18;
  const keys = {
    ArrowLeft: () => turn(-step, 0), ArrowRight: () => turn(step, 0), ArrowUp: () => turn(0, -step / 2),
    ArrowDown: () => turn(0, step / 2), "+": () => turn(0, 0, 0.88), "=": () => turn(0, 0, 0.88), "-": () => turn(0, 0, 1.14),
  };
  canvas.addEventListener("keydown", (event) => {
    if (!keys[event.key]) return;
    event.preventDefault();
    keys[event.key]();
  });

  container.append(canvas);
  // On every resize the framing distance is refitted; a camera now closer
  // than the fit for the new shape (a phone turned to portrait) moves back
  // along its current direction, so the model stays whole.
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const fresh = home.lengthSq() === 0;
    const need = fit(camera.aspect);
    home.copy(view).multiplyScalar(need);
    controls.maxDistance = Math.max(controls.maxDistance, need * 1.6);
    if (fresh) camera.position.copy(home);
    else if (camera.position.distanceTo(controls.target) < need) camera.position.sub(controls.target).setLength(need).add(controls.target);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frame = 0;
  const render = () => {
    frame = requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  };
  render();

  return {
    reset() {
      controls.autoRotate = false;
      camera.position.copy(home);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      release(scene);
      scene.environment?.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
