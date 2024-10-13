"use client";

import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTriggerManual,
} from "@/components/ui/dropdown-menu";
import {
  AutosizeTextarea,
  type AutosizeTextAreaProps,
  type AutosizeTextAreaRef,
} from "@/components/ui/textarea";
import { XIcon } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

export const TextAreaSelector = forwardRef<
  HTMLDivElement,
  AutosizeTextAreaProps & { onValueChange?: (v: string) => void }
>(({ onValueChange, ...props }, ref) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const textAreaRef = useRef<AutosizeTextAreaRef>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    if (selectedOption) {
      onValueChange?.(`{{${selectedOption}}}`);
      textAreaRef.current!.textArea.value = "";
    } else {
      onValueChange?.("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  return (
    <DropdownMenuSub open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
      <div className="relative" ref={ref}>
        <DropdownMenuSubTriggerManual />
        <AutosizeTextarea
          {...props}
          ref={textAreaRef}
          onFocus={() => {
            setIsSelectorOpen(true);
          }}
          onChange={(e) => {
            onValueChange?.(e.currentTarget.value);
          }}
        />
        {selectedOption && (
          <div
            className="absolute left-2 top-2 flex cursor-pointer items-center border bg-secondary p-1 text-xs text-black"
            onClick={() => setSelectedOption(null)}
          >
            <span>Manual Content</span>
            <XIcon className="ml-2 size-4" />
          </div>
        )}
      </div>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          sideOffset={10}
          className="w-[18rem]"
          onFocusOutside={(e) => {
            if (textAreaRef.current!.textArea === document.activeElement) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex flex-wrap gap-4 p-4">
            <div
              className="cursor-pointer border bg-secondary p-1 text-xs text-black"
              onClick={() => setSelectedOption("Manual Content")}
            >
              Manual Content
            </div>
            <div className="cursor-pointer border bg-secondary p-1 text-xs text-black">
              Logical
            </div>
            <div className="cursor-pointer border bg-secondary p-1 text-xs text-black">
              Divider
            </div>
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
});

TextAreaSelector.displayName = "TextAreaSelector";
