"use client";

import React, { useState, useEffect, useRef } from "react";

interface RotatingTextProps {
  texts?: string[]; // Optional for automatic rotation
  message?: string; // Controlled message
  interval?: number; // Time between rotations in milliseconds
}

export const RotatingText: React.FC<RotatingTextProps> = ({
  texts = [],
  message = "",
  interval = 3000,
}) => {
  const [fadeProp, setFadeProp] = useState("opacity-0");
  const prevMessageRef = useRef<string>("");

  useEffect(() => {
    if (texts.length > 0) {
      const timeout = setInterval(() => {
        setFadeProp("opacity-0");

        setTimeout(() => {
          // This part handles automatic rotation
          // Ensure that this setState does not affect controlled messages
          setFadeProp("opacity-100");
        }, 500); // Duration of fade-out before changing text
      }, interval);

      return () => clearInterval(timeout);
    }

    if (message && prevMessageRef.current !== message) {
      setFadeProp("opacity-0");
      setTimeout(() => {
        setFadeProp("opacity-100");
      }, 500);
      prevMessageRef.current = message;
    }
  }, [texts, message, interval]);

  return (
    <span
      className={`transition-opacity duration-500 ${fadeProp} text-lg font-medium text-white`}
    >
      {message || (texts.length > 0 ? texts[0] : "")}
    </span>
  );
}; 