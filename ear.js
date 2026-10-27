// ear.js: hold-to-talk client for hear_node. Raw PCM s16le @16 kHz over WebSocket.
// Face ↔ Ear v3: rid per Talk, ignore pending ticks, wait for final:true,
// and on drop poll GET /result so a frozen feed heals instead of reading as silence.
// const rec = await startListening("http://host:8421", token);   // on press
// const affect = await rec.stop();                                // on release

const WORKLET = `
class Pcm extends AudioWorkletProcessor {
  constructor() { super(); this.r = sampleRate / 16000; this.p = 0; this.a = 0; this.n = 0;
                  this.b = new Int16Array(1600); this.k = 0; }
  process(inputs) {
    const x = inputs[0][0];
    if (!x) return true;
    for (const s of x) {                       // box-filter decimation to 16 kHz
      this.a += s; this.n++;
      if (++this.p >= this.r) {
        this.p -= this.r;
        const v = Math.max(-1, Math.min(1, this.a / this.n));
        this.a = this.n = 0;
        this.b[this.k++] = v < 0 ? v * 32768 : v * 32767;
        if (this.k === 1600) { this.port.postMessage(this.b.buffer, [this.b.buffer]);
                               this.b = new Int16Array(1600); this.k = 0; }
      }
    }
    return true;
  }
}
registerProcessor("pcm", Pcm);`;

function newRid() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  } catch (e) {}
  var s = "", i, a = new Uint8Array(16);
  try { crypto.getRandomValues(a); } catch (e) { for (i = 0; i < 16; i++) a[i] = (Math.random() * 256) | 0; }
  for (i = 0; i < 16; i++) s += ("0" + a[i].toString(16)).slice(-2);
  return s;
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function pollResult(host, token, rid, deadline) {
  var base = host.replace(/\/$/, "");
  var q = "?t=" + encodeURIComponent(token) + "&rid=" + encodeURIComponent(rid);
  while (Date.now() < deadline) {
    var r;
    try {
      r = await fetch(base + "/result" + q, { cache: "no-store" });
    } catch (e) {
      await sleep(2500);
      continue;
    }
    if (r.status === 200) {
      try { return await r.json(); } catch (e) { return { error: "parse_failure" }; }
    }
    if (r.status === 202) { await sleep(2500); continue; }
    if (r.status === 404) return { error: "didn't_catch_that" };
    if (r.status === 400) return { error: "bad_rid" };
    await sleep(2500);
  }
  return { error: "result_timeout" };
}

async function openHear(host, token, rid) {
  var q = "?t=" + encodeURIComponent(token) + "&rid=" + encodeURIComponent(rid);
  var url = host.replace(/^http/, "ws") + "/hear" + q;
  return await new Promise(function (ok, fail) {
    var ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    var opened = false;
    var timer = setTimeout(function () {
      try { ws.close(); } catch (e) {}
      fail(new Error("ear connect timeout"));
    }, 8000);
    ws.onopen = function () { opened = true; clearTimeout(timer); ok(ws); };
    ws.onerror = function () {
      if (opened) return;
      clearTimeout(timer);
      fail(new Error("ear connect failed"));
    };
    ws.onclose = function (ev) {
      if (opened) return;
      clearTimeout(timer);
      // 503 busy is conveyed as a close before open in some stacks; surface it.
      var err = new Error(ev && ev.code === 1013 ? "busy" : "ear connect closed");
      err.code = ev && ev.code;
      fail(err);
    };
  });
}

export async function startListening(host, token = "") {
  var rid = newRid();
  var ws;
  try {
    ws = await openHear(host, token, rid);
  } catch (e) {
    if (e && (e.message === "busy" || e.code === 1013)) {
      await sleep(2000);
      rid = newRid();
      ws = await openHear(host, token, rid);
    } else {
      throw e;
    }
  }

  var pending = [];
  var send = function (m) { if (ws.readyState === 1) ws.send(m); else pending.push(m); };
  // If already open (usual), flush immediately; else wait once.
  if (ws.readyState === 1) pending.splice(0).forEach(function (m) { ws.send(m); });
  else ws.onopen = function () { pending.splice(0).forEach(function (m) { ws.send(m); }); };

  var gotFinal = false;
  var reply = new Promise(function (ok, fail) {
    ws.onmessage = function (e) {
      var j;
      try { j = JSON.parse(typeof e.data === "string" ? e.data : ""); } catch (err) { return; }
      if (!j || j.pending === true) return; // ticks — ignore
      if (j.final === true || j.error || j.words || j.language) {
        gotFinal = true;
        ok(j);
      }
    };
    ws.onerror = function () {
      if (gotFinal) return;
      fail(new Error("socket_error"));
    };
    ws.onclose = function () {
      if (gotFinal) return;
      fail(new Error("socket_closed"));
    };
  });

  // Prosody is the signal, so switch off every browser "enhancement".
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" })));
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm");
  node.port.onmessage = (e) => send(e.data);
  src.connect(node);

  return {
    rid: rid,
    async stop() {
      stream.getTracks().forEach((t) => t.stop());
      src.disconnect();
      node.disconnect();
      await ctx.close();
      send("end");
      try {
        return await reply;
      } catch (e) {
        // Drop before final: heal via /result (Face ↔ Ear v3). Never treat as Loom silence.
        try { ws.close(); } catch (err) {}
        var deadline = Date.now() + 5 * 60 * 1000;
        var recovered = await pollResult(host, token, rid, deadline);
        if (recovered && recovered.error === "didn't_catch_that") {
          return { error: "didn't catch that" };
        }
        return recovered;
      }
    },
  };
}
