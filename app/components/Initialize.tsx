'use client';

import { Blobatar } from "@blobatar/react";
import { thinking, surprised } from "blobatar/expression";
import "blobatar/motion.css";
import { cx } from "class-variance-authority";
import { useState } from "react";

interface InitializeProps {
  handleInitialize: () => Promise<void>;
  shouldInitDb: boolean;
}

export function Initialize({
  handleInitialize,
  shouldInitDb,
}: InitializeProps) {
  const [shouldThink, setShouldThink] = useState(false);

  const expression = () => {
    if (shouldThink) {
      return thinking;
    } else if (!shouldInitDb) {
      return surprised;
    }
    return undefined;
  }

  return (
    <dialog className={
      cx(
        "fixed top-0 left-0 w-full h-full flex flex-col items-center",
        "justify-center p-4 rounded shadow-md bg-black text-white z-99"
      )
    }>
      <div className="flex-1 max-h-[300px]">
        <div className="mb-4 h-20 w-full flex items-center justify-center">
          <Blobatar
            name="8ool!574ck"
            traits={{ shape: 0.54 }}
            size={120}
            expression={expression()}
            animate="always"
          />
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold tracking-tight"
        onClick={() => {
          setShouldThink(true);
          console.log("CLICKED")
          handleInitialize().then(() => {
            setShouldThink(false);
          });
        }}
      >
        Get Started
      </button>
    </dialog>
  )
}