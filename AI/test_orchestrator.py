"""
Test script to demonstrate the full AI Orchestrator workflow.

This demonstrates:
1. File conversion to text
2. Orchestrator routing decisions  
3. Agent collaboration (Doc ⟷ Sherlock)
4. Coms agent formatting
5. Final output
"""

import asyncio
import json
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from AI.agent_orchastrator import AgentOrchestrator


def print_header(title: str):
    """Print a formatted header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def print_result(result: dict):
    """Pretty print the result."""
    print(json.dumps(result, indent=2, default=str))


async def test_communication_routing():
    """Test routing to Coms Agent."""
    print_header("TEST 1: Communication Request → Coms Agent")
    
    orchestrator = AgentOrchestrator()
    
    request = {
        "message": "I need to draft an email to my client John explaining the settlement offer we received",
        "ID": {"userid": "user123", "sessionid": "session001"}
    }
    
    print("📨 Request:")
    print(f"   '{request['message']}'")
    
    result = await orchestrator.process_request(request)
    
    print("\n📊 Result:")
    print_result(result)


async def test_document_processing():
    """Test routing to Doc Agent."""
    print_header("TEST 2: Document Processing → Doc Agent")
    
    orchestrator = AgentOrchestrator()
    
    # Use test case folder
    case_folder = str(Path(__file__).parent / "data" / "test" / "case_1")
    
    request = {
        "message": "Process all the documents in this case folder and extract key information",
        "case_folder": case_folder,
        "ID": {"userid": "user123", "sessionid": "session002"}
    }
    
    print("📂 Request:")
    print(f"   '{request['message']}'")
    print(f"   Case folder: {case_folder}")
    
    result = await orchestrator.process_request(request)
    
    print("\n📊 Result Summary:")
    if result.get('results'):
        summary = result['results'].get('summary', {})
        print(f"   Total files: {summary.get('total_files', 0)}")
        print(f"   Successful: {summary.get('successful', 0)}")
        print(f"   Failed: {summary.get('failed', 0)}")
        print(f"   Types: {summary.get('by_type', {})}")


async def test_strategic_analysis():
    """Test routing to Collaborative Mode."""
    print_header("TEST 3: Strategic Analysis → Collaborative Mode (Doc ⟷ Sherlock)")
    
    orchestrator = AgentOrchestrator()
    
    # Use test case folder
    case_folder = str(Path(__file__).parent / "data" / "test" / "case_1")
    
    request = {
        "message": "Analyze this case and recommend a settlement strategy. What's our best approach?",
        "case_folder": case_folder,
        "ID": {"userid": "user123", "sessionid": "session003"}
    }
    
    print("🔍 Request:")
    print(f"   '{request['message']}'")
    print(f"   Case folder: {case_folder}")
    
    result = await orchestrator.process_request(request)
    
    print("\n📊 Result Summary:")
    if result.get('consensus'):
        consensus = result['consensus']
        print(f"   Consensus reached: {consensus.get('consensus_reached', False)}")
        print(f"   Iterations: {consensus.get('conversation_iterations', 0)}")
        print(f"   Confidence: {consensus.get('confidence', 'N/A')}")
        
        print("\n📋 Areas of Agreement:")
        for area in consensus.get('areas_of_agreement', [])[:3]:
            print(f"   ✓ {area}")
        
        print("\n💬 Final Recommendation:")
        rec = consensus.get('final_recommendation', '')
        print(f"   {rec[:300]}...")


async def test_all_workflows():
    """Run all test scenarios."""
    print_header("🎭 AI ORCHESTRATOR - COMPREHENSIVE WORKFLOW TESTS")
    
    tests = [
        ("Communication", test_communication_routing),
        ("Document Processing", test_document_processing),
        ("Strategic Analysis", test_strategic_analysis),
    ]
    
    for test_name, test_func in tests:
        try:
            await test_func()
            print(f"\n✅ {test_name} test completed successfully")
        except Exception as e:
            print(f"\n❌ {test_name} test failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "-"*80)
    
    print_header("✨ ALL TESTS COMPLETE")


async def interactive_mode():
    """Interactive mode to test custom requests."""
    print_header("🎭 AI ORCHESTRATOR - INTERACTIVE MODE")
    
    orchestrator = AgentOrchestrator()
    
    print("Enter your requests below. Type 'exit' to quit.\n")
    
    session_id = "interactive_001"
    request_count = 0
    
    while True:
        try:
            print("\n" + "="*80)
            user_input = input("📨 Your request: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            if not user_input:
                continue
            
            request_count += 1
            
            # Check if user wants to specify a case folder
            case_folder = None
            if 'case_1' in user_input.lower() or 'case 1' in user_input.lower():
                case_folder = str(Path(__file__).parent / "data" / "test" / "case_1")
                print(f"   📂 Using case folder: case_1")
            
            request = {
                "message": user_input,
                "case_folder": case_folder,
                "ID": {
                    "userid": "interactive_user",
                    "sessionid": f"{session_id}_{request_count}"
                }
            }
            
            print("\n🔄 Processing...\n")
            result = await orchestrator.process_request(request)
            
            print("\n📊 RESULT:")
            print("-"*80)
            
            # Pretty print based on route
            intent = result.get('intent_analysis', {})
            print(f"Intent: {intent.get('primary_intent', 'unknown')}")
            print(f"Route: {intent.get('recommended_route', 'unknown')}")
            print(f"Confidence: {intent.get('confidence', 0):.2f}")
            
            if result.get('response_type') == 'strategic_analysis':
                consensus = result.get('consensus', {})
                print(f"\nConsensus: {consensus.get('consensus_reached', False)}")
                print(f"Iterations: {consensus.get('conversation_iterations', 0)}")
                
                if consensus.get('final_recommendation'):
                    print(f"\n📋 Recommendation:")
                    print(consensus['final_recommendation'][:500] + "...")
            
            else:
                print(f"\nFull result available in result object")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()


def main():
    """Main entry point."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--interactive':
        asyncio.run(interactive_mode())
    else:
        asyncio.run(test_all_workflows())


if __name__ == "__main__":
    main()
