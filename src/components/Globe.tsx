import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import globeTexture from "../assets/globe.jpg";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";
import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import vertexShader from "../shaders/vertex.glsl";
import { drawThreeGeo } from "../utils/threeGeoJSON.js";

const Globe = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouse = {
      x: 0,
      y: 0,
    };
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

    var planet = new THREE.Object3D();
    planet.rotation.x = -Math.PI * 0.5;
    scene.add(planet);

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

    fetch("/geo_data/countries.json")
      .then((response) => response.text())
      .then((text) => {
        const data = JSON.parse(text);
        // json, radius, shape, materalOptions, container
        drawThreeGeo(
          data,
          radius,
          "sphere",
          {
            color: 0x80ff80,
          },
          planet
        );
      });

    function animate() {
      controls.update();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      //   sphere.rotation.y += 0.0005;
      gsap.to(group.rotation, {
        x: -mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 2,
      });
    }
    animate();

    const raycaster = new THREE.Raycaster();

    addEventListener("pointerdown", (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObject(sphere);
      console.log("intersects", intersects);
      if (intersects.length > 0) {
        const point = intersects[0].point.normalize();

        // Convert intersection point to latitude and longitude
        const latitude = 90 - (Math.acos(point.y) * 180) / Math.PI;
        const longitude =
          (((Math.atan2(point.x, point.z) * 180) / Math.PI + 180) % 360) - 180;

        console.log(
          `Latitude: ${latitude.toFixed(2)}°, Longitude: ${longitude.toFixed(
            2
          )}°`
        );
      }
    });

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-screen"></div>;
};

export default Globe;

// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { useEffect, useRef } from "react";

// const Globe = () => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(
//       60,
//       containerRef.current.clientWidth / containerRef.current.clientHeight,
//       0.1,
//       1000
//     );
//     camera.position.z = 200;

//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(
//       containerRef.current.clientWidth,
//       containerRef.current.clientHeight
//     );
//     containerRef.current.appendChild(renderer.domElement);

//     // Orbit Controls
//     const controls = new OrbitControls(camera, renderer.domElement);

//     // Create Globe
//     const radius = 100;
//     const globe = new THREE.Mesh(
//       new THREE.SphereGeometry(radius, 64, 64),
//       new THREE.MeshBasicMaterial({ color: 0x003366, wireframe: true })
//     );
//     scene.add(globe);

//     // Load GeoJSON
//     fetch("/your-geojson.json")
//       .then((res) => res.json())
//       .then((geoData) => {
//         geoData.features.forEach((feature) => {
//           const coords = feature.geometry.coordinates;
//           const polygons =
//             feature.geometry.type === "Polygon" ? [coords] : coords;

//           polygons.forEach((polygon) => {
//             polygon.forEach((ring) => {
//               const points = ring.map(([lon, lat]) =>
//                 latLongToVector3(lat, lon, radius)
//               );
//               const line = createLine(points);
//               scene.add(line);
//             });
//           });
//         });
//       });

//     const latLongToVector3 = (lat, lon, radius) => {
//       const phi = (90 - lat) * (Math.PI / 180);
//       const theta = (lon + 180) * (Math.PI / 180);
//       const x = -radius * Math.sin(phi) * Math.cos(theta);
//       const z = radius * Math.sin(phi) * Math.sin(theta);
//       const y = radius * Math.cos(phi);
//       return new THREE.Vector3(x, y, z);
//     };

//     const createLine = (points) => {
//       const geometry = new THREE.BufferGeometry().setFromPoints(points);
//       const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
//       return new THREE.LineLoop(geometry, material);
//     };

//     const animate = () => {
//       requestAnimationFrame(animate);
//       controls.update();
//       renderer.render(scene, camera);
//     };
//     animate();

//     // Cleanup
//     return () => {
//       renderer.dispose();
//       containerRef.current.removeChild(renderer.domElement);
//     };
//   }, []);

//   return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
// };

// export default Globe;
