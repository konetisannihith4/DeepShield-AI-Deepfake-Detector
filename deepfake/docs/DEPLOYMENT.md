# Production Deployment Guide

DeepShield AI is containerized using Docker and Docker Compose with Nginx reverse proxy support.

## 1. Docker Compose Production Launch

To launch MySQL 8, Node.js API Server, and Nginx reverse proxy in containerized production mode:

```bash
docker-compose up -d --build
```

Verify service status:
```bash
docker-compose ps
```

---

## 2. Nginx Reverse Proxy Architecture
Nginx handles port 80/443 mapping, WebSocket upgrades for Socket.IO audio chunk streaming, and static asset caching.
