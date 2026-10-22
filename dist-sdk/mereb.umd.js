(function(e,t){typeof exports==`object`&&typeof module<`u`?t(exports):typeof define==`function`&&define.amd?define([`exports`],t):(e=typeof globalThis<`u`?globalThis:e||self,t(e.Mereb={}))})(this,function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t=Object.defineProperty,n=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r};(!globalThis.EventTarget||!globalThis.Event)&&console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);var r=class extends Event{message;error;constructor(e,t){super(`error`,t),this.message=e.message,this.error=e}},i=class extends Event{code;reason;wasClean=!0;constructor(e=1e3,t=``,n){super(`close`,n),this.code=e,this.reason=t}},a={Event,ErrorEvent:r,CloseEvent:i};function o(e,t){if(!e)throw Error(t)}function s(e){return new e.constructor(e.type,e)}function c(e){return`data`in e?new MessageEvent(e.type,e):`code`in e||`reason`in e?new i(e.code||1999,e.reason||`unknown reason`,e):`error`in e?new r(e.error,e):new Event(e.type,e)}var l=typeof process<`u`&&process.versions?.node!==void 0,u=typeof navigator<`u`&&navigator.product===`ReactNative`,d=l||u?c:s,f={maxReconnectionDelay:1e4,minReconnectionDelay:3e3,minUptime:5e3,reconnectionDelayGrowFactor:1.3,connectionTimeout:4e3,maxRetries:1/0,maxEnqueuedMessages:1/0,startClosed:!1,debug:!1},p=!1;function m(){}var h=class e extends EventTarget{_ws;_retryCount=-1;_uptimeTimeout;_connectTimeout;_shouldReconnect=!0;_connectLock=!1;_binaryType=`blob`;_closeCalled=!1;_didWarnAboutClosedSend=!1;_messageQueue=[];_debugLogger=console.log.bind(console);_url;_protocols;_options;constructor(e,t,n={}){super(),this._url=e,this._protocols=t,this._options=n,this._options.startClosed&&(this._shouldReconnect=!1),this._options.debugLogger&&(this._debugLogger=this._options.debugLogger),this._connect()}static get CONNECTING(){return 0}static get OPEN(){return 1}static get CLOSING(){return 2}static get CLOSED(){return 3}get CONNECTING(){return e.CONNECTING}get OPEN(){return e.OPEN}get CLOSING(){return e.CLOSING}get CLOSED(){return e.CLOSED}get binaryType(){return this._ws?this._ws.binaryType:this._binaryType}set binaryType(e){this._binaryType=e,this._ws&&(this._ws.binaryType=e)}get retryCount(){return Math.max(this._retryCount,0)}get bufferedAmount(){return this._messageQueue.reduce((e,t)=>(typeof t==`string`?e+=t.length:t instanceof Blob?e+=t.size:e+=t.byteLength,e),0)+(this._ws?this._ws.bufferedAmount:0)}get extensions(){return this._ws?this._ws.extensions:``}get protocol(){return this._ws?this._ws.protocol:``}get readyState(){return this._closeCalled?e.CLOSED:this._ws?this._ws.readyState:this._options.startClosed?e.CLOSED:e.CONNECTING}get url(){return this._ws?this._ws.url:``}get shouldReconnect(){return this._shouldReconnect}onclose=null;onerror=null;onmessage=null;onopen=null;close(e=1e3,t){if(this._closeCalled=!0,this._shouldReconnect=!1,this._clearTimeouts(),!this._ws){this._debug(`close enqueued: no ws instance`);return}if(this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING){this._debug(`close: already closing or closed`);return}this._disconnect(e,t)}reconnect(e,t){this._shouldReconnect=!0,this._closeCalled=!1,this._didWarnAboutClosedSend=!1,this._retryCount=-1,!this._ws||this._ws.readyState===this.CLOSED||this._ws.readyState===this.CLOSING||this._disconnect(e,t),this._connect()}send(e){if(this._ws&&this._ws.readyState===this.OPEN)return this._debug(`send`,e),this._ws.send(e),!0;this._closeCalled&&!this._didWarnAboutClosedSend&&(this._didWarnAboutClosedSend=!0,console.warn(`ReconnectingWebSocket: send() was called after close(). The message has been buffered, but it will only be delivered if reconnect() is called on this socket. If this socket has been discarded, the message is lost — this usually means a stale socket reference is being used.`));let{maxEnqueuedMessages:t=f.maxEnqueuedMessages}=this._options;return this._messageQueue.length<t&&(this._debug(`enqueue`,e),this._messageQueue.push(e)),!1}drainQueuedMessages(){let e=this._messageQueue;return this._messageQueue=[],e}_debug(...e){this._options.debug&&this._debugLogger(`RWS>`,...e)}_getNextDelay(){let{reconnectionDelayGrowFactor:e=f.reconnectionDelayGrowFactor,minReconnectionDelay:t=f.minReconnectionDelay,maxReconnectionDelay:n=f.maxReconnectionDelay}=this._options,r=0;return this._retryCount>0&&(r=t*e**(this._retryCount-1),r>n&&(r=n)),this._debug(`next delay`,r),r}_wait(){return new Promise(e=>{setTimeout(e,this._getNextDelay())})}_getNextProtocols(e){if(!e)return Promise.resolve(null);if(typeof e==`string`||Array.isArray(e))return Promise.resolve(e);if(typeof e==`function`){let t=e();if(!t)return Promise.resolve(null);if(typeof t==`string`||Array.isArray(t))return Promise.resolve(t);if(t.then)return t}throw Error(`Invalid protocols`)}_getNextUrl(e){if(typeof e==`string`)return Promise.resolve(e);if(typeof e==`function`){let t=e();if(typeof t==`string`)return Promise.resolve(t);if(t.then)return t}throw Error(`Invalid URL`)}_connect(){if(this._connectLock||!this._shouldReconnect)return;this._connectLock=!0;let{maxRetries:e=f.maxRetries,connectionTimeout:t=f.connectionTimeout}=this._options;if(this._retryCount>=e){this._debug(`max retries reached`,this._retryCount,`>=`,e),this._connectLock=!1;return}this._retryCount++,this._debug(`connect`,this._retryCount),this._removeListeners(),this._wait().then(()=>Promise.all([this._getNextUrl(this._url),this._getNextProtocols(this._protocols||null)])).then(([e,n])=>{if(this._closeCalled){this._connectLock=!1;return}!this._options.WebSocket&&typeof WebSocket>`u`&&!p&&(console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`),p=!0);let r=this._options.WebSocket||WebSocket;this._debug(`connect`,{url:e,protocols:n}),this._ws=n?new r(e,n):new r(e),this._ws.binaryType=this._binaryType,this._connectLock=!1,this._addListeners(),this._connectTimeout=setTimeout(()=>this._handleTimeout(),t)}).catch(e=>{this._connectLock=!1,this._handleError(new a.ErrorEvent(Error(e.message),this))})}_handleTimeout(){this._debug(`timeout event`),this._handleError(new a.ErrorEvent(Error(`TIMEOUT`),this))}_disconnect(e=1e3,t){if(this._clearTimeouts(),this._ws){this._removeListeners();try{(this._ws.readyState===this.OPEN||this._ws.readyState===this.CONNECTING)&&this._ws.close(e,t),this._handleClose(new a.CloseEvent(e,t,this))}catch{}}}_acceptOpen(){this._debug(`accept open`),this._retryCount=0}_handleOpen=e=>{this._debug(`open event`);let{minUptime:t=f.minUptime}=this._options;clearTimeout(this._connectTimeout),this._uptimeTimeout=setTimeout(()=>this._acceptOpen(),t),o(this._ws,`WebSocket is not defined`),this._ws.binaryType=this._binaryType,this._messageQueue.forEach(e=>{this._ws?.send(e)}),this._messageQueue=[],this.onopen&&this.onopen(e),this.dispatchEvent(d(e))};_handleMessage=e=>{this._debug(`message event`),this.onmessage&&this.onmessage(e),this.dispatchEvent(d(e))};_handleError=e=>{this._debug(`error event`,e.message),this._disconnect(void 0,e.message===`TIMEOUT`?`timeout`:void 0),this.onerror&&this.onerror(e),this._debug(`exec error listeners`),this.dispatchEvent(d(e)),this._connect()};_handleClose=e=>{this._debug(`close event`),this._clearTimeouts(),this._options.shouldReconnectOnClose&&!this._options.shouldReconnectOnClose(e)&&(this._shouldReconnect=!1),this._shouldReconnect&&this._connect(),this.onclose&&this.onclose(e),this.dispatchEvent(d(e))};_removeListeners(){this._ws&&(this._debug(`removeListeners`),this._ws.removeEventListener(`open`,this._handleOpen),this._ws.removeEventListener(`close`,this._handleClose),this._ws.removeEventListener(`message`,this._handleMessage),this._ws.removeEventListener(`error`,this._handleError),this._ws.addEventListener(`error`,m))}_addListeners(){this._ws&&(this._debug(`addListeners`),this._ws.addEventListener(`open`,this._handleOpen),this._ws.addEventListener(`close`,this._handleClose),this._ws.addEventListener(`message`,this._handleMessage),this._ws.addEventListener(`error`,this._handleError))}_clearTimeouts(){clearTimeout(this._connectTimeout),clearTimeout(this._uptimeTimeout)}},g=e=>e[1]!==null&&e[1]!==void 0;function _(){if(crypto?.randomUUID)return crypto.randomUUID();let e=Date.now(),t=performance?.now&&performance.now()*1e3||0;return`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,function(n){let r=Math.random()*16;return e>0?(r=(e+r)%16|0,e=Math.floor(e/16)):(r=(t+r)%16|0,t=Math.floor(t/16)),(n===`x`?r:r&3|8).toString(16)})}function v(e,t,n={}){let{host:r,path:i,protocol:a,room:o,party:s,basePath:c,prefix:l,query:u}=e,d=r.replace(/^(http|https|ws|wss):\/\//,``);if(d.endsWith(`/`)&&(d=d.slice(0,-1)),i?.startsWith(`/`))throw Error(`path must not start with a slash`);let f=s??`main`,p=i?`/${i}`:``,m=a||(d.startsWith(`localhost:`)||d.startsWith(`127.0.0.1:`)||d.startsWith(`192.168.`)||d.startsWith(`10.`)||d.startsWith(`172.`)&&d.split(`.`)[1]>=`16`&&d.split(`.`)[1]<=`31`||d.startsWith(`[::ffff:7f00:1]:`)?t:`${t}s`),h=`${m}://${d}/${c||`${l||`parties`}/${f}/${o}`}${p}`,_=(e={})=>`${h}?${new URLSearchParams([...Object.entries(n),...Object.entries(e).filter(g)])}`,v=typeof u==`function`?async()=>_(await u()):_(u);return{host:d,path:p,room:o,name:f,protocol:m,partyUrl:h,urlProvider:v}}var y=class extends h{_pk;_pkurl;name;room;host;path;basePath;constructor(e){let t=b(e);if(super(t.urlProvider,t.protocols,t.socketOptions),this.partySocketOptions=e,this.setWSProperties(t),!e.startClosed&&!this.room&&!this.basePath)throw this.close(),Error(`Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect().`);e.disableNameValidation||(e.party?.includes(`/`)&&console.warn(`PartySocket: party name "${e.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`),e.room?.includes(`/`)&&console.warn(`PartySocket: room name "${e.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`))}updateProperties(e){let t=b({...this.partySocketOptions,...e,host:e.host??this.host,room:e.room??this.room,path:e.path??this.path,basePath:e.basePath??this.basePath});this._url=t.urlProvider,this._protocols=t.protocols,this._options=t.socketOptions,this.setWSProperties(t)}setWSProperties(e){let{_pk:t,_pkurl:n,name:r,room:i,host:a,path:o,basePath:s}=e;this._pk=t,this._pkurl=n,this.name=r,this.room=i,this.host=a,this.path=o,this.basePath=s}reconnect(e,t){if(!this.host)throw Error("The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");if(!this.room&&!this.basePath)throw Error("The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor.");super.reconnect(e,t)}get id(){return this._pk}get roomUrl(){return this._pkurl}static async fetch(e,t){let n=v(e,`http`),r=typeof n.urlProvider==`string`?n.urlProvider:await n.urlProvider();return(e.fetch??fetch)(r,t)}};function b(e){let{id:t,host:n,path:r,party:i,room:a,protocol:o,query:s,protocols:c,...l}=e,u=t||_(),d=v(e,`ws`,{_pk:u});return{_pk:u,_pkurl:d.partyUrl,name:d.name,room:d.room,host:d.host,path:d.path,basePath:e.basePath,protocols:c,socketOptions:l,urlProvider:d.urlProvider}}var x=[{urls:`stun:stun.l.google.com:19302`},{urls:`stun:stun1.l.google.com:19302`},{urls:`stun:stun.cloudflare.com:3478`},{urls:`stun:openrelay.metered.ca:80`}],S=[{urls:[`turn:openrelay.metered.ca:80`,`turn:openrelay.metered.ca:443`,`turns:openrelay.metered.ca:443?transport=tcp`],username:`openrelayproject`,credential:`openrelayproject`}],C=class{static async resolveIceServers(e){if(typeof e==`function`)try{let t=await e();if(Array.isArray(t)&&t.length>0)return t}catch(e){console.warn(`[Mereb:TurnPool] Failed to fetch dynamic TURN servers, falling back to defaults`,e)}return Array.isArray(e)&&e.length>0?e:[...x,...S]}},w=n({DC:()=>k,DEFAULT_ICE_SERVERS:()=>T,ROLE:()=>E,STATUS:()=>D,WS:()=>O,generateRoomCode:()=>A}),T=[...x,...S],E={HOST:`host`,CLIENT:`client`,BOT:`bot`},D={IDLE:`idle`,CONNECTING:`connecting`,IN_LOBBY:`in_lobby`,MATCHING:`matching`,CONNECTED:`connected`,DISCONNECTED:`disconnected`},O={CREATE_ROOM:`create-room`,JOIN_ROOM:`join-room`,QUICK_PLAY:`quick-play`,SIGNAL:`signal`,ROOM_CREATED:`room-created`,ROOM_JOINED:`room-joined`,PLAYER_JOINED:`player-joined`,PLAYER_LEFT:`player-left`,MATCH_QUEUED:`match-queued`,MATCH_FOUND:`match-found`,START_SIGNAL:`start-signal`,ERROR:`error`},k={STATE:`state`,INPUT:`input`,EVENT:`event`,PING:`ping`,PONG:`pong`};function A(){let e=``;for(let t=0;t<4;t++)e+=`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`[Math.floor(Math.random()*32)];return e}var j=class extends EventTarget{constructor(e,t=`tank-arena`){super(),this.host=e,this.appId=t,this.ws=null,this.roomId=null}connect(e,t=15e3){return this.roomId=e,new Promise((n,r)=>{let i=!1,a=setTimeout(()=>{i||(i=!0,r(Error(`Connection timed out. Server may still be waking up.`)))},t);try{this.ws&&this.ws.close(),this.ws=new y({host:this.host,room:e,query:{appId:this.appId}}),this.ws.addEventListener(`open`,()=>{i||(i=!0,clearTimeout(a),this.dispatchEvent(new CustomEvent(`open`,{detail:{id:this.playerId}})),n())}),this.ws.addEventListener(`message`,e=>{try{let t=JSON.parse(e.data);this.dispatchEvent(new CustomEvent(`message`,{detail:t}))}catch(e){console.error(`[Mereb:Signaling] JSON Parse error`,e)}}),this.ws.addEventListener(`close`,()=>{this.dispatchEvent(new CustomEvent(`close`))}),this.ws.addEventListener(`error`,e=>{this.dispatchEvent(new CustomEvent(`error`,{detail:e}))})}catch(e){clearTimeout(a),r(e)}})}send(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}sendSignal(e,t){this.send({type:O.SIGNAL,to:e,signal:t})}disconnect(){this.ws&&=(this.ws.close(),null),this.roomId=null}get playerId(){return this.ws?this.ws.id:null}},M=class extends EventTarget{constructor(e={}){super(),this.ping=0,this.jitter=0,this.packetLoss=0,this.rating=`good`,this._pingHistory=[],this._sentPings=new Map,this._nextSeq=1,this._lostCount=0,this._totalSent=0,this._windowSize=e.windowSize||10}createPingPacket(){let e=this._nextSeq++,t=performance.now();this._sentPings.set(e,t),this._totalSent++;for(let[e,n]of this._sentPings.entries())t-n>3500&&(this._sentPings.delete(e),this._lostCount++,this._updateStats());return{seq:e,time:t}}recordPong(e){if(!this._sentPings.has(e))return;let t=this._sentPings.get(e);this._sentPings.delete(e);let n=Math.max(1,Math.round(performance.now()-t));this._pingHistory.push(n),this._pingHistory.length>this._windowSize&&this._pingHistory.shift(),this._updateStats()}_updateStats(){if(this._pingHistory.length===0)return;let e=this._pingHistory.reduce((e,t)=>e+t,0),t=Math.round(e/this._pingHistory.length);this.ping=t;let n=0;for(let e=1;e<this._pingHistory.length;e++)n+=Math.abs(this._pingHistory[e]-this._pingHistory[e-1]);this.jitter=this._pingHistory.length>1?Math.round(n/(this._pingHistory.length-1)):0;let r=Math.min(this._totalSent,30);this.packetLoss=r>0?Math.min(100,Math.round(this._lostCount/r*100)):0;let i=`great`;i=this.ping>220||this.packetLoss>=10?`poor`:this.ping>130||this.packetLoss>=4?`fair`:this.ping>65||this.packetLoss>=2?`good`:`great`;let a=i!==this.rating;this.rating=i,this.dispatchEvent(new CustomEvent(`update`,{detail:this.getStats()})),a&&this.dispatchEvent(new CustomEvent(`rating-change`,{detail:{rating:this.rating}}))}getStats(){return{ping:this.ping,jitter:this.jitter,packetLoss:this.packetLoss,rating:this.rating}}reset(){this.ping=0,this.jitter=0,this.packetLoss=0,this.rating=`good`,this._pingHistory=[],this._sentPings.clear(),this._lostCount=0,this._totalSent=0}},N=class extends EventTarget{constructor(e={}){super(),this.iceServers=e.iceServers||T,this.pc=new RTCPeerConnection({iceServers:this.iceServers}),this.unreliableChannel=null,this.reliableChannel=null,this._connected=!1,this.latency=0,this.quality=new M,this._pingInterval=null,this.pendingCandidates=[],this.quality.addEventListener(`update`,e=>{this.dispatchEvent(new CustomEvent(`quality`,{detail:e.detail}))}),this.pc.onicecandidate=e=>{e.candidate&&this.dispatchEvent(new CustomEvent(`ice-candidate`,{detail:{candidate:e.candidate}}))},this.pc.onconnectionstatechange=()=>{let e=this.pc.connectionState;(e===`disconnected`||e===`failed`||e===`closed`)&&this._handleDisconnect()},this.pc.ondatachannel=e=>{let t=e.channel;t.label===`unreliable`?this._setupUnreliableChannel(t):t.label===`reliable`&&this._setupReliableChannel(t)}}_setupUnreliableChannel(e){this.unreliableChannel=e,this.unreliableChannel.binaryType=`arraybuffer`,e.onopen=()=>this._checkChannelsOpen(),e.onclose=()=>this._handleDisconnect(),e.onmessage=e=>{if(e.data instanceof ArrayBuffer){this.dispatchEvent(new CustomEvent(`binary`,{detail:e.data}));return}try{let t=JSON.parse(e.data);t.type===k.STATE?this.dispatchEvent(new CustomEvent(`state`,{detail:t.data})):t.type===k.INPUT&&this.dispatchEvent(new CustomEvent(`input`,{detail:t.data}))}catch(e){console.warn(`[Mereb:RTC] Failed to parse message on unreliable channel`,e)}}}_setupReliableChannel(e){this.reliableChannel=e,e.onopen=()=>this._checkChannelsOpen(),e.onclose=()=>this._handleDisconnect(),e.onmessage=e=>{try{let t=JSON.parse(e.data);t.type===k.EVENT?this.dispatchEvent(new CustomEvent(`event`,{detail:t})):t.type===k.PING?this.sendReliable({type:k.PONG,seq:t.seq,time:t.time}):t.type===k.PONG&&(this.quality.recordPong(t.seq),this.latency=this.quality.ping,this.dispatchEvent(new CustomEvent(`latency`,{detail:{latency:this.latency}})))}catch(e){console.warn(`[Mereb:RTC] Failed to parse message on reliable channel`,e)}}}_checkChannelsOpen(){let e=this.unreliableChannel&&this.unreliableChannel.readyState===`open`,t=this.reliableChannel&&this.reliableChannel.readyState===`open`;(e||t)&&!this._connected&&(this._connected=!0,this._startPing(),this.dispatchEvent(new CustomEvent(`open`)))}_startPing(){this._pingInterval&&clearInterval(this._pingInterval),this._pingInterval=setInterval(()=>{if(this.reliableChannel&&this.reliableChannel.readyState===`open`){let e=this.quality.createPingPacket();this.sendReliable({type:k.PING,seq:e.seq,time:e.time})}},1500)}_handleDisconnect(){this._connected&&(this._connected=!1,this._pingInterval&&clearInterval(this._pingInterval),this.quality.reset(),this.dispatchEvent(new CustomEvent(`close`)))}async createOffer(){let e=this.pc.createDataChannel(`unreliable`,{ordered:!1,maxRetransmits:0});this._setupUnreliableChannel(e);let t=this.pc.createDataChannel(`reliable`,{ordered:!0});this._setupReliableChannel(t);let n=await this.pc.createOffer();return await this.pc.setLocalDescription(n),this.pc.localDescription}async handleOffer(e){try{if(this.pc.signalingState!==`stable`)return null;for(await this.pc.setRemoteDescription(new RTCSessionDescription(e));this.pendingCandidates.length>0;){let e=this.pendingCandidates.shift();try{await this.pc.addIceCandidate(new RTCIceCandidate(e))}catch{}}let t=await this.pc.createAnswer();return await this.pc.setLocalDescription(t),this.pc.localDescription}catch(e){return console.warn(`[Mereb:RTC] Handled offer race condition:`,e.message),null}}async handleAnswer(e){try{if(this.pc.signalingState===`have-local-offer`)for(await this.pc.setRemoteDescription(new RTCSessionDescription(e));this.pendingCandidates.length>0;){let e=this.pendingCandidates.shift();try{await this.pc.addIceCandidate(new RTCIceCandidate(e))}catch{}}}catch(e){console.warn(`[Mereb:RTC] Handled answer race condition:`,e.message)}}async addIceCandidate(e){if(e){if(!this.pc.remoteDescription||!this.pc.remoteDescription.type){this.pendingCandidates.push(e);return}try{await this.pc.addIceCandidate(new RTCIceCandidate(e))}catch(e){console.warn(`[Mereb:RTC] addIceCandidate error:`,e.message)}}}sendBinary(e){if(this.unreliableChannel&&this.unreliableChannel.readyState===`open`){let t=e instanceof ArrayBuffer?e:e.buffer;this.unreliableChannel.send(t)}}sendState(e){this.unreliableChannel&&this.unreliableChannel.readyState===`open`&&(e instanceof ArrayBuffer||ArrayBuffer.isView(e)?this.sendBinary(e):this.unreliableChannel.send(JSON.stringify({type:k.STATE,data:e})))}sendInput(e){this.unreliableChannel&&this.unreliableChannel.readyState===`open`&&(e instanceof ArrayBuffer||ArrayBuffer.isView(e)?this.sendBinary(e):this.unreliableChannel.send(JSON.stringify({type:k.INPUT,data:e})))}sendReliable(e){this.reliableChannel&&this.reliableChannel.readyState===`open`&&this.reliableChannel.send(JSON.stringify(e))}sendEvent(e,t={}){this.sendReliable({type:k.EVENT,name:e,data:t})}get connected(){return this._connected}close(){this._pingInterval&&clearInterval(this._pingInterval),this.unreliableChannel&&this.unreliableChannel.close(),this.reliableChannel&&this.reliableChannel.close(),this.pc&&this.pc.close(),this._connected=!1}},P=class extends EventTarget{constructor(e){super(),this.client=e,this.portalType=null,this.sdk=null,this.isAdPlaying=!1,this.userProfile=null,this.client.on(`match-start`,()=>this.notifyGameplayStart()),this.client.on(`peer-disconnect`,()=>this.notifyGameplayStop())}attach(e=`auto`,t=null){let n=e,r=t;if(n===`auto`){if(typeof window<`u`&&window.PokiSDK)n=`poki`,r=window.PokiSDK;else if(typeof window<`u`&&(window.CrazyGames?.SDK||window.CrazyGames))n=`crazygames`,r=window.CrazyGames?.SDK||window.CrazyGames;else return console.info(`[Mereb:Portal] No portal SDK detected in global scope. Running in standalone mode.`),this}return this.portalType=n,this.sdk=r,this.portalType===`poki`?this._setupPoki():this.portalType===`crazygames`&&this._setupCrazyGames(),console.log(`[Mereb:Portal] Successfully hooked into ${this.portalType.toUpperCase()} SDK.`),this}_setupPoki(){this.client.addEventListener(`room-created`,e=>{if(this.sdk?.shareableURL)try{let t=this.sdk.shareableURL({room:e.detail.roomCode});t&&(e.detail.shareUrl=t)}catch(e){console.warn(`[Mereb:Portal] Poki shareableURL error`,e)}})}async requestCommercialBreak(){return this.sdk?(this.isAdPlaying=!0,this.dispatchEvent(new CustomEvent(`ad-start`)),new Promise(e=>{let t=()=>{this.isAdPlaying=!1,this.dispatchEvent(new CustomEvent(`ad-end`)),e(!0)};if(this.portalType===`poki`&&this.sdk.commercialBreak)this.sdk.commercialBreak().then(t).catch(t);else if(this.portalType===`crazygames`){let e={adStarted:()=>{},adFinished:t,adError:t};this.sdk.ad?.requestAd?this.sdk.ad.requestAd(`midgame`,e):this.sdk.requestAd?this.sdk.requestAd(`midgame`,e):t()}else t()})):!1}async _setupCrazyGames(){try{if(this.sdk.user?.getUser){let e=await this.sdk.user.getUser();e&&(this.userProfile={username:e.username,avatarUrl:e.profilePictureUrl})}}catch{}this.client.addEventListener(`room-created`,async e=>{if(this.sdk.game?.inviteLink)try{let t=await this.sdk.game.inviteLink({room:e.detail.roomCode});t&&(e.detail.shareUrl=t)}catch(e){console.warn(`[Mereb:Portal] CrazyGames inviteLink error`,e)}})}notifyGameplayStart(){if(this.sdk)try{this.portalType===`poki`&&this.sdk.gameplayStart?this.sdk.gameplayStart():this.portalType===`crazygames`&&(this.sdk.game?.gameplayStart?this.sdk.game.gameplayStart():this.sdk.gameplayStart&&this.sdk.gameplayStart())}catch{}}notifyGameplayStop(){if(this.sdk)try{this.portalType===`poki`&&this.sdk.gameplayStop?this.sdk.gameplayStop():this.portalType===`crazygames`&&(this.sdk.game?.gameplayStop?this.sdk.game.gameplayStop():this.sdk.gameplayStop&&this.sdk.gameplayStop())}catch{}}getInviteUrl(e){if(this.portalType===`poki`&&this.sdk?.shareableURL)try{return this.sdk.shareableURL({room:e})}catch{}return typeof window<`u`?`${window.location.origin}${window.location.pathname}?room=${e}`:`?room=${e}`}},F=class extends EventTarget{constructor(e={}){if(super(),this.host=e.host||(typeof window<`u`&&window.location.hostname===`localhost`?`localhost:1999`:``),this.appId=e.appId||`tank-arena`,this.botTimeoutMs=e.botTimeoutMs??8e3,this.iceServers=e.iceServers,this.autoJoinFromUrl=e.autoJoinFromUrl??!0,this.signaling=new j(this.host,this.appId),this.peer=null,this.portal=new P(this),this.status=D.IDLE,this.role=null,this.localId=null,this.peerId=null,this.roomCode=null,this.isBot=!1,this.latency=0,this._matchTimeout=null,e.onMatchStart&&this.on(`match-start`,e.onMatchStart),e.onState&&this.on(`state`,e.onState),e.onInput&&this.on(`input`,e.onInput),e.onEvent&&this.on(`event`,e.onEvent),e.onPeerDisconnect&&this.on(`peer-disconnect`,e.onPeerDisconnect),e.onStatusChange&&this.on(`status-change`,e.onStatusChange),e.onLatency&&this.on(`latency`,e.onLatency),e.onQuality&&this.on(`quality`,e.onQuality),this._setupSignalingListeners(),this.autoJoinFromUrl&&typeof window<`u`){let e=new URLSearchParams(window.location.search).get(`room`);e&&setTimeout(()=>this.joinRoom(e),50)}}on(e,t){this.addEventListener(e,e=>t(e.detail))}off(e,t){this.removeEventListener(e,t)}_setStatus(e){this.status=e,this.dispatchEvent(new CustomEvent(`status-change`,{detail:{status:e}}))}_setupSignalingListeners(){this.signaling.addEventListener(`message`,async e=>{let t=e.detail;switch(t.type){case O.PLAYER_JOINED:this.peerId=t.playerId;break;case O.ROOM_JOINED:this.peerId=t.players.find(e=>e!==this.localId),t.hostId!==this.localId&&(this.role=E.CLIENT);break;case O.START_SIGNAL:this.peerId=t.peerId,this.role=E.HOST,await this._initPeerConnection(!0);break;case O.SIGNAL:await this._handleSignal(t);break;case O.MATCH_FOUND:this._matchTimeout&&clearTimeout(this._matchTimeout),this.roomCode=t.roomCode,this.peerId=t.opponentId,this._setStatus(D.CONNECTING),this.signaling.disconnect(),setTimeout(async()=>{await this.signaling.connect(this.roomCode),this.localId=this.signaling.playerId},150);break;case O.MATCH_QUEUED:this._setStatus(D.MATCHING);break;case O.PLAYER_LEFT:this._handlePeerLeft(`disconnected`);break;case O.ERROR:this.dispatchEvent(new CustomEvent(`error`,{detail:{message:t.message}}))}})}async _initPeerConnection(e){if(this.peer&&this.peer.close(),this.peer=new N({iceServers:this.iceServers}),this.peer.addEventListener(`ice-candidate`,e=>{this.signaling.sendSignal(this.peerId,{type:`ice-candidate`,candidate:e.detail.candidate})}),this.peer.addEventListener(`open`,()=>{this._setStatus(D.CONNECTED),this.dispatchEvent(new CustomEvent(`match-start`,{detail:{role:this.role,localId:this.localId,peerId:this.peerId,isBot:!1,isHost:this.role===E.HOST}}))}),this.peer.addEventListener(`close`,()=>{this._handlePeerLeft(`rtc_closed`)}),this.peer.addEventListener(`state`,e=>{this.dispatchEvent(new CustomEvent(`state`,{detail:e.detail}))}),this.peer.addEventListener(`input`,e=>{this.dispatchEvent(new CustomEvent(`input`,{detail:e.detail}))}),this.peer.addEventListener(`event`,e=>{this.dispatchEvent(new CustomEvent(`event`,{detail:e.detail}))}),this.peer.addEventListener(`latency`,e=>{this.latency=e.detail.latency,this.dispatchEvent(new CustomEvent(`latency`,{detail:{latency:this.latency}}))}),this.peer.addEventListener(`binary`,e=>{this.dispatchEvent(new CustomEvent(`binary`,{detail:e.detail}))}),this.peer.addEventListener(`quality`,e=>{this.dispatchEvent(new CustomEvent(`quality`,{detail:e.detail}))}),e){let e=await this.peer.createOffer();this.signaling.sendSignal(this.peerId,{type:`offer`,sdp:e})}}async _handleSignal(e){let t=e.signal;if(!this.peer&&t.type===`offer`&&(this.role=E.CLIENT,await this._initPeerConnection(!1)),t.type===`ice-candidate`){this.peer?await this.peer.addIceCandidate(t.candidate):(this._earlyCandidates||=[],this._earlyCandidates.push(t.candidate));return}if(this.peer){if(t.type===`offer`){let n=await this.peer.handleOffer(t.sdp);if(this.signaling.sendSignal(e.from,{type:`answer`,sdp:n}),this._earlyCandidates&&this._earlyCandidates.length>0){for(let e of this._earlyCandidates)await this.peer.addIceCandidate(e);this._earlyCandidates=[]}}else if(t.type===`answer`&&(await this.peer.handleAnswer(t.sdp),this._earlyCandidates&&this._earlyCandidates.length>0)){for(let e of this._earlyCandidates)await this.peer.addIceCandidate(e);this._earlyCandidates=[]}}}_handlePeerLeft(e){this.status===D.CONNECTED&&(this._setStatus(D.DISCONNECTED),this.dispatchEvent(new CustomEvent(`peer-disconnect`,{detail:{peerId:this.peerId,reason:e}})))}async createRoom(e=null){this.disconnect(),this.role=E.HOST,this.roomCode=e?e.toUpperCase().trim():A(),this._setStatus(D.CONNECTING),await this.signaling.connect(this.roomCode),this.localId=this.signaling.playerId,this._setStatus(D.IN_LOBBY);let t=typeof window<`u`?`${window.location.origin}${window.location.pathname}?room=${this.roomCode}`:`?room=${this.roomCode}`;return this.dispatchEvent(new CustomEvent(`room-created`,{detail:{roomCode:this.roomCode,shareUrl:t}})),{roomCode:this.roomCode,shareUrl:t}}async joinRoom(e){this.disconnect(),this.role=E.CLIENT,this.roomCode=e.toUpperCase().trim(),this._setStatus(D.CONNECTING),await this.signaling.connect(this.roomCode),this.localId=this.signaling.playerId,this._setStatus(D.IN_LOBBY),this.dispatchEvent(new CustomEvent(`room-joined`,{detail:{roomCode:this.roomCode}}))}async quickPlay(){this.disconnect(),this._setStatus(D.MATCHING),await this.signaling.connect(`matchmaker`),this.localId=this.signaling.playerId,this.signaling.send({type:O.QUICK_PLAY}),this.botTimeoutMs&&this.botTimeoutMs>0&&(this._matchTimeout=setTimeout(()=>{this._startBotMatch()},this.botTimeoutMs))}_startBotMatch(){this.disconnect(),this.isBot=!0,this.role=E.HOST,this.localId=`local_player`,this.peerId=`bot_opponent`,this._setStatus(D.CONNECTED),this.dispatchEvent(new CustomEvent(`match-start`,{detail:{role:E.HOST,localId:this.localId,peerId:this.peerId,isBot:!0,isHost:!0}}))}sendState(e){this.peer&&this.peer.connected&&this.peer.sendState(e)}sendBinary(e){this.peer&&this.peer.connected&&this.peer.sendBinary(e)}sendInput(e){this.peer&&this.peer.connected&&this.peer.sendInput(e)}sendEvent(e,t={}){this.peer&&this.peer.connected&&this.peer.sendEvent(e,t)}usePortal(e=`auto`,t=null){return this.portal.attach(e,t)}get stats(){return this.peer?this.peer.quality.getStats():{ping:0,jitter:0,packetLoss:0,rating:`good`}}get isHost(){return this.role===E.HOST}disconnect(){this._matchTimeout&&clearTimeout(this._matchTimeout),this.peer&&=(this.peer.close(),null),this.signaling.disconnect(),this.status=D.IDLE,this.role=null,this.localId=null,this.peerId=null,this.roomCode=null,this.isBot=!1,this.latency=0}},I=class{constructor(e,t={}){this.client=e,this.options=Object.assign({title:`⚔️ MEREB ARENA`,container:document.body},t),this.element=document.createElement(`div`),this.element.className=`mereb-lobby-overlay`,this._injectStyles(),this._buildDOM(),this._setupHandlers(),this.options.container&&this.options.container.appendChild(this.element)}_injectStyles(){if(document.getElementById(`mereb-lobby-styles`))return;let e=document.createElement(`style`);e.id=`mereb-lobby-styles`,e.textContent=`
      .mereb-lobby-overlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(10, 10, 26, 0.88); backdrop-filter: blur(6px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: 'Fredoka', system-ui, sans-serif; color: #fff;
        user-select: none;
      }
      .mereb-lobby-title {
        font-size: clamp(32px, 6vw, 56px); font-weight: 800;
        text-shadow: 0 4px 0 #333, 0 8px 24px rgba(0,0,0,0.6);
        margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px;
      }
      .mereb-menu-stack {
        display: flex; flex-direction: column; gap: 14px; width: min(300px, 85vw);
      }
      .mereb-btn {
        appearance: none; border: none; outline: none; cursor: pointer;
        font-family: inherit; font-size: 19px; font-weight: 700; text-transform: uppercase;
        padding: 16px 24px; border-radius: 14px; color: #fff;
        transition: transform 0.08s ease, box-shadow 0.08s ease;
        box-shadow: 0 4px 0 rgba(0,0,0,0.4);
      }
      .mereb-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 rgba(0,0,0,0.4) !important;
      }
      .btn-create { background: #16a34a; border-bottom: 4px solid #14532d; }
      .btn-join { background: #2563eb; border-bottom: 4px solid #1e3a8a; }
      .btn-quick { background: #f59e0b; border-bottom: 4px solid #b45309; color: #000; }
      .btn-copy { background: #0891b2; border-bottom: 4px solid #155e75; margin-top: 10px; }
      .btn-back { background: #475569; border-bottom: 4px solid #1e293b; margin-top: 10px; }
      .btn-submit { background: #9333ea; border-bottom: 4px solid #581c87; padding: 16px; flex-shrink: 0; }
      
      .mereb-join-box { display: flex; flex-direction: column; gap: 10px; width: 100%; }
      .mereb-input-row { display: flex; gap: 8px; width: 100%; }
      .mereb-code-input {
        flex: 1; padding: 14px; font-size: 24px; font-family: monospace; font-weight: 800;
        text-align: center; border-radius: 14px; border: 2px solid #475569;
        background: #1e1e2f; color: #fff; text-transform: uppercase; outline: none; min-width: 0;
      }
      .mereb-code-input:focus { border-color: #38bdf8; }

      .mereb-room-display { text-align: center; width: min(320px, 85vw); }
      .mereb-room-code {
        font-size: clamp(48px, 12vw, 68px); font-family: monospace; font-weight: 800;
        letter-spacing: 6px; color: #facc15; text-shadow: 0 4px 0 #ca8a04; margin-bottom: 4px;
      }
      .mereb-status-text {
        margin-top: 20px; font-size: 17px; color: #94a3b8; font-weight: 600;
        min-height: 24px; text-transform: uppercase; letter-spacing: 1px;
      }
      .mereb-error-text {
        margin-top: 8px; font-size: 15px; color: #f87171; font-weight: 700;
        min-height: 20px; text-transform: uppercase;
      }
      .mereb-dots::after { content: ''; animation: merebDots 1.5s steps(4, end) infinite; }
      @keyframes merebDots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }
    `,document.head.appendChild(e)}_buildDOM(){this.element.innerHTML=`
      <h1 class="mereb-lobby-title">${this.options.title}</h1>

      <div class="mereb-menu-stack" id="mereb-main-menu">
        <button class="mereb-btn btn-create" id="mereb-btn-create">🎮 CREATE ROOM</button>
        <button class="mereb-btn btn-join" id="mereb-btn-join">🔗 JOIN ROOM</button>
        <button class="mereb-btn btn-quick" id="mereb-btn-quick">⚡ QUICK PLAY</button>
        ${this.options.onHome?`<button class="mereb-btn btn-back" id="mereb-btn-home" style="margin-top: 10px; background: #334155; font-size: 14px; padding: 12px 18px;">← LANDING PAGE</button>`:``}
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
    `,this.mainMenu=this.element.querySelector(`#mereb-main-menu`),this.joinMenu=this.element.querySelector(`#mereb-join-menu`),this.roomView=this.element.querySelector(`#mereb-room-view`),this.codeInput=this.element.querySelector(`#mereb-input-code`),this.codeText=this.element.querySelector(`#mereb-code-text`),this.statusText=this.element.querySelector(`#mereb-status-text`),this.errorText=this.element.querySelector(`#mereb-error-text`)}_setupHandlers(){if(this.options.onHome){let e=this.element.querySelector(`#mereb-btn-home`);e&&e.addEventListener(`click`,()=>{this.options.onHome()})}this.element.querySelector(`#mereb-btn-create`).addEventListener(`click`,async()=>{this.setStatus(`Connecting to server...`,!0);try{let{roomCode:e}=await this.client.createRoom();this.mainMenu.style.display=`none`,this.roomView.style.display=`block`,this.codeText.innerText=e,this.setStatus(`Waiting for opponent...`,!0)}catch{this.showError(`Server waking up... Click again in a moment`)}}),this.element.querySelector(`#mereb-btn-join`).addEventListener(`click`,()=>{this.mainMenu.style.display=`none`,this.joinMenu.style.display=`flex`,this.codeInput.focus()});let e=()=>{let e=this.codeInput.value.trim().toUpperCase();e.length===4?(this.setStatus(`Connecting to room...`,!0),this.client.joinRoom(e).catch(()=>{this.showError(`Could not connect to room`)})):this.showError(`Code must be 4 characters`)};this.element.querySelector(`#mereb-btn-submit`).addEventListener(`click`,e),this.codeInput.addEventListener(`keypress`,t=>{t.key===`Enter`&&e()}),this.element.querySelector(`#mereb-btn-quick`).addEventListener(`click`,()=>{this.setStatus(`Finding opponent...`,!0),this.client.quickPlay()});let t=this.element.querySelector(`#mereb-btn-copy`);t.addEventListener(`click`,()=>{let e=this.codeText.innerText,n=`${window.location.origin}${window.location.pathname}?room=${e}`;navigator.clipboard.writeText(n).then(()=>{let e=t.innerText;t.innerText=`COPIED! ✅`,setTimeout(()=>{t.innerText=e},2e3)}).catch(()=>{this.showError(`Failed to copy`)})});let n=()=>{this.client.disconnect(),this.resetToMenu()};this.element.querySelector(`#mereb-btn-join-back`).addEventListener(`click`,n),this.element.querySelector(`#mereb-btn-room-back`).addEventListener(`click`,n),this.client.on(`match-start`,()=>{this.hide()}),this.client.on(`error`,e=>{this.showError(e.message||`Network error`)}),this.client.on(`peer-disconnect`,()=>{this.show(),this.resetToMenu(),this.showError(`Opponent disconnected`)})}setStatus(e,t=!1){this.statusText.innerText=e,t?this.statusText.classList.add(`mereb-dots`):this.statusText.classList.remove(`mereb-dots`)}showError(e){this.errorText.innerText=e,setTimeout(()=>{this.errorText.innerText=``},3500)}resetToMenu(){this.mainMenu.style.display=`flex`,this.joinMenu.style.display=`none`,this.roomView.style.display=`none`,this.codeInput.value=``,this.statusText.innerText=``,this.statusText.classList.remove(`mereb-dots`)}show(){this.element.style.display=`flex`}hide(){this.element.style.display=`none`}},L=typeof TextEncoder<`u`?new TextEncoder:null,R=typeof TextDecoder<`u`?new TextDecoder:null,z=class{constructor(e=512){this.capacity=e,this.buffer=new ArrayBuffer(this.capacity),this.view=new DataView(this.buffer),this.offset=0}_ensureCapacity(e){if(this.offset+e>this.capacity){let t=this.capacity*2;for(;this.offset+e>t;)t*=2;let n=new ArrayBuffer(t);new Uint8Array(n).set(new Uint8Array(this.buffer)),this.buffer=n,this.view=new DataView(this.buffer),this.capacity=t}}reset(){return this.offset=0,this}writeUint8(e){return this._ensureCapacity(1),this.view.setUint8(this.offset,e),this.offset+=1,this}writeInt8(e){return this._ensureCapacity(1),this.view.setInt8(this.offset,e),this.offset+=1,this}writeBoolean(e){return this.writeUint8(+!!e)}writeUint16(e){return this._ensureCapacity(2),this.view.setUint16(this.offset,e,!0),this.offset+=2,this}writeInt16(e){return this._ensureCapacity(2),this.view.setInt16(this.offset,e,!0),this.offset+=2,this}writeUint32(e){return this._ensureCapacity(4),this.view.setUint32(this.offset,e,!0),this.offset+=4,this}writeInt32(e){return this._ensureCapacity(4),this.view.setInt32(this.offset,e,!0),this.offset+=4,this}writeFloat32(e){return this._ensureCapacity(4),this.view.setFloat32(this.offset,e,!0),this.offset+=4,this}writeFloat64(e){return this._ensureCapacity(8),this.view.setFloat64(this.offset,e,!0),this.offset+=8,this}writeFixed16(e,t=100){let n=Math.max(-32768,Math.min(32767,Math.round(e*t)));return this.writeInt16(n)}writeFixed8(e,t=10){let n=Math.max(-128,Math.min(127,Math.round(e*t)));return this.writeInt8(n)}writeString(e){if(!L){let t=e.length;this.writeUint16(t);for(let n=0;n<t;n++)this.writeUint8(e.charCodeAt(n));return this}let t=L.encode(e);return this.writeUint16(t.length),this._ensureCapacity(t.length),new Uint8Array(this.buffer,this.offset,t.length).set(t),this.offset+=t.length,this}writeBytes(e){return this._ensureCapacity(e.length),new Uint8Array(this.buffer,this.offset,e.length).set(e),this.offset+=e.length,this}getBuffer(){return this.buffer.slice(0,this.offset)}getView(){return new Uint8Array(this.buffer,0,this.offset)}get length(){return this.offset}},B=class{constructor(e){if(e instanceof ArrayBuffer)this.buffer=e,this.view=new DataView(this.buffer),this.byteLength=this.buffer.byteLength;else if(ArrayBuffer.isView(e))this.buffer=e.buffer,this.view=new DataView(this.buffer,e.byteOffset,e.byteLength),this.byteLength=e.byteLength;else throw Error(`BinaryReader requires an ArrayBuffer or TypedArray view`);this.offset=0}seek(e){return this.offset=Math.max(0,Math.min(this.byteLength,e)),this}readUint8(){let e=this.view.getUint8(this.offset);return this.offset+=1,e}readInt8(){let e=this.view.getInt8(this.offset);return this.offset+=1,e}readBoolean(){return this.readUint8()!==0}readUint16(){let e=this.view.getUint16(this.offset,!0);return this.offset+=2,e}writeInt16(){let e=this.view.getInt16(this.offset,!0);return this.offset+=2,e}readInt16(){let e=this.view.getInt16(this.offset,!0);return this.offset+=2,e}readUint32(){let e=this.view.getUint32(this.offset,!0);return this.offset+=4,e}readInt32(){let e=this.view.getInt32(this.offset,!0);return this.offset+=4,e}readFloat32(){let e=this.view.getFloat32(this.offset,!0);return this.offset+=4,e}readFloat64(){let e=this.view.getFloat64(this.offset,!0);return this.offset+=8,e}readFixed16(e=100){return this.readInt16()/e}readFixed8(e=10){return this.readInt8()/e}readString(){let e=this.readUint16();if(!R){let t=``;for(let n=0;n<e;n++)t+=String.fromCharCode(this.readUint8());return t}let t=new Uint8Array(this.buffer,this.view.byteOffset+this.offset,e);return this.offset+=e,R.decode(t)}readBytes(e){let t=new Uint8Array(this.buffer,this.view.byteOffset+this.offset,e);return this.offset+=e,t}get bytesRemaining(){return this.byteLength-this.offset}};function V(e,t,n){return e+(t-e)*n}function H(e,t,n){let r=(t-e)%(Math.PI*2);return r<-Math.PI&&(r+=Math.PI*2),r>Math.PI&&(r-=Math.PI*2),e+r*n}var U=class{constructor(e={}){this.bufferTime=e.bufferTime??100,this.maxExtrapolation=e.maxExtrapolation??120,this.maxSnapshots=e.maxSnapshots??30,this.snapshots=[],this.angleProperties=new Set(e.angleProperties||[`rotation`,`turretRotation`,`angle`,`yaw`,`pitch`]),this.snapProperties=new Set(e.snapProperties||[`health`,`score`,`team`,`state`,`invulnerable`,`isShooting`])}pushSnapshot(e,t){let n=performance.now(),r={clientRecvTime:n,serverTime:e||n,entities:t};this.snapshots.length>0&&r.serverTime<this.snapshots[0].serverTime||(this.snapshots.push(r),this.snapshots.sort((e,t)=>e.serverTime-t.serverTime),this.snapshots.length>this.maxSnapshots&&this.snapshots.shift())}getInterpolated(){if(this.snapshots.length===0)return{};if(this.snapshots.length===1)return this.snapshots[0].entities;performance.now();let e=this.snapshots[this.snapshots.length-1].serverTime-this.bufferTime,t=null,n=null;for(let r=0;r<this.snapshots.length-1;r++)if(this.snapshots[r].serverTime<=e&&this.snapshots[r+1].serverTime>=e){t=this.snapshots[r],n=this.snapshots[r+1];break}if(!t&&e<this.snapshots[0].serverTime)return this.snapshots[0].entities;if(!t){t=this.snapshots[this.snapshots.length-2],n=this.snapshots[this.snapshots.length-1];let r=n.serverTime-t.serverTime;if(r<=0)return n.entities;let i=e-n.serverTime,a=1+Math.min(i,this.maxExtrapolation)/r;return this._interpolateEntities(t.entities,n.entities,a)}let r=n.serverTime-t.serverTime,i=r>0?(e-t.serverTime)/r:1;return this._interpolateEntities(t.entities,n.entities,Math.max(0,Math.min(1,i)))}_interpolateEntities(e,t,n){let r={},i=new Set([...Object.keys(e||{}),...Object.keys(t||{})]);for(let a of i){let i=e[a],o=t[a];if(!i&&o){r[a]={...o};continue}if(i&&!o){r[a]={...i};continue}let s={};for(let e of Object.keys(o)){let t=i[e],r=o[e];s[e]=typeof r==`number`&&typeof t==`number`?this.snapProperties.has(e)?r:this.angleProperties.has(e)?H(t,r,n):V(t,r,n):r===void 0?t:r}r[a]=s}return r}clear(){this.snapshots=[]}};function W(e){let t=Object.entries(e).map(([e,t])=>typeof t==`string`?{name:e,type:t,scale:t===`fixed16`?100:1}:{name:e,type:t.type||`fixed16`,scale:t.scale||100}),n=new z(512);return{fields:t,encode(e,r=null){let i=r||n.reset();for(let n=0;n<t.length;n++){let{name:r,type:a,scale:o}=t[n],s=e?e[r]:0;switch(a){case`uint8`:i.writeUint8(s||0);break;case`int8`:i.writeInt8(s||0);break;case`uint16`:i.writeUint16(s||0);break;case`int16`:i.writeInt16(s||0);break;case`uint32`:i.writeUint32(s||0);break;case`int32`:i.writeInt32(s||0);break;case`float32`:i.writeFloat32(s||0);break;case`fixed16`:i.writeFixed16(s||0,o);break;case`boolean`:case`bool`:i.writeBoolean(!!s);break;case`string`:i.writeString(s||``);break;default:i.writeFloat32(s||0)}}return r?i:i.getView()},decode(e){let n=e instanceof B?e:new B(e),r={};for(let e=0;e<t.length;e++){let{name:i,type:a,scale:o}=t[e];switch(a){case`uint8`:r[i]=n.readUint8();break;case`int8`:r[i]=n.readInt8();break;case`uint16`:r[i]=n.readUint16();break;case`int16`:r[i]=n.readInt16();break;case`uint32`:r[i]=n.readUint32();break;case`int32`:r[i]=n.readInt32();break;case`float32`:r[i]=n.readFloat32();break;case`fixed16`:r[i]=n.readFixed16(o);break;case`boolean`:case`bool`:r[i]=n.readBoolean();break;case`string`:r[i]=n.readString();break;default:r[i]=n.readFloat32()}}return r}}}var G=class{constructor(e={}){this.container=e.container||document.body,this.forceShow=e.forceShow||!1,this.onMove=e.onMove||null,this.onAim=e.onAim||null,this.onFire=e.onFire||null,this.isTouchDevice=this.forceShow||`ontouchstart`in window||navigator.maxTouchPoints>0,this.maxRadius=e.maxRadius||55,this.deadzone=e.deadzone||.15,this.state={move:{x:0,y:0,up:!1,down:!1,left:!1,right:!1,angle:0,active:!1},aim:{x:0,y:0,angle:0,active:!1},fire:!1},this.leftTouchId=null,this.leftCenter={x:0,y:0},this.rightTouchId=null,this.rightCenter={x:0,y:0},this.dom=null,this.isTouchDevice&&(this._buildDOM(),this._attachEvents())}_buildDOM(){this._injectStyles(),this.dom=document.createElement(`div`),this.dom.className=`mereb-touch-overlay`,this.leftZone=document.createElement(`div`),this.leftZone.className=`mereb-touch-zone left-zone`,this.leftBase=document.createElement(`div`),this.leftBase.className=`mereb-joystick-base left-base`,this.leftKnob=document.createElement(`div`),this.leftKnob.className=`mereb-joystick-knob left-knob`,this.leftBase.appendChild(this.leftKnob),this.leftZone.appendChild(this.leftBase),this.rightZone=document.createElement(`div`),this.rightZone.className=`mereb-touch-zone right-zone`,this.rightBase=document.createElement(`div`),this.rightBase.className=`mereb-joystick-base right-base`,this.rightKnob=document.createElement(`div`),this.rightKnob.className=`mereb-joystick-knob right-knob`,this.rightBase.appendChild(this.rightKnob),this.rightZone.appendChild(this.rightBase),this.fireBtn=document.createElement(`button`),this.fireBtn.className=`mereb-fire-btn`,this.fireBtn.innerHTML=`
      <span class="fire-icon">💥</span>
      <span class="fire-text">FIRE</span>
    `,this.rightZone.appendChild(this.fireBtn),this.dom.appendChild(this.leftZone),this.dom.appendChild(this.rightZone),this.container.appendChild(this.dom)}_injectStyles(){if(document.getElementById(`mereb-touch-styles`))return;let e=document.createElement(`style`);e.id=`mereb-touch-styles`,e.textContent=`
      .mereb-touch-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 25;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }
      .mereb-touch-zone {
        position: absolute;
        top: 25%;
        bottom: 0;
        width: 50%;
        pointer-events: auto;
        touch-action: none;
      }
      .left-zone {
        left: 0;
      }
      .right-zone {
        right: 0;
      }

      /* Joystick Base */
      .mereb-joystick-base {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%);
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05);
        pointer-events: none;
        opacity: 0.45;
        transition: opacity 0.15s ease, border-color 0.15s ease;
        margin-left: -60px;
        margin-top: -60px;
      }
      .mereb-joystick-base.active {
        opacity: 0.9;
        border-color: #38bdf8;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2);
      }

      .left-base {
        left: 80px;
        bottom: 80px;
      }
      .right-base {
        right: 170px;
        bottom: 80px;
      }

      /* Joystick Knob */
      .mereb-joystick-knob {
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #38bdf8, #0284c7);
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        left: 35px;
        top: 35px;
        pointer-events: none;
        transition: transform 0.06s cubic-bezier(0.1, 0.9, 0.2, 1);
      }
      .right-knob {
        background: linear-gradient(135deg, #f87171, #dc2626);
      }

      /* Fire Button (Chunky Arcade 3D) */
      .mereb-fire-btn {
        position: absolute;
        right: 28px;
        bottom: 50px;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
        border: 3px solid #fecaca;
        border-bottom: 6px solid #7f1d1d;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.45);
        font-family: 'Fredoka', system-ui, sans-serif;
        font-weight: 700;
        cursor: pointer;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        transition: transform 0.05s, border-bottom-width 0.05s, box-shadow 0.05s;
        z-index: 30;
      }
      .mereb-fire-btn .fire-icon {
        font-size: 24px;
        line-height: 1;
        pointer-events: none;
      }
      .mereb-fire-btn .fire-text {
        font-size: 13px;
        letter-spacing: 0.5px;
        pointer-events: none;
      }
      .mereb-fire-btn:active, .mereb-fire-btn.pressed {
        transform: translateY(4px);
        border-bottom-width: 2px;
        box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
        background: #dc2626;
      }
    `,document.head.appendChild(e)}_attachEvents(){let e=e=>{e.preventDefault();let t=this.container.getBoundingClientRect(),n=t.left+t.width/2;for(let r=0;r<e.changedTouches.length;r++){let i=e.changedTouches[r],a=i.clientX,o=i.clientY,s=this.fireBtn.getBoundingClientRect();if(a>=s.left&&a<=s.right&&o>=s.top&&o<=s.bottom){this.state.fire=!0,this.fireBtn.classList.add(`pressed`),this.onFire&&this.onFire(!0);continue}a<n&&this.leftTouchId===null?(this.leftTouchId=i.identifier,this.leftCenter={x:a-t.left,y:o-t.top},this.leftBase.style.left=`${this.leftCenter.x}px`,this.leftBase.style.top=`${this.leftCenter.y}px`,this.leftBase.style.bottom=`auto`,this.leftBase.classList.add(`active`),this.state.move.active=!0):a>=n&&this.rightTouchId===null&&(this.rightTouchId=i.identifier,this.rightCenter={x:a-t.left,y:o-t.top},this.rightBase.style.left=`${this.rightCenter.x}px`,this.rightBase.style.top=`${this.rightCenter.y}px`,this.rightBase.style.right=`auto`,this.rightBase.style.bottom=`auto`,this.rightBase.classList.add(`active`),this.state.aim.active=!0)}},t=e=>{e.preventDefault();let t=this.container.getBoundingClientRect();for(let n=0;n<e.changedTouches.length;n++){let r=e.changedTouches[n],i=r.clientX-t.left,a=r.clientY-t.top;if(r.identifier===this.leftTouchId){let e=i-this.leftCenter.x,t=a-this.leftCenter.y,n=Math.sqrt(e*e+t*t),r=Math.atan2(t,e),o=Math.min(n,this.maxRadius),s=o/this.maxRadius,c=Math.cos(r)*o,l=Math.sin(r)*o;if(this.leftKnob.style.transform=`translate(${c}px, ${l}px)`,s>this.deadzone){let i=e/n*s,a=t/n*s;this.state.move.x=i,this.state.move.y=a,this.state.move.angle=r,this.state.move.left=i<-.3,this.state.move.right=i>.3,this.state.move.up=a<-.3,this.state.move.down=a>.3}else this.state.move.x=0,this.state.move.y=0,this.state.move.left=!1,this.state.move.right=!1,this.state.move.up=!1,this.state.move.down=!1;this.onMove&&this.onMove(this.state.move)}if(r.identifier===this.rightTouchId){let e=i-this.rightCenter.x,t=a-this.rightCenter.y,n=Math.sqrt(e*e+t*t),r=Math.atan2(e,-t),o=Math.min(n,this.maxRadius),s=o/this.maxRadius,c=Math.sin(r)*o,l=-Math.cos(r)*o;this.rightKnob.style.transform=`translate(${c}px, ${l}px)`,s>this.deadzone&&(this.state.aim.x=Math.sin(r)*s,this.state.aim.y=-Math.cos(r)*s,this.state.aim.angle=r,s>.4&&(this.state.fire=!0)),this.onAim&&this.onAim(this.state.aim)}}},n=e=>{this.container.getBoundingClientRect();for(let t=0;t<e.changedTouches.length;t++){let n=e.changedTouches[t],r=n.clientX,i=n.clientY,a=this.fireBtn.getBoundingClientRect();r>=a.left&&r<=a.right&&i>=a.top&&i<=a.bottom&&(this.state.fire=!1,this.fireBtn.classList.remove(`pressed`),this.onFire&&this.onFire(!1)),n.identifier===this.leftTouchId&&(this.leftTouchId=null,this.leftKnob.style.transform=`translate(0px, 0px)`,this.leftBase.classList.remove(`active`),this.state.move={x:0,y:0,up:!1,down:!1,left:!1,right:!1,angle:0,active:!1},this.onMove&&this.onMove(this.state.move)),n.identifier===this.rightTouchId&&(this.rightTouchId=null,this.rightKnob.style.transform=`translate(0px, 0px)`,this.rightBase.classList.remove(`active`),this.state.aim.active=!1,this.fireBtn.classList.contains(`pressed`)||(this.state.fire=!1),this.onAim&&this.onAim(this.state.aim))}};this.dom.addEventListener(`touchstart`,e,{passive:!1}),this.dom.addEventListener(`touchmove`,t,{passive:!1}),this.dom.addEventListener(`touchend`,n,{passive:!1}),this.dom.addEventListener(`touchcancel`,n,{passive:!1}),this.fireBtn.addEventListener(`touchstart`,e=>{e.stopPropagation(),e.preventDefault(),this.state.fire=!0,this.fireBtn.classList.add(`pressed`),this.onFire&&this.onFire(!0)},{passive:!1});let r=e=>{e.stopPropagation(),this.state.fire=!1,this.fireBtn.classList.remove(`pressed`),this.onFire&&this.onFire(!1)};this.fireBtn.addEventListener(`touchend`,r),this.fireBtn.addEventListener(`touchcancel`,r)}show(){this.dom&&(this.dom.style.display=`block`)}hide(){this.dom&&(this.dom.style.display=`none`)}getState(){return{move:{...this.state.move},aim:{...this.state.aim},fire:this.state.fire}}destroy(){this.dom&&this.dom.parentNode&&this.dom.parentNode.removeChild(this.dom)}},K=class{constructor(e,t={}){this.client=e,this.container=t.container||document.body,this.engine=t.engine||null,this.visible=!1,this.activeTab=`console`,this.artificialLagMs=0,this.artificialDropRate=0,this.logs=[],this.maxLogs=100,this._buildDOM(),this._attachGlobalHotkey(),this._hookClientEvents()}_buildDOM(){this._injectStyles(),this.pill=document.createElement(`button`),this.pill.className=`mereb-terminal-pill`,this.pill.innerHTML=`⚡ <span class="pill-text">MEREB DEV</span>`,this.pill.title="Toggle Mereb Netcode Terminal (` or ~)",this.pill.addEventListener(`click`,()=>this.toggle()),this.container.appendChild(this.pill),this.element=document.createElement(`div`),this.element.className=`mereb-terminal-modal`,this.element.style.display=`none`,this.element.innerHTML=`
      <div class="terminal-header">
        <div class="terminal-title">
          <span class="terminal-badge">⚡ MEREB NETCODE v1.0</span>
          <span class="terminal-status-dot"></span>
          <span class="terminal-room-id">OFFLINE</span>
        </div>
        <div class="terminal-tabs">
          <button class="terminal-tab-btn active" data-tab="console">💻 CONSOLE</button>
          <button class="terminal-tab-btn" data-tab="telemetry">📊 TELEMETRY</button>
          <button class="terminal-tab-btn" data-tab="chaos">🧪 CHAOS SIM</button>
          <button class="terminal-tab-btn" data-tab="entities">📦 ENTITIES</button>
        </div>
        <button class="terminal-close-btn" title="Close">✕</button>
      </div>

      <div class="terminal-body">
        <!-- Tab 1: Console -->
        <div class="terminal-tab-content tab-console active">
          <div class="terminal-output"></div>
          <form class="terminal-input-bar">
            <span class="terminal-prompt">&gt;</span>
            <input type="text" class="terminal-input" placeholder="Type a command (or 'help')..." />
            <button type="submit" class="terminal-send-btn">RUN</button>
          </form>
        </div>

        <!-- Tab 2: Telemetry -->
        <div class="terminal-tab-content tab-telemetry">
          <div class="telemetry-grid">
            <div class="telemetry-card">
              <div class="telemetry-label">RTT / PING</div>
              <div class="telemetry-value telemetry-ping">-- ms</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">JITTER</div>
              <div class="telemetry-value telemetry-jitter">-- ms</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">PACKET LOSS</div>
              <div class="telemetry-value telemetry-loss">0%</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">WEBRTC STATE</div>
              <div class="telemetry-value telemetry-rtc">DISCONNECTED</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">PEER ROLE</div>
              <div class="telemetry-value telemetry-role">NONE</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">ROOM CODE</div>
              <div class="telemetry-value telemetry-room">--</div>
            </div>
          </div>
          <div class="telemetry-details"></div>
        </div>

        <!-- Tab 3: Chaos Simulator -->
        <div class="terminal-tab-content tab-chaos">
          <div class="chaos-desc">
            Simulate real-world mobile network conditions (3G/4G lag and packet drops) to test client prediction and snapshot interpolation.
          </div>
          <div class="chaos-controls">
            <div class="chaos-field">
              <label>Artificial Latency: <span class="chaos-lag-val">0ms</span></label>
              <input type="range" class="chaos-lag-slider" min="0" max="600" step="25" value="0" />
            </div>
            <div class="chaos-field">
              <label>Packet Drop Rate: <span class="chaos-drop-val">0%</span></label>
              <input type="range" class="chaos-drop-slider" min="0" max="50" step="5" value="0" />
            </div>
            <div class="chaos-presets">
              <button class="chaos-preset-btn" data-lag="0" data-drop="0">🟢 Perfect (0ms)</button>
              <button class="chaos-preset-btn" data-lag="60" data-drop="0">🟡 4G LTE (60ms)</button>
              <button class="chaos-preset-btn" data-lag="180" data-drop="5">🟠 Slow 3G (180ms + 5%)</button>
              <button class="chaos-preset-btn" data-lag="400" data-drop="20">🔴 Extreme (400ms + 20%)</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: Entities -->
        <div class="terminal-tab-content tab-entities">
          <pre class="entities-json">No active game state to inspect.</pre>
        </div>
      </div>
    `,this.container.appendChild(this.element),this.closeBtn=this.element.querySelector(`.terminal-close-btn`),this.closeBtn.addEventListener(`click`,()=>this.hide()),this.output=this.element.querySelector(`.terminal-output`),this.input=this.element.querySelector(`.terminal-input`),this.form=this.element.querySelector(`.terminal-input-bar`),this.form.addEventListener(`submit`,e=>{e.preventDefault();let t=this.input.value.trim();t&&(this.executeCommand(t),this.input.value=``)}),this.tabBtns=this.element.querySelectorAll(`.terminal-tab-btn`),this.tabBtns.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;this.switchTab(t)})});let e=this.element.querySelector(`.chaos-lag-slider`),t=this.element.querySelector(`.chaos-lag-val`);e.addEventListener(`input`,e=>{this.artificialLagMs=parseInt(e.target.value,10),t.innerText=`${this.artificialLagMs}ms`,this.log(`[Chaos] Injected artificial latency: ${this.artificialLagMs}ms`,`warn`)});let n=this.element.querySelector(`.chaos-drop-slider`),r=this.element.querySelector(`.chaos-drop-val`);n.addEventListener(`input`,e=>{this.artificialDropRate=parseInt(e.target.value,10)/100,r.innerText=`${e.target.value}%`,this.log(`[Chaos] Injected packet drop rate: ${e.target.value}%`,`warn`)}),this.element.querySelectorAll(`.chaos-preset-btn`).forEach(i=>{i.addEventListener(`click`,()=>{let a=parseInt(i.dataset.lag,10),o=parseInt(i.dataset.drop,10);e.value=a,n.value=o,this.artificialLagMs=a,this.artificialDropRate=o/100,t.innerText=`${a}ms`,r.innerText=`${o}%`,this.log(`[Chaos] Preset applied: Lag ${a}ms, Drop ${o}%`,`info`)})}),this.log(`Mereb Terminal Initialized. Type "help" for commands.`,`system`)}_injectStyles(){if(document.getElementById(`mereb-terminal-styles`))return;let e=document.createElement(`style`);e.id=`mereb-terminal-styles`,e.textContent=`
      .mereb-terminal-pill {
        position: fixed;
        bottom: 16px;
        left: 16px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #38bdf8;
        border-radius: 9999px;
        padding: 6px 14px;
        font-family: 'Fredoka', ui-monospace, monospace;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        transition: transform 0.1s, background 0.15s;
      }
      .mereb-terminal-pill:hover {
        transform: scale(1.05);
        background: rgba(56, 189, 248, 0.15);
      }

      .mereb-terminal-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(850px, 92vw);
        height: min(520px, 85vh);
        background: rgba(10, 15, 30, 0.94);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 14px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15);
        backdrop-filter: blur(16px);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
        color: #e2e8f0;
      }

      .terminal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: rgba(15, 23, 42, 0.9);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .terminal-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .terminal-badge {
        color: #38bdf8;
        font-weight: 700;
      }
      .terminal-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
      }
      .terminal-status-dot.connected {
        background: #22c55e;
      }
      .terminal-room-id {
        font-size: 11px;
        color: #94a3b8;
      }

      .terminal-tabs {
        display: flex;
        gap: 4px;
      }
      .terminal-tab-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: color 0.15s, background 0.15s;
      }
      .terminal-tab-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }
      .terminal-tab-btn.active {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.15);
      }

      .terminal-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .terminal-close-btn:hover {
        color: #fff;
        background: rgba(239, 68, 68, 0.3);
      }

      .terminal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .terminal-tab-content {
        flex: 1;
        display: none;
        flex-direction: column;
        padding: 14px;
        overflow-y: auto;
      }
      .terminal-tab-content.active {
        display: flex;
      }

      /* Console Tab */
      .terminal-output {
        flex: 1;
        overflow-y: auto;
        font-size: 12px;
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 10px;
        word-break: break-all;
      }
      .terminal-log-line {
        display: flex;
        gap: 8px;
      }
      .terminal-log-time {
        color: #64748b;
        font-size: 11px;
      }
      .log-info { color: #38bdf8; }
      .log-warn { color: #facc15; }
      .log-error { color: #f87171; }
      .log-system { color: #a855f7; }
      .log-success { color: #4ade80; }

      .terminal-input-bar {
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 4px 10px;
        gap: 8px;
      }
      .terminal-prompt {
        color: #38bdf8;
        font-weight: 700;
      }
      .terminal-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #f1f5f9;
        font-family: inherit;
        font-size: 13px;
      }
      .terminal-send-btn {
        background: #0284c7;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 4px 12px;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      /* Telemetry Tab */
      .telemetry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .telemetry-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px;
        text-align: center;
      }
      .telemetry-label {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .telemetry-value {
        font-size: 16px;
        font-weight: 700;
        color: #38bdf8;
      }

      /* Chaos Tab */
      .chaos-desc {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.5;
        margin-bottom: 18px;
      }
      .chaos-controls {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .chaos-field label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .chaos-field input[type="range"] {
        width: 100%;
        accent-color: #38bdf8;
      }
      .chaos-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .chaos-preset-btn {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        font-family: inherit;
        font-size: 11px;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.1s;
      }
      .chaos-preset-btn:hover {
        background: rgba(56, 189, 248, 0.2);
        color: #fff;
      }

      /* Entities Tab */
      .entities-json {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 14px;
        font-size: 12px;
        line-height: 1.5;
        overflow-x: auto;
        color: #38bdf8;
      }
    `,document.head.appendChild(e)}_attachGlobalHotkey(){window.addEventListener(`keydown`,e=>{(e.key==="`"||e.key===`~`)&&e.target.tagName!==`INPUT`&&e.target.tagName!==`TEXTAREA`&&(e.preventDefault(),this.toggle())})}_hookClientEvents(){this.client&&(this.client.on(`status`,e=>{this.log(`[Status] ${e}`,`info`),this._updateHeader()}),this.client.on(`quality`,e=>{this._updateTelemetry(e)}),this.client.on(`match-start`,e=>{this.log(`[Match] Started as ${e.role} vs ${e.peerId}`,`success`),this._updateHeader()}),this.client.on(`event`,e=>{this.log(`[Event] ${e.name}: ${JSON.stringify(e.data||{})}`,`info`)}),this.client.on(`error`,e=>{this.log(`[Error] ${e.message||e}`,`error`)}))}toggle(){this.visible?this.hide():this.show()}show(){this.visible=!0,this.element.style.display=`flex`,this.input.focus(),this._refreshEntities()}hide(){this.visible=!1,this.element.style.display=`none`}switchTab(e){this.activeTab=e,this.tabBtns.forEach(t=>{t.classList.toggle(`active`,t.dataset.tab===e)}),this.element.querySelectorAll(`.terminal-tab-content`).forEach(t=>{t.classList.toggle(`active`,t.classList.contains(`tab-${e}`))}),e===`entities`&&this._refreshEntities()}log(e,t=`info`){let n=new Date().toLocaleTimeString(),r={time:n,message:e,type:t};if(this.logs.push(r),this.logs.length>this.maxLogs&&this.logs.shift(),this.output){let r=document.createElement(`div`);r.className=`terminal-log-line log-${t}`,r.innerHTML=`<span class="terminal-log-time">[${n}]</span> <span class="terminal-log-msg">${this._escapeHTML(e)}</span>`,this.output.appendChild(r),this.output.scrollTop=this.output.scrollHeight}}executeCommand(e){this.log(`> ${e}`,`system`);let[t,...n]=e.trim().split(/\s+/),r=t.toLowerCase();switch(r){case`help`:this.log(`Available Commands:`,`info`),this.log(`  help                 - Show this help list`,`info`),this.log(`  status               - Dump connection & room status`,`info`),this.log(`  state                - Inspect player/bullet entities`,`info`),this.log(`  lag <ms>             - Simulate network latency (e.g. lag 150)`,`info`),this.log(`  drop <percent>       - Simulate packet loss (e.g. drop 10)`,`info`),this.log(`  kick                 - Forfeit / leave current match`,`info`),this.log(`  clear                - Clear console output`,`info`);break;case`status`:let e=this.client?.roomCode||`None`,t=this.client?.role||`None`,i=this.client?.peerId||`None`,a=this.client?.localId||`None`;this.log(`Status Report: Room=${e} | Role=${t} | Local=${a} | Peer=${i}`,`success`);break;case`state`:this._refreshEntities(),this.switchTab(`entities`);break;case`lag`:let o=parseInt(n[0],10)||0;this.artificialLagMs=o,this.log(`Simulated lag set to ${o}ms`,`warn`);break;case`drop`:let s=parseInt(n[0],10)||0;this.artificialDropRate=s/100,this.log(`Simulated packet drop rate set to ${s}%`,`warn`);break;case`kick`:case`leave`:this.client&&(this.client.leave(),this.log(`Forfeited and disconnected.`,`warn`));break;case`clear`:this.output&&(this.output.innerHTML=``),this.logs=[];break;default:this.log(`Unknown command: "${r}". Type "help" for options.`,`error`)}}_updateHeader(){let e=this.element.querySelector(`.terminal-room-id`),t=this.element.querySelector(`.terminal-status-dot`),n=this.client&&this.client.peer&&this.client.peer.connected;t&&t.classList.toggle(`connected`,n),e&&(e.innerText=this.client?.roomCode?`ROOM: ${this.client.roomCode}`:`OFFLINE`);let r=this.element.querySelector(`.telemetry-rtc`),i=this.element.querySelector(`.telemetry-role`),a=this.element.querySelector(`.telemetry-room`);r&&(r.innerText=n?`CONNECTED`:this.client?.status||`IDLE`),i&&(i.innerText=this.client?.role||`NONE`),a&&(a.innerText=this.client?.roomCode||`--`)}_updateTelemetry(e){if(!e)return;let t=this.element.querySelector(`.telemetry-ping`),n=this.element.querySelector(`.telemetry-jitter`),r=this.element.querySelector(`.telemetry-loss`);t&&(t.innerText=`${e.ping||0} ms`),n&&(n.innerText=`${e.jitter||0} ms`),r&&(r.innerText=`${e.packetLoss||0}%`)}_refreshEntities(){let e=this.element.querySelector(`.entities-json`);e&&(e.innerText=this.engine&&this.engine.playerStates?JSON.stringify({players:this.engine.playerStates,bullets:this.engine.bulletStates||[]},null,2):`No entity states available.`)}_escapeHTML(e){return e.replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e]||e)}},q=new class{constructor(){this.client=null,this.appId=`tank-arena`,this.host=`mereb-signaling.dawitbaslyos.workers.dev`,this.entities=new Map,this.interpolator=new U,this.rpcHandlers=new Map,this.touch=null,this.isInitialized=!1}async init(e={}){return this.isInitialized&&this.client?this.client:(this.appId=e.appId||`tank-arena`,this.host=e.host||`mereb-signaling.dawitbaslyos.workers.dev`,this.client=new F({appId:this.appId,host:this.host,botTimeoutMs:e.botTimeoutMs??8e3,autoJoinFromUrl:e.autoJoinFromUrl??!0}),this.client.on(`event`,e=>{if(e.name===`mereb:rpc`){let{rpcName:t,payload:n,senderId:r}=e.data||{},i=this.rpcHandlers.get(t);i&&i(n,r)}}),this.isInitialized=!0,this.client)}async joinOrCreateRoom(e){return this.client||await this.init(),this.client.joinRoom(e)}async quickPlay(){return this.client||await this.init(),this.client.quickPlay()}rpc(e,t={}){this.client&&this.client.sendEvent(`mereb:rpc`,{rpcName:e,payload:t,senderId:this.client.localId})}onRpc(e,t){this.rpcHandlers.set(e,t)}instantiate(e,t={}){let n=t.isLocal??!0,r=t.schema?W(t.schema):null,i=t.id||`${e}_${this.client?.localId||`p`}`,a={id:i,type:e,isLocal:n,schema:r,state:{},set(e){if(this.state={...this.state,...e},this.isLocal&&r&&q.client){let e=r.encode(this.state);q.client.sendBinary(e)}},onUpdate(e){this._updateCallback=e}};return this.entities.set(i,a),a}attachControls(e={}){return this.touch||=new G(e),this.touch}};typeof window<`u`&&(window.Mereb={...q,Engine:q,MerebClient:F,MerebLobby:I,PeerConnection:N,SignalingClient:j,BinaryWriter:z,BinaryReader:B,SnapshotInterpolator:U,defineSchema:W,TouchControls:G,MerebTerminal:K,TurnPool:C,NetworkQuality:M,PortalManager:P,DEFAULT_STUN_SERVERS:x,DEFAULT_TURN_SERVERS:S,...w}),e.BinaryReader=B,e.BinaryWriter=z,e.DC=k,e.DEFAULT_ICE_SERVERS=T,e.DEFAULT_STUN_SERVERS=x,e.DEFAULT_TURN_SERVERS=S,e.Mereb=q,e.MerebClient=F,e.MerebLobby=I,e.MerebTerminal=K,e.NetworkQuality=M,e.PeerConnection=N,e.PortalManager=P,e.ROLE=E,e.STATUS=D,e.SignalingClient=j,e.SnapshotInterpolator=U,e.TouchControls=G,e.TurnPool=C,e.WS=O,e.defineSchema=W,e.generateRoomCode=A});