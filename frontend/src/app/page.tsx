"use client"
import { Canvas } from "@react-three/fiber"
import { CometScene } from "@/components/comet-scene"

export default function Page() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <CometScene />
      </Canvas>
    </div>
  )
}

