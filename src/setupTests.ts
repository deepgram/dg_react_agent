import '@testing-library/jest-dom';

// Mock the AudioContext and related APIs
class MockAudioContext {
  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      fftSize: 0,
      frequencyBinCount: 0,
    };
  }
  
  createBufferSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }

  createMediaStreamSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((data: unknown) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  readyState = 0;

  constructor(public url: string, public protocols?: string | string[]) {}

  send(_data: string | ArrayBuffer) {
    // Mock implementation
  }

  close() {
    // Mock implementation
  }
}

// Mock MediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => 
    Promise.resolve({
      getTracks: () => [{
        stop: jest.fn(),
      }],
    })
  ),
};

// Setup global mocks
(global as any).AudioContext = MockAudioContext;
(global as any).WebSocket = MockWebSocket;
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  configurable: true,
});

// Mock window.URL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

(global.URL as any).createObjectURL = mockCreateObjectURL;
(global.URL as any).revokeObjectURL = mockRevokeObjectURL;

// Cleanup between tests
beforeEach(() => {
  jest.clearAllMocks();
});
