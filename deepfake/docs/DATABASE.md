# MySQL 8 Database & Prisma Schema Guide

DeepShield AI uses **MySQL 8** with **Prisma ORM** for enterprise schema management and index optimization.

## Entity Relationship Overview

- **User**: Multi-tenant identity (`ADMIN`, `ANALYST`, `VIEWER`). Foreign key to `Organization`.
- **Organization**: Workspace entity tracking scan quotas and REST API access keys.
- **DetectionHistory**: Records stored audio scan payloads including JSON waveform, spectrogram, MFCC, pitch, score, and synthetic segment annotations.
- **AuditLog**: Immutable action log stream.
- **RefreshToken**: Revocable JWT refresh token storage.
- **Notification**: Alert feed items.
- **SystemSetting**: Dynamic key-value configuration.

## Database Management via MySQL Workbench
Open **MySQL Workbench**, connect to `localhost:3306`, and query table indexes:
```sql
USE deepshield;
SHOW TABLES;
SELECT * FROM DetectionHistory ORDER BY createdAt DESC;
```
