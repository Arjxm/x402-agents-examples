# Vercel AI vs CrewAI - Tool Registry Comparison

A side-by-side comparison of the x402 agent implementation using tool registry pattern.

## Quick Overview

| Aspect | Vercel AI (TypeScript) | CrewAI (Python) |
|--------|------------------------|-----------------|
| **Language** | TypeScript | Python |
| **Framework** | Vercel AI SDK | CrewAI |
| **Schema** | Zod | Pydantic |
| **Payment** | ethers.js | eth-account |
| **Pattern** | Registry arrays | Registry arrays ✅ |

## File Structure Comparison

### Vercel AI Implementation

```
vercel-ai-x402-agent/
├── lib/
│   ├── tools-registry.ts      # API registry
│   ├── x402-server.ts         # x402 client
│   └── x402-browser.ts        # Browser client
├── app/
│   ├── api/chat/route.ts      # Chat endpoint
│   └── page.tsx               # UI
└── package.json
```

### CrewAI Implementation

```
x402-crewai-agent/
├── utils/
│   ├── tools_registry.py      # API registry ✅
│   ├── x402_client.py         # x402 client ✅
│   └── x402_handler.py        # Server handler
├── agents/
│   └── x402_agent_registry.py # Agent with registry
├── apis/
│   └── paid_apis.py           # API server
└── requirements.txt
```

## Code Comparison

### 1. Defining an API

#### Vercel AI (TypeScript)

**File: `lib/tools-registry.ts`**

```typescript
import { z } from 'zod';

export const PAID_APIS = [
  {
    name: 'weather',
    description: 'Get current weather for a location (costs $0.10 USDC)',
    endpoint: 'https://api.example.com/weather',
    method: 'GET' as const,
    cost: 0.10,
    schema: z.object({
      city: z.string().describe('City name')
    }),
    transform: (params: any) => ({
      city: params.city
    }),
    buildUrl: (params: any) =>
      `https://api.example.com/weather?city=${params.city}`
  },
  {
    name: 'translation',
    description: 'Translate text (costs $0.15 USDC)',
    endpoint: 'https://api.example.com/translate',
    method: 'POST' as const,
    cost: 0.15,
    schema: z.object({
      text: z.string().describe('Text to translate'),
      target: z.string().describe('Target language')
    }),
    transform: (params: any) => ({
      text: params.text,
      targetLanguage: params.target
    })
  }
];

export const FREE_APIS = [
  {
    name: 'search_web',
    description: 'Search the web using DuckDuckGo (free)',
    endpoint: 'https://api.duckduckgo.com/',
    method: 'GET' as const,
    cost: 0,
    schema: z.object({
      query: z.string().describe('Search query')
    }),
    buildUrl: (params: any) =>
      `https://api.duckduckgo.com/?q=${encodeURIComponent(params.query)}&format=json`
  }
];
```

#### CrewAI (Python)

**File: `utils/tools_registry.py`**

```python
from pydantic import BaseModel
from typing import List
from enum import Enum

class HTTPMethod(str, Enum):
    GET = "GET"
    POST = "POST"

class APIParameter(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True

class APIConfig(BaseModel):
    name: str
    description: str
    endpoint: str
    method: HTTPMethod
    cost: float
    parameters: List[APIParameter]
    transform: Optional[Callable] = None
    build_url: Optional[Callable] = None

PAID_APIS = [
    APIConfig(
        name="weather",
        description="Get current weather for a location (costs $0.10 USD)",
        endpoint="https://api.example.com/weather",
        method=HTTPMethod.GET,
        cost=0.10,
        parameters=[
            APIParameter(
                name="city",
                type="string",
                description="City name",
                required=True
            )
        ],
        transform=lambda params: {
            "city": params.get("city")
        },
        build_url=lambda params:
            f"https://api.example.com/weather?city={params.get('city')}"
    ),
    APIConfig(
        name="translation",
        description="Translate text (costs $0.15 USD)",
        endpoint="https://api.example.com/translate",
        method=HTTPMethod.POST,
        cost=0.15,
        parameters=[
            APIParameter(name="text", type="string", description="Text to translate", required=True),
            APIParameter(name="target", type="string", description="Target language", required=True)
        ],
        transform=lambda params: {
            "text": params.get("text"),
            "targetLanguage": params.get("target")
        }
    )
]

FREE_APIS = [
    APIConfig(
        name="search_web",
        description="Search the web using DuckDuckGo (free)",
        endpoint="https://api.duckduckgo.com/",
        method=HTTPMethod.GET,
        cost=0.0,
        parameters=[
            APIParameter(name="query", type="string", description="Search query", required=True)
        ],
        build_url=lambda params:
            f"https://api.duckduckgo.com/?q={params.get('query')}&format=json"
    )
]
```

### 2. x402 Payment Client

#### Vercel AI (TypeScript)

**File: `lib/x402-server.ts`**

```typescript
import { ethers } from 'ethers';

export class X402ServerClient {
  private wallet: ethers.Wallet;
  private address: string;
  public lastTransactionHash: string | null = null;
  public lastNetwork: string | null = null;

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.address = this.wallet.address;
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Step 1: Try without payment
    let response = await fetch(url, options);

    // Step 2: Handle 402
    if (response.status === 402) {
      const paymentReq = await response.json();
      const method = paymentReq.accepts?.[0] || paymentReq.methods?.[0];

      // Create payment authorization
      const paymentHeader = await this.createPaymentAuthorization(method);

      // Retry with payment
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-PAYMENT': paymentHeader
        }
      });
    }

    return response;
  }

  private async createPaymentAuthorization(method: any): Promise<string> {
    // EIP-712 signature logic
    const domain = { /* ... */ };
    const types = { /* ... */ };
    const message = { /* ... */ };

    const signature = await this.wallet.signTypedData(domain, types, message);

    const payload = {
      x402Version: 1,
      scheme: method.scheme,
      network: method.network,
      payload: { signature, authorization: { /* ... */ } }
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}
```

#### CrewAI (Python)

**File: `utils/x402_client.py`**

```python
from eth_account import Account
from eth_account.messages import encode_structured_data
import base64
import json

class X402Client:
    def __init__(self, private_key: Optional[str] = None):
        self.last_transaction_hash: Optional[str] = None
        self.last_network: Optional[str] = None

        if private_key:
            self.account = Account.from_key(private_key)
            self.address = self.account.address

    def fetch(self, url: str, method: str = "GET",
              headers: Optional[Dict] = None,
              data: Optional[Dict] = None) -> Tuple[bool, Any]:

        # Step 1: Try without payment
        response = requests.get(url, headers=headers)

        # Step 2: Handle 402
        if response.status_code == 402:
            payment_req = response.json()
            challenge = payment_req.get('detail', payment_req)

            # Create payment authorization
            payment_header = self._create_payment_authorization(challenge)

            # Retry with payment
            retry_headers = {**headers, "X-PAYMENT": payment_header}
            response = requests.get(url, headers=retry_headers)

        return response.status_code == 200, response.json()

    def _create_payment_authorization(self, challenge: Dict) -> str:
        # EIP-712 signature logic
        domain = { # ... }
        types = { # ... }
        message = { # ... }

        structured_data = {
            "types": types,
            "primaryType": "TransferWithAuthorization",
            "domain": domain,
            "message": message
        }

        encoded_data = encode_structured_data(structured_data)
        signed_message = self.account.sign_message(encoded_data)
        signature = signed_message.signature.hex()

        payload = {
            "x402Version": 1,
            "scheme": method.get('scheme'),
            "network": method.get('network'),
            "payload": {
                "signature": signature,
                "authorization": { # ... }
            }
        }

        payload_json = json.dumps(payload)
        return base64.b64encode(payload_json.encode()).decode()
```

### 3. Executing Paid APIs

#### Vercel AI (TypeScript)

**File: `lib/tools-registry.ts`**

```typescript
export async function executePaidAPI(
  apiConfig: typeof PAID_APIS[0],
  params: any,
  userId?: string
): Promise<any> {
  console.log(`🔐 Executing paid API: ${apiConfig.name} (cost: $${apiConfig.cost})`);

  try {
    // Build URL if needed
    const url = apiConfig.buildUrl ? apiConfig.buildUrl(params) : apiConfig.endpoint;

    // Transform parameters
    const body = apiConfig.transform(params);

    // Make paid API call using x402
    const response = await x402Client.fetch(url, {
      method: apiConfig.method,
      headers: { 'Content-Type': 'application/json' },
      body: apiConfig.method === 'GET' ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${await response.text()}`);
    }

    const result = await response.json();
    const txInfo = x402Client.getLastTransaction();

    return {
      ...result,
      _transaction: txInfo.hash ? {
        hash: txInfo.hash,
        network: txInfo.network,
        explorerUrl: getExplorerUrl(txInfo.hash, txInfo.network)
      } : null
    };
  } catch (error) {
    console.error(`❌ Paid API call failed:`, error);
    throw error;
  }
}
```

#### CrewAI (Python)

**File: `agents/x402_agent_registry.py`**

```python
def _execute_paid_api(self, api_config: APIConfig, params: Dict[str, Any]) -> str:
    """Execute a paid API call with x402 payment handling"""
    print(f"🔐 Executing PAID API: {api_config.name}")

    try:
        # Build URL if needed
        if api_config.build_url:
            url = api_config.build_url(params)
        else:
            url = api_config.endpoint

        # Transform parameters if needed
        if api_config.transform:
            data = api_config.transform(params)
        else:
            data = params

        # Make request with x402 client
        success, result = self.client.fetch(
            url=url,
            method=api_config.method.value,
            headers=api_config.headers,
            data=data if api_config.method != HTTPMethod.GET else None
        )

        if success:
            # Get transaction info if available
            tx_info = self.client.get_last_transaction()

            # Format result
            result_str = json.dumps(result, indent=2)

            if tx_info.get("hash"):
                result_str += f"\n\n💳 Transaction Details:\n"
                result_str += f"   Hash: {tx_info['hash']}\n"
                result_str += f"   Network: {tx_info['network']}\n"
                result_str += f"   Explorer: {tx_info['explorer_url']}"

            return result_str
        else:
            return f"Error: {json.dumps(result, indent=2)}"

    except Exception as e:
        print(f"❌ Paid API call failed: {str(e)}")
        return f"Error: {str(e)}"
```

### 4. Using the Agent

#### Vercel AI (TypeScript)

**File: `app/api/chat/route.ts`**

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PAID_APIS, FREE_APIS, executePaidAPI, executeFreeAPI } from '@/lib/tools-registry';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Convert APIs to tools
  const tools = {};

  for (const api of [...PAID_APIS, ...FREE_APIS]) {
    tools[api.name] = {
      description: api.description,
      parameters: api.schema,
      execute: async (params: any) => {
        if (api.cost > 0) {
          return executePaidAPI(api, params);
        } else {
          return executeFreeAPI(api, params);
        }
      }
    };
  }

  const result = await streamText({
    model: openai('gpt-4'),
    messages,
    tools,
  });

  return result.toDataStreamResponse();
}
```

#### CrewAI (Python)

**File: `agents/x402_agent_registry.py`**

```python
from crewai import Agent, Task, Crew
from utils.tools_registry import get_all_apis

def create_x402_agent() -> Agent:
    """Create agent with registry-based tools"""

    # Create dynamic tool from registry
    tools = create_dynamic_tools_from_registry()

    agent = Agent(
        role="Information Assistant with x402 Payment Registry",
        goal="Help users by accessing APIs from the tool registry",
        backstory=f"""You can access {len(get_all_apis())} APIs.
        Payment is handled automatically via x402 protocol.""",
        tools=tools,
        verbose=True
    )

    return agent

def process_user_request(user_query: str) -> str:
    """Process request using registry-based agent"""

    agent = create_x402_agent()

    task = Task(
        description=f"User request: {user_query}\n\n"
                   f"Select the appropriate API and call it with correct parameters.",
        agent=agent,
        expected_output="Clear response with information and cost details"
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()
    return str(result)
```

## Key Differences

### 1. Type System

| Aspect | Vercel AI | CrewAI |
|--------|-----------|--------|
| **Schema** | Zod schemas | Pydantic models |
| **Validation** | `z.object()` | `BaseModel` |
| **Runtime** | TypeScript types | Python type hints |

### 2. Async Handling

| Aspect | Vercel AI | CrewAI |
|--------|-----------|--------|
| **Syntax** | `async/await` | `requests` (sync) or `async/await` |
| **Promises** | Native | Using asyncio |

### 3. Crypto Libraries

| Aspect | Vercel AI | CrewAI |
|--------|-----------|--------|
| **Wallet** | `ethers.Wallet` | `eth_account.Account` |
| **Signing** | `wallet.signTypedData()` | `account.sign_message()` |
| **EIP-712** | Built-in ethers | `encode_structured_data()` |

## Similarities

✅ Both use registry arrays (PAID_APIS, FREE_APIS)
✅ Both have transform and buildUrl functions
✅ Both implement EIP-712 signatures
✅ Both handle 402 Payment Required
✅ Both track transactions
✅ Both have cost calculation
✅ Both are easy to extend

## Adding a New API - Side by Side

### Vercel AI

```typescript
// In lib/tools-registry.ts
export const PAID_APIS = [
  // ... existing APIs ...
  {
    name: 'new_service',
    description: 'New service (costs $0.30 USDC)',
    endpoint: 'https://api.example.com/service',
    method: 'POST' as const,
    cost: 0.30,
    schema: z.object({
      input: z.string()
    }),
    transform: (params) => ({ input: params.input })
  }
];
```

### CrewAI

```python
# In utils/tools_registry.py
PAID_APIS = [
    # ... existing APIs ...
    APIConfig(
        name="new_service",
        description="New service (costs $0.30 USD)",
        endpoint="https://api.example.com/service",
        method=HTTPMethod.POST,
        cost=0.30,
        parameters=[
            APIParameter(name="input", type="string", description="Input text", required=True)
        ],
        transform=lambda params: {"input": params.get("input")}
    )
]
```

**Result:** Both take ~10 lines and work immediately!

## Performance

| Metric | Vercel AI | CrewAI |
|--------|-----------|--------|
| **Startup** | Fast (Node.js) | Moderate (Python) |
| **Memory** | ~50-100MB | ~100-200MB |
| **API Call** | Async (fast) | Sync/Async |
| **Streaming** | Native support | Via chunked transfer |

## Use Cases

### Choose Vercel AI When:
- ✅ Building web applications
- ✅ Need streaming responses
- ✅ Want Next.js integration
- ✅ Need browser-based agents

### Choose CrewAI When:
- ✅ Building backend agents
- ✅ Need multi-agent workflows
- ✅ Want role-based agents
- ✅ Need Python ecosystem

## Conclusion

Both implementations follow the **same registry pattern**:

1. ✅ Define APIs in arrays
2. ✅ Automatic x402 payment handling
3. ✅ Easy to add new APIs
4. ✅ Centralized configuration
5. ✅ Type-safe and validated

**The pattern is framework-agnostic** and can be adapted to any agent framework!

---

**Ready to add your own APIs?** Check out:
- [REGISTRY-PATTERN.md](REGISTRY-PATTERN.md) - Full documentation
- [example_registry_usage.py](example_registry_usage.py) - Usage examples
