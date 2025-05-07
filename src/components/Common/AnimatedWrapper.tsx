import { MotionProps, motion } from "framer-motion";
import React from "react";

interface AnimatedWrapperProps extends MotionProps {
  children: React.ReactNode;
  keyValue: string | number;
  containerClassName?: string;
}

export function AnimatedWrapper({
  children,
  keyValue,
  containerClassName,
  ...rest
}: AnimatedWrapperProps) {
  return (
    <motion.div
      key={keyValue}
      layout
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={containerClassName}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
