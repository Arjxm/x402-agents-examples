/**
 * Extensible Tool Registry
 *
 * Easy way to register paid and free APIs/tools for the LangGraph agent
 *
 * To add a new tool:
 * 1. Add entry to TOOL_REGISTRY using registerTool()
 * 2. Define the schema using Zod
 * 3. Implement the execute function
 * 4. That's it! The agent will automatically handle it
 */

import { z } from 'zod';
import { X402Client } from '../x402/client.js';
import { DynamicStructuredTool } from '@langchain/core/tools';

export interface ToolConfig {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  isPaid: boolean;
  cost?: number;
  endpoint?: string;
  execute: (params: any, x402Client?: X402Client) => Promise<any>;
}

class ToolRegistry {
  private tools: Map<string, ToolConfig> = new Map();
  private x402Client: X402Client | null = null;

  /**
   * Initialize with x402 client for paid operations
   */
  initialize(x402Client: X402Client) {
    this.x402Client = x402Client;
  }

  /**
   * Register a new tool
   */
  registerTool(config: ToolConfig) {
    this.tools.set(config.name, config);
    console.log(`🔧 Registered tool: ${config.name} ${config.isPaid ? `(costs $${config.cost})` : '(free)'}`);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolConfig[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): ToolConfig | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Validate parameters
    const validatedParams = tool.schema.parse(params);

    // Execute
    if (tool.isPaid && this.x402Client) {
      console.log(`💰 Executing paid tool: ${name} (cost: $${tool.cost})`);
      return await tool.execute(validatedParams, this.x402Client);
    } else {
      console.log(`🆓 Executing free tool: ${name}`);
      return await tool.execute(validatedParams);
    }
  }

  /**
   * Convert to LangChain tools for LangGraph
   */
  toLangChainTools(): any[] {
    const tools: any[] = [];

    for (const tool of this.tools.values()) {
      const langchainTool = new DynamicStructuredTool({
        name: tool.name,
        description: tool.description,
        schema: tool.schema as any,
        func: async (input: any) => {
          try {
            const result = await this.executeTool(tool.name, input);

            // Format response to include transaction info if paid
            if (tool.isPaid && this.x402Client?.lastTransaction) {
              const tx = this.x402Client.lastTransaction;
              if (tx.success && tx.transactionHash) {
                const explorerUrl = this.x402Client.getExplorerUrl(tx.transactionHash, tx.network || 'base-sepolia');
                return JSON.stringify({
                  ...result,
                  payment: {
                    transactionHash: tx.transactionHash,
                    network: tx.network,
                    explorerUrl
                  }
                }, null, 2);
              }
            }

            return JSON.stringify(result, null, 2);
          } catch (error: any) {
            return JSON.stringify({
              error: error.message,
              tool: tool.name
            });
          }
        }
      } as any);

      tools.push(langchainTool);
    }

    return tools;
  }

  /**
   * Clear all tools
   */
  clear() {
    this.tools.clear();
  }

  /**
   * Get tools count
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Calculate total cost for multiple tools
   */
  calculateCost(toolNames: string[]): number {
    return toolNames.reduce((total, name) => {
      const tool = this.tools.get(name);
      return total + (tool?.isPaid ? tool.cost || 0 : 0);
    }, 0);
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Helper function to register a paid API tool
 */
export function registerPaidAPI(config: {
  name: string;
  description: string;
  endpoint: string;
  schema: z.ZodObject<any>;
  cost: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  transformParams?: (params: any) => any;
}) {
  toolRegistry.registerTool({
    name: config.name,
    description: `${config.description} (costs $${config.cost} USDC)`,
    schema: config.schema,
    isPaid: true,
    cost: config.cost,
    endpoint: config.endpoint,
    execute: async (params: any, x402Client?: X402Client) => {
      if (!x402Client) {
        throw new Error('x402 client not initialized');
      }

      // Transform parameters if needed
      const body = config.transformParams ? config.transformParams(params) : params;

      // Make paid API call using x402
      const response = await x402Client.fetch(config.endpoint, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API call failed: ${error}`);
      }

      return await response.json();
    }
  });
}

/**
 * Helper function to register a free API tool
 */
export function registerFreeAPI(config: {
  name: string;
  description: string;
  endpoint: string;
  schema: z.ZodObject<any>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  buildUrl?: (params: any) => string;
  transformParams?: (params: any) => any;
}) {
  toolRegistry.registerTool({
    name: config.name,
    description: `${config.description} (free)`,
    schema: config.schema,
    isPaid: false,
    endpoint: config.endpoint,
    execute: async (params: any) => {
      const url = config.buildUrl ? config.buildUrl(params) : config.endpoint;
      const body = config.transformParams ? config.transformParams(params) : params;

      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        ...(config.method !== 'GET' && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API call failed: ${error}`);
      }

      return await response.json();
    }
  });
}

/**
 * Helper function to register a custom tool
 */
export function registerCustomTool(config: {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  isPaid: boolean;
  cost?: number;
  execute: (params: any, x402Client?: X402Client) => Promise<any>;
}) {
  toolRegistry.registerTool(config);
}
