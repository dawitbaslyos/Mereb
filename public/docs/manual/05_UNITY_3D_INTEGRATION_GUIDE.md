# Mereb Manual: Unity 3D WebGL Integration Guide

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Stacks:** Unity 2022 LTS, Unity 2023 LTS, Unity 6 (WebGL) &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Overview & Architecture

Exporting multiplayer games to **Unity WebGL** has traditionally been difficult because Unity's native `System.Net.Sockets` and raw UDP sockets are disabled by web browser security sandboxes.

**Mereb solves this seamlessly for Unity.** By utilizing a lightweight WebGL JavaScript bridge (`.jslib`), Unity C# scripts communicate directly with the browser's WebRTC implementation and Cloudflare signaling worker.

```
       [ Unity 3D C# Engine ]                     [ Browser JavaScript Runtime ]
       MerebNetworkManager.cs                          mereb.umd.js SDK
  ┌──────────────────────────────┐              ┌──────────────────────────────┐
  │ • Authoritative Game State   │              │ • WebRTC DataChannel (UDP)   │
  │ • Player Controller / Input  │ [DllImport]  │ • Cloudflare WebSocket DO    │
  │ • Vector3 / Quaternion Lerp  │ ───────────► │ • Binary Packing & Unpacking │
  │ • OnMatchStarted() Callback  │ ◄─────────── │ • 8s Smart Bot Fallback      │
  └──────────────────────────────┘  SendMessage └──────────────────────────────┘
```

---

## 2. Step 1: Create the WebGL Bridge Plugin (`MerebBridge.jslib`)

In your Unity Project, create the directory `Assets/Plugins/WebGL/` and add the following file: `MerebBridge.jslib`:

```javascript
mergeInto(LibraryManager.library, {
  
  /**
   * Initializes MerebClient inside the browser runtime
   */
  Mereb_Init: function(hostStr, botTimeoutMs) {
    var host = UTF8ToString(hostStr);
    
    if (!window.Mereb) {
      console.error("[Mereb Unity] mereb.umd.js SDK is not loaded on window!");
      return;
    }

    window.merebClient = new window.Mereb.MerebClient({
      host: host,
      botTimeoutMs: botTimeoutMs,
      autoJoinFromUrl: true
    });

    // Match Start Listener
    window.merebClient.on('match-start', function(data) {
      var jsonStr = JSON.stringify(data);
      SendMessage('MerebNetworkManager', 'OnNativeMatchStarted', jsonStr);
    });

    // High-frequency State Listener
    window.merebClient.on('state', function(state) {
      var jsonStr = JSON.stringify(state);
      SendMessage('MerebNetworkManager', 'OnNativeStateReceived', jsonStr);
    });

    // Client Input Listener
    window.merebClient.on('input', function(input) {
      var jsonStr = JSON.stringify(input);
      SendMessage('MerebNetworkManager', 'OnNativeInputReceived', jsonStr);
    });

    // Network Health Stats
    window.merebClient.on('quality', function(stats) {
      var jsonStr = JSON.stringify(stats);
      SendMessage('MerebNetworkManager', 'OnNativeQualityUpdated', jsonStr);
    });

    // Peer Disconnected
    window.merebClient.on('peer-disconnect', function() {
      SendMessage('MerebNetworkManager', 'OnNativePeerDisconnected', '');
    });

    console.log("[Mereb Unity] SDK initialized successfully.");
  },

  /**
   * Triggers Global Quick Play
   */
  Mereb_QuickPlay: function() {
    if (window.merebClient) {
      window.merebClient.quickPlay();
    }
  },

  /**
   * Creates a private 4-letter room
   */
  Mereb_CreateRoom: function() {
    if (window.merebClient) {
      window.merebClient.createRoom().then(function(code) {
        SendMessage('MerebNetworkManager', 'OnNativeRoomCreated', code);
      });
    }
  },

  /**
   * Joins an existing 4-letter room
   */
  Mereb_JoinRoom: function(roomCodeStr) {
    var code = UTF8ToString(roomCodeStr);
    if (window.merebClient) {
      window.merebClient.joinRoom(code);
    }
  },

  /**
   * Sends high-frequency game state (Host -> Client)
   */
  Mereb_SendState: function(stateJsonStr) {
    var stateJson = UTF8ToString(stateJsonStr);
    if (window.merebClient) {
      try {
        var state = JSON.parse(stateJson);
        window.merebClient.sendState(state);
      } catch (e) {}
    }
  },

  /**
   * Sends continuous input stream (Client -> Host)
   */
  Mereb_SendInput: function(inputJsonStr) {
    var inputJson = UTF8ToString(inputJsonStr);
    if (window.merebClient) {
      try {
        var input = JSON.parse(inputJson);
        window.merebClient.sendInput(input);
      } catch (e) {}
    }
  },

  /**
   * Sends guaranteed game event
   */
  Mereb_SendEvent: function(eventNameStr, eventDataJsonStr) {
    var name = UTF8ToString(eventNameStr);
    var dataJson = UTF8ToString(eventDataJsonStr);
    if (window.merebClient) {
      try {
        var data = JSON.parse(dataJson);
        window.merebClient.sendEvent(name, data);
      } catch (e) {}
    }
  },

  /**
   * Disconnects active session
   */
  Mereb_Disconnect: function() {
    if (window.merebClient) {
      window.merebClient.disconnect();
    }
  }
});
```

---

## 3. Step 2: Implement `MerebNetworkManager.cs`

Attach this script to an empty GameObject named **`MerebNetworkManager`** in your startup Unity scene:

```csharp
using System;
using System.Runtime.InteropServices;
using UnityEngine;

[Serializable]
public class MatchStartPayload
{
    public string role;
    public string localId;
    public string peerId;
    public bool isHost;
    public bool isBot;
    public string roomCode;
}

[Serializable]
public class NetworkQualityPayload
{
    public int ping;
    public int jitter;
    public int packetLoss;
    public string rating;
}

[Serializable]
public class EntityTransformState
{
    public float px, py, pz;
    public float rx, ry, rz;
    public int health;
}

public class MerebNetworkManager : MonoBehaviour
{
    public static MerebNetworkManager Instance { get; private set; }

    [Header("Signaling Configuration")]
    [SerializeField] private string signalingHost = "mereb-signaling.dawitbaslyos.workers.dev";
    [SerializeField] private int botTimeoutMs = 8000;

    [Header("Network Status")]
    public bool isConnected = false;
    public bool isHost = false;
    public bool isBot = false;
    public string currentRole = "";
    public string roomCode = "";
    public int currentPing = 0;

    [Header("Entities")]
    [SerializeField] private Transform localPlayer;
    [SerializeField] private Transform remoteOpponent;
    [SerializeField] private float interpolationSpeed = 15f;

    private Vector3 targetOpponentPos;
    private Quaternion targetOpponentRot;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void Mereb_Init(string host, int timeout);
    [DllImport("__Internal")] private static extern void Mereb_QuickPlay();
    [DllImport("__Internal")] private static extern void Mereb_CreateRoom();
    [DllImport("__Internal")] private static extern void Mereb_JoinRoom(string code);
    [DllImport("__Internal")] private static extern void Mereb_SendState(string json);
    [DllImport("__Internal")] private static extern void Mereb_SendInput(string json);
    [DllImport("__Internal")] private static extern void Mereb_SendEvent(string name, string json);
    [DllImport("__Internal")] private static extern void Mereb_Disconnect();
#else
    // Mock fallbacks for in-editor testing
    private static void Mereb_Init(string h, int t) => Debug.Log($"[Mereb Editor Mock] Init host: {h}");
    private static void Mereb_QuickPlay() => Debug.Log("[Mereb Editor Mock] QuickPlay started");
    private static void Mereb_CreateRoom() => Debug.Log("[Mereb Editor Mock] CreateRoom");
    private static void Mereb_JoinRoom(string c) => Debug.Log($"[Mereb Editor Mock] JoinRoom: {c}");
    private static void Mereb_SendState(string j) {}
    private static void Mereb_SendInput(string j) {}
    private static void Mereb_SendEvent(string n, string j) {}
    private static void Mereb_Disconnect() {}
#endif

    private void Awake()
    {
        if (Instance == null) { Instance = this; DontDestroyOnLoad(gameObject); }
        else { Destroy(gameObject); }
    }

    private void Start()
    {
        Debug.Log("[Mereb] Initializing WebGL Netcode...");
        Mereb_Init(signalingHost, botTimeoutMs);
    }

    public void QuickPlay()
    {
        Debug.Log("[Mereb] Entering Quick Play Queue...");
        Mereb_QuickPlay();
    }

    public void CreateRoom()
    {
        Mereb_CreateRoom();
    }

    public void JoinRoom(string code)
    {
        Mereb_JoinRoom(code.ToUpper());
    }

    private void FixedUpdate()
    {
        if (!isConnected) return;

        if (isHost && localPlayer != null)
        {
            // Authoritative Host: Broadcast world state at 20-50Hz
            EntityTransformState state = new EntityTransformState
            {
                px = localPlayer.position.x,
                py = localPlayer.position.y,
                pz = localPlayer.position.z,
                rx = localPlayer.eulerAngles.x,
                ry = localPlayer.eulerAngles.y,
                rz = localPlayer.eulerAngles.z,
                health = 100
            };
            Mereb_SendState(JsonUtility.ToJson(state));
        }
        else if (!isHost)
        {
            // Client: Stream player inputs to Host
            string inputJson = $"{{\"horizontal\":{Input.GetAxisRaw("Horizontal")},\"vertical\":{Input.GetAxisRaw("Vertical")}}}";
            Mereb_SendInput(inputJson);
        }
    }

    private void Update()
    {
        // Smoothly interpolate remote opponent movement on Client
        if (!isHost && remoteOpponent != null)
        {
            remoteOpponent.position = Vector3.Lerp(remoteOpponent.position, targetOpponentPos, Time.deltaTime * interpolationSpeed);
            remoteOpponent.rotation = Quaternion.Slerp(remoteOpponent.rotation, targetOpponentRot, Time.deltaTime * interpolationSpeed);
        }
    }

    // Callbacks invoked from MerebBridge.jslib via SendMessage
    public void OnNativeMatchStarted(string json)
    {
        MatchStartPayload data = JsonUtility.FromJson<MatchStartPayload>(json);
        isConnected = true;
        isHost = data.isHost;
        isBot = data.isBot;
        currentRole = data.role;
        roomCode = data.roomCode;

        Debug.Log($"[Mereb C#] Match Started! Role: {currentRole} | IsHost: {isHost} | Bot: {isBot}");
    }

    public void OnNativeStateReceived(string json)
    {
        if (isHost) return;

        EntityTransformState state = JsonUtility.FromJson<EntityTransformState>(json);
        targetOpponentPos = new Vector3(state.px, state.py, state.pz);
        targetOpponentRot = Quaternion.Euler(state.rx, state.ry, state.rz);
    }

    public void OnNativeInputReceived(string json)
    {
        // Host executes simulation on client inputs
        Debug.Log($"[Mereb Host] Received client input: {json}");
    }

    public void OnNativeQualityUpdated(string json)
    {
        NetworkQualityPayload quality = JsonUtility.FromJson<NetworkQualityPayload>(json);
        currentPing = quality.ping;
    }

    public void OnNativePeerDisconnected(string empty)
    {
        Debug.LogWarning("[Mereb] Opponent disconnected.");
        isConnected = false;
    }
}
```

---

## 4. Step 3: Configure Unity WebGL Template

In your exported WebGL `index.html` (or custom template), ensure `mereb.umd.js` is loaded prior to the Unity loader:

```html
<!DOCTYPE html>
<html lang="en-us">
  <head>
    <meta charset="utf-8">
    <title>My Unity Mereb Game</title>
    <!-- Load Mereb SDK -->
    <script src="https://unpkg.com/mereb-netcode/dist-sdk/mereb.umd.js"></script>
  </head>
  <body>
    <canvas id="unity-canvas" width="960" height="600"></canvas>
    <script src="Build/unity.loader.js"></script>
    <script>
      createUnityInstance(document.querySelector("#unity-canvas"), {
        dataUrl: "Build/game.data",
        frameworkUrl: "Build/game.framework.js",
        codeUrl: "Build/game.wasm",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "IndieDev",
        productName: "ArenaDuel",
        productVersion: "1.0",
      });
    </script>
  </body>
</html>
```

---

> [!NOTE]
> When building for WebGL in Unity (**File -> Build Settings -> WebGL**), ensure **Compression Format** is set to `Gzip` or `Brotli`, and test on an active HTTP server (such as Vite or `python -m http.server`) because browser WebRTC requires `http://` or `https://` origin context.
