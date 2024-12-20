"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { signIn } from "next-auth/react";
import { useState } from "react";

export const LoginModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}) => {
  const [signInClicked, setSignInClicked] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <div className="w-full">
          <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-urban text-2xl font-bold">Sign In</h3>
            <p className="text-sm text-gray-500">
              Start now to improve your productivity
            </p>
          </div>

          <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16">
            <Button
              variant="default"
              disabled={signInClicked}
              onClick={() => {
                void signIn("google");
                setSignInClicked(true);
              }}
            >
              {signInClicked ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <Icons.google className="mr-2 size-4" />
              )}{" "}
              Sign In with Google
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
