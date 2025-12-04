/**
 * LangGraph Agent with x402 Integration
 *
 * A stateful agent that can use paid and free APIs via x402 protocol
 */

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, Annotation, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { toolRegistry } from '../tools/registry.js';
import { X402Client } from '../x402/client.js';

// Define agent state
const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  totalCost: Annotation<number>({
    reducer: (a, b) => a + b,
    default: () => 0
  }),
  paidToolsUsed: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => []
  })
});

export class X402Agent {
  private model: ChatOpenAI;
  private x402Client: X402Client;
  private graph: any;

  constructor(
    openaiApiKey: string,
    agentWalletPrivateKey: string,
    facilitatorUrl?: string
  ) {
    // Initialize OpenAI model
    this.model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: openaiApiKey
    });

    // Initialize x402 client
    this.x402Client = new X402Client(agentWalletPrivateKey, facilitatorUrl);

    // Initialize tool registry with x402 client
    toolRegistry.initialize(this.x402Client);

    console.log('🤖 X402 Agent initialized');
    console.log(`💼 Wallet address: ${this.x402Client.getAddress()}`);
    console.log(`🔧 Available tools: ${toolRegistry.count()}`);
  }

  /**
   * Build the agent graph
   */
  private buildGraph() {
    // Get LangChain tools from registry
    const tools = toolRegistry.toLangChainTools();

    // Bind tools to model
    const modelWithTools = this.model.bindTools(tools);

    // Create tool node
    const toolNode = new ToolNode(tools);

    // Define the function that determines whether to continue or not
    function shouldContinue(state: typeof AgentState.State) {
      const messages = state.messages;
      const lastMessage: any = messages[messages.length - 1];

      // If there are no tool calls, we're done
      if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
        return 'end';
      }

      // Otherwise continue
      return 'continue';
    }

    // Define the function that calls the model
    async function callModel(state: typeof AgentState.State) {
      const messages = state.messages;
      const response = await modelWithTools.invoke(messages);
      return { messages: [response] };
    }

    // Create the graph
    const workflow = new StateGraph(AgentState)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge('__start__', 'agent')
      .addConditionalEdges('agent', shouldContinue, {
        continue: 'tools',
        end: '__end__'
      })
      .addEdge('tools', 'agent');

    return workflow.compile();
  }

  /**
   * Run the agent
   */
  async run(userMessage: string): Promise<string> {
    // Build graph if not already built
    if (!this.graph) {
      this.graph = this.buildGraph();
    }

    console.log('\n💬 User:', userMessage);
    console.log('🤔 Agent thinking...\n');

    try {
      // Run the graph
      const result = await this.graph.invoke({
        messages: [{ role: 'user', content: userMessage }]
      });

      // Get the final response
      const messages = result.messages;
      const lastMessage = messages[messages.length - 1];
      const response = lastMessage.content;

      console.log('\n🤖 Agent:', response);

      // Display transaction info if any paid tools were used
      const lastTx = this.x402Client.getLastTransaction();
      if (lastTx && lastTx.success && lastTx.transactionHash) {
        const explorerUrl = this.x402Client.getExplorerUrl(
          lastTx.transactionHash,
          lastTx.network || 'base-sepolia'
        );
        console.log('\n💳 Payment Transaction:');
        console.log(`   Hash: ${lastTx.transactionHash}`);
        console.log(`   Network: ${lastTx.network}`);
        console.log(`   Explorer: ${explorerUrl}`);
      }

      return response;

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }

  /**
   * Stream responses (for interactive chat)
   */
  async *stream(userMessage: string) {
    if (!this.graph) {
      this.graph = this.buildGraph();
    }

    console.log('\n💬 User:', userMessage);
    console.log('🤔 Agent thinking...\n');

    try {
      const stream = await this.graph.stream({
        messages: [{ role: 'user', content: userMessage }]
      });

      for await (const chunk of stream) {
        if (chunk.agent) {
          const messages = chunk.agent.messages;
          const lastMessage = messages[messages.length - 1];
          yield lastMessage.content;
        }
      }

      // Display transaction info at the end
      const lastTx = this.x402Client.getLastTransaction();
      if (lastTx && lastTx.success && lastTx.transactionHash) {
        const explorerUrl = this.x402Client.getExplorerUrl(
          lastTx.transactionHash,
          lastTx.network || 'base-sepolia'
        );
        yield `\n\n💳 Payment Transaction:\n   Hash: ${lastTx.transactionHash}\n   Network: ${lastTx.network}\n   Explorer: ${explorerUrl}`;
      }

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      walletAddress: this.x402Client.getAddress(),
      totalTools: toolRegistry.count(),
      lastTransaction: this.x402Client.getLastTransaction()
    };
  }
}
