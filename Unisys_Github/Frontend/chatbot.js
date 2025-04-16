// Initialize chat history and session
let chatHistory = [];
let sessionId = localStorage.getItem('chatSessionId');

// If no session exists, create a new one
if (!sessionId) {
    sessionId = Date.now().toString();
    localStorage.setItem('chatSessionId', sessionId);
}

// Function to format markdown-style text
function formatMessage(text) {
    // Replace markdown formatting with HTML
    return text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers (h1 to h3)
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bullet points
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
        // Numbered lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
        // Line breaks
        .replace(/\n/g, '<br>');
}

// Function to clear chat history
function clearChat() {
    // Clear chat history array
    chatHistory = [];
    
    // Clear localStorage
    localStorage.removeItem('chatHistory');
    
    // Clear chat messages from UI
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = '';
    
    // Add welcome message back
    addMessage('Hello! I\'m your AI assistant for the carbon emissions monitoring system. I can help you understand CO2 data, sustainability practices, and environmental impact. How can I assist you today?');
}

// Function to save chat history to localStorage
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Function to load chat history from localStorage
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        // Display all saved messages
        const chatContainer = document.getElementById('chat-messages');
        chatContainer.innerHTML = ''; // Clear existing messages
        chatHistory.forEach(message => {
            addMessageToUI(message.text, message.isUser);
        });
    }
}

// Function to add a message to the UI only
function addMessageToUI(message, isUser = false) {
    const chatContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Apply formatting only to bot messages
    if (isUser) {
        messageContent.textContent = message;
    } else {
        messageContent.innerHTML = formatMessage(message);
    }
    
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to add a message to both UI and history
function addMessage(message, isUser = false) {
    // Add to UI with formatting
    addMessageToUI(message, isUser);
    
    // Add to chat history (store original message without HTML)
    chatHistory.push({
        text: message,
        isUser: isUser,
        timestamp: new Date()
    });
    
    // Save to localStorage
    saveChatHistory();
}

// Function to create a loading message
function addLoadingMessage() {
    const chatContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message loading';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

// Function to handle user input
async function handleUserInput(event) {
    event.preventDefault();
    
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input field
    inputField.value = '';
    
    // Add loading message
    const loadingMessage = addLoadingMessage();
    
    try {
        // Send message to backend
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({ message })
        });
        
        // Remove loading message
        loadingMessage.remove();
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        
        // Add bot response to chat
        addMessage(data.response);
    } catch (error) {
        // Remove loading message
        loadingMessage.remove();
        
        console.error('Error:', error);
        addMessage('Sorry, I encountered an error. Please try again later.');
    }
}

// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const form = document.getElementById('chat-form');
        form.dispatchEvent(new Event('submit'));
    }
}

// Initialize chat interface
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const clearChatBtn = document.getElementById('clear-chat');
    
    if (chatForm) {
        chatForm.addEventListener('submit', handleUserInput);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', handleKeyPress);
    }
    
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat history?')) {
                clearChat();
            }
        });
    }
    
    // Load existing chat history
    loadChatHistory();
    
    // Add welcome message only if there's no chat history
    if (chatHistory.length === 0) {
        addMessage('Hello! I\'m your AI assistant for the carbon emissions monitoring system. I can help you understand CO2 data, sustainability practices, and environmental impact. How can I assist you today?');
    }
});

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // When page becomes visible again, reload chat history
        loadChatHistory();
    }
}); 