import { AnimatePresence, motion } from "framer-motion";

interface AnimatedCounterProps {
  count: number;
}

export function AnimatedCounter({ count }: AnimatedCounterProps) {
  return (
    <div className="inline-flex items-center justify-center overflow-hidden h-4 min-w-4">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 0.5,
          }}
          className="inline-block"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
