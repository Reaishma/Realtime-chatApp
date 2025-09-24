let ws = null;
let currentUsername = null;
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

// Get WebSocket URL based on current location
function getWebSocketURL(username) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    
    // Fallback for cases where host might be undefined or empty
    if (!host) {
        host = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    }
    
    // Additional fallback for localhost development
    if (!host || host === 'undefined:undefined') {
        host = 'localhost:5000';
    }
    
    return `${protocol}//${host}/ws/${encodeURIComponent(username)}`;
}

// Join chat function
function joinChat() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    if (username.length > 20) {
        alert('Username must be 20 characters or less');
        return;
    }
    
    currentUsername = username;
    connectWebSocket(username);
}

// Connect to WebSocket
function connectWebSocket(username) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    
    const wsUrl = getWebSocketURL(username);
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function(event) {
        console.log('Connected to WebSocket');
        connectionAttempts = 0;
        
        // Hide login form and show chat
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'flex';
        
        // Focus on message input
        document.getElementById('messageInput').focus();
        
        // Add welcome message
        addSystemMessage(`Welcome to the chat, ${username}!`);
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };
    
    ws.onclose = function(event) {
        console.log('WebSocket connection closed', event.code, event.reason);
        
        if (connectionAttempts < maxConnectionAttempts && currentUsername) {
            connectionAttempts++;
            console.log(`Attempting to reconnect... (${connectionAttempts}/${maxConnectionAttempts})`);
            setTimeout(() => {
                connectWebSocket(currentUsername);
            }, 2000 * connectionAttempts); // Exponential backoff
        } else if (currentUsername) {
            addSystemMessage('Connection lost. Please refresh the page to reconnect.');
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        addSystemMessage('Connection error. Trying to reconnect...');
    };
}

// Handle incoming messages
function handleMessage(data) {
    switch (data.type) {
        case 'chat_message':
            addChatMessage(data.user_name, data.message, data.user_name === currentUsername);
            break;
        case 'user_joined':
        case 'user_left':
            addSystemMessage(data.message);
            updateUserCount();
            break;
    }
}

// Add chat message to UI
function addChatMessage(username, message, isOwnMessage) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    if (!isOwnMessage) {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = username;
        messageDiv.appendChild(headerDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = message;
    messageDiv.appendChild(contentDiv);
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add system message
function addSystemMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.textContent = message;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    if (message.length > 500) {
        alert('Message must be 500 characters or less');
        return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const messageData = {
            message: message
        };
        
        ws.send(JSON.stringify(messageData));
        messageInput.value = '';
    } else {
        addSystemMessage('Connection lost. Trying to reconnect...');
        if (currentUsername) {
            connectWebSocket(currentUsername);
        }
    }
}

// Update user count (placeholder - would need server to track this)
function updateUserCount() {
    // This is a simple placeholder. In a real app, the server would send user count updates
    const userCountSpan = document.getElementById('userCount');
    // For now, we'll just show a placeholder value
    userCountSpan.textContent = '...';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Enter key to join chat
    document.getElementById('usernameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
    
    // Enter key to send message
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Handle page visibility changes to manage connections
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden
            console.log('Page hidden');
        } else {
            // Page is visible again
            console.log('Page visible');
            if (currentUsername && (!ws || ws.readyState !== WebSocket.OPEN)) {
                console.log('Reconnecting...');
                connectWebSocket(currentUsername);
            }
        }
    });
    
    // Handle window beforeunload to clean up connection
    window.addEventListener('beforeunload', function() {
        if (ws) {
            ws.close();
        }
    });
});