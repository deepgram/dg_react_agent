// Global instance counter for debugging
var instanceCounter = 0;
var WebSocketManager = /** @class */ (function () {
    function WebSocketManager(options, handlers) {
        if (handlers === void 0) { handlers = {}; }
        this.options = options;
        this.handlers = handlers;
        this.ws = null;
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.isManualClose = false;
        this.eventListeners = new Set();
        this.instanceId = ++instanceCounter;
        this.log("\uD83C\uDFD7\uFE0F WebSocketManager #".concat(this.instanceId, " created"));
    }
    WebSocketManager.prototype.log = function (message, data) {
        if (this.options.debug) {
            console.log("[WebSocketManager] ".concat(message), data || '');
        }
    };
    WebSocketManager.prototype.updateConnectionState = function (newState) {
        var _a, _b;
        if (this.connectionState !== newState) {
            this.log("\uD83D\uDD04 Connection state: ".concat(this.connectionState, " \u2192 ").concat(newState));
            this.connectionState = newState;
            (_b = (_a = this.handlers).onConnectionStateChange) === null || _b === void 0 ? void 0 : _b.call(_a, newState);
            this.notifyListeners({ type: 'state', state: newState });
        }
    };
    WebSocketManager.prototype.createConnection = function () {
        try {
            this.log('🔌 Creating new WebSocket connection...');
            this.updateConnectionState('connecting');
            var url = this.buildWebSocketURL();
            this.log('🔑 Using subprotocol authentication with API key');
            this.log('🔗 Full URL:', url);
            this.log('🔑 API Key:', this.options.apiKey.substring(0, 10) + '...');
            this.ws = new WebSocket(url, ['token', this.options.apiKey]);
            this.log('📡 WebSocket readyState after creation:', this.ws.readyState);
            this.setupEventHandlers();
        }
        catch (error) {
            this.handleConnectionError(error);
        }
    };
    WebSocketManager.prototype.setupEventHandlers = function () {
        var _this = this;
        if (!this.ws)
            return;
        this.ws.onopen = function () {
            var _a, _b;
            _this.log('✅ WebSocket opened successfully');
            _this.updateConnectionState('connected');
            _this.reconnectAttempts = 0;
            (_b = (_a = _this.handlers).onOpen) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        this.ws.onmessage = function (event) {
            var _a, _b, _c, _d;
            try {
                if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
                    if (event.data instanceof Blob) {
                        event.data.arrayBuffer().then(function (buffer) {
                            var _a, _b;
                            (_b = (_a = _this.handlers).onMessage) === null || _b === void 0 ? void 0 : _b.call(_a, buffer);
                            _this.notifyListeners({ type: 'binary', data: buffer });
                        });
                    }
                    else {
                        (_b = (_a = _this.handlers).onMessage) === null || _b === void 0 ? void 0 : _b.call(_a, event.data);
                        _this.notifyListeners({ type: 'binary', data: event.data });
                    }
                }
                else if (typeof event.data === 'string') {
                    var data = JSON.parse(event.data);
                    (_d = (_c = _this.handlers).onMessage) === null || _d === void 0 ? void 0 : _d.call(_c, data);
                    _this.notifyListeners({ type: 'message', data: data });
                }
            }
            catch (error) {
                _this.handleMessageError(error);
            }
        };
        this.ws.onclose = function (event) {
            var _a, _b;
            _this.log("\uD83D\uDD34 WebSocket closed - Code: ".concat(event.code, ", Reason: ").concat(event.reason || 'No reason'));
            _this.updateConnectionState('disconnected');
            _this.ws = null;
            (_b = (_a = _this.handlers).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (!_this.isManualClose && _this.shouldReconnect()) {
                _this.scheduleReconnect();
            }
        };
        this.ws.onerror = function () {
            _this.handleConnectionError(new Error('WebSocket connection error'));
        };
    };
    WebSocketManager.prototype.handleConnectionError = function (error) {
        var _a, _b;
        this.log('🚨 Connection error:', error);
        this.updateConnectionState('error');
        var connectionError = {
            name: 'ConnectionError',
            message: error.message,
            type: 'connection',
            code: 'WEBSOCKET_ERROR',
            details: { originalError: error }
        };
        (_b = (_a = this.handlers).onError) === null || _b === void 0 ? void 0 : _b.call(_a, connectionError);
        this.notifyListeners({ type: 'error', error: connectionError });
        if (this.shouldReconnect()) {
            this.scheduleReconnect();
        }
    };
    WebSocketManager.prototype.handleMessageError = function (error) {
        var _a, _b;
        var messageError = {
            name: 'MessageError',
            message: "Failed to parse WebSocket message: ".concat(error.message),
            type: 'connection',
            code: 'MESSAGE_PARSE_ERROR',
            details: { originalError: error }
        };
        (_b = (_a = this.handlers).onError) === null || _b === void 0 ? void 0 : _b.call(_a, messageError);
        this.notifyListeners({ type: 'error', error: messageError });
    };
    WebSocketManager.prototype.shouldReconnect = function () {
        var _a;
        var maxAttempts = (_a = this.options.maxReconnectAttempts) !== null && _a !== void 0 ? _a : 3;
        return this.reconnectAttempts < maxAttempts;
    };
    WebSocketManager.prototype.scheduleReconnect = function () {
        var _this = this;
        var _a;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        var baseDelay = (_a = this.options.reconnectDelay) !== null && _a !== void 0 ? _a : 1000;
        var delay = baseDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectTimer = window.setTimeout(function () {
            _this.reconnectAttempts++;
            _this.createConnection();
        }, delay);
    };
    WebSocketManager.prototype.connect = function () {
        if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
            return;
        }
        this.isManualClose = false;
        this.createConnection();
    };
    WebSocketManager.prototype.disconnect = function () {
        this.isManualClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
        }
    };
    WebSocketManager.prototype.sendMessage = function (message) {
        if (this.connectionState !== 'connected' || !this.ws) {
            throw new Error('WebSocket is not connected');
        }
        try {
            var jsonMessage = JSON.stringify(message);
            this.ws.send(jsonMessage);
        }
        catch (error) {
            this.handleConnectionError(error);
        }
    };
    WebSocketManager.prototype.sendBinary = function (data) {
        if (this.connectionState !== 'connected' || !this.ws) {
            throw new Error('WebSocket is not connected');
        }
        try {
            this.ws.send(data);
        }
        catch (error) {
            this.handleConnectionError(error);
        }
    };
    WebSocketManager.prototype.getState = function () {
        return this.connectionState;
    };
    WebSocketManager.prototype.isConnected = function () {
        return this.connectionState === 'connected';
    };
    WebSocketManager.prototype.cleanup = function () {
        this.disconnect();
        this.eventListeners.clear();
    };
    WebSocketManager.prototype.buildWebSocketURL = function () {
        return this.options.url;
    };
    WebSocketManager.prototype.addEventListener = function (listener) {
        var _this = this;
        this.eventListeners.add(listener);
        return function () { return _this.eventListeners.delete(listener); };
    };
    WebSocketManager.prototype.notifyListeners = function (event) {
        Array.from(this.eventListeners).forEach(function (listener) { return listener(event); });
    };
    return WebSocketManager;
}());
export { WebSocketManager };
//# sourceMappingURL=WebSocketManager.js.map