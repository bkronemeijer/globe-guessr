import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import globeTexture from "../assets/8k_earth_daymap.jpg";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";
import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import vertexShader from "../shaders/vertex.glsl";
import { latLonToVector3, vector3ToLatLon } from "../utils/threeGeoJSON.js";

const Globe = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    const group = new THREE.Group();

    // Setup camera
    camera.position.z = 15;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // geography
    const radius = 5;

    // var planet = new THREE.Object3D();
    // planet.rotation.x = -Math.PI * 0.5;
    // scene.add(planet);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // var geometry = new THREE.SphereGeometry(radius, 32, 32);
    // var material = new THREE.MeshBasicMaterial({
    //   color: 0x333333,
    //   wireframe: true,
    //   transparent: true,
    // });
    // var sphere = new THREE.Mesh(geometry, material);
    // planet.add(sphere);

    // globe sphere object
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 50, 50),
      // new THREE.MeshBasicMaterial({
      //   color: 0x333333,
      //   wireframe: true,
      //   transparent: true,
      // })
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
    // group.rotation.y = Math.PI;

    const gMarker = new THREE.SphereGeometry(0.02, 16, 16); // small red dot
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

    // fetch("/geo_data/countries.json")
    //   .then((response) => response.text())
    //   .then((text) => {
    //     const data = JSON.parse(text);
    //     // json, radius, shape, materalOptions, container
    //     drawThreeGeo(
    //       data,
    //       radius,
    //       "sphere",
    //       {
    //         color: 0x80ff80,
    //       },
    //       planet
    //     );
    //   });

    function animate() {
      controls.update();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      //   sphere.rotation.y += 0.0005;
      // gsap.to(group.rotation, {
      //   x: -mouse.y * 0.3,
      //   y: mouse.x * 0.5,
      //   duration: 2,
      // });
    }
    animate();

    const raycaster = new THREE.Raycaster();

    const handlePointerDown = (event: PointerEvent) => {
      event.stopPropagation();

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersect = raycaster.intersectObject(sphere)[0];

      if (intersect) {
        const originalRotation = group.rotation.clone();
        group.rotation.set(0, 0, 0);
        group.updateMatrixWorld();

        const point = intersect.point.clone();
        group.worldToLocal(point);
        point.normalize();

        function vector3ToLatLon(v: THREE.Vector3) {
          const p = v.clone().normalize();
          const lat = 90 - Math.acos(p.y) * (180 / Math.PI);
          let lon = 360 - (180 - Math.atan2(p.z, -p.x) * (180 / Math.PI));
          if (lon > 180) lon -= 360; // ensure -180 to 180
          return { lat, lon };
        }

        const { lat, lon } = vector3ToLatLon(point);
        console.log(`Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`);

        group.rotation.copy(originalRotation);
        group.updateMatrixWorld();
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.domElement.removeEventListener(
          "pointerdown",
          handlePointerDown
        );
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen"></div>;
};

export default Globe;
