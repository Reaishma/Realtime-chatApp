# Real-time Chat Application

A real-time chat application built with FastAPI and WebSockets, featuring a modern dark theme with red accent colors.

## Features

- **Real-time messaging**: Instant message delivery using WebSockets
- **Dark theme**: Modern dark interface with white text and red accents
- **User management**: Join/leave notifications and user session handling
- **Responsive design**: Works on desktop and mobile devices
- **Connection resilience**: Automatic reconnection with exponential backoff
- **Message validation**: Input length limits and XSS protection

## Technology Stack

### Backend
- **FastAPI**: Web framework with WebSocket support
- **WebSockets**: Real-time bidirectional communication
- **Uvicorn**: ASGI server for running the application
- **Pydantic**: Data validation and settings management
- **Python 3.11**: Modern Python runtime with type hints

### Frontend
- **Vanilla JavaScript**: Pure JS without frameworks
- **CSS3**: Modern styling with flexbox and animations
- **WebSocket API**: Native browser WebSocket implementation

## Project Structure

```
├── main.py              # Application entry point
├── app/                 # Main application package
│   ├── __init__.py      # Package initialization
│   ├── main.py          # FastAPI application factory
│   ├── config.py        # Application configuration and settings
│   ├── models.py        # Data models (User, ChatRoom)
│   ├── schemas.py       # Pydantic schemas for API validation
│   ├── routes.py        # API routes and WebSocket endpoints
│   ├── chat.py          # Chat logic and connection management
│   └── static/          # Frontend assets
│       ├── style.css    # Dark theme CSS styling
│       └── chat.js      # WebSocket client and UI logic
├── requirements.txt     # Python dependencies
├── vercel.json         # Vercel deployment configuration
└── README.md           # Project documentation
```

## Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   # Option 1: Using uvicorn directly
   uvicorn main:app --host 0.0.0.0 --port 5000 --reload
   
   # Option 2: Using Python main module
   python main.py
   ```

3. **Open your browser** and navigate to `http://localhost:5000`

## Deployment

### Vercel Deployment
The application is configured for Vercel deployment with `vercel.json`. However, note that Vercel's serverless Python runtime has limitations with WebSockets for persistent connections.

**Important**: For production WebSocket functionality, consider:
- Using platforms that support persistent WebSocket connections (Fly.io, Render, Railway)
- Implementing external WebSocket services (Ably, Pusher, Supabase Realtime)
- Moving WebSocket handling to Node.js Edge Functions on Vercel

### Alternative Deployment Options
- **Fly.io**: Full WebSocket support with persistent processes
- **Render**: Native WebSocket handling
- **Railway**: Container-based deployment with WebSocket support
- **Heroku**: Traditional hosting with WebSocket capabilities

## How It Works

1. **User Registration**: Users enter a username to join the chat
2. **WebSocket Connection**: Client establishes WebSocket connection to `/ws/{username}`
3. **Message Broadcasting**: All messages are broadcast to connected users
4. **Connection Management**: Server handles user join/leave events
5. **Auto-reconnection**: Client automatically reconnects on connection loss

## API Endpoints

### HTTP Endpoints
- `GET /`: Main chat interface
- `GET /health`: Health check with system statistics
- `GET /stats`: Overall chat statistics
- `GET /room/{room_id}/stats`: Room-specific statistics
- `GET /static/{file}`: Static file serving

### WebSocket Endpoints
- `WebSocket /ws/{username}`: Real-time chat communication
  - Validates username length (max 20 characters)
  - Handles message broadcasting and user management
  - Supports automatic reconnection on connection loss

## Message Format

```json
{
  "type": "chat_message|user_joined|user_left",
  "user_name": "username",
  "message": "message content",
  "timestamp": 1234567890.123
}
```

## Security Features

- **XSS Protection**: Messages rendered safely using `textContent`
- **Input Validation**: Username and message length limits
- **Connection Management**: Proper WebSocket cleanup and error handling

## Browser Compatibility

- **Modern browsers** with WebSocket support
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Responsive design included

## Architecture Features

### Modular Design
- **Separation of Concerns**: Clear separation between models, routes, schemas, and business logic
- **Configuration Management**: Centralized settings with environment variable support
- **Type Safety**: Full Pydantic validation and Python type hints
- **Scalable Structure**: Easy to extend with additional features

### Chat Features
- **Multi-room Support**: Framework for multiple chat rooms (currently single room)
- **User Management**: Comprehensive user session tracking
- **Message Statistics**: Real-time statistics and monitoring
- **Connection Resilience**: Robust error handling and cleanup

### Development Notes
- Uses in-memory storage for user sessions (no database required)
- Messages are not persisted beyond current session
- Designed for demonstration and development purposes
- Can be extended with database integration and user authentication
- Follows FastAPI best practices for production applications

## Troubleshooting

### Common Issues

1. **WebSocket connection fails**:
   - Check if server is running on correct port
   - Verify firewall settings
   - Ensure WebSocket URL protocol matches (ws/wss)

2. **Page loading errors**:
   - Clear browser cache
   - Check network connectivity
   - Verify server logs for errors

3. **Messages not appearing**:
   - Check browser console for JavaScript errors
   - Verify WebSocket connection status
   - Refresh page to reconnect

### Development Tips

- Use browser developer tools to monitor WebSocket connections
- Check server logs for connection and error details
- Test with multiple browser tabs for multi-user simulation

## License

This project is provided as-is for educational and development purposes.