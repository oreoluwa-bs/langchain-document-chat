import { Form } from "@remix-run/react";
import { Button, buttonVariants } from "./ui/button";
import Textarea from "react-textarea-autosize";
import { CornerDownLeft, Plus } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "~/lib/utils";
import { useRef } from "react";

export function PromptForm() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <Form action="/?index" method="post">
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  //   router.refresh()
                  //   router.push('/')
                }}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4"
                )}
              >
                <Plus size={16} />
                <span className="sr-only">New Chat</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          //   onKeyDown={onKeyDown}
          rows={1}
          name="prompt"
          placeholder="Ask a question."
          spellCheck={false}
          className="min-h-[60px] border-0 focus-visible:ring-0 w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  //   disabled={isLoading || input === ''}
                >
                  <CornerDownLeft size={16} />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Form>
  );
}
