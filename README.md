# logistics-tool-agent

Chatbot #4: a real tool-calling ReAct agent. Every prior project used `Command({ goto })` — YOUR code decided the route. This one is different: `.bindTools(tools)` gives the model the tool definitions, and the model decides, per turn, whether to call a tool, which one, and with what arguments. `toolsCondition` just checks whether the last message has `tool_calls` — it doesn't make any decisions itself.

## Setup

```bash
npm install
cp .env.example .env   # add your GROQ_API_KEY
npm run dev
```

## Verified before you got it

- Type-checked clean against the real installed `@langchain/langgraph@0.2.74` types.
- The three mock tools (`tools.ts`) were run standalone (not through the LLM) to confirm their outputs are correct — I couldn't test the actual LLM tool-calling loop myself (no Groq access in this sandbox), so that part is on you to verify.

## What's structurally different from every earlier project

- **State is `MessagesAnnotation`**, not a custom schema like `EmailAgentState`/`DeliveryExceptionState`. No `classification`, no `resolution` — just an accumulating message list, same as chatbot #1.
- **No `Command` anywhere.** Routing is `.addConditionalEdges("agent", toolsCondition)` — the prebuilt function, not something you wrote.
- **The loop can run more than once per turn.** If the model needs two tools to answer one question (e.g. "what's the ETA for order ORD-2234, and are there couriers free near it?"), it'll call one, see the result, decide it needs another, call that, and only then answer — `agent → tools → agent → tools → agent` in a single `invoke()`. Try forcing this with a two-part question and watch the `[tool call]` logs.

## What to poke at

- Ask something that needs NO tool ("what's the capital of France") and confirm `toolsCondition` routes straight to `END` — no `[tool call]` lines at all.
- Ask something that needs exactly one tool, then something that plausibly needs two in the same message. Count how many `[tool call]` lines print for each.
- Add a fourth tool yourself (e.g. `reportDeliveryException`, reusing the exception types from project #3) and see how little wiring it takes — that's the actual payoff of this pattern over `Command` routing: adding a new capability doesn't touch `graph.ts` at all, just `tools.ts`.
- Set `temperature: 0` (already set in `graph.ts`) to `0.9` and ask the same order-status question a few times — does it still reliably call the tool, or does it start hallucinating an answer instead of calling `getOrderStatus`? This is a real, common failure mode worth seeing firsthand.
- `checkCourierAvailability`'s roster only has 3 areas hardcoded. Ask about an area not in the list and check the tool result AND the model's final phrasing — does it correctly say "no couriers," or does it invent one anyway?
