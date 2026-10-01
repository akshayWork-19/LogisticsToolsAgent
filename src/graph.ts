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

// ReAct agent loop: binds tools to ChatGroq and routes conditionally via toolsCondition.

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
