"use client";

import React, { useRef } from "react";
import "../globals.css";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardHeader } from "@/components/dashboard-header";

const logo = "/logo.png"


// Skydome component (runs inside Canvas)
function Skydome() {
  const skydomeRef = useRef<THREE.Mesh>(null);
  const skyTexture = useTexture("/clouds.png");

  // Clone and configure texture
  const configuredSkyTexture = React.useMemo(() => {
    if (!skyTexture) return undefined;
    const t = skyTexture.clone();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any).encoding = (THREE as any).sRGBEncoding;
    t.flipY = false;
    t.needsUpdate = true;
    return t;
  }, [skyTexture]);

  // Rotate dome slowly
  useFrame((_, delta) => {
    if (skydomeRef.current) {
      skydomeRef.current.rotation.y += delta * 0.13;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff8c5a" />

      {/* Environment reflections */}
      <Environment preset="sunset" />

      {/* Skydome */}
      <mesh ref={skydomeRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[5, 100, 100]} />
        <meshBasicMaterial side={THREE.BackSide} map={configuredSkyTexture} />
      </mesh>
    </>
  );
}

// Layout
export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* === Background Skydome === */}
      <div className="absolute inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <Skydome />
        </Canvas>
      </div>

    
      <div className="flex h-full">
        <div className="h-full w-full z-[-1] absolute right-0 backdrop-blur-sm bg-black/10"></div>
        <div className="h-full w-full z-[-1]  absolute right-0 top-[71px] bg-white"></div>
        <aside className="w-64 border-r">
          <div className="flex flex-row justify-center items-center space-x-3">
            <img src={logo} className="w-8 h-8 invert" alt="Simply Law Logo"/>

            <div className="flex h-16 items-center">
                <h2 className="text-lg font-semibold text-white">
                    <Link href="/">
                    Simply Law
                </Link>
            </h2>
          </div>
      </div>

          <DashboardNav />
        </aside>

       
        <div className="flex flex-1 flex-col overflow-hidden">

          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 text-white bg-white">
            {children}
          </main>
        </div>
      </div>
     
    </div>
  );
}
