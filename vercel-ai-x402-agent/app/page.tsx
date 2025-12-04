'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [totalCost, setTotalCost] = useState(0);

  // Calculate cost from tool calls in messages
  const updateCost = () => {
    let cost = 0;
    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content.includes('Cost: $')) {
        const match = msg.content.match(/Cost: \$(\d+\.?\d*)/);
        if (match) {
          cost += parseFloat(match[1]);
        }
      }
    });
    setTotalCost(cost);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Agent with x402
            </h1>
            <p className="text-sm text-gray-600">
              Powered by Vercel AI SDK + x402 Protocol
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Spent</div>
            <div className="text-2xl font-bold text-blue-600">
              ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Welcome to AI Agent with x402
              </h2>
              <p className="text-gray-600 mb-6">
                I can help you with various tasks using both free and paid APIs
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-semibold text-green-900 mb-2">
                    🆓 Free APIs
                  </div>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Weather information</li>
                    <li>• Web search</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-900 mb-2">
                    💰 Paid APIs (x402)
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI Sentiment Analysis - GPT ($0.10)</li>
                    <li>• Test Sentiment Analysis ($0.10)</li>
                    <li>• Data enrichment ($0.25)</li>
                    <li>• Professional translation ($0.15)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-sm text-gray-500">
                Try: "Analyze the sentiment of 'I love this product!'"
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {message.role === 'user' ? 'You' : '🤖 AI Agent'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Show tool calls */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {message.toolInvocations.map((tool: any, idx: number) => (
                      <div key={idx} className="text-sm bg-gray-50 rounded p-2 mb-2">
                        <div className="font-mono text-xs text-gray-600 mb-1">
                          🔧 {tool.toolName}
                        </div>
                        {tool.state === 'result' && (
                          <div className="text-xs space-y-2">
                            {tool.result.success ? (
                              <>
                                <div className="text-green-600 font-semibold">
                                  ✅ Success {tool.result.cost > 0 && `(Cost: $${tool.result.cost})`}
                                </div>
                                {/* Show detailed transaction info if available */}
                                {(tool.result.data?.transactionHash || tool.result.data?._transaction) && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2 mt-2">
                                    <div className="font-semibold text-blue-900 mb-2">
                                      📝 Transaction Details
                                    </div>

                                    {/* Transaction Hash */}
                                    {tool.result.data.transactionHash && (
                                      <div>
                                        <div className="text-gray-600 mb-1">Transaction Hash:</div>
                                        <div className="font-mono text-xs bg-white p-2 rounded border border-blue-100 break-all">
                                          {tool.result.data.transactionHash}
                                        </div>
                                      </div>
                                    )}

                                    {/* Amount & Network */}
                                    <div className="grid grid-cols-2 gap-2">
                                      {tool.result.data.amount && (
                                        <div>
                                          <div className="text-gray-600">Amount:</div>
                                          <div className="font-semibold text-blue-900">
                                            ${(parseInt(tool.result.data.amount) / 1_000_000).toFixed(2)} USDC
                                          </div>
                                        </div>
                                      )}
                                      {tool.result.data.network && (
                                        <div>
                                          <div className="text-gray-600">Network:</div>
                                          <div className="font-semibold text-blue-900 capitalize">
                                            {tool.result.data.network.replace('-', ' ')}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Block Number */}
                                    {tool.result.data.blockNumber && (
                                      <div>
                                        <div className="text-gray-600">Block Number:</div>
                                        <div className="font-mono text-sm">
                                          #{tool.result.data.blockNumber}
                                        </div>
                                      </div>
                                    )}

                                    {/* Payer Address */}
                                    {tool.result.data.payer && (
                                      <div>
                                        <div className="text-gray-600">Payer Address:</div>
                                        <div className="font-mono text-xs bg-white p-2 rounded border border-blue-100 break-all">
                                          {tool.result.data.payer}
                                        </div>
                                      </div>
                                    )}

                                    {/* Timestamp */}
                                    {tool.result.data.timestamp && (
                                      <div>
                                        <div className="text-gray-600">Timestamp:</div>
                                        <div className="text-sm">
                                          {new Date(tool.result.data.timestamp).toLocaleString()}
                                        </div>
                                      </div>
                                    )}

                                    {/* Explorer Link */}
                                    {tool.result.data?._transaction?.explorerUrl && (
                                      <a
                                        href={tool.result.data._transaction.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline font-semibold mt-2"
                                      >
                                        <span>🔗</span>
                                        <span>View on Block Explorer →</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-red-600">
                                ❌ Error: {tool.result.error}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything... I'll let you know if it costs money!"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Agent will ask for confirmation before using paid APIs
          </div>
        </form>
      </div>
    </div>
  );
}
