# REST API & Socket.IO Specification

## REST API Endpoints

### Authentication
- `POST /api/auth/register`: Create user & organization.
- `POST /api/auth/login`: Authenticate and receive JWT access + refresh tokens.
- `POST /api/auth/refresh`: Refresh access token.
- `GET /api/auth/me`: Get active authenticated user details.

### Detection & Analytics
- `POST /api/detect/upload`: Multipart audio file upload analysis.
- `GET /api/detect/history`: Query detection archive with filters.
- `GET /api/detect/:id`: Get detailed detection record.
- `GET /api/detect/analytics/summary`: Aggregated executive metrics.

## Realtime Socket.IO Protocol
- Connection URL: `ws://localhost:5000/socket.io/`
- Events:
  - Client -> Server: `start-mic-stream`, `audio-chunk`, `stop-mic-stream`
  - Server -> Client: `realtime-telemetry` (`waveform`, `fftBins`, `liveScore`, `riskLevel`, `alertTriggered`)
