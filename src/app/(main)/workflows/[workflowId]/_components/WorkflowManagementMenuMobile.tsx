"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function WorkflowManagementMenuMobile() {
  const isMobile = useMediaQuery("(max-width: 1024px)");

  if (!isMobile) return null;

  return;
}
