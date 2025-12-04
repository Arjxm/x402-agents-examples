"""
x402 Protocol Payment Handler
Implements HTTP 402 Payment Required protocol for paid API access
"""
import hashlib
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json


class X402PaymentHandler:
    """Handles x402 protocol payments and access validation"""

    def __init__(self, api_key: str = "test_key_123"):
        self.api_key = api_key
        self.payment_records = {}  # In production, use a database
        self.access_tokens = {}  # Store valid access tokens

    def generate_payment_challenge(self, resource: str, cost: float) -> Dict[str, Any]:
        """
        Generate a payment challenge for a resource
        Returns 402 Payment Required with payment details
        """
        challenge_id = hashlib.sha256(
            f"{resource}{time.time()}".encode()
        ).hexdigest()[:16]

        challenge = {
            "status": 402,
            "message": "Payment Required",
            "challenge_id": challenge_id,
            "resource": resource,
            "cost": cost,
            "currency": "USD",
            "payment_methods": ["credit_card", "crypto", "test_token"],
            "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat()
        }

        self.payment_records[challenge_id] = {
            "challenge": challenge,
            "paid": False,
            "created_at": datetime.now()
        }

        return challenge

    def process_payment(self, challenge_id: str, payment_token: str) -> Dict[str, Any]:
        """
        Process a payment for a challenge
        Returns access token if payment is successful
        """
        if challenge_id not in self.payment_records:
            return {
                "success": False,
                "error": "Invalid challenge ID"
            }

        record = self.payment_records[challenge_id]

        if record["paid"]:
            return {
                "success": False,
                "error": "Payment already processed"
            }

        # Simulate payment processing
        # In production, integrate with real payment gateway
        if payment_token.startswith("test_") or payment_token == self.api_key:
            access_token = hashlib.sha256(
                f"{challenge_id}{payment_token}{time.time()}".encode()
            ).hexdigest()

            record["paid"] = True
            record["payment_token"] = payment_token
            record["access_token"] = access_token
            record["paid_at"] = datetime.now()

            # Store access token with expiry
            self.access_tokens[access_token] = {
                "challenge_id": challenge_id,
                "resource": record["challenge"]["resource"],
                "expires_at": datetime.now() + timedelta(hours=1)
            }

            return {
                "success": True,
                "access_token": access_token,
                "expires_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                "resource": record["challenge"]["resource"]
            }

        return {
            "success": False,
            "error": "Payment failed"
        }

    def validate_access_token(self, access_token: str, resource: str) -> bool:
        """Validate if an access token is valid for a resource"""
        if access_token not in self.access_tokens:
            return False

        token_info = self.access_tokens[access_token]

        # Check expiry
        if datetime.now() > token_info["expires_at"]:
            del self.access_tokens[access_token]
            return False

        # Check resource match
        if token_info["resource"] != resource:
            return False

        return True

    def create_payment_response_headers(self, challenge: Dict[str, Any]) -> Dict[str, str]:
        """Create HTTP headers for 402 Payment Required response"""
        return {
            "WWW-Authenticate": f'Payment challenge_id="{challenge["challenge_id"]}", cost={challenge["cost"]}',
            "X-Payment-Challenge": json.dumps(challenge),
            "Content-Type": "application/json"
        }


# Global payment handler instance
payment_handler = X402PaymentHandler()
