import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

interface RailPanelProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export default function RailPanel({
  children,
  open = true,
  onOpenChange,
}: RailPanelProps) {
  return (
    <div className="relative flex">
      <motion.div
        inert={!open}
        aria-hidden={!open}
        initial={{ width: "auto", opacity: 1 }}
        animate={{ width: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        layout
        className="overflow-hidden pr-3"
      >
        {children}
      </motion.div>

      <div className="relative flex items-center">
        <button
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className={cn(
            "border border-gray-200 rounded-sm bg-gray-200 h-full relative transition-all duration-300 ease-in-out w-auto",
            open ? "cursor-w-resize" : "cursor-e-resize",
          )}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
            <div className="rounded-b-lg rounded-t-lg border border-gray-300 bg-white">
              <GripVertical className="size-4 my-2" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
