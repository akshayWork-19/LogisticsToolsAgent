import { ChatGroq } from "@langchain/groq";
import {
  StateGraph,
  START,
  END,
  MessagesAnnotation,
  MemorySaver,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools";

/**
 * The actual difference from everything you've built so far: in the
 * email agent and delivery agent, YOUR CODE decided the route
 * (if/else on classification.intent, classification.exceptionType).
 * Here, `.bindTools(tools)` gives the model the tool definitions, and
 * the MODEL decides — per turn — whether to call a tool, which one,
 * and with what arguments. `toolsCondition` just checks whether the
 * model's last message included a tool call; it doesn't decide
 * anything itself.
 */

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.7,
});

const modelWithTools = model.bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await modelWithTools.invoke(state.messages);
  return {
    messages: [response],
  };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent");

const checkpointer = new MemorySaver();
export const app = workflow.compile({ checkpointer });
