import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ENV } from '../config/env';

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ENV.CLIENT_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.initHandlers();
  }

  private initHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.IO]: Client connected -> ID: ${socket.id}`);

      // Handle start live microphone detection session
      socket.on('start-mic-stream', (data: { sampleRate?: number }) => {
        console.log(`[Socket.IO]: Started mic stream for ${socket.id}`);
        socket.emit('stream-status', { active: true, message: 'Mic stream initialized' });
      });

      // Handle real-time audio chunk packet processing
      socket.on('audio-chunk', (chunkData: { buffer: ArrayBuffer | number[]; timestamp?: number }) => {
        // Simulate real-time signal FFT & synthetic probability evaluation
        const time = Date.now();
        const randSeed = Math.sin(time / 1000) * 0.5 + 0.5;
        
        const waveform = Array.from({ length: 30 }, (_, i) => 
          Math.sin(i * 0.5 + time / 200) * 0.7 + (Math.random() * 0.2 - 0.1)
        );

        const fftBins = Array.from({ length: 16 }, (_, i) => 
          Math.max(0, Math.min(1, Math.sin(i * 0.4 + time / 500) * 0.8 + 0.2))
        );

        const liveScore = Math.round((0.15 + randSeed * 0.65) * 100) / 100;
        const isCritical = liveScore >= 0.75;
        const riskLevel = isCritical ? 'CRITICAL' : liveScore >= 0.5 ? 'HIGH' : liveScore >= 0.3 ? 'MODERATE' : 'LOW';

        socket.emit('realtime-telemetry', {
          timestamp: time,
          waveform,
          fftBins,
          liveScore,
          riskLevel,
          confidence: Math.round((0.88 + Math.random() * 0.08) * 100),
          alertTriggered: isCritical,
          alertMessage: isCritical ? 'Neural Vocoder Phase Anomaly Detected in Mic Stream!' : null,
        });
      });

      socket.on('stop-mic-stream', () => {
        console.log(`[Socket.IO]: Stopped mic stream for ${socket.id}`);
        socket.emit('stream-status', { active: false, message: 'Mic stream ended' });
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO]: Client disconnected -> ID: ${socket.id}`);
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
