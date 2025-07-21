import '@testing-library/jest-dom';
// Mock the AudioContext and related APIs
var MockAudioContext = /** @class */ (function () {
    function MockAudioContext() {
    }
    MockAudioContext.prototype.createAnalyser = function () {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            fftSize: 0,
            frequencyBinCount: 0,
        };
    };
    MockAudioContext.prototype.createBufferSource = function () {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
        };
    };
    MockAudioContext.prototype.createMediaStreamSource = function () {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
        };
    };
    MockAudioContext.prototype.resume = function () {
        return Promise.resolve();
    };
    MockAudioContext.prototype.suspend = function () {
        return Promise.resolve();
    };
    MockAudioContext.prototype.close = function () {
        return Promise.resolve();
    };
    return MockAudioContext;
}());
// Mock WebSocket
var MockWebSocket = /** @class */ (function () {
    function MockWebSocket(url, protocols) {
        this.url = url;
        this.protocols = protocols;
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        this.readyState = 0;
    }
    MockWebSocket.prototype.send = function (_data) {
        // Mock implementation
    };
    MockWebSocket.prototype.close = function () {
        // Mock implementation
    };
    return MockWebSocket;
}());
// Mock MediaDevices
var mockMediaDevices = {
    getUserMedia: jest.fn().mockImplementation(function () {
        return Promise.resolve({
            getTracks: function () { return [{
                    stop: jest.fn(),
                }]; },
        });
    }),
};
// Setup global mocks
global.AudioContext = MockAudioContext;
global.WebSocket = MockWebSocket;
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    configurable: true,
});
// Mock window.URL
var mockCreateObjectURL = jest.fn();
var mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;
// Cleanup between tests
beforeEach(function () {
    jest.clearAllMocks();
});
//# sourceMappingURL=setupTests.js.map