//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
};
//#endregion
//#region node_modules/partysocket/dist/ws.js
(!globalThis.EventTarget || !globalThis.Event) && console.error("\n  PartySocket requires a global 'EventTarget' class to be available!\n  You can polyfill this global by adding this to your code before any partysocket imports: \n  \n  ```\n  import 'partysocket/event-target-polyfill';\n  ```\n  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.\n");
var n = class extends Event {
	message;
	error;
	constructor(e, t) {
		super("error", t), this.message = e.message, this.error = e;
	}
}, r = class extends Event {
	code;
	reason;
	wasClean = !0;
	constructor(e = 1e3, t = "", n) {
		super("close", n), this.code = e, this.reason = t;
	}
}, i = {
	Event,
	ErrorEvent: n,
	CloseEvent: r
};
function a(e, t) {
	if (!e) throw Error(t);
}
function o(e) {
	return new e.constructor(e.type, e);
}
function s(e) {
	return "data" in e ? new MessageEvent(e.type, e) : "code" in e || "reason" in e ? new r(e.code || 1999, e.reason || "unknown reason", e) : "error" in e ? new n(e.error, e) : new Event(e.type, e);
}
var c = typeof process < "u" && process.versions?.node !== void 0, l = typeof navigator < "u" && navigator.product === "ReactNative", u = c || l ? s : o, d = {
	maxReconnectionDelay: 1e4,
	minReconnectionDelay: 3e3,
	minUptime: 5e3,
	reconnectionDelayGrowFactor: 1.3,
	connectionTimeout: 4e3,
	maxRetries: Infinity,
	maxEnqueuedMessages: Infinity,
	startClosed: !1,
	debug: !1
}, f = !1;
function p() {}
var m = class e extends EventTarget {
	_ws;
	_retryCount = -1;
	_uptimeTimeout;
	_connectTimeout;
	_shouldReconnect = !0;
	_connectLock = !1;
	_binaryType = "blob";
	_closeCalled = !1;
	_didWarnAboutClosedSend = !1;
	_messageQueue = [];
	_debugLogger = console.log.bind(console);
	_url;
	_protocols;
	_options;
	constructor(e, t, n = {}) {
		super(), this._url = e, this._protocols = t, this._options = n, this._options.startClosed && (this._shouldReconnect = !1), this._options.debugLogger && (this._debugLogger = this._options.debugLogger), this._connect();
	}
	static get CONNECTING() {
		return 0;
	}
	static get OPEN() {
		return 1;
	}
	static get CLOSING() {
		return 2;
	}
	static get CLOSED() {
		return 3;
	}
	get CONNECTING() {
		return e.CONNECTING;
	}
	get OPEN() {
		return e.OPEN;
	}
	get CLOSING() {
		return e.CLOSING;
	}
	get CLOSED() {
		return e.CLOSED;
	}
	get binaryType() {
		return this._ws ? this._ws.binaryType : this._binaryType;
	}
	set binaryType(e) {
		this._binaryType = e, this._ws && (this._ws.binaryType = e);
	}
	get retryCount() {
		return Math.max(this._retryCount, 0);
	}
	get bufferedAmount() {
		return this._messageQueue.reduce((e, t) => (typeof t == "string" ? e += t.length : t instanceof Blob ? e += t.size : e += t.byteLength, e), 0) + (this._ws ? this._ws.bufferedAmount : 0);
	}
	get extensions() {
		return this._ws ? this._ws.extensions : "";
	}
	get protocol() {
		return this._ws ? this._ws.protocol : "";
	}
	get readyState() {
		return this._closeCalled ? e.CLOSED : this._ws ? this._ws.readyState : this._options.startClosed ? e.CLOSED : e.CONNECTING;
	}
	get url() {
		return this._ws ? this._ws.url : "";
	}
	get shouldReconnect() {
		return this._shouldReconnect;
	}
	onclose = null;
	onerror = null;
	onmessage = null;
	onopen = null;
	close(e = 1e3, t) {
		if (this._closeCalled = !0, this._shouldReconnect = !1, this._clearTimeouts(), !this._ws) {
			this._debug("close enqueued: no ws instance");
			return;
		}
		if (this._ws.readyState === this.CLOSED || this._ws.readyState === this.CLOSING) {
			this._debug("close: already closing or closed");
			return;
		}
		this._disconnect(e, t);
	}
	reconnect(e, t) {
		this._shouldReconnect = !0, this._closeCalled = !1, this._didWarnAboutClosedSend = !1, this._retryCount = -1, !this._ws || this._ws.readyState === this.CLOSED || this._ws.readyState === this.CLOSING || this._disconnect(e, t), this._connect();
	}
	send(e) {
		if (this._ws && this._ws.readyState === this.OPEN) return this._debug("send", e), this._ws.send(e), !0;
		this._closeCalled && !this._didWarnAboutClosedSend && (this._didWarnAboutClosedSend = !0, console.warn("ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used."));
		let { maxEnqueuedMessages: t = d.maxEnqueuedMessages } = this._options;
		return this._messageQueue.length < t && (this._debug("enqueue", e), this._messageQueue.push(e)), !1;
	}
	drainQueuedMessages() {
		let e = this._messageQueue;
		return this._messageQueue = [], e;
	}
	_debug(...e) {
		this._options.debug && this._debugLogger("RWS>", ...e);
	}
	_getNextDelay() {
		let { reconnectionDelayGrowFactor: e = d.reconnectionDelayGrowFactor, minReconnectionDelay: t = d.minReconnectionDelay, maxReconnectionDelay: n = d.maxReconnectionDelay } = this._options, r = 0;
		return this._retryCount > 0 && (r = t * e ** (this._retryCount - 1), r > n && (r = n)), this._debug("next delay", r), r;
	}
	_wait() {
		return new Promise((e) => {
			setTimeout(e, this._getNextDelay());
		});
	}
	_getNextProtocols(e) {
		if (!e) return Promise.resolve(null);
		if (typeof e == "string" || Array.isArray(e)) return Promise.resolve(e);
		if (typeof e == "function") {
			let t = e();
			if (!t) return Promise.resolve(null);
			if (typeof t == "string" || Array.isArray(t)) return Promise.resolve(t);
			if (t.then) return t;
		}
		throw Error("Invalid protocols");
	}
	_getNextUrl(e) {
		if (typeof e == "string") return Promise.resolve(e);
		if (typeof e == "function") {
			let t = e();
			if (typeof t == "string") return Promise.resolve(t);
			if (t.then) return t;
		}
		throw Error("Invalid URL");
	}
	_connect() {
		if (this._connectLock || !this._shouldReconnect) return;
		this._connectLock = !0;
		let { maxRetries: e = d.maxRetries, connectionTimeout: t = d.connectionTimeout } = this._options;
		if (this._retryCount >= e) {
			this._debug("max retries reached", this._retryCount, ">=", e), this._connectLock = !1;
			return;
		}
		this._retryCount++, this._debug("connect", this._retryCount), this._removeListeners(), this._wait().then(() => Promise.all([this._getNextUrl(this._url), this._getNextProtocols(this._protocols || null)])).then(([e, n]) => {
			if (this._closeCalled) {
				this._connectLock = !1;
				return;
			}
			!this._options.WebSocket && typeof WebSocket > "u" && !f && (console.error("‼️ No WebSocket implementation available. You should define options.WebSocket. \n\nFor example, if you're using node.js, run `npm install ws`, and then in your code:\n\nimport PartySocket from 'partysocket';\nimport WS from 'ws';\n\nconst partysocket = new PartySocket({\n  host: \"127.0.0.1:1999\",\n  room: \"test-room\",\n  WebSocket: WS\n});\n\n"), f = !0);
			let r = this._options.WebSocket || WebSocket;
			this._debug("connect", {
				url: e,
				protocols: n
			}), this._ws = n ? new r(e, n) : new r(e), this._ws.binaryType = this._binaryType, this._connectLock = !1, this._addListeners(), this._connectTimeout = setTimeout(() => this._handleTimeout(), t);
		}).catch((e) => {
			this._connectLock = !1, this._handleError(new i.ErrorEvent(Error(e.message), this));
		});
	}
	_handleTimeout() {
		this._debug("timeout event"), this._handleError(new i.ErrorEvent(Error("TIMEOUT"), this));
	}
	_disconnect(e = 1e3, t) {
		if (this._clearTimeouts(), this._ws) {
			this._removeListeners();
			try {
				(this._ws.readyState === this.OPEN || this._ws.readyState === this.CONNECTING) && this._ws.close(e, t), this._handleClose(new i.CloseEvent(e, t, this));
			} catch {}
		}
	}
	_acceptOpen() {
		this._debug("accept open"), this._retryCount = 0;
	}
	_handleOpen = (e) => {
		this._debug("open event");
		let { minUptime: t = d.minUptime } = this._options;
		clearTimeout(this._connectTimeout), this._uptimeTimeout = setTimeout(() => this._acceptOpen(), t), a(this._ws, "WebSocket is not defined"), this._ws.binaryType = this._binaryType, this._messageQueue.forEach((e) => {
			this._ws?.send(e);
		}), this._messageQueue = [], this.onopen && this.onopen(e), this.dispatchEvent(u(e));
	};
	_handleMessage = (e) => {
		this._debug("message event"), this.onmessage && this.onmessage(e), this.dispatchEvent(u(e));
	};
	_handleError = (e) => {
		this._debug("error event", e.message), this._disconnect(void 0, e.message === "TIMEOUT" ? "timeout" : void 0), this.onerror && this.onerror(e), this._debug("exec error listeners"), this.dispatchEvent(u(e)), this._connect();
	};
	_handleClose = (e) => {
		this._debug("close event"), this._clearTimeouts(), this._options.shouldReconnectOnClose && !this._options.shouldReconnectOnClose(e) && (this._shouldReconnect = !1), this._shouldReconnect && this._connect(), this.onclose && this.onclose(e), this.dispatchEvent(u(e));
	};
	_removeListeners() {
		this._ws && (this._debug("removeListeners"), this._ws.removeEventListener("open", this._handleOpen), this._ws.removeEventListener("close", this._handleClose), this._ws.removeEventListener("message", this._handleMessage), this._ws.removeEventListener("error", this._handleError), this._ws.addEventListener("error", p));
	}
	_addListeners() {
		this._ws && (this._debug("addListeners"), this._ws.addEventListener("open", this._handleOpen), this._ws.addEventListener("close", this._handleClose), this._ws.addEventListener("message", this._handleMessage), this._ws.addEventListener("error", this._handleError));
	}
	_clearTimeouts() {
		clearTimeout(this._connectTimeout), clearTimeout(this._uptimeTimeout);
	}
}, h = (e) => e[1] !== null && e[1] !== void 0;
function g() {
	if (crypto?.randomUUID) return crypto.randomUUID();
	let e = Date.now(), t = performance?.now && performance.now() * 1e3 || 0;
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(n) {
		let r = Math.random() * 16;
		return e > 0 ? (r = (e + r) % 16 | 0, e = Math.floor(e / 16)) : (r = (t + r) % 16 | 0, t = Math.floor(t / 16)), (n === "x" ? r : r & 3 | 8).toString(16);
	});
}
function _(e, t, n = {}) {
	let { host: r, path: i, protocol: a, room: o, party: s, basePath: c, prefix: l, query: u } = e, d = r.replace(/^(http|https|ws|wss):\/\//, "");
	if (d.endsWith("/") && (d = d.slice(0, -1)), i?.startsWith("/")) throw Error("path must not start with a slash");
	let f = s ?? "main", p = i ? `/${i}` : "", m = a || (d.startsWith("localhost:") || d.startsWith("127.0.0.1:") || d.startsWith("192.168.") || d.startsWith("10.") || d.startsWith("172.") && d.split(".")[1] >= "16" && d.split(".")[1] <= "31" || d.startsWith("[::ffff:7f00:1]:") ? t : `${t}s`), g = `${m}://${d}/${c || `${l || "parties"}/${f}/${o}`}${p}`, _ = (e = {}) => `${g}?${new URLSearchParams([...Object.entries(n), ...Object.entries(e).filter(h)])}`, v = typeof u == "function" ? async () => _(await u()) : _(u);
	return {
		host: d,
		path: p,
		room: o,
		name: f,
		protocol: m,
		partyUrl: g,
		urlProvider: v
	};
}
var v = class extends m {
	_pk;
	_pkurl;
	name;
	room;
	host;
	path;
	basePath;
	constructor(e) {
		let t = y(e);
		if (super(t.urlProvider, t.protocols, t.socketOptions), this.partySocketOptions = e, this.setWSProperties(t), !e.startClosed && !this.room && !this.basePath) throw this.close(), Error("Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect().");
		e.disableNameValidation || (e.party?.includes("/") && console.warn(`PartySocket: party name "${e.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`), e.room?.includes("/") && console.warn(`PartySocket: room name "${e.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`));
	}
	updateProperties(e) {
		let t = y({
			...this.partySocketOptions,
			...e,
			host: e.host ?? this.host,
			room: e.room ?? this.room,
			path: e.path ?? this.path,
			basePath: e.basePath ?? this.basePath
		});
		this._url = t.urlProvider, this._protocols = t.protocols, this._options = t.socketOptions, this.setWSProperties(t);
	}
	setWSProperties(e) {
		let { _pk: t, _pkurl: n, name: r, room: i, host: a, path: o, basePath: s } = e;
		this._pk = t, this._pkurl = n, this.name = r, this.room = i, this.host = a, this.path = o, this.basePath = s;
	}
	reconnect(e, t) {
		if (!this.host) throw Error("The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");
		if (!this.room && !this.basePath) throw Error("The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");
		super.reconnect(e, t);
	}
	get id() {
		return this._pk;
	}
	get roomUrl() {
		return this._pkurl;
	}
	static async fetch(e, t) {
		let n = _(e, "http"), r = typeof n.urlProvider == "string" ? n.urlProvider : await n.urlProvider();
		return (e.fetch ?? fetch)(r, t);
	}
};
function y(e) {
	let { id: t, host: n, path: r, party: i, room: a, protocol: o, query: s, protocols: c, ...l } = e, u = t || g(), d = _(e, "ws", { _pk: u });
	return {
		_pk: u,
		_pkurl: d.partyUrl,
		name: d.name,
		room: d.room,
		host: d.host,
		path: d.path,
		basePath: e.basePath,
		protocols: c,
		socketOptions: l,
		urlProvider: d.urlProvider
	};
}
//#endregion
//#region src/sdk/netcode/TurnPool.js
var b = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "stun:stun1.l.google.com:19302" },
	{ urls: "stun:stun.cloudflare.com:3478" },
	{ urls: "stun:openrelay.metered.ca:80" }
], x = [{
	urls: [
		"turn:openrelay.metered.ca:80",
		"turn:openrelay.metered.ca:443",
		"turns:openrelay.metered.ca:443?transport=tcp"
	],
	username: "openrelayproject",
	credential: "openrelayproject"
}], S = class {
	static async resolveIceServers(e) {
		if (typeof e == "function") try {
			let t = await e();
			if (Array.isArray(t) && t.length > 0) return t;
		} catch (e) {
			console.warn("[Mereb:TurnPool] Failed to fetch dynamic TURN servers, falling back to defaults", e);
		}
		return Array.isArray(e) && e.length > 0 ? e : [...b, ...x];
	}
}, C = /* @__PURE__ */ t({
	DC: () => O,
	DEFAULT_ICE_SERVERS: () => w,
	ROLE: () => T,
	STATUS: () => E,
	WS: () => D,
	generateRoomCode: () => k
}), w = [...b, ...x], T = {
	HOST: "host",
	CLIENT: "client",
	BOT: "bot"
}, E = {
	IDLE: "idle",
	CONNECTING: "connecting",
	IN_LOBBY: "in_lobby",
	MATCHING: "matching",
	CONNECTED: "connected",
	DISCONNECTED: "disconnected"
}, D = {
	CREATE_ROOM: "create-room",
	JOIN_ROOM: "join-room",
	QUICK_PLAY: "quick-play",
	SIGNAL: "signal",
	ROOM_CREATED: "room-created",
	ROOM_JOINED: "room-joined",
	PLAYER_JOINED: "player-joined",
	PLAYER_LEFT: "player-left",
	MATCH_QUEUED: "match-queued",
	MATCH_FOUND: "match-found",
	START_SIGNAL: "start-signal",
	ERROR: "error"
}, O = {
	STATE: "state",
	INPUT: "input",
	EVENT: "event",
	PING: "ping",
	PONG: "pong"
};
function k() {
	let e = "";
	for (let t = 0; t < 4; t++) e += "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)];
	return e;
}
//#endregion
//#region src/sdk/SignalingClient.js
var A = class extends EventTarget {
	constructor(e, t = "tank-arena") {
		super(), this.host = e, this.appId = t, this.ws = null, this.roomId = null;
	}
	connect(e, t = 15e3) {
		return this.roomId = e, new Promise((n, r) => {
			let i = !1, a = setTimeout(() => {
				i || (i = !0, r(/* @__PURE__ */ Error("Connection timed out. Server may still be waking up.")));
			}, t);
			try {
				this.ws && this.ws.close(), this.ws = new v({
					host: this.host,
					room: e,
					query: { appId: this.appId }
				}), this.ws.addEventListener("open", () => {
					i || (i = !0, clearTimeout(a), this.dispatchEvent(new CustomEvent("open", { detail: { id: this.playerId } })), n());
				}), this.ws.addEventListener("message", (e) => {
					try {
						let t = JSON.parse(e.data);
						this.dispatchEvent(new CustomEvent("message", { detail: t }));
					} catch (e) {
						console.error("[Mereb:Signaling] JSON Parse error", e);
					}
				}), this.ws.addEventListener("close", () => {
					this.dispatchEvent(new CustomEvent("close"));
				}), this.ws.addEventListener("error", (e) => {
					this.dispatchEvent(new CustomEvent("error", { detail: e }));
				});
			} catch (e) {
				clearTimeout(a), r(e);
			}
		});
	}
	send(e) {
		this.ws && this.ws.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify(e));
	}
	sendSignal(e, t) {
		this.send({
			type: D.SIGNAL,
			to: e,
			signal: t
		});
	}
	disconnect() {
		this.ws &&= (this.ws.close(), null), this.roomId = null;
	}
	get playerId() {
		return this.ws ? this.ws.id : null;
	}
}, j = class extends EventTarget {
	constructor(e = {}) {
		super(), this.ping = 0, this.jitter = 0, this.packetLoss = 0, this.rating = "good", this._pingHistory = [], this._sentPings = /* @__PURE__ */ new Map(), this._nextSeq = 1, this._lostCount = 0, this._totalSent = 0, this._windowSize = e.windowSize || 10;
	}
	createPingPacket() {
		let e = this._nextSeq++, t = performance.now();
		this._sentPings.set(e, t), this._totalSent++;
		for (let [e, n] of this._sentPings.entries()) t - n > 3500 && (this._sentPings.delete(e), this._lostCount++, this._updateStats());
		return {
			seq: e,
			time: t
		};
	}
	recordPong(e) {
		if (!this._sentPings.has(e)) return;
		let t = this._sentPings.get(e);
		this._sentPings.delete(e);
		let n = Math.max(1, Math.round(performance.now() - t));
		this._pingHistory.push(n), this._pingHistory.length > this._windowSize && this._pingHistory.shift(), this._updateStats();
	}
	_updateStats() {
		if (this._pingHistory.length === 0) return;
		let e = this._pingHistory.reduce((e, t) => e + t, 0), t = Math.round(e / this._pingHistory.length);
		this.ping = t;
		let n = 0;
		for (let e = 1; e < this._pingHistory.length; e++) n += Math.abs(this._pingHistory[e] - this._pingHistory[e - 1]);
		this.jitter = this._pingHistory.length > 1 ? Math.round(n / (this._pingHistory.length - 1)) : 0;
		let r = Math.min(this._totalSent, 30);
		this.packetLoss = r > 0 ? Math.min(100, Math.round(this._lostCount / r * 100)) : 0;
		let i = "great";
		i = this.ping > 220 || this.packetLoss >= 10 ? "poor" : this.ping > 130 || this.packetLoss >= 4 ? "fair" : this.ping > 65 || this.packetLoss >= 2 ? "good" : "great";
		let a = i !== this.rating;
		this.rating = i, this.dispatchEvent(new CustomEvent("update", { detail: this.getStats() })), a && this.dispatchEvent(new CustomEvent("rating-change", { detail: { rating: this.rating } }));
	}
	getStats() {
		return {
			ping: this.ping,
			jitter: this.jitter,
			packetLoss: this.packetLoss,
			rating: this.rating
		};
	}
	reset() {
		this.ping = 0, this.jitter = 0, this.packetLoss = 0, this.rating = "good", this._pingHistory = [], this._sentPings.clear(), this._lostCount = 0, this._totalSent = 0;
	}
}, M = class extends EventTarget {
	constructor(e = {}) {
		super(), this.iceServers = e.iceServers || w, this.pc = new RTCPeerConnection({ iceServers: this.iceServers }), this.unreliableChannel = null, this.reliableChannel = null, this._connected = !1, this.latency = 0, this.quality = new j(), this._pingInterval = null, this.pendingCandidates = [], this.quality.addEventListener("update", (e) => {
			this.dispatchEvent(new CustomEvent("quality", { detail: e.detail }));
		}), this.pc.onicecandidate = (e) => {
			e.candidate && this.dispatchEvent(new CustomEvent("ice-candidate", { detail: { candidate: e.candidate } }));
		}, this.pc.onconnectionstatechange = () => {
			let e = this.pc.connectionState;
			(e === "disconnected" || e === "failed" || e === "closed") && this._handleDisconnect();
		}, this.pc.ondatachannel = (e) => {
			let t = e.channel;
			t.label === "unreliable" ? this._setupUnreliableChannel(t) : t.label === "reliable" && this._setupReliableChannel(t);
		};
	}
	_setupUnreliableChannel(e) {
		this.unreliableChannel = e, this.unreliableChannel.binaryType = "arraybuffer", e.onopen = () => this._checkChannelsOpen(), e.onclose = () => this._handleDisconnect(), e.onmessage = (e) => {
			if (e.data instanceof ArrayBuffer) {
				this.dispatchEvent(new CustomEvent("binary", { detail: e.data }));
				return;
			}
			try {
				let t = JSON.parse(e.data);
				t.type === O.STATE ? this.dispatchEvent(new CustomEvent("state", { detail: t.data })) : t.type === O.INPUT && this.dispatchEvent(new CustomEvent("input", { detail: t.data }));
			} catch (e) {
				console.warn("[Mereb:RTC] Failed to parse message on unreliable channel", e);
			}
		};
	}
	_setupReliableChannel(e) {
		this.reliableChannel = e, e.onopen = () => this._checkChannelsOpen(), e.onclose = () => this._handleDisconnect(), e.onmessage = (e) => {
			try {
				let t = JSON.parse(e.data);
				t.type === O.EVENT ? this.dispatchEvent(new CustomEvent("event", { detail: t })) : t.type === O.PING ? this.sendReliable({
					type: O.PONG,
					seq: t.seq,
					time: t.time
				}) : t.type === O.PONG && (this.quality.recordPong(t.seq), this.latency = this.quality.ping, this.dispatchEvent(new CustomEvent("latency", { detail: { latency: this.latency } })));
			} catch (e) {
				console.warn("[Mereb:RTC] Failed to parse message on reliable channel", e);
			}
		};
	}
	_checkChannelsOpen() {
		let e = this.unreliableChannel && this.unreliableChannel.readyState === "open", t = this.reliableChannel && this.reliableChannel.readyState === "open";
		(e || t) && !this._connected && (this._connected = !0, this._startPing(), this.dispatchEvent(new CustomEvent("open")));
	}
	_startPing() {
		this._pingInterval && clearInterval(this._pingInterval), this._pingInterval = setInterval(() => {
			if (this.reliableChannel && this.reliableChannel.readyState === "open") {
				let e = this.quality.createPingPacket();
				this.sendReliable({
					type: O.PING,
					seq: e.seq,
					time: e.time
				});
			}
		}, 1500);
	}
	_handleDisconnect() {
		this._connected && (this._connected = !1, this._pingInterval && clearInterval(this._pingInterval), this.quality.reset(), this.dispatchEvent(new CustomEvent("close")));
	}
	async createOffer() {
		let e = this.pc.createDataChannel("unreliable", {
			ordered: !1,
			maxRetransmits: 0
		});
		this._setupUnreliableChannel(e);
		let t = this.pc.createDataChannel("reliable", { ordered: !0 });
		this._setupReliableChannel(t);
		let n = await this.pc.createOffer();
		return await this.pc.setLocalDescription(n), this.pc.localDescription;
	}
	async handleOffer(e) {
		try {
			if (this.pc.signalingState !== "stable") return null;
			for (await this.pc.setRemoteDescription(new RTCSessionDescription(e)); this.pendingCandidates.length > 0;) {
				let e = this.pendingCandidates.shift();
				try {
					await this.pc.addIceCandidate(new RTCIceCandidate(e));
				} catch {}
			}
			let t = await this.pc.createAnswer();
			return await this.pc.setLocalDescription(t), this.pc.localDescription;
		} catch (e) {
			return console.warn("[Mereb:RTC] Handled offer race condition:", e.message), null;
		}
	}
	async handleAnswer(e) {
		try {
			if (this.pc.signalingState === "have-local-offer") for (await this.pc.setRemoteDescription(new RTCSessionDescription(e)); this.pendingCandidates.length > 0;) {
				let e = this.pendingCandidates.shift();
				try {
					await this.pc.addIceCandidate(new RTCIceCandidate(e));
				} catch {}
			}
		} catch (e) {
			console.warn("[Mereb:RTC] Handled answer race condition:", e.message);
		}
	}
	async addIceCandidate(e) {
		if (e) {
			if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
				this.pendingCandidates.push(e);
				return;
			}
			try {
				await this.pc.addIceCandidate(new RTCIceCandidate(e));
			} catch (e) {
				console.warn("[Mereb:RTC] addIceCandidate error:", e.message);
			}
		}
	}
	sendBinary(e) {
		if (this.unreliableChannel && this.unreliableChannel.readyState === "open") {
			let t = e instanceof ArrayBuffer ? e : e.buffer;
			this.unreliableChannel.send(t);
		}
	}
	sendState(e) {
		this.unreliableChannel && this.unreliableChannel.readyState === "open" && (e instanceof ArrayBuffer || ArrayBuffer.isView(e) ? this.sendBinary(e) : this.unreliableChannel.send(JSON.stringify({
			type: O.STATE,
			data: e
		})));
	}
	sendInput(e) {
		this.unreliableChannel && this.unreliableChannel.readyState === "open" && (e instanceof ArrayBuffer || ArrayBuffer.isView(e) ? this.sendBinary(e) : this.unreliableChannel.send(JSON.stringify({
			type: O.INPUT,
			data: e
		})));
	}
	sendReliable(e) {
		this.reliableChannel && this.reliableChannel.readyState === "open" && this.reliableChannel.send(JSON.stringify(e));
	}
	sendEvent(e, t = {}) {
		this.sendReliable({
			type: O.EVENT,
			name: e,
			data: t
		});
	}
	get connected() {
		return this._connected;
	}
	close() {
		this._pingInterval && clearInterval(this._pingInterval), this.unreliableChannel && this.unreliableChannel.close(), this.reliableChannel && this.reliableChannel.close(), this.pc && this.pc.close(), this._connected = !1;
	}
}, N = class extends EventTarget {
	constructor(e) {
		super(), this.client = e, this.portalType = null, this.sdk = null, this.isAdPlaying = !1, this.userProfile = null, this.client.on("match-start", () => this.notifyGameplayStart()), this.client.on("peer-disconnect", () => this.notifyGameplayStop());
	}
	attach(e = "auto", t = null) {
		let n = e, r = t;
		if (n === "auto") {
			if (typeof window < "u" && window.PokiSDK) n = "poki", r = window.PokiSDK;
			else if (typeof window < "u" && (window.CrazyGames?.SDK || window.CrazyGames)) n = "crazygames", r = window.CrazyGames?.SDK || window.CrazyGames;
			else return console.info("[Mereb:Portal] No portal SDK detected in global scope. Running in standalone mode."), this;
		}
		return this.portalType = n, this.sdk = r, this.portalType === "poki" ? this._setupPoki() : this.portalType === "crazygames" && this._setupCrazyGames(), console.log(`[Mereb:Portal] Successfully hooked into ${this.portalType.toUpperCase()} SDK.`), this;
	}
	_setupPoki() {
		this.client.addEventListener("room-created", (e) => {
			if (this.sdk?.shareableURL) try {
				let t = this.sdk.shareableURL({ room: e.detail.roomCode });
				t && (e.detail.shareUrl = t);
			} catch (e) {
				console.warn("[Mereb:Portal] Poki shareableURL error", e);
			}
		});
	}
	async requestCommercialBreak() {
		return this.sdk ? (this.isAdPlaying = !0, this.dispatchEvent(new CustomEvent("ad-start")), new Promise((e) => {
			let t = () => {
				this.isAdPlaying = !1, this.dispatchEvent(new CustomEvent("ad-end")), e(!0);
			};
			if (this.portalType === "poki" && this.sdk.commercialBreak) this.sdk.commercialBreak().then(t).catch(t);
			else if (this.portalType === "crazygames") {
				let e = {
					adStarted: () => {},
					adFinished: t,
					adError: t
				};
				this.sdk.ad?.requestAd ? this.sdk.ad.requestAd("midgame", e) : this.sdk.requestAd ? this.sdk.requestAd("midgame", e) : t();
			} else t();
		})) : !1;
	}
	async _setupCrazyGames() {
		try {
			if (this.sdk.user?.getUser) {
				let e = await this.sdk.user.getUser();
				e && (this.userProfile = {
					username: e.username,
					avatarUrl: e.profilePictureUrl
				});
			}
		} catch {}
		this.client.addEventListener("room-created", async (e) => {
			if (this.sdk.game?.inviteLink) try {
				let t = await this.sdk.game.inviteLink({ room: e.detail.roomCode });
				t && (e.detail.shareUrl = t);
			} catch (e) {
				console.warn("[Mereb:Portal] CrazyGames inviteLink error", e);
			}
		});
	}
	notifyGameplayStart() {
		if (this.sdk) try {
			this.portalType === "poki" && this.sdk.gameplayStart ? this.sdk.gameplayStart() : this.portalType === "crazygames" && (this.sdk.game?.gameplayStart ? this.sdk.game.gameplayStart() : this.sdk.gameplayStart && this.sdk.gameplayStart());
		} catch {}
	}
	notifyGameplayStop() {
		if (this.sdk) try {
			this.portalType === "poki" && this.sdk.gameplayStop ? this.sdk.gameplayStop() : this.portalType === "crazygames" && (this.sdk.game?.gameplayStop ? this.sdk.game.gameplayStop() : this.sdk.gameplayStop && this.sdk.gameplayStop());
		} catch {}
	}
	getInviteUrl(e) {
		if (this.portalType === "poki" && this.sdk?.shareableURL) try {
			return this.sdk.shareableURL({ room: e });
		} catch {}
		return typeof window < "u" ? `${window.location.origin}${window.location.pathname}?room=${e}` : `?room=${e}`;
	}
}, P = class extends EventTarget {
	constructor(e = {}) {
		if (super(), this.host = e.host || (typeof window < "u" && window.location.hostname === "localhost" ? "localhost:1999" : ""), this.appId = e.appId || "tank-arena", this.botTimeoutMs = e.botTimeoutMs ?? 8e3, this.iceServers = e.iceServers, this.autoJoinFromUrl = e.autoJoinFromUrl ?? !0, this.signaling = new A(this.host, this.appId), this.peer = null, this.portal = new N(this), this.status = E.IDLE, this.role = null, this.localId = null, this.peerId = null, this.roomCode = null, this.isBot = !1, this.latency = 0, this._matchTimeout = null, e.onMatchStart && this.on("match-start", e.onMatchStart), e.onState && this.on("state", e.onState), e.onInput && this.on("input", e.onInput), e.onEvent && this.on("event", e.onEvent), e.onPeerDisconnect && this.on("peer-disconnect", e.onPeerDisconnect), e.onStatusChange && this.on("status-change", e.onStatusChange), e.onLatency && this.on("latency", e.onLatency), e.onQuality && this.on("quality", e.onQuality), this._setupSignalingListeners(), this.autoJoinFromUrl && typeof window < "u") {
			let e = new URLSearchParams(window.location.search).get("room");
			e && setTimeout(() => this.joinRoom(e), 50);
		}
	}
	on(e, t) {
		this.addEventListener(e, (e) => t(e.detail));
	}
	off(e, t) {
		this.removeEventListener(e, t);
	}
	_setStatus(e) {
		this.status = e, this.dispatchEvent(new CustomEvent("status-change", { detail: { status: e } }));
	}
	_setupSignalingListeners() {
		this.signaling.addEventListener("message", async (e) => {
			let t = e.detail;
			switch (t.type) {
				case D.PLAYER_JOINED:
					this.peerId = t.playerId;
					break;
				case D.ROOM_JOINED:
					this.peerId = t.players.find((e) => e !== this.localId), t.hostId !== this.localId && (this.role = T.CLIENT);
					break;
				case D.START_SIGNAL:
					this.peerId = t.peerId, this.role = T.HOST, await this._initPeerConnection(!0);
					break;
				case D.SIGNAL:
					await this._handleSignal(t);
					break;
				case D.MATCH_FOUND:
					this._matchTimeout && clearTimeout(this._matchTimeout), this.roomCode = t.roomCode, this.peerId = t.opponentId, this._setStatus(E.CONNECTING), this.signaling.disconnect(), setTimeout(async () => {
						await this.signaling.connect(this.roomCode), this.localId = this.signaling.playerId;
					}, 150);
					break;
				case D.MATCH_QUEUED:
					this._setStatus(E.MATCHING);
					break;
				case D.PLAYER_LEFT:
					this._handlePeerLeft("disconnected");
					break;
				case D.ERROR: this.dispatchEvent(new CustomEvent("error", { detail: { message: t.message } }));
			}
		});
	}
	async _initPeerConnection(e) {
		if (this.peer && this.peer.close(), this.peer = new M({ iceServers: this.iceServers }), this.peer.addEventListener("ice-candidate", (e) => {
			this.signaling.sendSignal(this.peerId, {
				type: "ice-candidate",
				candidate: e.detail.candidate
			});
		}), this.peer.addEventListener("open", () => {
			this._setStatus(E.CONNECTED), this.dispatchEvent(new CustomEvent("match-start", { detail: {
				role: this.role,
				localId: this.localId,
				peerId: this.peerId,
				isBot: !1,
				isHost: this.role === T.HOST
			} }));
		}), this.peer.addEventListener("close", () => {
			this._handlePeerLeft("rtc_closed");
		}), this.peer.addEventListener("state", (e) => {
			this.dispatchEvent(new CustomEvent("state", { detail: e.detail }));
		}), this.peer.addEventListener("input", (e) => {
			this.dispatchEvent(new CustomEvent("input", { detail: e.detail }));
		}), this.peer.addEventListener("event", (e) => {
			this.dispatchEvent(new CustomEvent("event", { detail: e.detail }));
		}), this.peer.addEventListener("latency", (e) => {
			this.latency = e.detail.latency, this.dispatchEvent(new CustomEvent("latency", { detail: { latency: this.latency } }));
		}), this.peer.addEventListener("binary", (e) => {
			this.dispatchEvent(new CustomEvent("binary", { detail: e.detail }));
		}), this.peer.addEventListener("quality", (e) => {
			this.dispatchEvent(new CustomEvent("quality", { detail: e.detail }));
		}), e) {
			let e = await this.peer.createOffer();
			this.signaling.sendSignal(this.peerId, {
				type: "offer",
				sdp: e
			});
		}
	}
	async _handleSignal(e) {
		let t = e.signal;
		if (!this.peer && t.type === "offer" && (this.role = T.CLIENT, await this._initPeerConnection(!1)), t.type === "ice-candidate") {
			this.peer ? await this.peer.addIceCandidate(t.candidate) : (this._earlyCandidates ||= [], this._earlyCandidates.push(t.candidate));
			return;
		}
		if (this.peer) {
			if (t.type === "offer") {
				let n = await this.peer.handleOffer(t.sdp);
				if (this.signaling.sendSignal(e.from, {
					type: "answer",
					sdp: n
				}), this._earlyCandidates && this._earlyCandidates.length > 0) {
					for (let e of this._earlyCandidates) await this.peer.addIceCandidate(e);
					this._earlyCandidates = [];
				}
			} else if (t.type === "answer" && (await this.peer.handleAnswer(t.sdp), this._earlyCandidates && this._earlyCandidates.length > 0)) {
				for (let e of this._earlyCandidates) await this.peer.addIceCandidate(e);
				this._earlyCandidates = [];
			}
		}
	}
	_handlePeerLeft(e) {
		this.status === E.CONNECTED && (this._setStatus(E.DISCONNECTED), this.dispatchEvent(new CustomEvent("peer-disconnect", { detail: {
			peerId: this.peerId,
			reason: e
		} })));
	}
	async createRoom() {
		this.disconnect(), this.role = T.HOST, this.roomCode = k(), this._setStatus(E.CONNECTING), await this.signaling.connect(this.roomCode), this.localId = this.signaling.playerId, this._setStatus(E.IN_LOBBY);
		let e = typeof window < "u" ? `${window.location.origin}${window.location.pathname}?room=${this.roomCode}` : `?room=${this.roomCode}`;
		return this.dispatchEvent(new CustomEvent("room-created", { detail: {
			roomCode: this.roomCode,
			shareUrl: e
		} })), {
			roomCode: this.roomCode,
			shareUrl: e
		};
	}
	async joinRoom(e) {
		this.disconnect(), this.role = T.CLIENT, this.roomCode = e.toUpperCase().trim(), this._setStatus(E.CONNECTING), await this.signaling.connect(this.roomCode), this.localId = this.signaling.playerId, this._setStatus(E.IN_LOBBY), this.dispatchEvent(new CustomEvent("room-joined", { detail: { roomCode: this.roomCode } }));
	}
	async quickPlay() {
		this.disconnect(), this._setStatus(E.MATCHING), await this.signaling.connect("matchmaker"), this.localId = this.signaling.playerId, this.signaling.send({ type: D.QUICK_PLAY }), this.botTimeoutMs && this.botTimeoutMs > 0 && (this._matchTimeout = setTimeout(() => {
			this._startBotMatch();
		}, this.botTimeoutMs));
	}
	_startBotMatch() {
		this.disconnect(), this.isBot = !0, this.role = T.HOST, this.localId = "local_player", this.peerId = "bot_opponent", this._setStatus(E.CONNECTED), this.dispatchEvent(new CustomEvent("match-start", { detail: {
			role: T.HOST,
			localId: this.localId,
			peerId: this.peerId,
			isBot: !0,
			isHost: !0
		} }));
	}
	sendState(e) {
		this.peer && this.peer.connected && this.peer.sendState(e);
	}
	sendBinary(e) {
		this.peer && this.peer.connected && this.peer.sendBinary(e);
	}
	sendInput(e) {
		this.peer && this.peer.connected && this.peer.sendInput(e);
	}
	sendEvent(e, t = {}) {
		this.peer && this.peer.connected && this.peer.sendEvent(e, t);
	}
	usePortal(e = "auto", t = null) {
		return this.portal.attach(e, t);
	}
	get stats() {
		return this.peer ? this.peer.quality.getStats() : {
			ping: 0,
			jitter: 0,
			packetLoss: 0,
			rating: "good"
		};
	}
	get isHost() {
		return this.role === T.HOST;
	}
	disconnect() {
		this._matchTimeout && clearTimeout(this._matchTimeout), this.peer &&= (this.peer.close(), null), this.signaling.disconnect(), this.status = E.IDLE, this.role = null, this.localId = null, this.peerId = null, this.roomCode = null, this.isBot = !1, this.latency = 0;
	}
}, F = class {
	constructor(e, t = {}) {
		this.client = e, this.options = Object.assign({
			title: "⚔️ MEREB ARENA",
			container: document.body
		}, t), this.element = document.createElement("div"), this.element.className = "mereb-lobby-overlay", this._injectStyles(), this._buildDOM(), this._setupHandlers(), this.options.container && this.options.container.appendChild(this.element);
	}
	_injectStyles() {
		if (document.getElementById("mereb-lobby-styles")) return;
		let e = document.createElement("style");
		e.id = "mereb-lobby-styles", e.textContent = "\n      .mereb-lobby-overlay {\n        position: fixed; inset: 0; z-index: 1000;\n        background: rgba(10, 10, 26, 0.88); backdrop-filter: blur(6px);\n        display: flex; flex-direction: column; align-items: center; justify-content: center;\n        font-family: 'Fredoka', system-ui, sans-serif; color: #fff;\n        user-select: none;\n      }\n      .mereb-lobby-title {\n        font-size: clamp(32px, 6vw, 56px); font-weight: 800;\n        text-shadow: 0 4px 0 #333, 0 8px 24px rgba(0,0,0,0.6);\n        margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px;\n      }\n      .mereb-menu-stack {\n        display: flex; flex-direction: column; gap: 14px; width: min(300px, 85vw);\n      }\n      .mereb-btn {\n        appearance: none; border: none; outline: none; cursor: pointer;\n        font-family: inherit; font-size: 19px; font-weight: 700; text-transform: uppercase;\n        padding: 16px 24px; border-radius: 14px; color: #fff;\n        transition: transform 0.08s ease, box-shadow 0.08s ease;\n        box-shadow: 0 4px 0 rgba(0,0,0,0.4);\n      }\n      .mereb-btn:active {\n        transform: translateY(3px);\n        box-shadow: 0 1px 0 rgba(0,0,0,0.4) !important;\n      }\n      .btn-create { background: #16a34a; border-bottom: 4px solid #14532d; }\n      .btn-join { background: #2563eb; border-bottom: 4px solid #1e3a8a; }\n      .btn-quick { background: #f59e0b; border-bottom: 4px solid #b45309; color: #000; }\n      .btn-copy { background: #0891b2; border-bottom: 4px solid #155e75; margin-top: 10px; }\n      .btn-back { background: #475569; border-bottom: 4px solid #1e293b; margin-top: 10px; }\n      .btn-submit { background: #9333ea; border-bottom: 4px solid #581c87; padding: 16px; flex-shrink: 0; }\n      \n      .mereb-join-box { display: flex; flex-direction: column; gap: 10px; width: 100%; }\n      .mereb-input-row { display: flex; gap: 8px; width: 100%; }\n      .mereb-code-input {\n        flex: 1; padding: 14px; font-size: 24px; font-family: monospace; font-weight: 800;\n        text-align: center; border-radius: 14px; border: 2px solid #475569;\n        background: #1e1e2f; color: #fff; text-transform: uppercase; outline: none; min-width: 0;\n      }\n      .mereb-code-input:focus { border-color: #38bdf8; }\n\n      .mereb-room-display { text-align: center; width: min(320px, 85vw); }\n      .mereb-room-code {\n        font-size: clamp(48px, 12vw, 68px); font-family: monospace; font-weight: 800;\n        letter-spacing: 6px; color: #facc15; text-shadow: 0 4px 0 #ca8a04; margin-bottom: 4px;\n      }\n      .mereb-status-text {\n        margin-top: 20px; font-size: 17px; color: #94a3b8; font-weight: 600;\n        min-height: 24px; text-transform: uppercase; letter-spacing: 1px;\n      }\n      .mereb-error-text {\n        margin-top: 8px; font-size: 15px; color: #f87171; font-weight: 700;\n        min-height: 20px; text-transform: uppercase;\n      }\n      .mereb-dots::after { content: ''; animation: merebDots 1.5s steps(4, end) infinite; }\n      @keyframes merebDots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }\n    ", document.head.appendChild(e);
	}
	_buildDOM() {
		this.element.innerHTML = `
      <h1 class="mereb-lobby-title">${this.options.title}</h1>

      <div class="mereb-menu-stack" id="mereb-main-menu">
        <button class="mereb-btn btn-create" id="mereb-btn-create">🎮 CREATE ROOM</button>
        <button class="mereb-btn btn-join" id="mereb-btn-join">🔗 JOIN ROOM</button>
        <button class="mereb-btn btn-quick" id="mereb-btn-quick">⚡ QUICK PLAY</button>
        ${this.options.onHome ? "<button class=\"mereb-btn btn-back\" id=\"mereb-btn-home\" style=\"margin-top: 10px; background: #334155; font-size: 14px; padding: 12px 18px;\">← LANDING PAGE</button>" : ""}
      </div>

      <div class="mereb-menu-stack" id="mereb-join-menu" style="display: none;">
        <div class="mereb-input-row">
          <input type="text" class="mereb-code-input" id="mereb-input-code" maxlength="4" placeholder="CODE" />
          <button class="mereb-btn btn-submit" id="mereb-btn-submit">GO ➜</button>
        </div>
        <button class="mereb-btn btn-back" id="mereb-btn-join-back">◀ BACK</button>
      </div>

      <div class="mereb-room-display" id="mereb-room-view" style="display: none;">
        <div class="mereb-room-code" id="mereb-code-text">----</div>
        <button class="mereb-btn btn-copy" id="mereb-btn-copy">📋 COPY INVITE LINK</button>
        <button class="mereb-btn btn-back" id="mereb-btn-room-back">◀ BACK</button>
      </div>

      <div class="mereb-status-text" id="mereb-status-text"></div>
      <div class="mereb-error-text" id="mereb-error-text"></div>
    `, this.mainMenu = this.element.querySelector("#mereb-main-menu"), this.joinMenu = this.element.querySelector("#mereb-join-menu"), this.roomView = this.element.querySelector("#mereb-room-view"), this.codeInput = this.element.querySelector("#mereb-input-code"), this.codeText = this.element.querySelector("#mereb-code-text"), this.statusText = this.element.querySelector("#mereb-status-text"), this.errorText = this.element.querySelector("#mereb-error-text");
	}
	_setupHandlers() {
		if (this.options.onHome) {
			let e = this.element.querySelector("#mereb-btn-home");
			e && e.addEventListener("click", () => {
				this.options.onHome();
			});
		}
		this.element.querySelector("#mereb-btn-create").addEventListener("click", async () => {
			this.setStatus("Connecting to server...", !0);
			try {
				let { roomCode: e } = await this.client.createRoom();
				this.mainMenu.style.display = "none", this.roomView.style.display = "block", this.codeText.innerText = e, this.setStatus("Waiting for opponent...", !0);
			} catch {
				this.showError("Server waking up... Click again in a moment");
			}
		}), this.element.querySelector("#mereb-btn-join").addEventListener("click", () => {
			this.mainMenu.style.display = "none", this.joinMenu.style.display = "flex", this.codeInput.focus();
		});
		let e = () => {
			let e = this.codeInput.value.trim().toUpperCase();
			e.length === 4 ? (this.setStatus("Connecting to room...", !0), this.client.joinRoom(e).catch(() => {
				this.showError("Could not connect to room");
			})) : this.showError("Code must be 4 characters");
		};
		this.element.querySelector("#mereb-btn-submit").addEventListener("click", e), this.codeInput.addEventListener("keypress", (t) => {
			t.key === "Enter" && e();
		}), this.element.querySelector("#mereb-btn-quick").addEventListener("click", () => {
			this.setStatus("Finding opponent...", !0), this.client.quickPlay();
		});
		let t = this.element.querySelector("#mereb-btn-copy");
		t.addEventListener("click", () => {
			let e = this.codeText.innerText, n = `${window.location.origin}${window.location.pathname}?room=${e}`;
			navigator.clipboard.writeText(n).then(() => {
				let e = t.innerText;
				t.innerText = "COPIED! ✅", setTimeout(() => {
					t.innerText = e;
				}, 2e3);
			}).catch(() => {
				this.showError("Failed to copy");
			});
		});
		let n = () => {
			this.client.disconnect(), this.resetToMenu();
		};
		this.element.querySelector("#mereb-btn-join-back").addEventListener("click", n), this.element.querySelector("#mereb-btn-room-back").addEventListener("click", n), this.client.on("match-start", () => {
			this.hide();
		}), this.client.on("error", (e) => {
			this.showError(e.message || "Network error");
		}), this.client.on("peer-disconnect", () => {
			this.show(), this.resetToMenu(), this.showError("Opponent disconnected");
		});
	}
	setStatus(e, t = !1) {
		this.statusText.innerText = e, t ? this.statusText.classList.add("mereb-dots") : this.statusText.classList.remove("mereb-dots");
	}
	showError(e) {
		this.errorText.innerText = e, setTimeout(() => {
			this.errorText.innerText = "";
		}, 3500);
	}
	resetToMenu() {
		this.mainMenu.style.display = "flex", this.joinMenu.style.display = "none", this.roomView.style.display = "none", this.codeInput.value = "", this.statusText.innerText = "", this.statusText.classList.remove("mereb-dots");
	}
	show() {
		this.element.style.display = "flex";
	}
	hide() {
		this.element.style.display = "none";
	}
}, I = typeof TextEncoder < "u" ? new TextEncoder() : null, L = typeof TextDecoder < "u" ? new TextDecoder() : null, R = class {
	constructor(e = 512) {
		this.capacity = e, this.buffer = new ArrayBuffer(this.capacity), this.view = new DataView(this.buffer), this.offset = 0;
	}
	_ensureCapacity(e) {
		if (this.offset + e > this.capacity) {
			let t = this.capacity * 2;
			for (; this.offset + e > t;) t *= 2;
			let n = new ArrayBuffer(t);
			new Uint8Array(n).set(new Uint8Array(this.buffer)), this.buffer = n, this.view = new DataView(this.buffer), this.capacity = t;
		}
	}
	reset() {
		return this.offset = 0, this;
	}
	writeUint8(e) {
		return this._ensureCapacity(1), this.view.setUint8(this.offset, e), this.offset += 1, this;
	}
	writeInt8(e) {
		return this._ensureCapacity(1), this.view.setInt8(this.offset, e), this.offset += 1, this;
	}
	writeBoolean(e) {
		return this.writeUint8(+!!e);
	}
	writeUint16(e) {
		return this._ensureCapacity(2), this.view.setUint16(this.offset, e, !0), this.offset += 2, this;
	}
	writeInt16(e) {
		return this._ensureCapacity(2), this.view.setInt16(this.offset, e, !0), this.offset += 2, this;
	}
	writeUint32(e) {
		return this._ensureCapacity(4), this.view.setUint32(this.offset, e, !0), this.offset += 4, this;
	}
	writeInt32(e) {
		return this._ensureCapacity(4), this.view.setInt32(this.offset, e, !0), this.offset += 4, this;
	}
	writeFloat32(e) {
		return this._ensureCapacity(4), this.view.setFloat32(this.offset, e, !0), this.offset += 4, this;
	}
	writeFloat64(e) {
		return this._ensureCapacity(8), this.view.setFloat64(this.offset, e, !0), this.offset += 8, this;
	}
	writeFixed16(e, t = 100) {
		let n = Math.max(-32768, Math.min(32767, Math.round(e * t)));
		return this.writeInt16(n);
	}
	writeFixed8(e, t = 10) {
		let n = Math.max(-128, Math.min(127, Math.round(e * t)));
		return this.writeInt8(n);
	}
	writeString(e) {
		if (!I) {
			let t = e.length;
			this.writeUint16(t);
			for (let n = 0; n < t; n++) this.writeUint8(e.charCodeAt(n));
			return this;
		}
		let t = I.encode(e);
		return this.writeUint16(t.length), this._ensureCapacity(t.length), new Uint8Array(this.buffer, this.offset, t.length).set(t), this.offset += t.length, this;
	}
	writeBytes(e) {
		return this._ensureCapacity(e.length), new Uint8Array(this.buffer, this.offset, e.length).set(e), this.offset += e.length, this;
	}
	getBuffer() {
		return this.buffer.slice(0, this.offset);
	}
	getView() {
		return new Uint8Array(this.buffer, 0, this.offset);
	}
	get length() {
		return this.offset;
	}
}, z = class {
	constructor(e) {
		if (e instanceof ArrayBuffer) this.buffer = e, this.view = new DataView(this.buffer), this.byteLength = this.buffer.byteLength;
		else if (ArrayBuffer.isView(e)) this.buffer = e.buffer, this.view = new DataView(this.buffer, e.byteOffset, e.byteLength), this.byteLength = e.byteLength;
		else throw Error("BinaryReader requires an ArrayBuffer or TypedArray view");
		this.offset = 0;
	}
	seek(e) {
		return this.offset = Math.max(0, Math.min(this.byteLength, e)), this;
	}
	readUint8() {
		let e = this.view.getUint8(this.offset);
		return this.offset += 1, e;
	}
	readInt8() {
		let e = this.view.getInt8(this.offset);
		return this.offset += 1, e;
	}
	readBoolean() {
		return this.readUint8() !== 0;
	}
	readUint16() {
		let e = this.view.getUint16(this.offset, !0);
		return this.offset += 2, e;
	}
	writeInt16() {
		let e = this.view.getInt16(this.offset, !0);
		return this.offset += 2, e;
	}
	readInt16() {
		let e = this.view.getInt16(this.offset, !0);
		return this.offset += 2, e;
	}
	readUint32() {
		let e = this.view.getUint32(this.offset, !0);
		return this.offset += 4, e;
	}
	readInt32() {
		let e = this.view.getInt32(this.offset, !0);
		return this.offset += 4, e;
	}
	readFloat32() {
		let e = this.view.getFloat32(this.offset, !0);
		return this.offset += 4, e;
	}
	readFloat64() {
		let e = this.view.getFloat64(this.offset, !0);
		return this.offset += 8, e;
	}
	readFixed16(e = 100) {
		return this.readInt16() / e;
	}
	readFixed8(e = 10) {
		return this.readInt8() / e;
	}
	readString() {
		let e = this.readUint16();
		if (!L) {
			let t = "";
			for (let n = 0; n < e; n++) t += String.fromCharCode(this.readUint8());
			return t;
		}
		let t = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, e);
		return this.offset += e, L.decode(t);
	}
	readBytes(e) {
		let t = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, e);
		return this.offset += e, t;
	}
	get bytesRemaining() {
		return this.byteLength - this.offset;
	}
};
//#endregion
//#region src/sdk/netcode/SnapshotInterpolator.js
function B(e, t, n) {
	return e + (t - e) * n;
}
function V(e, t, n) {
	let r = (t - e) % (Math.PI * 2);
	return r < -Math.PI && (r += Math.PI * 2), r > Math.PI && (r -= Math.PI * 2), e + r * n;
}
var H = class {
	constructor(e = {}) {
		this.bufferTime = e.bufferTime ?? 100, this.maxExtrapolation = e.maxExtrapolation ?? 120, this.maxSnapshots = e.maxSnapshots ?? 30, this.snapshots = [], this.angleProperties = new Set(e.angleProperties || [
			"rotation",
			"turretRotation",
			"angle",
			"yaw",
			"pitch"
		]), this.snapProperties = new Set(e.snapProperties || [
			"health",
			"score",
			"team",
			"state",
			"invulnerable",
			"isShooting"
		]);
	}
	pushSnapshot(e, t) {
		let n = performance.now(), r = {
			clientRecvTime: n,
			serverTime: e || n,
			entities: t
		};
		this.snapshots.length > 0 && r.serverTime < this.snapshots[0].serverTime || (this.snapshots.push(r), this.snapshots.sort((e, t) => e.serverTime - t.serverTime), this.snapshots.length > this.maxSnapshots && this.snapshots.shift());
	}
	getInterpolated() {
		if (this.snapshots.length === 0) return {};
		if (this.snapshots.length === 1) return this.snapshots[0].entities;
		performance.now();
		let e = this.snapshots[this.snapshots.length - 1].serverTime - this.bufferTime, t = null, n = null;
		for (let r = 0; r < this.snapshots.length - 1; r++) if (this.snapshots[r].serverTime <= e && this.snapshots[r + 1].serverTime >= e) {
			t = this.snapshots[r], n = this.snapshots[r + 1];
			break;
		}
		if (!t && e < this.snapshots[0].serverTime) return this.snapshots[0].entities;
		if (!t) {
			t = this.snapshots[this.snapshots.length - 2], n = this.snapshots[this.snapshots.length - 1];
			let r = n.serverTime - t.serverTime;
			if (r <= 0) return n.entities;
			let i = e - n.serverTime, a = 1 + Math.min(i, this.maxExtrapolation) / r;
			return this._interpolateEntities(t.entities, n.entities, a);
		}
		let r = n.serverTime - t.serverTime, i = r > 0 ? (e - t.serverTime) / r : 1;
		return this._interpolateEntities(t.entities, n.entities, Math.max(0, Math.min(1, i)));
	}
	_interpolateEntities(e, t, n) {
		let r = {}, i = /* @__PURE__ */ new Set([...Object.keys(e || {}), ...Object.keys(t || {})]);
		for (let a of i) {
			let i = e[a], o = t[a];
			if (!i && o) {
				r[a] = { ...o };
				continue;
			}
			if (i && !o) {
				r[a] = { ...i };
				continue;
			}
			let s = {};
			for (let e of Object.keys(o)) {
				let t = i[e], r = o[e];
				s[e] = typeof r == "number" && typeof t == "number" ? this.snapProperties.has(e) ? r : this.angleProperties.has(e) ? V(t, r, n) : B(t, r, n) : r === void 0 ? t : r;
			}
			r[a] = s;
		}
		return r;
	}
	clear() {
		this.snapshots = [];
	}
};
//#endregion
//#region src/sdk/netcode/Schema.js
function U(e) {
	let t = Object.entries(e).map(([e, t]) => typeof t == "string" ? {
		name: e,
		type: t,
		scale: t === "fixed16" ? 100 : 1
	} : {
		name: e,
		type: t.type || "fixed16",
		scale: t.scale || 100
	}), n = new R(512);
	return {
		fields: t,
		encode(e, r = null) {
			let i = r || n.reset();
			for (let n = 0; n < t.length; n++) {
				let { name: r, type: a, scale: o } = t[n], s = e ? e[r] : 0;
				switch (a) {
					case "uint8":
						i.writeUint8(s || 0);
						break;
					case "int8":
						i.writeInt8(s || 0);
						break;
					case "uint16":
						i.writeUint16(s || 0);
						break;
					case "int16":
						i.writeInt16(s || 0);
						break;
					case "uint32":
						i.writeUint32(s || 0);
						break;
					case "int32":
						i.writeInt32(s || 0);
						break;
					case "float32":
						i.writeFloat32(s || 0);
						break;
					case "fixed16":
						i.writeFixed16(s || 0, o);
						break;
					case "boolean":
					case "bool":
						i.writeBoolean(!!s);
						break;
					case "string":
						i.writeString(s || "");
						break;
					default: i.writeFloat32(s || 0);
				}
			}
			return r ? i : i.getView();
		},
		decode(e) {
			let n = e instanceof z ? e : new z(e), r = {};
			for (let e = 0; e < t.length; e++) {
				let { name: i, type: a, scale: o } = t[e];
				switch (a) {
					case "uint8":
						r[i] = n.readUint8();
						break;
					case "int8":
						r[i] = n.readInt8();
						break;
					case "uint16":
						r[i] = n.readUint16();
						break;
					case "int16":
						r[i] = n.readInt16();
						break;
					case "uint32":
						r[i] = n.readUint32();
						break;
					case "int32":
						r[i] = n.readInt32();
						break;
					case "float32":
						r[i] = n.readFloat32();
						break;
					case "fixed16":
						r[i] = n.readFixed16(o);
						break;
					case "boolean":
					case "bool":
						r[i] = n.readBoolean();
						break;
					case "string":
						r[i] = n.readString();
						break;
					default: r[i] = n.readFloat32();
				}
			}
			return r;
		}
	};
}
//#endregion
//#region src/sdk/controls/TouchControls.js
var W = class {
	constructor(e = {}) {
		this.container = e.container || document.body, this.forceShow = e.forceShow || !1, this.onMove = e.onMove || null, this.onAim = e.onAim || null, this.onFire = e.onFire || null, this.isTouchDevice = this.forceShow || "ontouchstart" in window || navigator.maxTouchPoints > 0, this.maxRadius = e.maxRadius || 55, this.deadzone = e.deadzone || .15, this.state = {
			move: {
				x: 0,
				y: 0,
				up: !1,
				down: !1,
				left: !1,
				right: !1,
				angle: 0,
				active: !1
			},
			aim: {
				x: 0,
				y: 0,
				angle: 0,
				active: !1
			},
			fire: !1
		}, this.leftTouchId = null, this.leftCenter = {
			x: 0,
			y: 0
		}, this.rightTouchId = null, this.rightCenter = {
			x: 0,
			y: 0
		}, this.dom = null, this.isTouchDevice && (this._buildDOM(), this._attachEvents());
	}
	_buildDOM() {
		this._injectStyles(), this.dom = document.createElement("div"), this.dom.className = "mereb-touch-overlay", this.leftZone = document.createElement("div"), this.leftZone.className = "mereb-touch-zone left-zone", this.leftBase = document.createElement("div"), this.leftBase.className = "mereb-joystick-base left-base", this.leftKnob = document.createElement("div"), this.leftKnob.className = "mereb-joystick-knob left-knob", this.leftBase.appendChild(this.leftKnob), this.leftZone.appendChild(this.leftBase), this.rightZone = document.createElement("div"), this.rightZone.className = "mereb-touch-zone right-zone", this.rightBase = document.createElement("div"), this.rightBase.className = "mereb-joystick-base right-base", this.rightKnob = document.createElement("div"), this.rightKnob.className = "mereb-joystick-knob right-knob", this.rightBase.appendChild(this.rightKnob), this.rightZone.appendChild(this.rightBase), this.fireBtn = document.createElement("button"), this.fireBtn.className = "mereb-fire-btn", this.fireBtn.innerHTML = "\n      <span class=\"fire-icon\">💥</span>\n      <span class=\"fire-text\">FIRE</span>\n    ", this.rightZone.appendChild(this.fireBtn), this.dom.appendChild(this.leftZone), this.dom.appendChild(this.rightZone), this.container.appendChild(this.dom);
	}
	_injectStyles() {
		if (document.getElementById("mereb-touch-styles")) return;
		let e = document.createElement("style");
		e.id = "mereb-touch-styles", e.textContent = "\n      .mereb-touch-overlay {\n        position: absolute;\n        top: 0; left: 0; width: 100%; height: 100%;\n        pointer-events: none;\n        z-index: 25;\n        user-select: none;\n        -webkit-user-select: none;\n        touch-action: none;\n      }\n      .mereb-touch-zone {\n        position: absolute;\n        top: 25%;\n        bottom: 0;\n        width: 50%;\n        pointer-events: auto;\n        touch-action: none;\n      }\n      .left-zone {\n        left: 0;\n      }\n      .right-zone {\n        right: 0;\n      }\n\n      /* Joystick Base */\n      .mereb-joystick-base {\n        position: absolute;\n        width: 120px;\n        height: 120px;\n        border-radius: 50%;\n        background: radial-gradient(circle, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%);\n        border: 2px solid rgba(255, 255, 255, 0.2);\n        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05);\n        pointer-events: none;\n        opacity: 0.45;\n        transition: opacity 0.15s ease, border-color 0.15s ease;\n        margin-left: -60px;\n        margin-top: -60px;\n      }\n      .mereb-joystick-base.active {\n        opacity: 0.9;\n        border-color: #38bdf8;\n        box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2);\n      }\n\n      .left-base {\n        left: 80px;\n        bottom: 80px;\n      }\n      .right-base {\n        right: 170px;\n        bottom: 80px;\n      }\n\n      /* Joystick Knob */\n      .mereb-joystick-knob {\n        position: absolute;\n        width: 50px;\n        height: 50px;\n        border-radius: 50%;\n        background: linear-gradient(135deg, #38bdf8, #0284c7);\n        border: 2px solid #ffffff;\n        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);\n        left: 35px;\n        top: 35px;\n        pointer-events: none;\n        transition: transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1);\n      }\n      .right-knob {\n        background: linear-gradient(135deg, #f87171, #dc2626);\n      }\n\n      /* Fire Button (Chunky Arcade 3D) */\n      .mereb-fire-btn {\n        position: absolute;\n        right: 28px;\n        bottom: 50px;\n        width: 90px;\n        height: 90px;\n        border-radius: 50%;\n        background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);\n        border: 3px solid #fecaca;\n        border-bottom: 6px solid #7f1d1d;\n        color: #ffffff;\n        display: flex;\n        flex-direction: column;\n        align-items: center;\n        justify-content: center;\n        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.45);\n        font-family: 'Fredoka', system-ui, sans-serif;\n        font-weight: 700;\n        cursor: pointer;\n        pointer-events: auto;\n        touch-action: none;\n        user-select: none;\n        transition: transform 0.05s, border-bottom-width 0.05s, box-shadow 0.05s;\n        z-index: 30;\n      }\n      .mereb-fire-btn .fire-icon {\n        font-size: 24px;\n        line-height: 1;\n        pointer-events: none;\n      }\n      .mereb-fire-btn .fire-text {\n        font-size: 13px;\n        letter-spacing: 0.5px;\n        pointer-events: none;\n      }\n      .mereb-fire-btn:active, .mereb-fire-btn.pressed {\n        transform: translateY(4px);\n        border-bottom-width: 2px;\n        box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);\n        background: #dc2626;\n      }\n    ", document.head.appendChild(e);
	}
	_attachEvents() {
		let e = (e) => {
			e.preventDefault();
			let t = this.container.getBoundingClientRect(), n = t.left + t.width / 2;
			for (let r = 0; r < e.changedTouches.length; r++) {
				let i = e.changedTouches[r], a = i.clientX, o = i.clientY, s = this.fireBtn.getBoundingClientRect();
				if (a >= s.left && a <= s.right && o >= s.top && o <= s.bottom) {
					this.state.fire = !0, this.fireBtn.classList.add("pressed"), this.onFire && this.onFire(!0);
					continue;
				}
				a < n && this.leftTouchId === null ? (this.leftTouchId = i.identifier, this.leftCenter = {
					x: a - t.left,
					y: o - t.top
				}, this.leftBase.style.left = `${this.leftCenter.x}px`, this.leftBase.style.top = `${this.leftCenter.y}px`, this.leftBase.style.bottom = "auto", this.leftBase.classList.add("active"), this.state.move.active = !0) : a >= n && this.rightTouchId === null && (this.rightTouchId = i.identifier, this.rightCenter = {
					x: a - t.left,
					y: o - t.top
				}, this.rightBase.style.left = `${this.rightCenter.x}px`, this.rightBase.style.top = `${this.rightCenter.y}px`, this.rightBase.style.right = "auto", this.rightBase.style.bottom = "auto", this.rightBase.classList.add("active"), this.state.aim.active = !0);
			}
		}, t = (e) => {
			e.preventDefault();
			let t = this.container.getBoundingClientRect();
			for (let n = 0; n < e.changedTouches.length; n++) {
				let r = e.changedTouches[n], i = r.clientX - t.left, a = r.clientY - t.top;
				if (r.identifier === this.leftTouchId) {
					let e = i - this.leftCenter.x, t = a - this.leftCenter.y, n = Math.sqrt(e * e + t * t), r = Math.atan2(t, e), o = Math.min(n, this.maxRadius), s = o / this.maxRadius, c = Math.cos(r) * o, l = Math.sin(r) * o;
					if (this.leftKnob.style.transform = `translate(${c}px, ${l}px)`, s > this.deadzone) {
						let i = e / n * s, a = t / n * s;
						this.state.move.x = i, this.state.move.y = a, this.state.move.angle = r, this.state.move.left = i < -.3, this.state.move.right = i > .3, this.state.move.up = a < -.3, this.state.move.down = a > .3;
					} else this.state.move.x = 0, this.state.move.y = 0, this.state.move.left = !1, this.state.move.right = !1, this.state.move.up = !1, this.state.move.down = !1;
					this.onMove && this.onMove(this.state.move);
				}
				if (r.identifier === this.rightTouchId) {
					let e = i - this.rightCenter.x, t = a - this.rightCenter.y, n = Math.sqrt(e * e + t * t), r = Math.atan2(e, -t), o = Math.min(n, this.maxRadius), s = o / this.maxRadius, c = Math.sin(r) * o, l = -Math.cos(r) * o;
					this.rightKnob.style.transform = `translate(${c}px, ${l}px)`, s > this.deadzone && (this.state.aim.x = Math.sin(r) * s, this.state.aim.y = -Math.cos(r) * s, this.state.aim.angle = r, s > .4 && (this.state.fire = !0)), this.onAim && this.onAim(this.state.aim);
				}
			}
		}, n = (e) => {
			this.container.getBoundingClientRect();
			for (let t = 0; t < e.changedTouches.length; t++) {
				let n = e.changedTouches[t], r = n.clientX, i = n.clientY, a = this.fireBtn.getBoundingClientRect();
				r >= a.left && r <= a.right && i >= a.top && i <= a.bottom && (this.state.fire = !1, this.fireBtn.classList.remove("pressed"), this.onFire && this.onFire(!1)), n.identifier === this.leftTouchId && (this.leftTouchId = null, this.leftKnob.style.transform = "translate(0px, 0px)", this.leftBase.classList.remove("active"), this.state.move = {
					x: 0,
					y: 0,
					up: !1,
					down: !1,
					left: !1,
					right: !1,
					angle: 0,
					active: !1
				}, this.onMove && this.onMove(this.state.move)), n.identifier === this.rightTouchId && (this.rightTouchId = null, this.rightKnob.style.transform = "translate(0px, 0px)", this.rightBase.classList.remove("active"), this.state.aim.active = !1, this.fireBtn.classList.contains("pressed") || (this.state.fire = !1), this.onAim && this.onAim(this.state.aim));
			}
		};
		this.dom.addEventListener("touchstart", e, { passive: !1 }), this.dom.addEventListener("touchmove", t, { passive: !1 }), this.dom.addEventListener("touchend", n, { passive: !1 }), this.dom.addEventListener("touchcancel", n, { passive: !1 }), this.fireBtn.addEventListener("touchstart", (e) => {
			e.stopPropagation(), e.preventDefault(), this.state.fire = !0, this.fireBtn.classList.add("pressed"), this.onFire && this.onFire(!0);
		}, { passive: !1 });
		let r = (e) => {
			e.stopPropagation(), this.state.fire = !1, this.fireBtn.classList.remove("pressed"), this.onFire && this.onFire(!1);
		};
		this.fireBtn.addEventListener("touchend", r), this.fireBtn.addEventListener("touchcancel", r);
	}
	show() {
		this.dom && (this.dom.style.display = "block");
	}
	hide() {
		this.dom && (this.dom.style.display = "none");
	}
	getState() {
		return {
			move: { ...this.state.move },
			aim: { ...this.state.aim },
			fire: this.state.fire
		};
	}
	destroy() {
		this.dom && this.dom.parentNode && this.dom.parentNode.removeChild(this.dom);
	}
}, G = class {
	constructor(e, t = {}) {
		this.client = e, this.container = t.container || document.body, this.engine = t.engine || null, this.visible = !1, this.activeTab = "console", this.artificialLagMs = 0, this.artificialDropRate = 0, this.logs = [], this.maxLogs = 100, this._buildDOM(), this._attachGlobalHotkey(), this._hookClientEvents();
	}
	_buildDOM() {
		this._injectStyles(), this.pill = document.createElement("button"), this.pill.className = "mereb-terminal-pill", this.pill.innerHTML = "⚡ <span class=\"pill-text\">MEREB DEV</span>", this.pill.title = "Toggle Mereb Netcode Terminal (` or ~)", this.pill.addEventListener("click", () => this.toggle()), this.container.appendChild(this.pill), this.element = document.createElement("div"), this.element.className = "mereb-terminal-modal", this.element.style.display = "none", this.element.innerHTML = "\n      <div class=\"terminal-header\">\n        <div class=\"terminal-title\">\n          <span class=\"terminal-badge\">⚡ MEREB NETCODE v1.0</span>\n          <span class=\"terminal-status-dot\"></span>\n          <span class=\"terminal-room-id\">OFFLINE</span>\n        </div>\n        <div class=\"terminal-tabs\">\n          <button class=\"terminal-tab-btn active\" data-tab=\"console\">💻 CONSOLE</button>\n          <button class=\"terminal-tab-btn\" data-tab=\"telemetry\">📊 TELEMETRY</button>\n          <button class=\"terminal-tab-btn\" data-tab=\"chaos\">🧪 CHAOS SIM</button>\n          <button class=\"terminal-tab-btn\" data-tab=\"entities\">📦 ENTITIES</button>\n        </div>\n        <button class=\"terminal-close-btn\" title=\"Close\">✕</button>\n      </div>\n\n      <div class=\"terminal-body\">\n        <!-- Tab 1: Console -->\n        <div class=\"terminal-tab-content tab-console active\">\n          <div class=\"terminal-output\"></div>\n          <form class=\"terminal-input-bar\">\n            <span class=\"terminal-prompt\">&gt;</span>\n            <input type=\"text\" class=\"terminal-input\" placeholder=\"Type a command (or 'help')...\" />\n            <button type=\"submit\" class=\"terminal-send-btn\">RUN</button>\n          </form>\n        </div>\n\n        <!-- Tab 2: Telemetry -->\n        <div class=\"terminal-tab-content tab-telemetry\">\n          <div class=\"telemetry-grid\">\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">RTT / PING</div>\n              <div class=\"telemetry-value telemetry-ping\">-- ms</div>\n            </div>\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">JITTER</div>\n              <div class=\"telemetry-value telemetry-jitter\">-- ms</div>\n            </div>\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">PACKET LOSS</div>\n              <div class=\"telemetry-value telemetry-loss\">0%</div>\n            </div>\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">WEBRTC STATE</div>\n              <div class=\"telemetry-value telemetry-rtc\">DISCONNECTED</div>\n            </div>\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">PEER ROLE</div>\n              <div class=\"telemetry-value telemetry-role\">NONE</div>\n            </div>\n            <div class=\"telemetry-card\">\n              <div class=\"telemetry-label\">ROOM CODE</div>\n              <div class=\"telemetry-value telemetry-room\">--</div>\n            </div>\n          </div>\n          <div class=\"telemetry-details\"></div>\n        </div>\n\n        <!-- Tab 3: Chaos Simulator -->\n        <div class=\"terminal-tab-content tab-chaos\">\n          <div class=\"chaos-desc\">\n            Simulate real-world mobile network conditions (3G/4G lag and packet drops) to test client prediction and snapshot interpolation.\n          </div>\n          <div class=\"chaos-controls\">\n            <div class=\"chaos-field\">\n              <label>Artificial Latency: <span class=\"chaos-lag-val\">0ms</span></label>\n              <input type=\"range\" class=\"chaos-lag-slider\" min=\"0\" max=\"600\" step=\"25\" value=\"0\" />\n            </div>\n            <div class=\"chaos-field\">\n              <label>Packet Drop Rate: <span class=\"chaos-drop-val\">0%</span></label>\n              <input type=\"range\" class=\"chaos-drop-slider\" min=\"0\" max=\"50\" step=\"5\" value=\"0\" />\n            </div>\n            <div class=\"chaos-presets\">\n              <button class=\"chaos-preset-btn\" data-lag=\"0\" data-drop=\"0\">🟢 Perfect (0ms)</button>\n              <button class=\"chaos-preset-btn\" data-lag=\"60\" data-drop=\"0\">🟡 4G LTE (60ms)</button>\n              <button class=\"chaos-preset-btn\" data-lag=\"180\" data-drop=\"5\">🟠 Slow 3G (180ms + 5%)</button>\n              <button class=\"chaos-preset-btn\" data-lag=\"400\" data-drop=\"20\">🔴 Extreme (400ms + 20%)</button>\n            </div>\n          </div>\n        </div>\n\n        <!-- Tab 4: Entities -->\n        <div class=\"terminal-tab-content tab-entities\">\n          <pre class=\"entities-json\">No active game state to inspect.</pre>\n        </div>\n      </div>\n    ", this.container.appendChild(this.element), this.closeBtn = this.element.querySelector(".terminal-close-btn"), this.closeBtn.addEventListener("click", () => this.hide()), this.output = this.element.querySelector(".terminal-output"), this.input = this.element.querySelector(".terminal-input"), this.form = this.element.querySelector(".terminal-input-bar"), this.form.addEventListener("submit", (e) => {
			e.preventDefault();
			let t = this.input.value.trim();
			t && (this.executeCommand(t), this.input.value = "");
		}), this.tabBtns = this.element.querySelectorAll(".terminal-tab-btn"), this.tabBtns.forEach((e) => {
			e.addEventListener("click", () => {
				let t = e.dataset.tab;
				this.switchTab(t);
			});
		});
		let e = this.element.querySelector(".chaos-lag-slider"), t = this.element.querySelector(".chaos-lag-val");
		e.addEventListener("input", (e) => {
			this.artificialLagMs = parseInt(e.target.value, 10), t.innerText = `${this.artificialLagMs}ms`, this.log(`[Chaos] Injected artificial latency: ${this.artificialLagMs}ms`, "warn");
		});
		let n = this.element.querySelector(".chaos-drop-slider"), r = this.element.querySelector(".chaos-drop-val");
		n.addEventListener("input", (e) => {
			this.artificialDropRate = parseInt(e.target.value, 10) / 100, r.innerText = `${e.target.value}%`, this.log(`[Chaos] Injected packet drop rate: ${e.target.value}%`, "warn");
		}), this.element.querySelectorAll(".chaos-preset-btn").forEach((i) => {
			i.addEventListener("click", () => {
				let a = parseInt(i.dataset.lag, 10), o = parseInt(i.dataset.drop, 10);
				e.value = a, n.value = o, this.artificialLagMs = a, this.artificialDropRate = o / 100, t.innerText = `${a}ms`, r.innerText = `${o}%`, this.log(`[Chaos] Preset applied: Lag ${a}ms, Drop ${o}%`, "info");
			});
		}), this.log("Mereb Terminal Initialized. Type \"help\" for commands.", "system");
	}
	_injectStyles() {
		if (document.getElementById("mereb-terminal-styles")) return;
		let e = document.createElement("style");
		e.id = "mereb-terminal-styles", e.textContent = "\n      .mereb-terminal-pill {\n        position: fixed;\n        bottom: 16px;\n        left: 16px;\n        background: rgba(15, 23, 42, 0.85);\n        border: 1px solid rgba(56, 189, 248, 0.5);\n        color: #38bdf8;\n        border-radius: 9999px;\n        padding: 6px 14px;\n        font-family: 'Fredoka', ui-monospace, monospace;\n        font-size: 12px;\n        font-weight: 700;\n        cursor: pointer;\n        z-index: 1000;\n        display: flex;\n        align-items: center;\n        gap: 6px;\n        backdrop-filter: blur(10px);\n        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);\n        transition: transform 0.1s, background 0.15s;\n      }\n      .mereb-terminal-pill:hover {\n        transform: scale(1.05);\n        background: rgba(56, 189, 248, 0.15);\n      }\n\n      .mereb-terminal-modal {\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        width: min(850px, 92vw);\n        height: min(520px, 85vh);\n        background: rgba(10, 15, 30, 0.94);\n        border: 1px solid rgba(56, 189, 248, 0.35);\n        border-radius: 14px;\n        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15);\n        backdrop-filter: blur(16px);\n        z-index: 2000;\n        display: flex;\n        flex-direction: column;\n        overflow: hidden;\n        font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;\n        color: #e2e8f0;\n      }\n\n      .terminal-header {\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        padding: 10px 16px;\n        background: rgba(15, 23, 42, 0.9);\n        border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n      }\n      .terminal-title {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-size: 12px;\n      }\n      .terminal-badge {\n        color: #38bdf8;\n        font-weight: 700;\n      }\n      .terminal-status-dot {\n        width: 8px;\n        height: 8px;\n        border-radius: 50%;\n        background: #ef4444;\n      }\n      .terminal-status-dot.connected {\n        background: #22c55e;\n      }\n      .terminal-room-id {\n        font-size: 11px;\n        color: #94a3b8;\n      }\n\n      .terminal-tabs {\n        display: flex;\n        gap: 4px;\n      }\n      .terminal-tab-btn {\n        background: transparent;\n        border: none;\n        color: #94a3b8;\n        font-family: inherit;\n        font-size: 11px;\n        font-weight: 600;\n        padding: 6px 12px;\n        border-radius: 6px;\n        cursor: pointer;\n        transition: color 0.15s, background 0.15s;\n      }\n      .terminal-tab-btn:hover {\n        color: #fff;\n        background: rgba(255, 255, 255, 0.05);\n      }\n      .terminal-tab-btn.active {\n        color: #38bdf8;\n        background: rgba(56, 189, 248, 0.15);\n      }\n\n      .terminal-close-btn {\n        background: transparent;\n        border: none;\n        color: #94a3b8;\n        font-size: 16px;\n        cursor: pointer;\n        padding: 4px 8px;\n        border-radius: 4px;\n      }\n      .terminal-close-btn:hover {\n        color: #fff;\n        background: rgba(239, 68, 68, 0.3);\n      }\n\n      .terminal-body {\n        flex: 1;\n        display: flex;\n        flex-direction: column;\n        overflow: hidden;\n      }\n      .terminal-tab-content {\n        flex: 1;\n        display: none;\n        flex-direction: column;\n        padding: 14px;\n        overflow-y: auto;\n      }\n      .terminal-tab-content.active {\n        display: flex;\n      }\n\n      /* Console Tab */\n      .terminal-output {\n        flex: 1;\n        overflow-y: auto;\n        font-size: 12px;\n        line-height: 1.6;\n        display: flex;\n        flex-direction: column;\n        gap: 3px;\n        margin-bottom: 10px;\n        word-break: break-all;\n      }\n      .terminal-log-line {\n        display: flex;\n        gap: 8px;\n      }\n      .terminal-log-time {\n        color: #64748b;\n        font-size: 11px;\n      }\n      .log-info { color: #38bdf8; }\n      .log-warn { color: #facc15; }\n      .log-error { color: #f87171; }\n      .log-system { color: #a855f7; }\n      .log-success { color: #4ade80; }\n\n      .terminal-input-bar {\n        display: flex;\n        align-items: center;\n        background: rgba(15, 23, 42, 0.8);\n        border: 1px solid rgba(255, 255, 255, 0.15);\n        border-radius: 8px;\n        padding: 4px 10px;\n        gap: 8px;\n      }\n      .terminal-prompt {\n        color: #38bdf8;\n        font-weight: 700;\n      }\n      .terminal-input {\n        flex: 1;\n        background: transparent;\n        border: none;\n        outline: none;\n        color: #f1f5f9;\n        font-family: inherit;\n        font-size: 13px;\n      }\n      .terminal-send-btn {\n        background: #0284c7;\n        color: #fff;\n        border: none;\n        border-radius: 6px;\n        padding: 4px 12px;\n        font-family: inherit;\n        font-size: 11px;\n        font-weight: 700;\n        cursor: pointer;\n      }\n\n      /* Telemetry Tab */\n      .telemetry-grid {\n        display: grid;\n        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));\n        gap: 12px;\n        margin-bottom: 16px;\n      }\n      .telemetry-card {\n        background: rgba(15, 23, 42, 0.6);\n        border: 1px solid rgba(255, 255, 255, 0.08);\n        border-radius: 10px;\n        padding: 12px;\n        text-align: center;\n      }\n      .telemetry-label {\n        font-size: 10px;\n        color: #94a3b8;\n        margin-bottom: 6px;\n        letter-spacing: 0.5px;\n      }\n      .telemetry-value {\n        font-size: 16px;\n        font-weight: 700;\n        color: #38bdf8;\n      }\n\n      /* Chaos Tab */\n      .chaos-desc {\n        font-size: 12px;\n        color: #94a3b8;\n        line-height: 1.5;\n        margin-bottom: 18px;\n      }\n      .chaos-controls {\n        display: flex;\n        flex-direction: column;\n        gap: 16px;\n      }\n      .chaos-field label {\n        display: flex;\n        justify-content: space-between;\n        font-size: 12px;\n        font-weight: 600;\n        margin-bottom: 6px;\n      }\n      .chaos-field input[type=\"range\"] {\n        width: 100%;\n        accent-color: #38bdf8;\n      }\n      .chaos-presets {\n        display: flex;\n        flex-wrap: wrap;\n        gap: 8px;\n        margin-top: 10px;\n      }\n      .chaos-preset-btn {\n        background: rgba(30, 41, 59, 0.7);\n        border: 1px solid rgba(255, 255, 255, 0.1);\n        color: #cbd5e1;\n        font-family: inherit;\n        font-size: 11px;\n        padding: 8px 14px;\n        border-radius: 8px;\n        cursor: pointer;\n        transition: background 0.1s;\n      }\n      .chaos-preset-btn:hover {\n        background: rgba(56, 189, 248, 0.2);\n        color: #fff;\n      }\n\n      /* Entities Tab */\n      .entities-json {\n        background: rgba(15, 23, 42, 0.6);\n        border: 1px solid rgba(255, 255, 255, 0.08);\n        border-radius: 10px;\n        padding: 14px;\n        font-size: 12px;\n        line-height: 1.5;\n        overflow-x: auto;\n        color: #38bdf8;\n      }\n    ", document.head.appendChild(e);
	}
	_attachGlobalHotkey() {
		window.addEventListener("keydown", (e) => {
			(e.key === "`" || e.key === "~") && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && (e.preventDefault(), this.toggle());
		});
	}
	_hookClientEvents() {
		this.client && (this.client.on("status", (e) => {
			this.log(`[Status] ${e}`, "info"), this._updateHeader();
		}), this.client.on("quality", (e) => {
			this._updateTelemetry(e);
		}), this.client.on("match-start", (e) => {
			this.log(`[Match] Started as ${e.role} vs ${e.peerId}`, "success"), this._updateHeader();
		}), this.client.on("event", (e) => {
			this.log(`[Event] ${e.name}: ${JSON.stringify(e.data || {})}`, "info");
		}), this.client.on("error", (e) => {
			this.log(`[Error] ${e.message || e}`, "error");
		}));
	}
	toggle() {
		this.visible ? this.hide() : this.show();
	}
	show() {
		this.visible = !0, this.element.style.display = "flex", this.input.focus(), this._refreshEntities();
	}
	hide() {
		this.visible = !1, this.element.style.display = "none";
	}
	switchTab(e) {
		this.activeTab = e, this.tabBtns.forEach((t) => {
			t.classList.toggle("active", t.dataset.tab === e);
		}), this.element.querySelectorAll(".terminal-tab-content").forEach((t) => {
			t.classList.toggle("active", t.classList.contains(`tab-${e}`));
		}), e === "entities" && this._refreshEntities();
	}
	log(e, t = "info") {
		let n = (/* @__PURE__ */ new Date()).toLocaleTimeString(), r = {
			time: n,
			message: e,
			type: t
		};
		if (this.logs.push(r), this.logs.length > this.maxLogs && this.logs.shift(), this.output) {
			let r = document.createElement("div");
			r.className = `terminal-log-line log-${t}`, r.innerHTML = `<span class="terminal-log-time">[${n}]</span> <span class="terminal-log-msg">${this._escapeHTML(e)}</span>`, this.output.appendChild(r), this.output.scrollTop = this.output.scrollHeight;
		}
	}
	executeCommand(e) {
		this.log(`> ${e}`, "system");
		let [t, ...n] = e.trim().split(/\s+/), r = t.toLowerCase();
		switch (r) {
			case "help":
				this.log("Available Commands:", "info"), this.log("  help                 - Show this help list", "info"), this.log("  status               - Dump connection & room status", "info"), this.log("  state                - Inspect player/bullet entities", "info"), this.log("  lag <ms>             - Simulate network latency (e.g. lag 150)", "info"), this.log("  drop <percent>       - Simulate packet loss (e.g. drop 10)", "info"), this.log("  kick                 - Forfeit / leave current match", "info"), this.log("  clear                - Clear console output", "info");
				break;
			case "status":
				let e = this.client?.roomCode || "None", t = this.client?.role || "None", i = this.client?.peerId || "None", a = this.client?.localId || "None";
				this.log(`Status Report: Room=${e} | Role=${t} | Local=${a} | Peer=${i}`, "success");
				break;
			case "state":
				this._refreshEntities(), this.switchTab("entities");
				break;
			case "lag":
				let o = parseInt(n[0], 10) || 0;
				this.artificialLagMs = o, this.log(`Simulated lag set to ${o}ms`, "warn");
				break;
			case "drop":
				let s = parseInt(n[0], 10) || 0;
				this.artificialDropRate = s / 100, this.log(`Simulated packet drop rate set to ${s}%`, "warn");
				break;
			case "kick":
			case "leave":
				this.client && (this.client.leave(), this.log("Forfeited and disconnected.", "warn"));
				break;
			case "clear":
				this.output && (this.output.innerHTML = ""), this.logs = [];
				break;
			default: this.log(`Unknown command: "${r}". Type "help" for options.`, "error");
		}
	}
	_updateHeader() {
		let e = this.element.querySelector(".terminal-room-id"), t = this.element.querySelector(".terminal-status-dot"), n = this.client && this.client.peer && this.client.peer.connected;
		t && t.classList.toggle("connected", n), e && (e.innerText = this.client?.roomCode ? `ROOM: ${this.client.roomCode}` : "OFFLINE");
		let r = this.element.querySelector(".telemetry-rtc"), i = this.element.querySelector(".telemetry-role"), a = this.element.querySelector(".telemetry-room");
		r && (r.innerText = n ? "CONNECTED" : this.client?.status || "IDLE"), i && (i.innerText = this.client?.role || "NONE"), a && (a.innerText = this.client?.roomCode || "--");
	}
	_updateTelemetry(e) {
		if (!e) return;
		let t = this.element.querySelector(".telemetry-ping"), n = this.element.querySelector(".telemetry-jitter"), r = this.element.querySelector(".telemetry-loss");
		t && (t.innerText = `${e.ping || 0} ms`), n && (n.innerText = `${e.jitter || 0} ms`), r && (r.innerText = `${e.packetLoss || 0}%`);
	}
	_refreshEntities() {
		let e = this.element.querySelector(".entities-json");
		e && (e.innerText = this.engine && this.engine.playerStates ? JSON.stringify({
			players: this.engine.playerStates,
			bullets: this.engine.bulletStates || []
		}, null, 2) : "No entity states available.");
	}
	_escapeHTML(e) {
		return e.replace(/[&<>'"]/g, (e) => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"'": "&#39;",
			"\"": "&quot;"
		})[e] || e);
	}
}, K = new class {
	constructor() {
		this.client = null, this.appId = "tank-arena", this.host = "mereb-signaling.dawitbaslyos.workers.dev", this.entities = /* @__PURE__ */ new Map(), this.interpolator = new H(), this.rpcHandlers = /* @__PURE__ */ new Map(), this.touch = null, this.isInitialized = !1;
	}
	async init(e = {}) {
		return this.isInitialized && this.client ? this.client : (this.appId = e.appId || "tank-arena", this.host = e.host || "mereb-signaling.dawitbaslyos.workers.dev", this.client = new P({
			appId: this.appId,
			host: this.host,
			botTimeoutMs: e.botTimeoutMs ?? 8e3,
			autoJoinFromUrl: e.autoJoinFromUrl ?? !0
		}), this.client.on("event", (e) => {
			if (e.name === "mereb:rpc") {
				let { rpcName: t, payload: n, senderId: r } = e.data || {}, i = this.rpcHandlers.get(t);
				i && i(n, r);
			}
		}), this.isInitialized = !0, this.client);
	}
	async joinOrCreateRoom(e) {
		return this.client || await this.init(), this.client.joinRoom(e);
	}
	async quickPlay() {
		return this.client || await this.init(), this.client.quickPlay();
	}
	rpc(e, t = {}) {
		this.client && this.client.sendEvent("mereb:rpc", {
			rpcName: e,
			payload: t,
			senderId: this.client.localId
		});
	}
	onRpc(e, t) {
		this.rpcHandlers.set(e, t);
	}
	instantiate(e, t = {}) {
		let n = t.isLocal ?? !0, r = t.schema ? U(t.schema) : null, i = t.id || `${e}_${this.client?.localId || "p"}`, a = {
			id: i,
			type: e,
			isLocal: n,
			schema: r,
			state: {},
			set(e) {
				if (this.state = {
					...this.state,
					...e
				}, this.isLocal && r && K.client) {
					let e = r.encode(this.state);
					K.client.sendBinary(e);
				}
			},
			onUpdate(e) {
				this._updateCallback = e;
			}
		};
		return this.entities.set(i, a), a;
	}
	attachControls(e = {}) {
		return this.touch ||= new W(e), this.touch;
	}
}();
//#endregion
//#region src/sdk/index.js
typeof window < "u" && (window.Mereb = {
	...K,
	Engine: K,
	MerebClient: P,
	MerebLobby: F,
	PeerConnection: M,
	SignalingClient: A,
	BinaryWriter: R,
	BinaryReader: z,
	SnapshotInterpolator: H,
	defineSchema: U,
	TouchControls: W,
	MerebTerminal: G,
	TurnPool: S,
	NetworkQuality: j,
	PortalManager: N,
	DEFAULT_STUN_SERVERS: b,
	DEFAULT_TURN_SERVERS: x,
	...C
});
//#endregion
export { z as BinaryReader, R as BinaryWriter, O as DC, w as DEFAULT_ICE_SERVERS, b as DEFAULT_STUN_SERVERS, x as DEFAULT_TURN_SERVERS, K as Mereb, P as MerebClient, F as MerebLobby, G as MerebTerminal, j as NetworkQuality, M as PeerConnection, N as PortalManager, T as ROLE, E as STATUS, A as SignalingClient, H as SnapshotInterpolator, W as TouchControls, S as TurnPool, D as WS, U as defineSchema, k as generateRoomCode };
