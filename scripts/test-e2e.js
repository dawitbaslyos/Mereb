// End-to-end foolproof test for Mereb Cloud Edge
// Tests:
// 1. WebSocket connections for 2 peers to /v1/illegalsoccer/general
// 2. Peer discovery & presence
// 3. Heartbeat ping / pong RTT
// 4. Client-to-client JSON broadcast
// 5. Client-to-client raw binary forwarding (ArrayBuffer / Uint8Array)
// 6. REST API broadcast (/v1/illegalsoccer/general/broadcast)
// 7. REST API presence (/v1/illegalsoccer/general/presence)
// 8. REST API Leaderboards (POST score, GET top scores)

const EDGE_URL = 'https://mereb-signaling.dawitbaslyos.workers.dev';
const WS_URL = 'wss://mereb-signaling.dawitbaslyos.workers.dev';
const APP_ID = 'illegalsoccer';
const ROOM_ID = 'general';

async function runTests() {
  console.log('🚀 Starting Mereb Cloud End-to-End Edge Verification...\n');
  let passed = 0;
  let total = 8;

  // Test 1: Connect Peer 1
  console.log('[Test 1] Connecting Peer 1 to WebSocket...');
  const ws1 = new WebSocket(`${WS_URL}/v1/${APP_ID}/${ROOM_ID}?key=dev_test_1`);
  ws1.binaryType = 'arraybuffer';

  const p1Connected = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout connecting peer 1')), 5000);
    ws1.onopen = () => console.log(' -> ws1 connected');
    ws1.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'connected') {
          clearTimeout(timeout);
          resolve(msg);
        }
      }
    };
    ws1.onerror = (err) => reject(err);
  });

  const p1Info = await p1Connected;
  console.log(`✅ Peer 1 Connected! Assigned ID: ${p1Info.id}`);
  passed++;

  // Test 2: Ping / Pong RTT
  console.log('\n[Test 2] Testing Heartbeat Ping/Pong for RTT latency...');
  const pingStart = Date.now();
  const pongPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for pong')), 3000);
    const handler = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'pong') {
          clearTimeout(timeout);
          ws1.removeEventListener('message', handler);
          resolve(Date.now() - pingStart);
        }
      }
    };
    ws1.addEventListener('message', handler);
  });
  ws1.send(JSON.stringify({ type: 'ping', time: pingStart }));
  const rtt = await pongPromise;
  console.log(`✅ Ping/Pong successful! Edge RTT: ${rtt}ms`);
  passed++;

  // Test 3: Connect Peer 2
  console.log('\n[Test 3] Connecting Peer 2 and verifying Peer-Joined event...');
  const ws2 = new WebSocket(`${WS_URL}/v1/${APP_ID}/${ROOM_ID}?key=dev_test_2`);
  ws2.binaryType = 'arraybuffer';

  const p2Joined = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout peer 2 joined')), 5000);
    const handler = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'peer-joined') {
          clearTimeout(timeout);
          ws1.removeEventListener('message', handler);
          resolve(msg);
        }
      }
    };
    ws1.addEventListener('message', handler);
  });

  const p2Connected = new Promise((resolve) => {
    ws2.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'connected') resolve(msg);
      }
    };
  });

  const [p2Info, joinEvent] = await Promise.all([p2Connected, p2Joined]);
  console.log(`✅ Peer 2 Connected (ID: ${p2Info.id}). Peer 1 detected peer-joined: ${joinEvent.id}`);
  passed++;

  // Test 4: JSON Broadcast between peers
  console.log('\n[Test 4] Testing JSON Broadcast from Peer 2 to Peer 1...');
  const jsonPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for JSON broadcast')), 5000);
    const handler = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.event === 'player-moved' && msg.x === 42) {
          clearTimeout(timeout);
          ws1.removeEventListener('message', handler);
          resolve(msg);
        }
      }
    };
    ws1.addEventListener('message', handler);
  });

  ws2.send(JSON.stringify({ event: 'player-moved', x: 42, y: 88 }));
  const receivedJson = await jsonPromise;
  console.log(`✅ JSON Broadcast received by Peer 1: x=${receivedJson.x}, y=${receivedJson.y}, from=${receivedJson.from}`);
  passed++;

  // Test 5: Raw Binary Forwarding (ArrayBuffer/Uint8Array)
  console.log('\n[Test 5] Testing High-Performance Raw Binary Forwarding...');
  const binaryPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for binary packet')), 5000);
    const handler = (e) => {
      if (typeof e.data !== 'string') {
        clearTimeout(timeout);
        ws1.removeEventListener('message', handler);
        resolve(e.data);
      }
    };
    ws1.addEventListener('message', handler);
  });

  const testBytes = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 1, 2, 3, 4]);
  ws2.send(testBytes.buffer);

  const receivedBuffer = await binaryPromise;
  const receivedBytes = new Uint8Array(receivedBuffer);
  let binaryMatches = testBytes.length === receivedBytes.length;
  for (let i = 0; i < testBytes.length; i++) {
    if (testBytes[i] !== receivedBytes[i]) binaryMatches = false;
  }
  if (!binaryMatches) throw new Error('Binary data mismatch!');
  console.log(`✅ Raw Binary packet forwarded intact! Byte count: ${receivedBytes.byteLength}`);
  passed++;

  // Test 6: HTTP REST Broadcast
  console.log('\n[Test 6] Testing HTTP REST Broadcast to Room...');
  const restBroadcastPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for REST broadcast')), 5000);
    const handler = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.alert === 'GOAL_SCORED') {
          clearTimeout(timeout);
          ws1.removeEventListener('message', handler);
          resolve(msg);
        }
      }
    };
    ws1.addEventListener('message', handler);
  });

  const restRes = await fetch(`${EDGE_URL}/v1/${APP_ID}/${ROOM_ID}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert: 'GOAL_SCORED', team: 'red', score: 1 })
  });
  const restJson = await restRes.json();
  console.log(` -> POST /broadcast response:`, restJson);
  const receivedRestEvent = await restBroadcastPromise;
  console.log(`✅ REST Broadcast delivered to connected socket: alert=${receivedRestEvent.alert}, score=${receivedRestEvent.score}`);
  passed++;

  // Test 7: HTTP REST Presence
  console.log('\n[Test 7] Testing HTTP REST Presence...');
  const presenceRes = await fetch(`${EDGE_URL}/v1/${APP_ID}/${ROOM_ID}/presence`);
  const presenceJson = await presenceRes.json();
  console.log(` -> GET /presence response:`, presenceJson);
  if (presenceJson.ccu !== 2 && presenceJson.peerCount !== 2) {
    throw new Error(`Expected CCU/peerCount 2, got ccu: ${presenceJson.ccu}, peerCount: ${presenceJson.peerCount}`);
  }
  console.log(`✅ Presence API returned active channel stats: CCU=${presenceJson.ccu}, Peers=${presenceJson.peerCount}`);
  passed++;

  // Test 8: Leaderboards API
  console.log('\n[Test 8] Testing Global Leaderboards API...');
  const scoreRes = await fetch(`${EDGE_URL}/api/apps/${APP_ID}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'ProStriker99',
      score: 1250,
      metadata: { goals: 5, rank: 'Ace' }
    })
  });
  const scoreJson = await scoreRes.json();
  console.log(` -> POST /api/apps/${APP_ID}/leaderboard response:`, scoreJson);

  const getScoresRes = await fetch(`${EDGE_URL}/api/apps/${APP_ID}/leaderboard`);
  const topScoresData = await getScoresRes.json();
  console.log(` -> GET /api/apps/${APP_ID}/leaderboard response:`, topScoresData);
  const scoresList = topScoresData.leaderboard || topScoresData;
  const foundScore = scoresList.some(s => s.player === 'ProStriker99' || s.username === 'ProStriker99');
  if (!foundScore) throw new Error('Score was not found in leaderboard!');
  console.log(`✅ Leaderboard registered and retrieved top scores successfully!`);
  passed++;

  // Cleanup
  ws1.close();
  ws2.close();

  console.log(`\n🎉 ALL ${passed}/${total} END-TO-EDGE TESTS PASSED PERFECTLY WITH ZERO BUGS!`);
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
