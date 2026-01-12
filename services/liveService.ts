import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio context utilities
const AUDIO_CTX_SAMPLE_RATE = 24000;

let audioContext: AudioContext | null = null;
let nextStartTime = 0;

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: AUDIO_CTX_SAMPLE_RATE,
    });
  }
  return audioContext;
}

// Basic PCM helpers
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class LiveVoiceClient {
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private outputContext: AudioContext;
  private outputNode: GainNode;
  
  constructor() {
    this.outputContext = ensureAudioContext();
    this.outputNode = this.outputContext.createGain();
    this.outputNode.connect(this.outputContext.destination);
  }

  async connect(onDisconnect: () => void) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });
    
    // Request Mic Access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.inputContext = new AudioContext({ sampleRate: 16000 });
    this.inputSource = this.inputContext.createMediaStreamSource(stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.session = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          console.log("Voice Connection Opened");
          this.startAudioInput();
        },
        onmessage: async (message: LiveServerMessage) => {
           this.handleMessage(message);
        },
        onclose: () => {
          console.log("Voice Connection Closed");
          onDisconnect();
        },
        onerror: (err) => {
          console.error("Voice Error", err);
          onDisconnect();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction: "You are chatting in a Discord voice channel. Be casual, brief, and conversational.",
      }
    });
  }

  private startAudioInput() {
    if (!this.processor || !this.inputSource || !this.inputContext) return;

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = floatTo16BitPCM(inputData);
      
      // Base64 encode
      let binary = '';
      const bytes = new Uint8Array(pcmData);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      this.session.then((s: any) => {
          s.sendRealtimeInput({
            media: {
            mimeType: 'audio/pcm;rate=16000',
            data: b64
            }
        });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      const rawBytes = base64ToUint8Array(audioData);
      // Decode raw PCM (s16le 24kHz 1ch) to AudioBuffer
      
      const pcmInt16 = new Int16Array(rawBytes.buffer);
      const float32 = new Float32Array(pcmInt16.length);
      for(let i=0; i<pcmInt16.length; i++) {
        float32[i] = pcmInt16[i] / 32768.0;
      }

      const buffer = this.outputContext.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = this.outputContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputNode);
      
      // Schedule playback
      const now = this.outputContext.currentTime;
      nextStartTime = Math.max(nextStartTime, now);
      source.start(nextStartTime);
      nextStartTime += buffer.duration;
    }
  }

  disconnect() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.inputSource) this.inputSource.disconnect();
    if (this.inputContext) this.inputContext.close();
    window.location.reload(); 
  }
}