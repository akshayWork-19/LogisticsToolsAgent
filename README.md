# logistics-tool-agent

A conversational logistics ReAct agent built with LangGraph.js and Groq (`openai/gpt-oss-20b`). The agent leverages dynamic tool calling (`ToolNode` and `toolsCondition`) to autonomously decide when to query order statuses, calculate shipping ETAs, or check regional courier availability before synthesizing an answer.

---

## Architecture & ReAct Loop

```
                         [ START ]
                             |
                             v
                         [ agent ] <---------------+
                   (ChatGroq with tools)           |
                             |                     |
                    [ toolsCondition ]             |
                      /            \               |
            Has tool_calls?      No tool_calls     |
                  /                    \           |
                 v                      v          |
             [ tools ]               [ END ]       |
          (ToolNode execution)                     |
                 |                                 |
                 +---------------------------------+
```

### 1. ReAct Execution Flow (`src/graph.ts`)
- **Tool Binding**: Tools are bound directly to `ChatGroq` via `model.bindTools(tools)`. The LLM evaluates user intent and decides whether to respond directly or emit tool invocations with validated JSON arguments.
- **State Schema**: Uses LangGraph's prebuilt `MessagesAnnotation`.
- **Conditional Routing**: Uses prebuilt `toolsCondition`. If the agent message contains `tool_calls`, control passes to `tools`. Otherwise, the turn concludes at `END`.
- **Multi-Step Execution**: `tools` routes back into `agent`. This allows the model to inspect tool outputs and either call secondary tools or formulate the final user-facing reply in a single turn.
- **Persistence**: Compiled with `MemorySaver` to retain conversational history across turns under a given `thread_id`.

### 2. Registered Tools (`src/tools.ts`)
All tools are defined with `@langchain/core/tools` using Zod input validation schemas:

- **`getOrderStatus`**:
  - *Description*: Retrieves current delivery status by order ID.
  - *Schema*: `{ orderId: string }`.
  - *Returns*: Status stage (`placed`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`).
- **`calculateETA`**:
  - *Description*: Estimates transit time between two Delhi NCR postal codes.
  - *Schema*: `{ originPincode: string, destPincode: string }`.
  - *Returns*: Estimated transit time in hours.
- **`checkCourierAvailablity`**:
  - *Description*: Checks courier partner coverage across Delhi NCR areas (e.g., Dwarka, Rohini, Connaught Place).
  - *Schema*: `{ area: string }`.
  - *Returns*: List of assigned courier identifiers or notification of unavailability.

### 3. CLI Runtime & Event Inspection (`src/index.ts`)
- Runs a terminal input loop via Node `readline`.
- Compares message history lengths before and after each invocation to identify new messages.
- Directly logs intermediate `[tool call]` payloads and `[tool result]` messages as they occur, providing clear visibility into the model's reasoning loop.

---

## File Structure

| File | Purpose |
| --- | --- |
| `src/tools.ts` | Tool definitions (`getOrderStatus`, `calculateETA`, `checkCourierAvailablity`) with Zod schemas. |
| `src/graph.ts` | LangGraph ReAct state graph, tool binding, and `MemorySaver` compilation. |
| `src/index.ts` | Terminal chat loop with tool call and result logging. |
| `package.json` | Project dependencies, scripts, and engine requirements. |
| `tsconfig.json` | TypeScript configuration. |

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Groq API Key (from [console.groq.com](https://console.groq.com))

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Add your Groq API key:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### 3. Start the Agent
Launch the interactive CLI:
```bash
npm run dev
```

Type queries such as:
- *"What's the status of order ORD-2234?"*
- *"Estimate delivery time from 110001 to 110075"*
- *"Are there any couriers available in Rohini?"*

---

## Available Scripts

- `npm run dev` - Runs `src/index.ts` via `tsx`.
- `npm run build` - Compiles TypeScript to `dist/` using `tsc`.
- `npm start` - Runs the compiled entry point `node dist/index.js`.
