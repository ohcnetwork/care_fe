import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type RailPanelProps = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
};
export default function RailPanel({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  children,
}: RailPanelProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const controlled = typeof openProp === "boolean";
  const open = controlled ? (openProp as boolean) : uncontrolledOpen;

  const setOpen = (val: boolean) => {
    if (controlled) {
      onOpenChange?.(val);
    } else {
      setUncontrolledOpen(val);
      onOpenChange?.(val);
    }
  };

  return (
    <div className="relative flex">
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        layout
        className={cn(
          "bg-sidebar text-sidebar-foreground border-r overflow-hidden pr-3",
          className,
        )}
      >
        {children}
      </motion.div>

      <div className="relative flex items-center">
        <div className="border-r border-gray-300 h-full relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
            <Button
              variant="outline"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className={cn(
                "rounded-full shadow-lg border-gray-300",
                className,
              )}
              size="icon"
            >
              {open ? (
                <ChevronLeft className="size-5" />
              ) : (
                <ChevronRight className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
