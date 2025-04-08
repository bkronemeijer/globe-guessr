import { useEffect, useRef } from "react";
import * as THREE from "three";
import globe from "../assets/globe.jpg";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";
import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import vertexShader from "../shaders/vertex.glsl";
import gsap from "gsap";

const Globe = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouse = {
      x: 0,
      y: 0,
    };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const group = new THREE.Group();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    document.body.appendChild(renderer.domElement);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // globe sphere object
    const globeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load(globe),
          },
        },
      })
    );

    group.add(globeSphere);
    scene.add(group);

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

    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
    });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = -Math.random() * 2000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      globeSphere.rotation.y += 0.001;
      gsap.to(group.rotation, {
        x: -mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 2,
      });
    }
    animate();
    let isDragging = false;

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 2;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 2;
      }
    };

    addEventListener("pointerdown", () => {
      isDragging = true;
    });

    addEventListener("mousemove", handleMouseMove);

    addEventListener("pointerup", () => {
      isDragging = false;
    });

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        removeEventListener("pointerdown", () => {
          isDragging = true;
        });
        removeEventListener("mousemove", handleMouseMove);
        removeEventListener("pointerup", () => {
          isDragging = false;
        });
      }
    };
  }, []);

  return (
    <div ref={mountRef} className="w-full h-screen">
      <button>Stop spinning</button>
    </div>
  );
};

export default Globe;
