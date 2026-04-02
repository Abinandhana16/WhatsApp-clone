import React from "react";

export default function UnreadBadge({ count, size = "md" }) {
  if (!count || count < 1) return null;
  const display = count > 99 ? "99+" : count;
  const sizeClasses = size === "sm"
    ? "min-w-[18px] h-[18px] text-xs px-1"
    : "min-w-[22px] h-[22px] text-sm px-1.5";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#25D366] text-white font-semibold ${sizeClasses} animate-badge-pop shadow-sm ml-2`}
      style={{ lineHeight: 1 }}
    >
      {display}
    </span>
  );
}
