"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai";
import { SendHorizontal, Loader2, MessageSquarePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { ChatContext } from "@/lib/chat/suggestion-chips";
import { mapToolResultToAction } from "@/lib/ai/tools/tool-action-map";
import { saveChatHistoryAction } from "@/app/(app)/recipes/actions";
import type {
  RecipeEditorState,
  RecipeEditorAction,
} from "@/components/recipes/recipe-editor";
import type { UIMessage } from "ai";

type RecipeChatPanelProps = {
  recipeState: RecipeEditorState;
  dispatch: React.Dispatch<RecipeEditorAction>;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  initialMessages?: UIMessage[];
  context?: ChatContext;
};

export function RecipeChatPanel({
  recipeState,
  dispatch,
  onStreamStart,
  onStreamEnd,
  initialMessages,
  context = "recipe",
}: RecipeChatPanelProps) {
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  // Keep a ref to the latest recipeId so the transport closure always sends the right value
  const recipeIdRef = useRef(recipeState.id);
  recipeIdRef.current = recipeState.id;

  // Keep a ref to the latest recipeState for within-batch ingredient lookups
  const recipeStateRef = useRef(recipeState);
  recipeStateRef.current = recipeState;

  // Track which tool call IDs have already been dispatched to avoid double-dispatch.
  // Pre-seed with all tool call IDs from initialMessages so that restored chat history
  // doesn't cause tool results to be re-dispatched on top of state already loaded from DB.
  const processedCallIds = useRef(new Set<string>(
    initialMessages?.flatMap((msg) => {
      if (msg.role !== "assistant") return [];
      return msg.parts
        .filter((p) => isToolUIPart(p))
        .map((p) => (p as unknown as { toolCallId: string }).toolCallId)
        .filter(Boolean);
    }) ?? []
  ));

  // Track whether streaming has started so we don't call onStreamStart on every render
  const streamingStartedRef = useRef(false);

  // Keep a ref to the latest messages for use inside onError (which doesn't receive messages)
  const messagesRef = useRef<UIMessage[]>([]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/recipe",
      // Use a function so the latest recipeId is sent even after createRecipe sets it
      body: () => ({ recipeId: recipeIdRef.current }),
    }),
    messages: initialMessages,
    onFinish: ({ messages: allMessages }) => {
      streamingStartedRef.current = false;
      onStreamEnd?.();
      // Persist chat history after each LLM response completes
      const id = recipeIdRef.current;
      if (id) {
        saveChatHistoryAction(id, allMessages).catch(() => {
          // Silent failure — history save is non-critical
        });
      }
    },
    onError: (error) => {
      streamingStartedRef.current = false;
      onStreamEnd?.();
      setChatError(error instanceof Error ? error.message : String(error));
      // Persist partial conversation on error too
      const id = recipeIdRef.current;
      if (id && messagesRef.current.length > 0) {
        saveChatHistoryAction(id, messagesRef.current).catch(() => {});
      }
    },
  });

  // Keep messagesRef in sync with the latest messages array
  messagesRef.current = messages;

  // Detect when streaming starts
  useEffect(() => {
    if (
      (status === "submitted" || status === "streaming") &&
      !streamingStartedRef.current
    ) {
      streamingStartedRef.current = true;
      onStreamStart?.();
    }
  }, [status, onStreamStart]);

  // Watch tool results and dispatch editor actions as they arrive
  useEffect(() => {
    // Track additions within this batch so updateIngredient/removeIngredient
    // can resolve ingredient_id → tempId for ingredients added earlier in the same stream
    let localIngredients = [...recipeStateRef.current.ingredients];

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;

      for (const part of msg.parts) {
        if (!isToolUIPart(part)) continue;
        if (part.state !== "output-available") continue;

        // ToolUIPart encodes the name in `type` ("tool-{name}"); DynamicToolUIPart has toolName directly.
        // getToolName handles both cases.
        const p = part as unknown as { toolCallId: string; output: unknown };
        if (processedCallIds.current.has(p.toolCallId)) continue;

        const toolName = getToolName(
          part as Parameters<typeof getToolName>[0]
        );
        const stateForLookup = {
          ...recipeStateRef.current,
          ingredients: localIngredients,
        };
        const result = mapToolResultToAction(toolName, p.output, stateForLookup);

        if (result) {
          const list = Array.isArray(result) ? result : [result];
          list.forEach((a) => {
            dispatch(a);
            // Keep localIngredients in sync so subsequent tool calls in the same
            // batch can look up ingredients added earlier
            if (a.type === "ADD_INGREDIENT") {
              localIngredients = [...localIngredients, a.payload];
            } else if (a.type === "REMOVE_INGREDIENT") {
              localIngredients = localIngredients.filter(
                (i) => i.tempId !== a.tempId
              );
            }
          });
        }
        processedCallIds.current.add(p.toolCallId);
      }
    }
  }, [messages, dispatch]); // recipeState intentionally excluded — we use the ref

  const isActive = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isActive) return;
    setChatError(null);
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            headline={t("empty_state", "chat_headline")}
            description={t("empty_state", "chat_description")}
            className="py-8"
          />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1",
                msg.role === "user" ? "items-end" : "items-start"
              )}
            >
              {msg.parts.map((part, idx) => {
                if (part.type === "text") {
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {msg.role === "user" ? (
                        part.text
                      ) : (
                        <div className="chat-prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isToolUIPart(part)) {
                  // Only show tools that are currently running — completed tools are ephemeral
                  if (
                    part.state === "output-available" ||
                    part.state === "output-error"
                  )
                    return null;

                  const toolName = getToolName(
                    part as Parameters<typeof getToolName>[0]
                  );
                  const toolLabel = t(
                    "tool_status",
                    toolName as Parameters<typeof t>[1]
                  );
                  return (
                    <div key={idx} className="flex items-center gap-1.5 py-0.5">
                      <Badge variant="default" className="gap-1 text-[10px]">
                        <Loader2 className="size-3 animate-spin" />
                        {toolLabel}
                      </Badge>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ))
        )}
        {isActive && (
          <div className="flex items-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
              <span className="animate-pulse">···</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips — visible only on pristine empty state */}
      {messages.length === 0 && !input.trim() && (
        <SuggestionChips
          context={context}
          onChipClick={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
        />
      )}

      {/* Stream-level error (distinct from tool errors visible in AI messages) */}
      {chatError && (
        <div className="mx-4 mb-2 rounded-md border border-l-[3px] border-[#E8B8B8] border-l-[#B54545] bg-[#FDE8E8] px-3 py-2 text-xs font-medium text-[#8A2E2E]">
          {chatError}
        </div>
      )}

      {/* Input — fixed at bottom of viewport on mobile (max-lg) */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex gap-2 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:bg-card max-lg:z-10"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Décris ta recette..."
          disabled={isActive}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isActive || !input.trim()}
          aria-label="Envoyer"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </form>
    </div>
  );
}
