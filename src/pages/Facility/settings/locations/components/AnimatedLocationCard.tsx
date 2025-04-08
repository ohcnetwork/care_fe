import { motion } from "framer-motion";
import { useRef } from "react";

import { LocationList } from "@/types/location/location";

import { LocationCard } from "./LocationCard";

interface AnimatedLocationCardProps {
  location: LocationList;
  onEdit?: (location: LocationList) => void;
  onView?: (location: LocationList) => void;
  onMoveUp?: (location: LocationList) => void;
  onMoveDown?: (location: LocationList) => void;
  className?: string;
  facilityId: string;
  index: number;
  totalCount?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  currentPage?: number;
  setPage?: (page: number) => void;
}

export function AnimatedLocationCard({
  location,
  onEdit,
  onView,
  onMoveUp,
  onMoveDown,
  className,
  facilityId,
  index,
  totalCount,
  isFirstPage,
  isLastPage,
  currentPage,
  setPage,
}: AnimatedLocationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Simple handlers that call the original handlers
  const handleMoveUp = () => {
    if (!onMoveUp) return;
    onMoveUp(location);
  };

  const handleMoveDown = () => {
    if (!onMoveDown) return;
    onMoveDown(location);
  };

  return (
    <motion.div
      layout="position"
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      }}
      ref={cardRef}
      className="w-full"
      data-testid={`location-card-${location.id}`}
    >
      <LocationCard
        location={location}
        onEdit={onEdit}
        onView={onView}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        className={className}
        facilityId={facilityId}
        index={index}
        totalCount={totalCount}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        currentPage={currentPage}
        setPage={setPage}
      />
    </motion.div>
  );
}
