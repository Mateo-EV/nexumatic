"use client";

import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoginModal } from "@/providers/LoginModalProvider";
import { ArrowRightIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Link } from "next-view-transitions";

// const links = [
//   {
//     title: "Documentation",
//     href: "#",
//   },
//   {
//     title: "Guides",
//     href: "#",
//   },
// ];

export const Navbar = () => {
  const { status } = useSession();
  const { setIsOpen } = useLoginModal();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-center bg-background/60 backdrop-blur-xl">
      <MaxWidthWrapper className="flex h-14 items-center justify-between py-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/">
            <span className="text-xl font-bold">Nexu</span>
            <span className="text-xl font-bold text-blue-500">matic</span>
          </Link>

          {/* {links && links.length > 0 ? (
            <nav className="hidden gap-6 md:flex">
              {links.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  prefetch={true}
                  className="flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:text-sm"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null} */}
        </div>

        <div className="flex items-center space-x-3">
          {status === "authenticated" ? (
            <Link href="/dashboard" className="md:block">
              <Button className="gap-2 px-5" size="sm">
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : status === "unauthenticated" ? (
            <Button
              className="gap-2 px-5"
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              <span>Sign In</span>
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <Skeleton className="h-9 w-28 rounded-full" />
          )}
        </div>
      </MaxWidthWrapper>
    </header>
  );
};
