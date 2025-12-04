"""
Tool Registry - Easy way to add paid and free APIs for CrewAI agents

To add a new paid API:
1. Add entry to PAID_APIS list
2. That's it! Agent will automatically use x402 for payment
"""

from typing import Dict, Any, List, Optional, Callable
from pydantic import BaseModel, Field
from enum import Enum


class HTTPMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"


class APIParameter(BaseModel):
    """Parameter definition for API calls"""
    name: str
    type: str  # "string", "number", "boolean", "array", "object"
    description: str
    required: bool = True
    default: Any = None


class APIConfig(BaseModel):
    """Configuration for a paid or free API"""
    name: str
    description: str
    endpoint: str
    method: HTTPMethod = HTTPMethod.GET
    cost: float = 0.0
    parameters: List[APIParameter] = []
    transform: Optional[Callable] = None  # Transform parameters before sending
    build_url: Optional[Callable] = None  # Build URL with query params (for GET)
    headers: Dict[str, str] = {}

    class Config:
        arbitrary_types_allowed = True


"""
Define your paid APIs here
Add as many as you want - they'll be available as tools to the agent
"""
PAID_APIS = [
    APIConfig(
        name="test_sentiment_analysis",
        description="Test sentiment analysis with transaction tracking (costs $0.10 USD) - Working demo!",
        endpoint="http://localhost:3000/api/test-paid",
        method=HTTPMethod.POST,
        cost=0.10,
        parameters=[
            APIParameter(
                name="text",
                type="string",
                description="The text to analyze",
                required=True
            )
        ],
        transform=lambda params: {"text": params.get("text")}
    ),

    APIConfig(
        name="weather",
        description="Get current weather for a city (costs $0.10 USD)",
        endpoint="http://localhost:8000/api/weather",
        method=HTTPMethod.GET,
        cost=0.10,
        parameters=[
            APIParameter(
                name="city",
                type="string",
                description="City name to get weather for",
                required=True
            )
        ],
        build_url=lambda params: f"http://localhost:8000/api/weather?city={params.get('city')}"
    ),

    APIConfig(
        name="stock_data",
        description="Get stock market data for a symbol (costs $0.25 USD)",
        endpoint="http://localhost:8000/api/stock_data",
        method=HTTPMethod.GET,
        cost=0.25,
        parameters=[
            APIParameter(
                name="symbol",
                type="string",
                description="Stock symbol (e.g., AAPL, GOOGL)",
                required=True
            )
        ],
        build_url=lambda params: f"http://localhost:8000/api/stock_data?symbol={params.get('symbol')}"
    ),

    APIConfig(
        name="news",
        description="Get latest news articles on any topic (costs $0.15 USD)",
        endpoint="http://localhost:8000/api/news",
        method=HTTPMethod.GET,
        cost=0.15,
        parameters=[
            APIParameter(
                name="topic",
                type="string",
                description="News topic to search for",
                required=True
            )
        ],
        build_url=lambda params: f"http://localhost:8000/api/news?topic={params.get('topic')}"
    ),

    APIConfig(
        name="translation",
        description="Translate text to target language (costs $0.20 USD)",
        endpoint="http://localhost:8000/api/translation",
        method=HTTPMethod.POST,
        cost=0.20,
        parameters=[
            APIParameter(
                name="text",
                type="string",
                description="Text to translate",
                required=True
            ),
            APIParameter(
                name="target_language",
                type="string",
                description="Target language code (e.g., 'es', 'fr', 'de')",
                required=True
            )
        ],
        transform=lambda params: {
            "text": params.get("text"),
            "target_language": params.get("target_language")
        }
    ),

    APIConfig(
        name="data_analysis",
        description="Perform comprehensive data analysis (costs $0.50 USD)",
        endpoint="http://localhost:8000/api/data_analysis",
        method=HTTPMethod.POST,
        cost=0.50,
        parameters=[
            APIParameter(
                name="data",
                type="object",
                description="Data object to analyze",
                required=True
            )
        ],
        transform=lambda params: params.get("data", {})
    ),

    APIConfig(
        name="paid_weather_x402",
        description="Get weather with full x402 payment flow (costs $0.10 USD) - Uses x402 protocol",
        endpoint="https://2701e145a0b0.ngrok-free.app/api/weather",
        method=HTTPMethod.GET,
        cost=0.10,
        parameters=[
            APIParameter(
                name="latitude",
                type="number",
                description="Latitude coordinate",
                required=True
            ),
            APIParameter(
                name="longitude",
                type="number",
                description="Longitude coordinate",
                required=True
            )
        ],
        build_url=lambda params: f"https://2701e145a0b0.ngrok-free.app/api/weather?latitude={params.get('latitude')}&longitude={params.get('longitude')}"
    ),
]


"""
Define your free APIs here
"""
FREE_APIS = [
    APIConfig(
        name="search_web",
        description="Search the web using DuckDuckGo (free)",
        endpoint="https://api.duckduckgo.com/",
        method=HTTPMethod.GET,
        cost=0.0,
        parameters=[
            APIParameter(
                name="query",
                type="string",
                description="Search query",
                required=True
            )
        ],
        build_url=lambda params: f"https://api.duckduckgo.com/?q={params.get('query')}&format=json"
    ),

    APIConfig(
        name="free_joke",
        description="Get a random joke (free)",
        endpoint="https://official-joke-api.appspot.com/random_joke",
        method=HTTPMethod.GET,
        cost=0.0,
        parameters=[]
    ),
]


def get_all_apis() -> List[APIConfig]:
    """Get all available APIs (paid + free)"""
    return PAID_APIS + FREE_APIS


def get_api_by_name(name: str) -> Optional[APIConfig]:
    """Get API configuration by name"""
    for api in get_all_apis():
        if api.name == name:
            return api
    return None


def get_paid_apis() -> List[APIConfig]:
    """Get only paid APIs"""
    return PAID_APIS


def get_free_apis() -> List[APIConfig]:
    """Get only free APIs"""
    return FREE_APIS


def calculate_cost(api_names: List[str]) -> float:
    """Calculate total cost for multiple API calls"""
    total = 0.0
    for name in api_names:
        api = get_api_by_name(name)
        if api:
            total += api.cost
    return total


def get_api_summary() -> Dict[str, Any]:
    """Get summary of all available APIs"""
    paid_apis = get_paid_apis()
    free_apis = get_free_apis()

    return {
        "total_apis": len(get_all_apis()),
        "paid_apis": len(paid_apis),
        "free_apis": len(free_apis),
        "total_paid_cost": sum(api.cost for api in paid_apis),
        "api_list": {
            "paid": [{"name": api.name, "cost": api.cost, "description": api.description} for api in paid_apis],
            "free": [{"name": api.name, "description": api.description} for api in free_apis]
        }
    }
