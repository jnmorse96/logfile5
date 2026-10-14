// The 3D villi scene. Imported lazily by VilliBackground.jsx; uses static
// member access on THREE so the bundler only keeps the parts it needs.
import * as THREE from "three";

function readColors(el) {
  const cs = getComputedStyle(el);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return { paper: v("--paper", "#f3f5f8"), accent: v("--accent", "#d6336c"), ink: v("--ink", "#10141a") };
}

export function init(canvas, apiRef) {
  if (!canvas) return () => {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: "low-power" });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 60);

  // ---- lighting: soft sky light plus one key light for form -----------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.15);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(4, 9, 6);
  scene.add(key);

  // ---- the lining: a gently undulating floor ---------------------------------
  const floorH = (x, z) => 0.35 * Math.sin(x * 0.35 + z * 0.12) + 0.25 * Math.sin(z * 0.27 - x * 0.18);
  const floorGeo = new THREE.PlaneGeometry(40, 70, 50, 90);
  floorGeo.rotateX(-Math.PI / 2);
  const fp = floorGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) fp.setY(i, floorH(fp.getX(i), fp.getZ(i)) - 0.05);
  floorGeo.computeVertexNormals();
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.z = -12;
  scene.add(floor);

  // ---- the villi: one instanced capsule mesh ---------------------------------
  const radius = 0.125;
  const length = 0.42;
  const villusGeo = new THREE.CapsuleGeometry(radius, length, 3, small ? 7 : 9);
  villusGeo.translate(0, length / 2 + radius, 0); // base at y = 0
  const fullH = length + radius * 2;

  const uniforms = { uTime: { value: 0 } };
  const villusMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
  villusMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        #else
          vec4 ip = vec4(0.0);
        #endif
        float h = clamp(position.y / ${fullH.toFixed(3)}, 0.0, 1.0);
        float bend = h * h;
        transformed.x += sin(uTime * 0.8 + ip.x * 0.7 + ip.z * 0.45) * 0.07 * bend;
        transformed.z += cos(uTime * 0.6 + ip.z * 0.55 - ip.x * 0.25) * 0.05 * bend;`
      );
  };

  const spacing = 0.34;
  const cols = small ? 30 : 50;
  const rows = small ? 84 : 96;
  const count = cols * rows;
  const villi = new THREE.InstancedMesh(villusGeo, villusMat, count);
  villi.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const heights = new Float32Array(count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let rand = 1234567;
  const rnd = () => ((rand = (rand * 16807) % 2147483647) / 2147483647);

  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacing + (rnd() - 0.5) * 0.12 + (r % 2 ? spacing / 2 : 0);
      const z = 10 - r * spacing + (rnd() - 0.5) * 0.12;
      // Height varies in soft waves, like folds of the lining.
      const wave = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.22) * Math.cos(z * 0.18 - x * 0.1);
      const hScale = 0.55 + wave * 0.9 + rnd() * 0.25;
      heights[i] = Math.min(1, (hScale - 0.55) / 1.15);
      p.set(x, floorH(x, z + 12) - 0.02, z);
      e.set((rnd() - 0.5) * 0.18, rnd() * Math.PI, (rnd() - 0.5) * 0.18);
      q.setFromEuler(e);
      const w = 0.85 + rnd() * 0.35;
      s.set(w, hScale, w);
      m.compose(p, q, s);
      villi.setMatrixAt(i, m);
      i++;
    }
  }
  villi.instanceMatrix.needsUpdate = true;
  scene.add(villi);

  // ---- colors from the page --------------------------------------------------
  const tmp = new THREE.Color();
  const paperC = new THREE.Color();
  const accentC = new THREE.Color();
  const inkC = new THREE.Color();
  const baseC = new THREE.Color();
  const tipC = new THREE.Color();
  const site = () => document.querySelector(".site") || document.documentElement;

  function recolor() {
    const { paper, accent, ink } = readColors(site());
    paperC.set(paper);
    accentC.set(accent);
    inkC.set(ink);
    const dark = paperC.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;

    renderer.setClearColor(paperC, 1);
    scene.fog = new THREE.Fog(paperC, dark ? 2.2 : 2.4, dark ? 10.5 : 11);

    // Keep everything close to the page color so text on top stays readable.
    baseC.copy(paperC).lerp(inkC, dark ? 0.06 : 0.035);
    tipC.copy(paperC).lerp(accentC, dark ? 0.42 : 0.26);
    floorMat.color.copy(paperC).lerp(inkC, dark ? 0.05 : 0.04);
    hemi.color.set(dark ? 0x9aa4b2 : 0xffffff);
    hemi.groundColor.copy(accentC).lerp(paperC, 0.6);
    hemi.intensity = dark ? 0.75 : 1.15;
    key.intensity = dark ? 0.9 : 1.35;

    for (let k = 0; k < count; k++) {
      tmp.copy(baseC).lerp(tipC, 0.25 + heights[k] * 0.75);
      villi.setColorAt(k, tmp);
    }
    if (villi.instanceColor) villi.instanceColor.needsUpdate = true;
    if (reduceMotion) render();
  }

  // ---- motion: scroll travel, slow drift, slight pointer parallax ------------
  const cam = { z: 8, y: 2.3, x: 0 };
  const target = { z: 8, y: 2.3, x: 0 };
  let pointerX = 0;
  let pointerY = 0;

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  function updateTarget() {
    const pr = scrollProgress();
    target.z = 8 - pr * 16;
    target.y = 2.3 - pr * 0.7;
    target.x = pointerX * 0.6;
  }

  function placeCamera(t) {
    camera.position.set(cam.x + Math.sin(t * 0.07) * 0.4, cam.y + pointerY * 0.15, cam.z);
    camera.lookAt(cam.x * 0.5, 0.15, cam.z - 8);
  }

  function render() {
    renderer.render(scene, camera);
  }

  let raf = 0;
  let last = performance.now();
  let time = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    uniforms.uTime.value = time;
    const ease = 1 - Math.pow(0.002, dt); // frame-rate independent smoothing
    cam.z += (target.z - cam.z) * ease;
    cam.y += (target.y - cam.y) * ease;
    cam.x += (target.x - cam.x) * ease;
    placeCamera(time);
    render();
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (reduceMotion) render();
  }
  function onPointer(ev) {
    pointerX = (ev.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (ev.clientY / window.innerHeight - 0.5) * 2;
    updateTarget();
  }
  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!reduceMotion && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  // Follow theme changes (toggle in the header, or the system setting).
  const themeObserver = new MutationObserver(() => requestAnimationFrame(recolor));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => requestAnimationFrame(recolor);
  mq.addEventListener?.("change", onScheme);

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  apiRef.current = { recolor };

  recolor();
  updateTarget();
  Object.assign(cam, target);
  placeCamera(0);

  if (reduceMotion) {
    render();
  } else {
    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    raf = requestAnimationFrame(frame);
  }
  canvas.classList.add("is-ready");

  return () => {
    cancelAnimationFrame(raf);
    themeObserver.disconnect();
    mq.removeEventListener?.("change", onScheme);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", updateTarget);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    apiRef.current = null;
    villusGeo.dispose();
    villusMat.dispose();
    floorGeo.dispose();
    floorMat.dispose();
    renderer.dispose();
  };
}
