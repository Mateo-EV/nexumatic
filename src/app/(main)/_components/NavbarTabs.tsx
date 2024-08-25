"use client";

import { cn, sleep } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTransitionRouter } from "next-view-transitions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const menuOptions = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Workflows", href: "/workflows" },
  { name: "Connections", href: "/connections" },
  { name: "Settings", href: "/settings" },
  { name: "Billing", href: "/billing" },
];

const transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.15,
};

function getFirstPath(pathname: string) {
  return `/${pathname.split("/")[1]}`;
}

export const NavbarTabs = () => {
  const pathname = usePathname();

  const [selected, setSelected] = useState(getFirstPath(pathname));

  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const navRef = useRef<HTMLDivElement>(null);
  const [navRect, setNavRect] = useState<DOMRect | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);

  const [hoveredTabIndex, setHoveredTabIndex] = useState<string | null>(null);
  const hoveredRect =
    buttonRefs.current[hoveredTabIndex ?? -1]?.getBoundingClientRect();

  const router = useTransitionRouter();

  useEffect(() => {
    setNavRect(navRef.current!.getBoundingClientRect());
    setSelectedRect(buttonRefs.current[selected]!.getBoundingClientRect());
  }, [selected]);

  useEffect(() => {
    setSelected(getFirstPath(pathname));
  }, [pathname]);

  const handleClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();

    setSelected(href);

    await sleep(200);
    router.push(href);
  };

  return (
    <nav
      ref={navRef}
      className="relative z-0 flex flex-shrink-0 items-center justify-center pb-2"
      onPointerLeave={() => setHoveredTabIndex(null)}
    >
      {menuOptions.map(({ name, href }) => {
        const isActive = selected === href;

        return (
          <div
            key={name}
            ref={(el) => {
              buttonRefs.current[href] = el;
            }}
          >
            <Link
              href={href}
              className={cn(
                "relative z-20 mb-0.5 flex h-8 select-none items-center px-4 text-sm font-semibold transition-colors",
                isActive ? "text-primary" : "hover:text-accent-foreground",
              )}
              onPointerEnter={() => {
                setHoveredTabIndex(href);
              }}
              onFocus={() => {
                setHoveredTabIndex(href);
              }}
              onClick={(e) => handleClick(e, href)}
            >
              {name}
            </Link>
          </div>
        );
      })}

      <AnimatePresence>
        {hoveredRect && navRect && (
          <motion.div
            key={"hover"}
            className="absolute left-0 top-0 z-10 mb-1 rounded-sm bg-accent p-1 dark:bg-zinc-800"
            initial={{
              x: hoveredRect.left - navRect.left,
              y: hoveredRect.top - navRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height,
              opacity: 0,
            }}
            animate={{
              x: hoveredRect.left - navRect.left,
              y: hoveredRect.top - navRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height,
              opacity: 1,
            }}
            exit={{
              x: hoveredRect.left - navRect.left,
              y: hoveredRect.top - navRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height,
              opacity: 0,
            }}
            transition={transition}
          />
        )}
      </AnimatePresence>

      {selectedRect && navRect && (
        <motion.div
          className={"absolute bottom-0 left-0 z-10 h-[3px] bg-primary"}
          initial={false}
          animate={{
            width: selectedRect.width,
            x: `calc(${selectedRect.left - navRect.left}px)`,
            opacity: 1,
          }}
          transition={transition}
        />
      )}
    </nav>
  );
};
