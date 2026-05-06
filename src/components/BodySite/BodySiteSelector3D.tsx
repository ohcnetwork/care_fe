import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { BodyMesh } from "@/components/BodySite/BodyMesh";
import {
  BODY_REGIONS,
  BodyRegion,
  findRegionByCode,
} from "@/components/BodySite/bodySiteRegions";

import { Code } from "@/types/base/code/code";

interface Props {
  value?: Code | null;
  onSelect: (code: Code) => void;
  className?: string;
  height?: number | string;
  allowedCodes?: string[];
}

export default function BodySiteSelector3D({
  value,
  onSelect,
  className,
  height = 480,
  allowedCodes,
}: Props) {
  const { t } = useTranslation();
  const selected = findRegionByCode(value);

  const regions = allowedCodes
    ? BODY_REGIONS.filter((r) => allowedCodes.includes(r.code.code))
    : BODY_REGIONS;

  const handleSelect = (region: BodyRegion) => {
    onSelect(region.code);
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden",
        className,
      )}
      style={{ height }}
    >
      <Canvas shadows camera={{ position: [0, 1.5, 8], fov: 35 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1.0}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <group position={[0, 0, 0]}>
            {regions.map((region) => (
              <BodyMesh
                key={region.id}
                region={region}
                selected={selected?.id === region.id}
                onSelect={handleSelect}
              />
            ))}
          </group>
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={14}
            target={[0, 0.8, 0]}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <div className="rounded-md bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow-sm">
          {selected ? (
            <span>
              <span className="font-medium">{t("selected")}:</span>{" "}
              {selected.code.display}{" "}
              <span className="text-gray-400">({selected.code.code})</span>
            </span>
          ) : (
            <span className="text-gray-500">{t("body_site_3d_hint")}</span>
          )}
        </div>
        <div className="rounded-md bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow-sm">
          {t("body_site_3d_drag_hint")}
        </div>
      </div>
    </div>
  );
}
