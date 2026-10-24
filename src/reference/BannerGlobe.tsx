import { useEffect, useRef, useState } from "react";

const MAPS = {
  day: "/globe/earth-day.jpg",
  night: "/globe/earth-night.jpg",
  bump: "/globe/earth-bump.jpg",
  specular: "/globe/earth-specular.jpg",
  clouds: "/globe/earth-clouds.jpg",
};

const FRUSTUM = 1.28;
const DISPLACEMENT = 0.042;

const earthVertex = `
  uniform sampler2D bumpMap;
  uniform float displacementScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vUv = uv;
    float height = texture2D(bumpMap, uv).r;
    vec3 displaced = position + normal * height * displacementScale;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), vNormal));
    if (dot(tangent, tangent) < 0.0001) tangent = vec3(1.0, 0.0, 0.0);
    vTangent = tangent;
    vBitangent = normalize(cross(vNormal, tangent));
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const earthFragment = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D bumpMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vec3 normal = normalize(vNormal);
    float height = texture2D(bumpMap, vUv).r;
    float heightX = texture2D(bumpMap, vUv + vec2(0.0014, 0.0)).r;
    float heightY = texture2D(bumpMap, vUv + vec2(0.0, 0.0014)).r;
    normal = normalize(normal + vTangent * (heightX - height) * 16.0 + vBitangent * (heightY - height) * 16.0);

    vec3 sun = normalize(sunDirection);
    float incidence = dot(normal, sun);
    float dayMix = smoothstep(-0.15, 0.42, incidence);
    float relief = mix(0.58, 1.0, clamp(incidence, 0.0, 1.0));

    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb;
    float lights = max(nightColor.r, max(nightColor.g, nightColor.b));
    nightColor *= mix(1.1, 2.8, smoothstep(0.015, 0.28, lights));
    vec3 color = mix(nightColor, dayColor * relief, dayMix);

    vec3 viewDirection = normalize(cameraPosition - vWorldPos);
    float specular = pow(max(dot(normal, normalize(sun + viewDirection)), 0.0), 42.0);
    specular *= texture2D(specularMap, vUv).r * dayMix;
    color += specular * 0.42;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const cloudVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const cloudFragment = `
  uniform sampler2D cloudsMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float density = texture2D(cloudsMap, vUv).r;
    float day = smoothstep(-0.05, 0.45, dot(normalize(vNormal), normalize(sunDirection)));
    float alpha = smoothstep(0.22, 0.8, density) * mix(0.28, 0.9, day);
    vec3 cloud = mix(vec3(0.03, 0.05, 0.08), vec3(0.97, 0.98, 1.0), day);
    gl_FragColor = vec4(cloud, alpha);
  }
`;

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
      camera.up.set(0, 1, 0);
      camera.position.set(0, 9, 18);
      camera.lookAt(0, 0.08, 0);
      camera.updateProjectionMatrix();

      const globe = new THREE.Group();
      globe.rotation.x = -0.35;
      globe.rotation.z = 0.38;
      scene.add(globe);

      const spin = new THREE.Group();
      spin.rotation.y = 0.52;
      globe.add(spin);

      const loader = new THREE.TextureLoader();
      const [dayMap, nightMap, bumpMap, specularMap, cloudsMap] = await Promise.all([
        loader.loadAsync(MAPS.day),
        loader.loadAsync(MAPS.night),
        loader.loadAsync(MAPS.bump),
        loader.loadAsync(MAPS.specular),
        loader.loadAsync(MAPS.clouds),
      ]);
      const maps = [dayMap, nightMap, bumpMap, specularMap, cloudsMap];
      if (cancelled) {
        maps.forEach((map) => map.dispose());
        renderer.dispose();
        return;
      }

      const anisotropy = renderer.capabilities.getMaxAnisotropy();
      maps.forEach((map) => {
        map.colorSpace = THREE.NoColorSpace;
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;
        map.anisotropy = anisotropy;
        map.needsUpdate = true;
      });

      const sunDirection = new THREE.Vector3(0.2, 0.45, 1.2).normalize();
      const geometry = new THREE.SphereGeometry(1, 192, 144);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: dayMap },
          nightMap: { value: nightMap },
          bumpMap: { value: bumpMap },
          specularMap: { value: specularMap },
          sunDirection: { value: sunDirection },
          displacementScale: { value: DISPLACEMENT },
        },
        vertexShader: earthVertex,
        fragmentShader: earthFragment,
      });
      spin.add(new THREE.Mesh(geometry, material));

      const cloudGeometry = new THREE.SphereGeometry(1.02, 96, 72);
      const cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
          cloudsMap: { value: cloudsMap },
          sunDirection: { value: sunDirection },
        },
        vertexShader: cloudVertex,
        fragmentShader: cloudFragment,
        transparent: true,
        depthWrite: false,
      });
      const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
      spin.add(clouds);
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
        if (!reduceMotion) {
          spin.rotation.y += delta * 0.000045;
          clouds.rotation.y += delta * 0.000018;
        }
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
        cloudGeometry.dispose();
        material.dispose();
        cloudMaterial.dispose();
        maps.forEach((map) => map.dispose());
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
