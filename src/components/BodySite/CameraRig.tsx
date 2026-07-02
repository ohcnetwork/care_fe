import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { CAMERA_PRESETS, CameraView } from "@/components/BodySite/views";

interface Props {
  view: CameraView;
}

export default function CameraRig({ view }: Props) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    const preset = CAMERA_PRESETS[view];
    targetPos.current.set(...preset.position);
    targetLookAt.current.set(...preset.target);
  }, [view]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={4}
      maxDistance={14}
      makeDefault
    />
  );
}
