import { useEffect, useRef, useState } from "react";

const EARTH_MAP = "/globe/earth.jpg";
const FRUSTUM = 1.28;

export function BannerGlobe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let dispose = () => {};

    const start = async () => {
      const THREE = await import("three");
      if (cancelled || !canvas.isConnected) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        reversedDepthBuffer: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.autoClear = true;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-FRUSTUM, FRUSTUM, FRUSTUM, -FRUSTUM, 0.1, 100);
      camera.position.set(0, 0, 20);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const globe = new THREE.Group();
      globe.rotation.z = 0.18;
      globe.rotation.y = 0.42;
      scene.add(globe);

      const geometry = new THREE.SphereGeometry(1, 128, 96);
      const material = new THREE.MeshBasicMaterial({
        toneMapped: false,
        depthTest: true,
        depthWrite: true,
      });
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `vec4 sampledDiffuseColor = texture2D( map, vMapUv );
           vec3 albedo = sampledDiffuseColor.rgb;
           float luma = dot(albedo, vec3(0.299, 0.587, 0.114));
           vec3 muted = mix(albedo, vec3(luma), 0.16);
           muted = pow(max(muted, 0.001), vec3(0.82));
           muted = muted * 1.28 + vec3(0.045, 0.055, 0.07);
           muted *= vec3(1.06, 1.0, 0.94);
           diffuseColor *= vec4(muted, sampledDiffuseColor.a);`,
        );
      };

      const earth = new THREE.Mesh(geometry, material);
      globe.add(earth);

      const loader = new THREE.TextureLoader();
      const map = await loader.loadAsync(EARTH_MAP);
      if (cancelled) {
        map.dispose();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        return;
      }
      map.colorSpace = THREE.NoColorSpace;
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.ClampToEdgeWrapping;
      map.generateMipmaps = false;
      map.minFilter = THREE.LinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.needsUpdate = true;
      material.map = map;
      material.needsUpdate = true;
      setLive(true);

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        const aspect = width / height;
        camera.left = -FRUSTUM * aspect;
        camera.right = FRUSTUM * aspect;
        camera.top = FRUSTUM;
        camera.bottom = -FRUSTUM;
        camera.updateProjectionMatrix();
      };
      resize();

      let visible = true;
      let frame = 0;
      let last = performance.now();
      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        if (!visible) return;
        const delta = Math.min(40, now - last);
        last = now;
        if (!reduceMotion) globe.rotation.y += delta * 0.000045;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);
      renderer.render(scene, camera);

      const ro = new ResizeObserver(resize);
      ro.observe(root);
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry?.isIntersecting ?? false;
        },
        { rootMargin: "80px" },
      );
      io.observe(root);
      window.addEventListener("resize", resize);

      dispose = () => {
        cancelAnimationFrame(frame);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        map.dispose();
        renderer.dispose();
      };
      if (cancelled) dispose();
    };

    start().catch(() => {
      setLive(false);
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className={`qp-banner-globe${live ? " is-live" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="qp-banner-globe__canvas" />
    </div>
  );
}
