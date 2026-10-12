import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import * as THREE from "three";

export type BallShot = {
  /** 0..1 strength of the green rim lights behind the ball. */
  rim: number;
  /** 0..1 strength of the white key light. */
  key: number;
  /** Key light orbit angle (radians): sweeping it rakes light across the dimples. */
  keyAngle: number;
  /** 0..1 green glow where the ball sits in the tee cup. */
  cupGlow: number;
  /** Camera position and the height it looks at. */
  camera: { x: number; y: number; z: number; lookY: number; fov: number };
  /** Ball spin (radians) and launch offset in world units. */
  spin: number;
  launch: { x: number; y: number; z: number };
  /** Tee wobble after the strike (radians). */
  teeTilt: number;
};

// Ball radius is 1 world unit. The ball rests in the tee cup at this height.
const REST_Y = 0.955;
const GREEN = new THREE.Color("#2bd46e");

// Classic wooden-tee silhouette, spun on a lathe (x = radius, y = height).
const TEE_PROFILE = [
  [0.0, -0.06],
  [0.16, -0.04],
  [0.29, 0.0],
  [0.31, -0.03],
  [0.24, -0.13],
  [0.15, -0.32],
  [0.115, -0.6],
  [0.1, -2.2],
  [0.07, -2.55],
  [0.02, -2.75],
  [0.0, -2.76],
].map(([x, y]) => new THREE.Vector2(x, y));

const useBallTextures = () => {
  const [textures, setTextures] = useState<{
    map: THREE.Texture;
    normal: THREE.Texture;
  } | null>(null);
  const [handle] = useState(() => delayRender("Loading golf ball textures"));
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all([
      loader.loadAsync(staticFile("advert/ball-color.png")),
      loader.loadAsync(staticFile("advert/ball-normal.png")),
    ])
      .then(([map, normal]) => {
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        normal.anisotropy = 8;
        setTextures({ map, normal });
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return textures;
};

const Rig: React.FC<{
  shot: BallShot;
  textures: { map: THREE.Texture; normal: THREE.Texture };
}> = ({ shot, textures }) => {
  const teeGeometry = useMemo(
    () => new THREE.LatheGeometry(TEE_PROFILE, 96),
    [],
  );
  const { camera: cam } = shot;
  const keyX = Math.cos(shot.keyAngle) * 4.2;
  const keyZ = Math.sin(shot.keyAngle) * 4.2;

  return (
    <>
      <CameraRig {...cam} />
      <ambientLight intensity={0.015} />
      {/* Key: cool white from above, orbiting to rake the dimples. */}
      <spotLight
        position={[keyX, 4.5, keyZ]}
        intensity={13 * shot.key}
        angle={0.42}
        penumbra={0.9}
        decay={0}
        color="#f3f6ff"
      />
      {/* Green rims from behind, left and right. */}
      <spotLight
        position={[-3.2, 2.2, -3.6]}
        intensity={60 * shot.rim}
        angle={0.5}
        penumbra={0.7}
        decay={0}
        color={GREEN}
      />
      <spotLight
        position={[3.4, 0.6, -3.8]}
        intensity={46 * shot.rim}
        angle={0.5}
        penumbra={0.7}
        decay={0}
        color={GREEN}
      />
      <pointLight
        position={[0, 0.05, 0.35]}
        intensity={6 * shot.cupGlow}
        distance={1.6}
        decay={1}
        color={GREEN}
      />

      <group
        position={[shot.launch.x, REST_Y + shot.launch.y, shot.launch.z]}
        rotation={[shot.spin * 0.6, shot.spin, 0]}
      >
        <mesh>
          <sphereGeometry args={[1, 160, 110]} />
          <meshPhysicalMaterial
            map={textures.map}
            normalMap={textures.normal}
            normalScale={new THREE.Vector2(1, -1)}
            roughness={0.42}
            clearcoat={0.35}
            clearcoatRoughness={0.3}
            sheen={0.2}
            sheenColor="#dfffe9"
          />
        </mesh>
      </group>

      <group rotation={[0, 0, shot.teeTilt]} position={[0, 0, 0]}>
        <mesh geometry={teeGeometry}>
          <meshPhysicalMaterial
            color="#0d110f"
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.08}
            metalness={0.1}
          />
        </mesh>
      </group>
    </>
  );
};

// Points the default r3f camera. Nothing animates on its own: every value
// comes from the current frame.
const CameraRig: React.FC<BallShot["camera"]> = ({ x, y, z, lookY, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(x, y, z);
  camera.fov = fov;
  camera.near = 0.05;
  camera.far = 100;
  camera.lookAt(0, lookY, 0);
  camera.updateProjectionMatrix();
  return null;
};

// The hero object: a dimpled golf ball on a glossy black tee, lit from
// darkness by green rim lights. Fully frame-driven through `shot`.
export const GolfBall3D: React.FC<{
  width: number;
  height: number;
  shot: BallShot;
}> = ({ width, height, shot }) => {
  const textures = useBallTextures();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      {textures ? <Rig shot={shot} textures={textures} /> : null}
    </ThreeCanvas>
  );
};
