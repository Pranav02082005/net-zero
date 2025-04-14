import google.generativeai as genai


# Configure the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Create model instance using the modern syntax
model = genai.GenerativeModel('gemini-2.0-flash')  # Updated model name

class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # Default to English

class ChatResponse(BaseModel):
    response: str

# Global variable to store chat history
conversation_history = ['''Main constraint: Never use ** for formatting.
Give plain text. keep the responses under 80 words.''']
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
        prompt = "/n".join(conversation_history) + f"/nAssistant:"

        # Generate content with streaming
        response = model.generate_content(prompt, stream=True)
        response_text = ""
        
        # Collect streaming response
        for chunk in response:
            response_text += chunk.text
        
        # Append the assistant's response to the conversation history
        conversation_history.append(f"Assistant: {response_text}")

        return {
            "response": response_text.strip()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )