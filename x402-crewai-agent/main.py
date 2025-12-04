"""
Main Entry Point for x402 CrewAI Agent System
Run this to start the interactive agent
"""
import sys
import os
from agents.x402_agent import process_user_request

def print_banner():
    """Print welcome banner"""
    banner = """
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║           x402 AI Agent with Payment Protocol             ║
    ║                                                           ║
    ║  Powered by CrewAI Framework                              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝

    This agent can help you with:
    🌤️  Weather Information ($0.10)
    📈 Stock Market Data ($0.25)
    📰 Latest News ($0.15)
    🌐 Translation Services ($0.20)
    📊 Data Analysis ($0.50)

    Payments are handled automatically using x402 protocol!

    Type 'exit' or 'quit' to stop.
    """
    print(banner)


def main():
    """Main interactive loop"""
    print_banner()

    while True:
        try:
            # Get user input
            print("\n" + "─" * 60)
            user_input = input("\n💬 Your request: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Thank you for using x402 AI Agent! Goodbye!\n")
                break

            # Process request
            result = process_user_request(user_input)

            print(f"\n✨ Agent Response:")
            print(f"─" * 60)
            print(result)

        except KeyboardInterrupt:
            print("\n\n👋 Thank you for using x402 AI Agent! Goodbye!\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            print("Please try again or contact support.")


if __name__ == "__main__":
    main()
