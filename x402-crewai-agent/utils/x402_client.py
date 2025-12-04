"""
x402 Client for handling HTTP 402 Payment Required protocol
Client-side implementation for making payments to x402-protected APIs
"""

import requests
import json
import base64
import time
import hashlib
from typing import Optional, Dict, Any, Tuple
from eth_account import Account
from eth_account.messages import encode_structured_data
import os


class X402Client:
    """
    Client for making HTTP requests with automatic x402 payment handling
    Similar to the TypeScript X402ServerClient
    """

    def __init__(self, private_key: Optional[str] = None):
        """
        Initialize x402 client with optional wallet private key

        Args:
            private_key: Ethereum private key for signing payments (optional)
        """
        self.last_transaction_hash: Optional[str] = None
        self.last_network: Optional[str] = None
        self.payment_token = os.getenv("PAYMENT_TOKEN", "test_token_123")

        if private_key:
            self.account = Account.from_key(private_key)
            self.address = self.account.address
            print(f"🔑 Agent wallet initialized: {self.address}")
        else:
            self.account = None
            self.address = None
            print("💳 Using test payment mode (no wallet)")

    def fetch(self, url: str, method: str = "GET", headers: Optional[Dict[str, str]] = None,
              data: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any]:
        """
        Make HTTP request with automatic x402 payment handling

        Returns:
            Tuple of (success: bool, response_data: Any)
        """
        # Reset transaction info
        self.last_transaction_hash = None
        self.last_network = None

        # Prepare headers
        req_headers = headers or {}
        if "Content-Type" not in req_headers:
            req_headers["Content-Type"] = "application/json"

        # Step 1: Try request without payment
        print(f"🌐 Making initial request to: {url}")

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=req_headers)
            else:
                response = requests.post(url, json=data, headers=req_headers)

            print(f"📥 Initial response status: {response.status_code}")

            # Step 2: Handle 402 Payment Required
            if response.status_code == 402:
                print("💳 Received 402 Payment Required, processing payment...")

                payment_success, payment_result = self._handle_402_payment(response, url, method, req_headers, data)

                if payment_success:
                    return True, payment_result
                else:
                    return False, {"error": "Payment failed", "details": payment_result}

            elif response.status_code == 200:
                print("✅ Request successful")
                try:
                    return True, response.json()
                except:
                    return True, response.text

            else:
                print(f"❌ Request failed with status {response.status_code}")
                return False, {"error": f"HTTP {response.status_code}", "details": response.text}

        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return False, {"error": str(e)}

    def _handle_402_payment(self, response: requests.Response, url: str,
                           method: str, headers: Dict[str, str],
                           data: Optional[Dict[str, Any]]) -> Tuple[bool, Any]:
        """Handle 402 Payment Required response"""
        try:
            # Parse payment challenge
            payment_req = response.json()

            # Handle FastAPI HTTPException format
            challenge = payment_req.get('detail', payment_req)

            print(f"💰 Payment required: ${challenge.get('cost', 0)} {challenge.get('currency', 'USD')}")
            print(f"📋 Challenge ID: {challenge.get('challenge_id')}")

            # Process payment based on available method
            if self.account:
                # Use blockchain payment with EIP-712 signature
                payment_header = self._create_payment_authorization(challenge)
                retry_headers = {**headers, "X-PAYMENT": payment_header}
                self.last_network = challenge.get('network', 'unknown')
            else:
                # Use simple token-based payment
                access_token = self._process_simple_payment(challenge)
                if not access_token:
                    return False, {"error": "Payment processing failed"}
                retry_headers = {**headers, "X-Access-Token": access_token}

            print("🔐 Payment processed, retrying request...")

            # Step 3: Retry with payment
            if method.upper() == "GET":
                retry_response = requests.get(url, headers=retry_headers)
            else:
                retry_response = requests.post(url, json=data, headers=retry_headers)

            print(f"📥 Retry response status: {retry_response.status_code}")

            if retry_response.status_code == 200:
                print("✅ Payment successful")

                # Try to extract transaction hash
                try:
                    result = retry_response.json()
                    self.last_transaction_hash = result.get('transactionHash') or result.get('txHash') or result.get('tx')
                    if self.last_transaction_hash:
                        print(f"📝 Transaction hash: {self.last_transaction_hash}")
                    return True, result
                except:
                    return True, retry_response.text
            else:
                print(f"❌ Payment failed: {retry_response.text}")
                return False, {"error": "Payment retry failed", "details": retry_response.text}

        except Exception as e:
            print(f"❌ Payment handling error: {str(e)}")
            return False, {"error": str(e)}

    def _process_simple_payment(self, challenge: Dict[str, Any]) -> Optional[str]:
        """Process payment using simple token-based method (for local APIs)"""
        try:
            # Extract payment endpoint from challenge or use default
            payment_url = challenge.get('payment_url', 'http://localhost:8000/payment')

            payment_data = {
                "challenge_id": challenge["challenge_id"],
                "payment_token": self.payment_token
            }

            response = requests.post(payment_url, json=payment_data)

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return result.get("access_token")

            return None

        except Exception as e:
            print(f"❌ Simple payment error: {str(e)}")
            return None

    def _create_payment_authorization(self, challenge: Dict[str, Any]) -> str:
        """
        Create signed payment authorization using EIP-712
        Similar to TypeScript implementation
        """
        if not self.account:
            raise Exception("Wallet not initialized")

        # Get payment method details
        method = challenge.get('methods', [{}])[0] if 'methods' in challenge else challenge

        # Generate random nonce
        nonce = "0x" + hashlib.sha256(str(time.time()).encode()).hexdigest()

        valid_after = int(time.time())
        timeout = method.get('timeout', method.get('maxTimeoutSeconds', 300))
        if isinstance(timeout, int) and timeout > 1000:
            timeout = timeout // 1000  # Convert ms to seconds
        valid_before = valid_after + timeout

        # EIP-712 Domain
        domain = {
            "name": method.get('extra', {}).get('name', 'USDC'),
            "version": method.get('extra', {}).get('version', '2'),
            "chainId": 8453 if method.get('network') == 'base' else 84532,
            "verifyingContract": method.get('asset')
        }

        # EIP-712 Types
        types = {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"}
            ],
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"}
            ]
        }

        # Message to sign
        message = {
            "from": self.address,
            "to": method.get('recipient', method.get('payTo')),
            "value": int(method.get('maximumAmount', method.get('maxAmountRequired', 0))),
            "validAfter": valid_after,
            "validBefore": valid_before,
            "nonce": nonce
        }

        # Create structured data
        structured_data = {
            "types": types,
            "primaryType": "TransferWithAuthorization",
            "domain": domain,
            "message": message
        }

        # Sign with private key
        encoded_data = encode_structured_data(structured_data)
        signed_message = self.account.sign_message(encoded_data)
        signature = signed_message.signature.hex()

        # Create payment payload (ERC-3009 format)
        payload = {
            "x402Version": 1,
            "scheme": method.get('scheme'),
            "network": method.get('network'),
            "payload": {
                "signature": signature,
                "authorization": {
                    "from": self.address,
                    "to": method.get('recipient', method.get('payTo')),
                    "value": str(message["value"]),
                    "validAfter": str(valid_after),
                    "validBefore": str(valid_before),
                    "nonce": nonce
                }
            }
        }

        # Encode as base64
        payload_json = json.dumps(payload)
        payment_header = base64.b64encode(payload_json.encode()).decode()

        print(f"📤 Payment header created (length: {len(payment_header)})")

        return payment_header

    def get_last_transaction(self) -> Dict[str, Optional[str]]:
        """Get last transaction info"""
        return {
            "hash": self.last_transaction_hash,
            "network": self.last_network,
            "explorer_url": self._get_explorer_url() if self.last_transaction_hash else None
        }

    def _get_explorer_url(self) -> str:
        """Get block explorer URL for transaction"""
        explorers = {
            'base': 'https://basescan.org/tx/',
            'base-sepolia': 'https://sepolia.basescan.org/tx/',
            'ethereum': 'https://etherscan.io/tx/',
            'polygon': 'https://polygonscan.com/tx/',
            'arbitrum': 'https://arbiscan.io/tx/',
            'optimism': 'https://optimistic.etherscan.io/tx/'
        }

        base_url = explorers.get(self.last_network, explorers['base-sepolia'])
        return f"{base_url}{self.last_transaction_hash}"

    def get_address(self) -> Optional[str]:
        """Get wallet address"""
        return self.address


# Global client instance
_default_client = None


def get_default_client() -> X402Client:
    """Get or create default x402 client"""
    global _default_client
    if _default_client is None:
        private_key = os.getenv("AGENT_WALLET_PRIVATE_KEY")
        _default_client = X402Client(private_key)
    return _default_client
