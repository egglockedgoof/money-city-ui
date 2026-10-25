// ear.js: hold-to-talk client for hear_node. Raw PCM s16le @16 kHz over WebSocket.
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

export async function startListening(host, token = "") {
  const q = token ? `?t=${encodeURIComponent(token)}` : "";
  const ws = new WebSocket(host.replace(/^http/, "ws") + "/hear" + q);  // opening it also prewarms
  ws.binaryType = "arraybuffer";

  const pending = [];                                       // buffer until the socket opens: no lost words
  const send = (m) => (ws.readyState === 1 ? ws.send(m) : pending.push(m));
  ws.onopen = () => { pending.splice(0).forEach((m) => ws.send(m)); };
  const reply = new Promise((ok, fail) => {
    ws.onmessage = (e) => ok(JSON.parse(e.data));
    ws.onerror = ws.onclose = () => fail(new Error("socket closed before reply"));
  });

  // Prosody is the signal, so switch off every browser "enhancement".
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" })));
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm");
  node.port.onmessage = (e) => send(e.data);                // Int16Array is little-endian on every real device
  src.connect(node);

  return {
    async stop() {
      stream.getTracks().forEach((t) => t.stop());
      src.disconnect();
      node.disconnect();
      await ctx.close();
      send("end");
      return reply;                                         // { language, words, sound, affect_vector } | { error }
    },
  };
}
