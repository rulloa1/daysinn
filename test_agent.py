import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

async def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("\n" + "=" * 60)
        print("⚠️  GEMINI_API_KEY environment variable is not set!")
        print("=" * 60)
        print("To run this agent:")
        print("1. Get an API key for free from: https://aistudio.google.com/app/api-keys")
        print("2. Set it in your terminal:")
        print("   export GEMINI_API_KEY=\"your-gemini-api-key\"")
        print("   Or add GEMINI_API_KEY=\"your-gemini-api-key\" to your .env file.")
        print("=" * 60 + "\n")
        return

    from google.antigravity import Agent, LocalAgentConfig

    print("\n🚀 Initializing Google Antigravity Agent...")
    config = LocalAgentConfig(api_key=api_key)
    
    async with Agent(config) as agent:
        prompt = "Hello! Briefly introduce yourself and share one surprising fact about the universe."
        print(f"\nUser: {prompt}\n")
        print("Agent (Streaming): ", end="", flush=True)
        response = await agent.chat(prompt)
        async for token in response:
            print(token, end="", flush=True)
        print("\n")

if __name__ == "__main__":
    asyncio.run(main())
