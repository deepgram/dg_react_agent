# Deepgram React Components Library Primer

## Overview

This library provides React components for integrating Deepgram's voice and text-to-speech (TTS) services. The architecture follows a clear separation between core functionality (src) and demonstration (test-app).

## Core Architecture Principles

### 1. Component Layer Separation

- **Source Package (`src/`)**: Contains all core functionality
  - WebSocket management
  - Audio processing
  - State management
  - Type definitions
  - Core hooks and components

- **Demo Application (`test-app/`)**: Serves as a testing and demonstration platform
  - Implementation examples
  - UI/UX patterns
  - Testing scenarios
  - No business logic

### 2. Core Components

#### Text-to-Speech (TTS)
- Primary Hook: `useDeepgramTTS`
- Responsibilities:
  - WebSocket connection management
  - Audio playback
  - State management
  - Error handling
  - Metrics collection

#### Voice Interaction
- Primary Component: `DeepgramVoiceInteraction`
- Features:
  - Real-time transcription
  - Agent interaction
  - Audio management
  - State management
  - Error handling

### 3. Design Patterns

#### State Management
- Use React's built-in state management (useState, useReducer)
- Prefer local state over global state
- Use refs for values that shouldn't trigger re-renders
- Implement proper cleanup in useEffect hooks

#### Performance Optimization
- Memoize callbacks and complex objects
- Prevent unnecessary re-renders
- Use refs for manager instances
- Implement proper cleanup for resources

#### Error Handling
- Centralized error handling
- Consistent error types and structures
- Proper error propagation
- User-friendly error messages

### 4. Code Organization

```
src/
├── components/           # Core components
│   ├── DeepgramTTS/     # TTS functionality
│   └── DeepgramVoiceInteraction/  # Voice interaction
├── types/               # TypeScript definitions
├── utils/              # Shared utilities
│   ├── audio/          # Audio processing
│   ├── shared/         # Common utilities
│   ├── state/          # State management
│   ├── tts/            # TTS-specific utilities
│   └── websocket/      # WebSocket management
```

## Development Guidelines

### 1. Component Development

- Keep core functionality in `src/`
- Implement proper TypeScript types
- Follow React best practices
- Document component interfaces
- Include JSDoc comments

### 2. State Management

- Use appropriate React hooks
- Implement proper cleanup
- Handle edge cases
- Consider component lifecycle

### 3. Testing

- Write comprehensive tests
- Test edge cases
- Test error scenarios
- Test performance
- Test cleanup

### 4. Error Handling

- Use typed errors
- Implement proper error boundaries
- Log errors appropriately
- Provide user feedback

### 5. Performance

- Monitor re-renders
- Use React DevTools
- Profile when needed
- Optimize heavy operations

## Best Practices

### 1. Code Style

- Use TypeScript
- Follow ESLint rules
- Write clear comments
- Use consistent naming

### 2. Component Design

- Keep components focused
- Implement proper prop types
- Use proper event handling
- Follow React patterns

### 3. Resource Management

- Clean up resources
- Handle WebSocket connections
- Manage audio contexts
- Handle memory appropriately

### 4. Documentation

- Write clear documentation
- Include examples
- Document edge cases
- Keep docs updated

## Common Patterns

### 1. WebSocket Management

- Create and configure WebSocket managers
- Set up proper event listeners
- Implement proper error handling
- Clean up connections on unmount

### 2. Audio Management

- Initialize audio managers with proper configuration
- Handle audio events appropriately
- Implement proper error handling
- Clean up audio resources on unmount

### 3. Error Handling

- Use typed error objects
- Implement proper error boundaries
- Provide meaningful error messages
- Log errors appropriately

## Common Gotchas

1. **Resource Cleanup**: Always clean up WebSocket connections and audio resources in useEffect cleanup functions.

2. **State Updates**: Be careful with state updates in async operations to avoid memory leaks.

3. **Error Handling**: Implement proper error boundaries and error handling for all async operations.

4. **Performance**: Watch for unnecessary re-renders and implement proper memoization.

5. **Browser Support**: Consider browser compatibility for audio and WebSocket features.

## Example Usage

See the `test-app/` directory for comprehensive examples of how to use the components. The test app demonstrates:

- Basic setup and configuration
- Error handling
- State management
- UI patterns
- Performance optimization

## Contributing

When contributing to this library:

1. Follow the established patterns
2. Write comprehensive tests
3. Document your changes
4. Consider backward compatibility
5. Follow the PR template

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) 