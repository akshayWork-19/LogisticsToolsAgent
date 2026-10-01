import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { app } from "./graph.js";
// import { MessagesPlaceholder } from "@langchain/core/prompts";

async function main() {
  const rl = readline.createInterface({ input, output });
  const config = {
    configurable: {
      thread_id: "logistics-session",
    },
  };

  console.log(
    "Logistics assistant ready (order status, ETA, courier availability). Type 'exit' to quit.\n",
  );
  console.log(
    "Try: 'What's the status of order ORD-2234?' or 'Any couriers free in Rohini?'\n",
  );

  while (true) {
    const userInput = await rl.question("You:");
    if (userInput.trim().toLowerCase() === "exit") break;
    // Track message count before invocation to isolate and log new messages from this turn.
    const priorState = await app.getState(config);
    const messageCountBefore = priorState.values.messages?.length ?? 0;

    const result = await app.invoke(
      {
        messages: [
          {
            role: "user",
            content: userInput,
          },
        ],
      },
      config,
    );

    const newMessages = result.messages.slice(messageCountBefore + 1);

    // Print tool calls and intermediate tool outputs generated during this turn.

    for (const msg of newMessages) {
      if (msg instanceof AIMessage && msg.tool_calls?.length) {
        for (const call of msg.tool_calls) {
          console.log(
            `[tool call] ${call.name}(${JSON.stringify(call.args)}) `,
          );
        }
      }
      if (msg instanceof ToolMessage) {
        console.log(`[tool result] ${msg.content}`);
      }
    }

    const reply = result.messages[result.messages.length - 1];
    console.log(`Bot:${reply.content} \n`);
  }
  rl.close();
}

main();
