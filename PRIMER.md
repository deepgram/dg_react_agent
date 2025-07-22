# Deepgram React Components Library Primer

## Project Overview
This library provides React components and hooks for integrating Deepgram's voice and text-to-speech (TTS) services. It follows a modular, extensible architecture that separates core functionality from demo implementations.

## Core Architecture Principles

### Package Structure
```
src/
  ├─ components/          # Feature-specific components and hooks
  │  ├─ DeepgramTTS/
  │  │  ├─ hooks/        # TTS-specific hooks
  │  │  └─ index.ts      # Public API
  │  └─ DeepgramAgent/   # Formerly DeepgramVoiceInteraction
  │     ├─ hooks/        # Agent-specific hooks
  │     └─ index.ts      # Public API
  ├─ hooks/              # Base hooks for shared functionality
  │  ├─ useAudio/        # Audio input/output hooks
  │  ├─ useWebSocket/    # WebSocket connection hooks
  │  └─ useVoice/        # Voice interaction hooks
  ├─ types/              # TypeScript type definitions
  │  ├─ common/          # Shared types (errors, config, etc.)
  │  ├─ tts/            # TTS-specific types
  │  └─ voice/          # Voice-specific types
  └─ utils/              # Utility classes and functions
     ├─ shared/         # Base classes and shared utilities
     ├─ audio/          # Audio management
     ├─ tts/            # TTS-specific utilities
     ├─ voice/          # Voice-specific utilities
     └─ websocket/      # WebSocket management
```

### Core vs Demo Separation
- Core functionality lives in `src/` package
- Demo/example code lives in `test-app/`
- Demo app should only consume the public API
- Heavy lifting (WebSocket, audio, etc.) belongs in `src/`

### Naming Conventions
- "Agent" is used instead of "VoiceInteraction" throughout the codebase
- Component names: `DeepgramAgent`, `DeepgramTTS`
- Hook names: `useDeepgramAgent`, `useDeepgramTTS`
- Type names follow component/hook names: `DeepgramAgentProps`, `DeepgramAgentHandle`
- No legacy type names or backward compatibility code is maintained
- Error types are prefixed with their domain: `AudioError`, `ConnectionError`, etc.

### Audio Configuration
Default microphone configuration is standardized:
```typescript
{
  constraints: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    latency: 0
  },
  bufferSize: 4096
}
```

### Base Classes and Inheritance
Following Java-like patterns while maintaining React best practices:
- Base classes in `src/utils/shared/` (e.g., `BaseWebSocketManager`, `BaseAudioManager`)
- Feature-specific implementations extend base classes
- Shared logic centralized in base classes
- Type-safe inheritance with TypeScript

### Hook Architecture
1. Base Hooks (`src/hooks/`):
   - `useAudioInput`: Base audio input functionality
   - `useWebSocketConnection`: Base WebSocket management
   - Pure, reusable functionality

2. Feature Hooks (`src/components/*/hooks/`):
   - Compose base hooks
   - Add feature-specific logic
   - Example: `useDeepgramAgent` uses `useAudioInput` and `useWebSocketConnection`

### Error Handling
Structured error hierarchy:
```typescript
BaseError
├─ AudioError
├─ ConnectionError
├─ APIError
└─ VoiceError
```

Error handling principles:
- Specific error types for different concerns
- Detailed error information in `details` property
- Consistent error propagation through hooks
- Proper cleanup on errors
- VoiceError includes specific error codes for different scenarios

### Resource Management
1. Initialization:
   - Single initialization in `useEffect`
   - Automatic cleanup on unmount
   - Prevent duplicate initialization
   - Microphone setup happens in core package, not demo app

2. Cleanup:
   - Proper resource cleanup order
   - Prevent duplicate cleanups
   - Handle race conditions with flags
   - Use cleanup flags in refs to prevent race conditions

3. State Management:
   - Use refs for stable references
   - Track cleanup state
   - Handle reconnection gracefully
   - Maintain options in refs to prevent stale closures

### WebSocket Management
1. Connection Lifecycle:
   - Base manager handles connection states
   - Feature managers handle specific protocols
   - Prevent duplicate connections
   - Proper error propagation

2. Message Handling:
   - Type-safe message processing
   - Binary data handling for audio
   - Error recovery strategies
   - Proper cleanup on errors

## Coding Standards

### React Patterns
1. Hooks:
   - Compose functionality from base hooks
   - Clear dependencies in `useEffect`/`useCallback`
   - Proper cleanup in `useEffect`
   - Memoize expensive operations
   - Use refs for cleanup flags

2. State Management:
   - Use `useRef` for mutable values
   - Use `useState` for render-triggering state
   - Prefer local state over global state
   - Keep options in refs to prevent stale closures

3. Props:
   - Clear interface definitions
   - Optional configuration with defaults
   - Callback props for events
   - Consistent naming across components

### TypeScript Usage
1. Types:
   - Clear interface definitions
   - Proper type exports
   - Discriminated unions for complex types
   - Avoid `any`
   - Use specific error types
   - Consistent naming conventions

2. Error Types:
   - Extend base error classes
   - Include detailed error information
   - Type-safe error handling
   - Specific error codes for different scenarios

3. Generics:
   - Use when functionality is truly generic
   - Constrain generic types appropriately
   - Prefer concrete types when possible

### Code Organization
1. File Structure:
   - One component/hook per file
   - Clear file naming
   - Index files for public API
   - Separate types into `.ts` files
   - Consistent directory structure

2. Imports/Exports:
   - Clear import organization
   - Named exports preferred
   - Re-export public API through index files
   - No circular dependencies

3. Documentation:
   - Clear JSDoc comments
   - Interface/type documentation
   - Example usage where appropriate
   - Document error scenarios

## Future Extensibility

### Speech-to-Text (STT)
- Reuse audio input infrastructure
- Extend base WebSocket functionality
- Share error handling patterns
- Follow same component/hook patterns

### Shared Audio Management
- Base audio classes handle common functionality
- Feature-specific managers extend base classes
- Consistent audio configuration
- Standard microphone setup

### WebSocket Management
- Base WebSocket manager handles connection lifecycle
- Feature-specific managers handle protocols
- Consistent error handling and reconnection
- Type-safe message handling

## Testing and Demo Apps

### Test App Structure
- Minimal dependencies
- Clear examples of each feature
- Proper error handling demonstration
- Configuration examples
- Uses only public API

### Component Testing
- Unit tests for utilities
- Integration tests for hooks
- End-to-end tests for full features
- Error scenario testing

## Build and Deploy

### Package Structure
- Clear package exports
- Proper peer dependencies
- TypeScript declarations
- Source maps for debugging
- No legacy exports

### Build Configuration
- Proper module formats (ESM, CJS)
- Tree-shaking support
- TypeScript strict mode
- Proper dependency handling
- Clean build output

## Best Practices

### Error Handling
1. Always use appropriate error types
2. Include detailed error information
3. Clean up resources on errors
4. Provide clear error messages
5. Use specific error codes

### Performance
1. Proper cleanup of resources
2. Memoize expensive operations
3. Avoid unnecessary re-renders
4. Handle large audio data efficiently
5. Use cleanup flags to prevent race conditions

### Security
1. Proper API key handling
2. Secure WebSocket connections
3. Input validation
4. Resource limits
5. Safe error messages

### Debugging
1. Comprehensive logging system
2. Different debug levels
3. Clear error messages
4. Performance metrics
5. Resource tracking

## Development Workflow

### Making Changes
1. Start with base functionality
2. Test core features first
3. Add feature-specific code
4. Update demo app
5. Test thoroughly
6. Update documentation

### Adding Features
1. Add base classes if needed
2. Create/update hooks
3. Add feature-specific components
4. Update documentation
5. Add demo implementation
6. Follow naming conventions

### Fixing Issues
1. Identify root cause
2. Fix in appropriate layer
3. Add tests
4. Update documentation
5. Verify fix in demo app
6. Consider impact on other features 