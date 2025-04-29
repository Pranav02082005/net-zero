from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Chatbot"])

# Configure the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Create model instance using the modern syntax
model = genai.GenerativeModel('gemini-2.0-flash')

class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # Default to English

class ChatResponse(BaseModel):
    response: str

# Global variable to store chat history
conversation_history = ['''Main constraint: Use proper formatting.
Keep the responses under 80 words, unless the user asks for more.
Focus on environmental and CO2-related topics.
You exist to help industry professionals to monitor their carbon footprint and provide ways toreduce it.
Provide specific, actionable insights when possible.''']

@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate chat response using Google's Gemini model
    
    Args:
        request (ChatRequest): Chat request with message
        current_user (Dict[str, Any], optional): Current user from token
        
    Returns:
        Dict[str, Any]: Chat response
    """
    try:
        # Append the new message to the conversation history
        conversation_history.append(f"User: {request.message}")

        # Construct the prompt using the conversation history
        prompt = "\n".join(conversation_history) + f"\nAssistant:"

        try:
            # Generate content with streaming
            response = model.generate_content(prompt, stream=True)
            response_text = ""
            
            # Collect streaming response
            for chunk in response:
                if chunk.text:
                    response_text += chunk.text
            
            # Clean and format the response
            response_text = response_text.strip()
            
            # Append the assistant's response to the conversation history
            conversation_history.append(f"Assistant: {response_text}")

            # Limit conversation history to last 10 messages
            if len(conversation_history) > 10:
                conversation_history = conversation_history[-10:]

            return {
                "response": response_text
            }
            
        except Exception as model_error:
            print(f"Model error: {str(model_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate response. Please try again."
            )

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )