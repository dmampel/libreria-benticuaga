"use client";

import React from "react";

interface TrustCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorScheme: "emerald" | "blue" | "violet" | "amber";
  rotation: string; // e.g., "rotate-1", "rotate-[-2deg]"
  badgeText?: string;
  hasWashiTape?: boolean;
  tapePosition?: "left" | "right" | "center";
  pinPosition?: "left" | "right" | "center";
}

const colorStyles = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-white",
    tapeColor: "bg-emerald-400/40",
    badge: "bg-emerald-100 text-emerald-700",
    iconText: "text-emerald-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-white",
    tapeColor: "bg-blue-400/40",
    badge: "bg-blue-100 text-blue-700",
    iconText: "text-blue-500",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-white",
    tapeColor: "bg-violet-400/40",
    badge: "bg-violet-100 text-violet-700",
    iconText: "text-violet-500",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-white",
    tapeColor: "bg-amber-400/40",
    badge: "bg-amber-100 text-amber-700",
    iconText: "text-amber-500",
  },
};

export default function TrustCard({
  title,
  description,
  icon,
  colorScheme,
  rotation,
  badgeText,
  hasWashiTape = false,
  tapePosition = "left",
  pinPosition = "center",
}: TrustCardProps) {
  const styles = colorStyles[colorScheme] || colorStyles.blue;

  // Realistic "torn paper" clip path - slightly irregular but preserves most content area
  const tornPath = "polygon(2% 0%, 15% 1%, 28% 0%, 42% 1%, 56% 0%, 71% 1%, 85% 0%, 100% 2%, 99% 15%, 100% 29%, 99% 44%, 100% 58%, 98% 72%, 100% 86%, 98% 100%, 85% 99%, 71% 100%, 56% 99%, 42% 100%, 28% 99%, 15% 100%, 0% 98%, 1% 85%, 0% 71%, 2% 56%, 0% 42%, 1% 28%, 0% 15%)";

  // Position presets for Washi Tape
  const tapeStyles = {
    left: "-top-4 -left-3 -rotate-12",
    right: "-top-4 -right-3 rotate-12",
    center: "-top-5 left-1/2 -translate-x-1/2 -rotate-3",
  };

  // Position presets for Push Pin
  const pinStyles = {
    left: "-top-6 left-6 rotate-[-10deg]",
    right: "-top-6 right-6 rotate-[25deg]",
    center: "-top-8 left-1/2 -translate-x-1/2 rotate-[15deg]",
  };

  return (
    <div 
      className={`group relative flex flex-col items-center text-center overflow-visible rounded-xl ${rotation} transition-all duration-500 hover:rotate-0 hover:scale-105 hover:z-20`}
      style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
    >
      {/* Washi Tape Deco */}
      {hasWashiTape ? (
        <div className={`absolute z-30 h-8 w-24 ${styles.tapeColor} backdrop-blur-sm transform-gpu shadow-sm before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] before:opacity-20 ${tapeStyles[tapePosition]}`} />
      ) : (
        /* Red Push Pin (Chinche) in Perspective */
        <div className={`absolute z-30 ${pinStyles[pinPosition]}`}>
          {/* Pin Shadow on Paper */}
          <div className="absolute top-10 -left-1 h-2 w-6 rounded-full bg-black/15 blur-[2px] -rotate-[15deg]" />
          
          {/* Pin Body (Cylinder) */}
          <div className="mx-auto h-4 w-3 bg-gradient-to-r from-red-800 via-red-600 to-red-900 rounded-b-sm" />
          
          {/* Pin Head (Top Disc) */}
          <div className="relative h-5 w-7 -mt-1 rounded-[100%] bg-gradient-to-br from-red-400 via-red-600 to-red-800 shadow-sm border-b border-white/20">
             {/* Pin Shine */}
             <div className="absolute top-1 left-2 h-1 w-3 rounded-full bg-white/30 blur-[0.5px]" />
          </div>
          
          {/* Tip / Needle pointing into paper */}
          <div className="mx-auto -mt-0.5 h-1 w-0.5 bg-gray-600/40" />
        </div>
      )}

      {/* Main Sticker Body with Torn Edge Effect */}
      <div 
        className={`relative flex flex-col items-center bg-white p-6 border-[1px] border-black/5 overflow-hidden`}
        style={{ clipPath: tornPath }}
      >
        {/* Crumpled / Handmade Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" />
        
        {/* Subtle internal crease shadow (arrugado) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,transparent_0%,black_100%)]" />

        {/* Badge / Label */}
        {badgeText && (
          <span className={`mb-4 inline-block rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-widest ${styles.badge} shadow-sm`}>
            {badgeText}
          </span>
        )}

        {/* Icon with "Stamp" effect */}
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed ${styles.iconText} border-current/20 bg-gray-50/50`}>
          {icon}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[200px] mb-4">
          <h3 className="mb-2 text-xl font-black italic tracking-tight text-gray-900 leading-tight">
            {title}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
