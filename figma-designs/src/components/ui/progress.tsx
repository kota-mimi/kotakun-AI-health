"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress@1.1.2";

import { cn } from "./utils";

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  color?: string;
  backgroundColor?: string;
}

function Progress({
  className,
  value,
  color,
  backgroundColor,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      style={{ 
        backgroundColor: backgroundColor || 'rgba(148, 163, 184, 0.2)' // slate-400/20
      }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: color || '#4682B4' // Steel Blue as default
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
