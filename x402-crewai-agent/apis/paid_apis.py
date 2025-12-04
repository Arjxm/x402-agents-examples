"""
Paid API Endpoints with x402 Protocol Integration
Provides various paid services (weather, data analysis, etc.)
"""
from fastapi import FastAPI, Header, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import random
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.x402_handler import payment_handler

app = FastAPI(title="x402 Paid APIs", description="Payment-gated API services using x402 protocol")


class PaymentRequest(BaseModel):
    challenge_id: str
    payment_token: str


class ResourceRequest(BaseModel):
    query: str
    access_token: Optional[str] = None


# API Pricing
API_PRICING = {
    "weather": 0.10,
    "stock_data": 0.25,
    "news": 0.15,
    "translation": 0.20,
    "data_analysis": 0.50
}


def require_payment(resource: str, access_token: Optional[str] = None):
    """Decorator-like function to check payment for a resource"""
    if not access_token:
        # No token provided, return payment challenge
        challenge = payment_handler.generate_payment_challenge(
            resource=resource,
            cost=API_PRICING.get(resource, 0.10)
        )
        raise HTTPException(
            status_code=402,
            detail=challenge,
            headers=payment_handler.create_payment_response_headers(challenge)
        )

    # Validate token
    if not payment_handler.validate_access_token(access_token, resource):
        challenge = payment_handler.generate_payment_challenge(
            resource=resource,
            cost=API_PRICING.get(resource, 0.10)
        )
        raise HTTPException(
            status_code=402,
            detail=challenge,
            headers=payment_handler.create_payment_response_headers(challenge)
        )


@app.get("/")
async def root():
    """API Information"""
    return {
        "name": "x402 Paid APIs",
        "version": "1.0.0",
        "protocol": "x402",
        "available_endpoints": list(API_PRICING.keys()),
        "pricing": API_PRICING,
        "instructions": {
            "1": "Make a request to any paid endpoint without token",
            "2": "Receive 402 Payment Required with challenge_id",
            "3": "Submit payment using /payment endpoint",
            "4": "Use returned access_token for API calls"
        }
    }


@app.post("/payment")
async def process_payment(payment: PaymentRequest):
    """Process payment for a resource access"""
    result = payment_handler.process_payment(
        challenge_id=payment.challenge_id,
        payment_token=payment.payment_token
    )

    if result["success"]:
        return JSONResponse(content=result, status_code=200)
    else:
        return JSONResponse(content=result, status_code=400)


@app.get("/api/weather")
async def get_weather(
    city: str,
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    """
    Get weather information for a city (Paid API - $0.10)
    Requires x402 payment
    """
    require_payment("weather", access_token)

    # Simulate weather data
    weather_data = {
        "city": city,
        "temperature": random.randint(15, 35),
        "condition": random.choice(["Sunny", "Cloudy", "Rainy", "Partly Cloudy"]),
        "humidity": random.randint(30, 90),
        "wind_speed": random.randint(5, 25),
        "timestamp": datetime.now().isoformat(),
        "cost": API_PRICING["weather"]
    }

    return weather_data


@app.get("/api/stock_data")
async def get_stock_data(
    symbol: str,
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    """
    Get stock data for a symbol (Paid API - $0.25)
    Requires x402 payment
    """
    require_payment("stock_data", access_token)

    # Simulate stock data
    base_price = random.uniform(50, 500)
    stock_data = {
        "symbol": symbol.upper(),
        "price": round(base_price, 2),
        "change": round(random.uniform(-10, 10), 2),
        "volume": random.randint(1000000, 10000000),
        "market_cap": f"${random.randint(1, 100)}B",
        "timestamp": datetime.now().isoformat(),
        "cost": API_PRICING["stock_data"]
    }

    return stock_data


@app.get("/api/news")
async def get_news(
    topic: str,
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    """
    Get news articles for a topic (Paid API - $0.15)
    Requires x402 payment
    """
    require_payment("news", access_token)

    # Simulate news data
    news_data = {
        "topic": topic,
        "articles": [
            {
                "title": f"Breaking: {topic} developments shake the market",
                "source": "Tech News Daily",
                "published_at": datetime.now().isoformat()
            },
            {
                "title": f"Analysis: What {topic} means for the future",
                "source": "Business Insider",
                "published_at": datetime.now().isoformat()
            },
            {
                "title": f"Expert insights on {topic}",
                "source": "Industry Watch",
                "published_at": datetime.now().isoformat()
            }
        ],
        "cost": API_PRICING["news"]
    }

    return news_data


@app.post("/api/translation")
async def translate_text(
    text: str,
    target_language: str,
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    """
    Translate text to target language (Paid API - $0.20)
    Requires x402 payment
    """
    require_payment("translation", access_token)

    # Simulate translation
    translation_data = {
        "original_text": text,
        "translated_text": f"[{target_language}] {text[::-1]}",  # Simple reverse for demo
        "source_language": "auto-detected",
        "target_language": target_language,
        "confidence": 0.95,
        "cost": API_PRICING["translation"]
    }

    return translation_data


@app.post("/api/data_analysis")
async def analyze_data(
    data: Dict[str, Any],
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    """
    Perform data analysis (Paid API - $0.50)
    Requires x402 payment
    """
    require_payment("data_analysis", access_token)

    # Simulate data analysis
    analysis_result = {
        "input_data": data,
        "summary": {
            "data_points": len(data) if isinstance(data, dict) else 0,
            "analysis_type": "comprehensive",
            "insights": [
                "Data shows positive trend",
                "Key metrics within expected range",
                "Anomalies detected: 2"
            ]
        },
        "recommendations": [
            "Continue monitoring key metrics",
            "Investigate detected anomalies"
        ],
        "timestamp": datetime.now().isoformat(),
        "cost": API_PRICING["data_analysis"]
    }

    return analysis_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
