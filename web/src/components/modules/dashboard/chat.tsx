"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquareIcon, SendIcon, UserRoundIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { z } from "zod";

const formSchema = z.object({
  message: z.string().min(1),
});

export default function Chat() {
  const [conversation, setConversation] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([
    {
      role: "assistant",
      content: "Hello, how can I help you today?",
    },
  ]);
  const [liveResponse, setLiveResponse] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, liveResponse]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsThinking(true);
    setConversation((prev) => [
      ...prev,
      { role: "user", content: data.message },
    ]);
    form.reset();

    let liveResponse = "";
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: data.message,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      setIsThinking(false);
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });

        liveResponse += text;
        setLiveResponse(liveResponse);
      }

      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: liveResponse },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
      setLiveResponse("");
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="absolute right-4 bottom-4" asChild>
        <Button size={"icon"} className="rounded-full">
          <BotMessageSquareIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[500px] h-[600px] p-0 space-y-4">
        <h1 className="text-xl font-bold text-center p-4 pb-0">
          Personal Accountant
        </h1>
        <hr />
        <div className="pt-0 relative h-full">
          <div className="flex flex-col gap-2 h-[calc(100%-150px)] overflow-y-auto px-4 pb-20">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={cn("flex flex-row gap-2 items-start", {
                  "rounded-lg bg-muted p-2 ml-auto flex-row-reverse":
                    message.role === "user",
                })}
              >
                {message.role === "assistant" && (
                  <BotMessageSquareIcon className="w-4 h-4 shrink-0 mt-1.5" />
                )}
                {message.role === "user" && (
                  <UserRoundIcon className="w-4 h-4 shrink-0 mt-1" />
                )}
                <Markdown className="prose prose-sm prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
                  {message.content}
                </Markdown>
              </div>
            ))}
            {isThinking && (
              <div className="flex flex-row gap-2 items-center">
                <BotMessageSquareIcon className="w-4 h-4" />
                <p className="animate-pulse prose prose-sm">Thinking...</p>
              </div>
            )}
            {liveResponse.length > 0 && (
              <div className="flex flex-row gap-2 items-start">
                <BotMessageSquareIcon className="w-4 h-4 shrink-0 mt-1.5" />
                <Markdown className="prose prose-sm prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
                  {liveResponse}
                </Markdown>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <hr />
          <div className="absolute bottom-20 left-0 right-0 p-4 w-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-row gap-2"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Ask me anything..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button size={"icon"} type="submit">
                  <SendIcon className="w-4 h-4" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
