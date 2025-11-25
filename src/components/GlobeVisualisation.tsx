import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import globeTexture from "../assets/8k_earth_daymap.jpg";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";
import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import vertexShader from "../shaders/vertex.glsl";
import {
  getCountryFromJSON,
  latLonToVector3,
  type CountryProperties,
} from "../utils/threeGeoJSON";

export interface CountrySelection {
  lat: number;
  lon: number;
  countryProperties: CountryProperties | null;
}

interface GlobeProps {
  onCountrySelect?: (selection: CountrySelection) => void;
}

const Globe = ({ onCountrySelect }: GlobeProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    const group = new THREE.Group();
    const raycaster = new THREE.Raycaster();

    camera.position.z = 15;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mountElement.appendChild(renderer.domElement);

    const radius = 5;

    const updateRendererSize = () => {
      const { width, height } = mountElement.getBoundingClientRect();
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight);
    };

    updateRendererSize();

    window.addEventListener("resize", updateRendererSize);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateRendererSize())
        : null;
    resizeObserver?.observe(mountElement);

    // globe sphere object
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 50, 50),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load(globeTexture),
          },
        },
      })
    );

    group.add(sphere);
    scene.add(group);

    const gMarker = new THREE.SphereGeometry(0.02, 16, 16);
    const mMarker = new THREE.MeshBasicMaterial({ color: 0xff3232 });
    const londonLat = 51.5072;
    const londonLon = -0.1276;

    const marker = new THREE.Mesh(gMarker, mMarker);
    const position = latLonToVector3(londonLat, londonLon, radius + 0.1);
    marker.position.copy(position);
    group.add(marker);

    const marker2 = new THREE.Mesh(gMarker, mMarker);
    const position2 = latLonToVector3(0, 0, radius + 0.1);
    marker2.position.copy(position2);
    group.add(marker2);

    // atmosphere sphere object
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
    );
    atmosphere.scale.set(1.2, 1.2, 1.2);
    scene.add(atmosphere);

    // Add stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
    });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const vector3ToLatLon = (point: THREE.Vector3) => {
      const normalisedPoint = point.clone().normalize();
      const lat = 90 - Math.acos(normalisedPoint.y) * (180 / Math.PI);
      let lon =
        360 -
        (180 - Math.atan2(normalisedPoint.z, -normalisedPoint.x) * (180 / Math.PI));
      if (lon > 180) lon -= 360;
      return { lat, lon };
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.stopPropagation();

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersect = raycaster.intersectObject(sphere)[0];

      if (intersect) {
        const originalRotation = group.rotation.clone();
        group.rotation.set(0, 0, 0);
        group.updateMatrixWorld();

        const point = intersect.point.clone();
        group.worldToLocal(point);
        point.normalize();

        const { lat, lon } = vector3ToLatLon(point);

        onCountrySelect?.({
          lat,
          lon,
          countryProperties: getCountryFromJSON(lat, lon),
        });

        group.rotation.copy(originalRotation);
        group.updateMatrixWorld();
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", handlePointerDown);

    let animationFrameId: number;
    const animate = () => {
      controls.update();
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", updateRendererSize);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
    };
  }, [onCountrySelect]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Globe;
