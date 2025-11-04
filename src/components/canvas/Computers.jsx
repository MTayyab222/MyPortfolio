import React, { Suspense, useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import CanvasLoader from "../Loader";

// Advanced model cleaner
const useCleanModel = (url) => {
  const [cleanScene, setCleanScene] = useState(null);
  const gltf = useGLTF(url);

  useEffect(() => {
    if (gltf.scene) {
      const cleanedScene = gltf.scene.clone();

      cleanedScene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const geometry = child.geometry;
          const position = geometry.attributes.position;

          if (position) {
            const array = position.array;
            let needsFix = false;

            // Check and fix NaN values
            for (let i = 0; i < array.length; i++) {
              if (isNaN(array[i]) || !isFinite(array[i])) {
                array[i] = 0;
                needsFix = true;
              }
            }

            if (needsFix) {
              console.log("Fixed NaN values in geometry");
              position.needsUpdate = true;
            }

            // Compute bounding sphere manually
            try {
              geometry.computeBoundingSphere();
            } catch (error) {
              console.warn(
                "Failed to compute bounding sphere, setting manually"
              );
              geometry.boundingSphere = new THREE.Sphere(
                new THREE.Vector3(0, 0, 0),
                5
              );
            }

            // Force bounding sphere if still invalid
            if (
              !geometry.boundingSphere ||
              isNaN(geometry.boundingSphere.radius) ||
              geometry.boundingSphere.radius === 0
            ) {
              geometry.boundingSphere = new THREE.Sphere(
                new THREE.Vector3(0, 0, 0),
                5
              );
            }
          }
        }
      });

      setCleanScene(cleanedScene);
    }
  }, [gltf.scene]);

  return cleanScene;
};

const Computers = ({ isMobile }) => {
  const cleanScene = useCleanModel("/desktop_pc/scene.gltf");

  if (!cleanScene) {
    return <FallbackComputer isMobile={isMobile} />;
  }

  return (
    <mesh>
      <hemisphereLight intensity={1.5} groundColor="black" />
      <pointLight intensity={3} />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.18}
        penumbra={0}
        intensity={5}
        castShadow
        shadow-mapSize={3024}
      />
      <primitive
        object={cleanScene}
        scale={isMobile ? 0.3 : 0.6}
        position={isMobile ? [0, -3, -2.2] : [0, -3.7, -1.4]}
        rotation={[-0.01, -0.2, -0.1]}
      />
    </mesh>
  );
};

// Fallback component
const FallbackComputer = ({ isMobile }) => {
  return (
    <group>
      <hemisphereLight intensity={1.5} groundColor="black" />
      <pointLight intensity={3} />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.18}
        penumbra={0}
        intensity={5}
        castShadow
        shadow-mapSize={3024}
      />
      {/* Simple computer-like geometry */}
      <mesh
        scale={isMobile ? 0.3 : 0.6}
        position={isMobile ? [0, -3, -2.2] : [0, -3.7, -1.4]}
        rotation={[-0.01, -0.2, -0.1]}
      >
        <boxGeometry args={[3, 2, 1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh
        scale={isMobile ? 0.25 : 0.5}
        position={isMobile ? [0, -1.5, -2.5] : [0, -2, -2]}
        rotation={[-0.01, -0.2, -0.1]}
      >
        <boxGeometry args={[2.5, 0.1, 1.5]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");
    setIsMobile(mediaQuery.matches);

    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{ position: [20, 3, 5], fov: 25 }}
      gl={{ preserveDrawingBuffer: true }}
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Computers isMobile={isMobile} />
      </Suspense>

      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;
