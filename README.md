<p align="center">
  <img src="https://img.shields.io/badge/AURA-Offline%20Payment%20Protocol-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTggMTJMIDEwIDE0TDE2IDgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==&logoColor=white" alt="AURA Badge" />
</p>

<h1 align="center">Ω AURA</h1>
<h3 align="center">Adaptive Universal Relay Architecture</h3>
<p align="center">
  <strong>A multi-mode offline payment platform that transfers encrypted payment packets<br/>via QR, Bluetooth LE, NFC, Ultrasonic Sound, and Li-Fi Light.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-0.83-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Expo-55-000020?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/ONNX-ML_Risk_Engine-005CED?style=flat-square&logo=onnx&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Security-RSA%202048%20%7C%20AES%20256%20%7C%20RS256%20JWT-22c55e?style=flat-square&logo=letsencrypt&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [5 Transport Modes](#-5-transport-modes)
- [Security Model](#-security-model)
- [AI / ML Risk Engine](#-ai--ml-risk-engine)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Mobile App Setup](#2-mobile-app-setup)
  - [Web Dashboard Setup](#3-web-dashboard-setup)
  - [Docker (One Command)](#4-docker-one-command-full-stack)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Screenshots & Demo](#-screenshots--demo)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**AURA** (Adaptive Universal Relay Architecture) is a full-stack offline payment protocol that enables secure peer-to-peer money transfers with **zero internet connectivity**. It uses cryptographic token signing, encrypted payment packets, and five distinct hardware communication channels to transmit payment data through the physical environment.

### The Problem

> **1.4 billion adults** globally lack access to reliable internet connectivity for financial transactions. In disaster zones, remote areas, underground transit, and crowded festivals, existing payment systems fail entirely.

### The Solution

AURA pre-fetches **RSA-2048 signed cryptographic tokens** onto your device. When you need to pay someone, the encrypted payment packet is transmitted through any available hardware channel — **QR Code, Bluetooth LE, NFC, Ultrasonic Sound, or Li-Fi Light pulses** — with no internet required. Transactions queue offline and settle automatically when connectivity resumes.

---

## ✨ Key Features

| Category | Feature | Details |
|----------|---------|---------|
| 💸 **Payments** | 5 Offline Transfer Modes | QR, BLE, NFC, Ultrasonic Sound (FSK), Li-Fi (Manchester) |
| 🔐 **Security** | Military-Grade Cryptography | RSA-2048 device keypairs, RSA-PSS token signing, AES-256-GCM packet encryption |
| 🧠 **AI** | ML Risk Engine | ONNX-compiled RandomForest classifier for real-time fraud detection |
| 📱 **Mobile** | Premium Native App | Expo + React Native with glassmorphism UI, animated orbs, biometric auth |
| 🌐 **Web** | Admin Dashboard | Vite + React + Tailwind with 3D hero, interactive environment simulator |
| 🔄 **Sync** | Offline-First Queue | AsyncStorage outbox with NetInfo auto-drain, first-sync-wins settlement |
| 🛡️ **Auth** | Multi-Factor | OTP (Twilio SMS) + RSA-2048 device key + bcrypt PIN + biometric (Face ID/fingerprint) |
| 💰 **Wallet** | Full Banking | Fund/withdraw/balance, multi-bank linking, daily/monthly transaction limits |
| 🔔 **Notifications** | Push & Email | Firebase Cloud Messaging + email receipts for large transactions (≥₹50,000) |
| 👥 **Contacts** | Quick Send | Contact book with favorites and search |
| 📊 **Analytics** | Transaction Insights | Mode distribution, risk scores, sync status, volume charts |
| 🏦 **KYC** | Identity Verification | Aadhaar/PAN verification flow (simulated endpoints) |
| ⚖️ **Disputes** | Chargeback Resolution | File disputes, admin review with cryptographic proof resolution |
| 🌍 **i18n** | Multi-Language | English, Hindi, Telugu via `expo-localization` |
| ♿ **Accessibility** | Screen Reader Support | `accessibilityRole` and `accessibilityLabel` on core UI components |
| 📝 **Audit** | Complete Logging | AuditLogMiddleware — method, path, status, latency, auth context |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AURA ECOSYSTEM                                │
├─────────────────┬───────────────────────┬───────────────────────────────┤
│                 │                       │                               │
│  📱 Mobile App  │  🌐 Web Dashboard    │  ⚡ Backend API               │
│  Expo + RN      │  Vite + React        │  FastAPI + PostgreSQL         │
│                 │  + TailwindCSS       │  + Redis + ONNX              │
│  ┌───────────┐  │  ┌───────────────┐   │  ┌─────────────────────────┐ │
│  │ 5 Transfer│  │  │ Landing Page  │   │  │ 20 API Route Modules    │ │
│  │ Services  │  │  │ + 3D Hero     │   │  │ 15 Service Layer        │ │
│  │           │  │  │ + Environment │   │  │ 16 Database Models      │ │
│  │ • QR      │  │  │   Simulator   │   │  │ ML Risk Engine (ONNX)   │ │
│  │ • BLE     │  │  ├───────────────┤   │  │ Token Expiry Tasks      │ │
│  │ • NFC     │  │  │ 18 Dashboard  │   │  │ Push Notifications      │ │
│  │ • Sound   │  │  │ Pages         │   │  │ Email Service           │ │
│  │ • Light   │  │  └───────────────┘   │  │ Audit Middleware         │ │
│  └───────────┘  │                       │  └─────────────────────────┘ │
│  ┌───────────┐  │                       │                               │
│  │ Offline   │  │                       │  ┌─────────────────────────┐ │
│  │ Outbox    │  │                       │  │ 🐘 PostgreSQL 16        │ │
│  │ Queue     │──│───────────────────────│──│ 🔴 Redis 7              │ │
│  └───────────┘  │                       │  │ 🔑 RSA Keypair (keys/) │ │
│                 │                       │  └─────────────────────────┘ │
└─────────────────┴───────────────────────┴───────────────────────────────┘
```

### Payment Flow

```mermaid
sequenceDiagram
    participant S as 📱 Sender
    participant R as 📱 Receiver
    participant B as ⚡ Backend

    Note over S: Pre-fetched RSA-signed tokens stored on device
    S->>S: Select token + receiver
    S->>S: Generate ephemeral AES-256 session key (ECDH)
    S->>S: Encrypt payment packet (AES-256-GCM)
    S->>R: Transmit via QR / BLE / NFC / Sound / Light
    R->>R: Decrypt packet, verify RSA-PSS signature
    R->>R: Store in offline outbox
    Note over R: Auto-sync when connectivity resumes
    R->>B: Submit transaction + sync queue
    B->>B: Verify token hash (SHA-256)
    B->>B: Check double-spend (token lock)
    B->>B: ML risk scoring (ONNX)
    B->>B: First-sync-wins settlement
    B-->>S: Push notification (FCM)
    B-->>R: Push notification (FCM)
```

---

## 📡 5 Transport Modes

AURA implements **five distinct hardware communication protocols**, each with custom encoding and decoding logic:

### 1. 📷 QR Code

| Spec | Value |
|------|-------|
| **Library** | `react-native-qrcode-svg` |
| **Speed** | ~1.2 seconds |
| **Range** | Line of sight |
| **How it works** | Encrypted payment packet serialized into a QR code. Receiver scans with camera. |

### 2. 📶 Bluetooth Low Energy (BLE)

| Spec | Value |
|------|-------|
| **Library** | `react-native-ble-plx` + `react-native-ble-peripheral-manager` |
| **Speed** | ~0.8 seconds |
| **Range** | ~30 meters |
| **How it works** | Peer-to-peer GATT characteristic writes. Sender advertises as BLE peripheral, receiver connects as central and reads the encrypted packet from a custom GATT characteristic. |

### 3. 📲 NFC (Near Field Communication)

| Spec | Value |
|------|-------|
| **Library** | `react-native-nfc-manager` + `react-native-hce` |
| **Speed** | ~0.3 seconds |
| **Range** | ~4 cm |
| **How it works** | NDEF record exchange. Sender writes encrypted packet to NFC tag/HCE, receiver taps to read. Fastest transfer mode. |

### 4. 🔊 Ultrasonic Sound (FSK Protocol)

| Spec | Value |
|------|-------|
| **Encoding** | Frequency Shift Keying (FSK) |
| **Frequencies** | 18 kHz (bit "0"), 19.5 kHz (bit "1") |
| **Start/End Markers** | 17 kHz / 20 kHz |
| **Decoding** | Goertzel algorithm (single-frequency DFT) |
| **Integrity** | CRC-16 + XOR-rotate ECC (4 parity bytes) + legacy XOR checksum |
| **Bit Rate** | 30 ms/bit (~33 bps) |
| **Speed** | ~2.5 seconds |
| **Range** | ~3 meters |

```
DATA → Binary Bits → CRC-16 + ECC → FSK Tones (18-20kHz)
                                          ↓
                         Speaker → Air → Microphone
                                          ↓
              Goertzel Detection → Binary → CRC/ECC Verify → DATA
```

### 5. 💡 Li-Fi Light (Manchester Pulse Protocol)

| Spec | Value |
|------|-------|
| **Encoding** | Manchester encoding |
| **Bit Period** | 160 ms (80 ms half-period) |
| **Preamble** | 8 rapid flashes at 40 ms half-period |
| **Sampling** | 100 Hz camera brightness frames |
| **Threshold** | Adaptive percentile-based (15th/85th percentile) |
| **Integrity** | CRC-16 + ECC (4 parity bytes) + legacy XOR |
| **Speed** | ~3.0 seconds |
| **Range** | ~1 meter |

```
DATA → Binary Bits → CRC-16 + ECC → Manchester Pulses
                                          ↓
                     Flashlight ON/OFF → Air → Camera
                                          ↓
          Brightness Sampling → Transition Detection → Binary → DATA
```

---

## 🔐 Security Model

AURA implements defense-in-depth with multiple cryptographic layers:

```
┌─────────────────────────────────────────────┐
│              SECURITY LAYERS                 │
├──────────────────┬──────────────────────────┤
│ Layer            │ Implementation           │
├──────────────────┼──────────────────────────┤
│ Device Keys      │ RSA-2048 (node-forge)    │
│                  │ Stored in SecureStore     │
│                  │ (Keychain / Keystore)     │
├──────────────────┼──────────────────────────┤
│ Token Signing    │ RSA-PSS + SHA-256        │
│                  │ Server-side private key   │
├──────────────────┼──────────────────────────┤
│ Packet Encryption│ AES-256-GCM              │
│                  │ Ephemeral session keys    │
├──────────────────┼──────────────────────────┤
│ JWT Auth         │ RS256 (asymmetric)       │
│                  │ 30-min access + 7-day    │
│                  │ refresh tokens           │
├──────────────────┼──────────────────────────┤
│ PIN Storage      │ bcrypt hash              │
├──────────────────┼──────────────────────────┤
│ Transaction Hash │ SHA-256 hash chain       │
├──────────────────┼──────────────────────────┤
│ Double-Spend     │ Token lock + DB check    │
│ Prevention       │ before transaction       │
├──────────────────┼──────────────────────────┤
│ Rate Limiting    │ slowapi (5/min OTP,      │
│                  │ 10/min verify, 3/min     │
│                  │ PIN recovery)            │
├──────────────────┼──────────────────────────┤
│ App Lock         │ Mandatory PIN on boot    │
│                  │ + biometric (Face ID/    │
│                  │ fingerprint)             │
├──────────────────┼──────────────────────────┤
│ Multi-Device     │ Device tracking table    │
│                  │ Old devices revoked      │
├──────────────────┼──────────────────────────┤
│ Audit Trail      │ AuditLogMiddleware       │
│                  │ Every request logged     │
└──────────────────┴──────────────────────────┘
```

---

## 🧠 AI / ML Risk Engine

AURA uses a **RandomForest classifier** compiled to **ONNX** format for real-time transaction risk scoring:

### Features

| Feature | Description |
|---------|-------------|
| `amount` | Transaction value (₹) |
| `mode_encoded` | Transfer mode (QR=0, BLE=1, Sound=2, Light=3, NFC=4) |
| `hour` | Hour of day (0–23) |

### Decision Thresholds

| Risk Score | Decision |
|-----------|----------|
| ≥ 0.70 | 🔴 **Block** — Transaction rejected |
| ≥ 0.35 | 🟡 **Review** — Flagged for manual review |
| < 0.35 | 🟢 **Approve** — Transaction proceeds |

### Model Pipeline

```
Training Data → scikit-learn RandomForest → skl2onnx → risk_model.onnx
                                                             ↓
                                             onnxruntime (backend inference)
```

The engine includes **heuristic fallback** if the ONNX model file is missing, ensuring the system always has risk scoring capability.

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **Python 3.12** | Runtime |
| **FastAPI 0.111** | API framework |
| **SQLAlchemy 2.0** | ORM |
| **Alembic 1.13** | Database migrations |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | OTP caching (with in-memory fallback) |
| **PyJWT** + `cryptography` | RS256 JWT + RSA-PSS signing |
| **passlib** + **bcrypt** | PIN hashing |
| **onnxruntime** | ML risk model inference |
| **slowapi** | Rate limiting |
| **Twilio** | SMS OTP delivery |
| **Razorpay** | Payment gateway (stub for development) |
| **firebase-admin** | Push notifications (FCM) |
| **Pydantic** | Config validation + request schemas |

### Mobile App

| Technology | Purpose |
|-----------|---------|
| **React Native 0.83** | Cross-platform framework |
| **Expo SDK 55** | Build toolchain + managed workflow |
| **node-forge** | RSA-2048 keypair generation |
| **expo-secure-store** | Hardware-backed key storage |
| **expo-camera** | QR scanning + Li-Fi brightness sampling |
| **expo-av** | Ultrasonic sound recording/playback |
| **react-native-ble-plx** | Bluetooth Low Energy |
| **react-native-nfc-manager** | NFC tag read/write |
| **expo-local-authentication** | Biometric auth (Face ID, fingerprint) |
| **expo-notifications** | Push notification handling |
| **expo-localization** | i18n (EN, HI, TE) |
| **@react-navigation** | Navigation (stack + bottom tabs) |

### Web Dashboard

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library |
| **Vite 7.3** | Build tool + dev server |
| **TailwindCSS 3.4** | Utility-first CSS |
| **Framer Motion** | Page animations + transitions |
| **Three.js** + `@react-three/fiber` | 3D hero elements |
| **GSAP** + ScrollTrigger | Scroll-triggered animations |
| **Lucide React** | Icon library |
| **react-router-dom v7** | Client-side routing |

---

## 📁 Project Structure

```
AURA/
├── backend/                          # ⚡ FastAPI backend
│   ├── app/
│   │   ├── ai/                       # ML risk engine
│   │   │   ├── risk_engine.py        # ONNX inference + heuristic fallback
│   │   │   ├── risk_model.onnx       # Trained RandomForest model
│   │   │   └── mode_scoring_engine.py
│   │   ├── middleware/
│   │   │   └── audit_log.py          # Request audit logging
│   │   ├── models/                   # 16 SQLAlchemy models
│   │   │   ├── user.py               # User + KYC status + FCM token
│   │   │   ├── wallet.py             # Balance management
│   │   │   ├── token.py              # Offline payment tokens
│   │   │   ├── transaction.py        # Transaction records
│   │   │   ├── sync.py               # Sync queue entries
│   │   │   ├── bank_account.py       # Linked bank accounts
│   │   │   ├── payment_session.py    # Ephemeral key exchange
│   │   │   ├── qr_session.py         # Web QR login sessions
│   │   │   ├── risk.py               # Risk score logs
│   │   │   ├── contact.py            # Contact book
│   │   │   ├── device.py             # Multi-device tracking
│   │   │   ├── dispute.py            # Dispute/chargeback records
│   │   │   ├── kyc.py                # KYC documents
│   │   │   ├── alert.py              # System alerts
│   │   │   ├── activity.py           # Activity logs
│   │   │   └── user_mode_preferences.py
│   │   ├── routes/                   # 20 API route modules
│   │   │   ├── auth.py               # OTP + JWT + PIN recovery
│   │   │   ├── wallet.py             # Fund / withdraw / balance
│   │   │   ├── tokens.py             # Issue / list / revoke tokens
│   │   │   ├── transactions.py       # Create + search + filter
│   │   │   ├── sync.py               # Offline queue settlement
│   │   │   ├── bank.py               # Bank account CRUD
│   │   │   ├── payments.py           # Payment gateway integration
│   │   │   ├── contacts.py           # Contact book CRUD
│   │   │   ├── kyc.py                # KYC verification endpoints
│   │   │   ├── disputes.py           # File + resolve disputes
│   │   │   ├── notifications.py      # Push notification management
│   │   │   ├── payment_session.py    # Ephemeral key exchange
│   │   │   ├── payment_packet.py     # Encrypt / decrypt packets
│   │   │   ├── simulation.py         # Offline payment simulation
│   │   │   ├── admin.py              # Admin dashboard API
│   │   │   ├── analytics.py          # Transaction analytics
│   │   │   ├── risk.py               # Risk score queries
│   │   │   ├── mode.py               # Mode preference CRUD
│   │   │   └── alerts.py             # System alerts
│   │   ├── services/                 # 15 service layer modules
│   │   │   ├── transaction_service.py # Core transaction engine
│   │   │   ├── token_service.py      # Token issuance + signing
│   │   │   ├── wallet_service.py     # Balance operations
│   │   │   ├── auth_service.py       # OTP + user creation
│   │   │   ├── sync_service.py       # Offline queue processing
│   │   │   ├── payment_session_service.py
│   │   │   ├── payment_packet_service.py
│   │   │   ├── payment_gateway.py    # Razorpay integration
│   │   │   ├── push_notification_service.py  # FCM
│   │   │   ├── email_service.py      # SMTP for large txn receipts
│   │   │   ├── otp_store.py          # Redis TTL + in-memory fallback
│   │   │   ├── risk_service.py       # Risk engine wrapper
│   │   │   ├── mode_service.py       # User mode preferences
│   │   │   └── analytics_service.py
│   │   ├── tasks/
│   │   │   └── token_expiry.py       # Background token expiry + auto-refund
│   │   ├── utils/
│   │   │   ├── crypto.py             # RSA-PSS sign/verify (cryptography lib)
│   │   │   ├── jwt.py                # RS256 JWT encode/decode
│   │   │   ├── hashing.py            # SHA-256 token + transaction hashing
│   │   │   ├── packet_crypto.py      # AES-256-GCM packet encrypt/decrypt
│   │   │   ├── session_crypto.py     # Session key generation
│   │   │   ├── token_generator.py    # Token payload builder
│   │   │   └── payment_packet.py     # Packet serialization
│   │   ├── config.py                 # Pydantic settings (validated)
│   │   ├── database.py               # SQLAlchemy engine + session
│   │   ├── deps.py                   # Dependency injection (auth guards)
│   │   ├── limiter.py                # slowapi rate limiter
│   │   └── main.py                   # FastAPI app + router registration
│   ├── alembic/                      # Database migrations
│   ├── keys/                         # RSA keypair (gitignored)
│   ├── tests/                        # pytest test suite
│   │   ├── conftest.py               # Test fixtures + DB setup
│   │   ├── test_auth.py
│   │   ├── test_wallet.py
│   │   ├── test_transactions.py
│   │   └── test_risk_engine.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── mobile/                           # 📱 Expo + React Native app
│   ├── App.js                        # Root — ThemeProvider + ErrorBoundary
│   ├── Navigation.js                 # Stack + Tab navigation (17 screens)
│   ├── src/
│   │   ├── screens/                  # 17 screens
│   │   │   ├── WelcomeScreen.js      # Onboarding splash
│   │   │   ├── AuthScreen.js         # OTP login + RSA keypair generation
│   │   │   ├── AppLockScreen.js      # PIN + biometric unlock
│   │   │   ├── HomeScreen.js         # Dashboard + quick actions
│   │   │   ├── SendScreen.js         # Multi-mode send flow
│   │   │   ├── ReceiveScreen.js      # Multi-mode receive (VU meter, brightness graph)
│   │   │   ├── TransactionsScreen.js # History + search + filters
│   │   │   ├── WalletScreen.js       # Fund / withdraw
│   │   │   ├── TokensScreen.js       # Offline token management
│   │   │   ├── BankScreen.js         # Bank account linking
│   │   │   ├── ProfileScreen.js      # Profile + KYC
│   │   │   ├── ModeControlScreen.js  # Transfer mode preferences
│   │   │   ├── SyncScreen.js         # Sync queue status
│   │   │   ├── AnalyticsScreen.js    # Transaction analytics
│   │   │   ├── NotificationsScreen.js
│   │   │   ├── SettingsScreen.js     # App settings + theme
│   │   │   └── ScanWebQRScreen.js    # Approve web login via QR
│   │   ├── services/                 # 8 service modules
│   │   │   ├── SoundService.js       # Ultrasonic FSK protocol
│   │   │   ├── LightService.js       # Li-Fi Manchester protocol
│   │   │   ├── BLEService.js         # Bluetooth LE GATT
│   │   │   ├── NFCService.js         # NFC NDEF read/write
│   │   │   ├── OfflineOutboxService.js # AsyncStorage queue + NetInfo
│   │   │   ├── PushNotificationService.js # Expo + FCM
│   │   │   ├── BiometricAuthService.js   # Face ID / fingerprint
│   │   │   └── i18n.js              # Internationalization (EN, HI, TE)
│   │   ├── components/              # 12 reusable UI components
│   │   ├── context/                 # ThemeContext (dark/light mode)
│   │   └── api/                     # API client (axios + auto-refresh)
│   ├── app.json                     # Expo config (permissions, plugins)
│   └── package.json
│
├── myapp/                           # 🌐 Web Dashboard (Vite + React)
│   ├── src/
│   │   ├── pages/                   # 18 pages
│   │   │   ├── LandingPage.jsx      # 3D hero + environment simulator + FAQ
│   │   │   ├── AuthPage.jsx         # OTP login
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── OverviewPage.jsx     # Main dashboard
│   │   │   ├── SendPage.jsx
│   │   │   ├── ReceivePage.jsx
│   │   │   ├── WalletPage.jsx
│   │   │   ├── TokensPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── BankPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── ModeControlPage.jsx
│   │   │   ├── SyncPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── PinSetupPage.jsx
│   │   ├── components/              # Shared components
│   │   ├── context/                 # ThemeContext
│   │   ├── api/                     # API client
│   │   ├── hooks/                   # Custom hooks
│   │   ├── layout/                  # App layout
│   │   ├── styles/                  # Global styles
│   │   ├── theme/                   # Theme tokens
│   │   ├── utils/                   # Utility functions
│   │   └── App.jsx                  # Root component + routing
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml               # PostgreSQL + Redis + Backend
├── train_risk_model.py              # ML model training script
├── pytest.ini                       # Test configuration
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| **Python** | 3.12+ |
| **Node.js** | 18+ |
| **PostgreSQL** | 16+ |
| **Redis** | 7+ (optional, has in-memory fallback) |
| **Docker** | 24+ (optional, for containerized setup) |

---

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/ruthwikreddy07/AURA.git
cd AURA/backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# ✏️ Edit .env with your actual values (DATABASE_URL, REDIS_URL, JWT_SECRET)

# Generate RSA keys for token signing
python generate_keys.py

# Run database migrations
python -m alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

### 2. Mobile App Setup

```bash
cd AURA/mobile

# Install dependencies
npm install

# Create environment file
echo "API_URL=http://<YOUR_LOCAL_IP>:8000" > .env

# Start Expo dev server
npx expo start

# Run on Android device/emulator
npx expo run:android

# Run on iOS simulator (macOS only)
npx expo run:ios
```

> **Note:** For BLE and NFC testing, you need a physical device with a [development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go does not support native modules like `react-native-ble-plx` and `react-native-nfc-manager`.

---

### 3. Web Dashboard Setup

```bash
cd AURA/myapp

# Install dependencies
npm install

# Start development server
npm run dev
```

The web dashboard will be available at `http://localhost:5173`.

---

### 4. Docker (One-Command Full Stack)

```bash
cd AURA

# Start PostgreSQL + Redis + Backend
docker-compose up --build -d

# The backend API will be available at http://localhost:8000
# PostgreSQL at localhost:5432
# Redis at localhost:6379
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ─── AURA Backend Environment Configuration ───

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/aura_db

# Redis connection string (has in-memory fallback if unavailable)
REDIS_URL=redis://localhost:6379/0

# JWT secret (must be at least 32 characters)
JWT_SECRET=change-me-to-a-secure-random-string-at-least-32-chars

# JWT algorithm (RS256 recommended for production)
JWT_ALGORITHM=RS256

# RSA key paths for token signing/verification
TOKEN_PRIVATE_KEY_PATH=./keys/private.pem
TOKEN_PUBLIC_KEY_PATH=./keys/public.pem

# Debug mode (True for development, False for production)
DEBUG=True
```

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account for SMS OTP |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Sender phone number |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email service for transaction receipts |

---

## 📚 API Reference

All routes are prefixed with `/api/v1/`. Interactive Swagger docs available at `/docs`.

| Module | Prefix | Auth | Description |
|--------|--------|------|-------------|
| **Auth** | `/auth` | Public + Rate Limited | OTP request/verify, JWT issue/refresh, PIN recovery |
| **Wallet** | `/wallet` | 🔒 User | Fund, withdraw, get balance |
| **Tokens** | `/tokens` | 🔒 User | Issue, list, revoke offline tokens |
| **Transactions** | `/transactions` | 🔒 User | Create transaction, search/filter history |
| **Sync** | `/sync` | 🔒 User | Submit offline queue, reconcile conflicts |
| **Bank** | `/bank` | 🔒 User | Link/remove bank accounts, set primary |
| **Payments** | `/payments` | 🔒 User | Payment gateway orders + verification |
| **Contacts** | `/contacts` | 🔒 User | CRUD + search + favorite toggle |
| **KYC** | `/kyc` | 🔒 User | Submit documents, check verification status |
| **Disputes** | `/disputes` | 🔒 User | File dispute, view status |
| **Notifications** | `/notifications` | 🔒 User | Register FCM token, notification history |
| **Payment Session** | `/payment-session` | 🔒 User | Create/join ephemeral key exchange |
| **Payment Packet** | `/payment-packet` | 🔒 User | Encrypt/decrypt payment packets |
| **Mode** | `/mode` | 🔒 User | Get/set transfer mode preferences |
| **Analytics** | `/analytics` | 🔒 User | Transaction volume, mode distribution |
| **Risk** | `/risk` | 🔒 User | Risk score history |
| **Alerts** | `/alerts` | 🔒 User | System alerts |
| **Simulation** | `/simulation` | 🔒 User | Offline payment simulation |
| **Admin** | `/admin` | 🔒 Admin | User management, system stats, token expiry |
| **Health** | `/health` | Public | Liveness check |

---

## 🗄️ Database Schema

AURA uses **16 SQLAlchemy models** managed via Alembic migrations:

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Phone, email, full name, RSA public key, PIN hash, KYC status, FCM token |
| `Wallet` | `wallets` | User wallet balance (1:1 with User) |
| `Token` | `tokens` | RSA-PSS signed offline payment tokens with hash, nonce, expiry |
| `Transaction` | `transactions` | Sender, receiver, token, mode, risk score, SHA-256 hash |
| `SyncQueue` | `sync_queue` | Offline transactions pending settlement |
| `BankAccount` | `bank_accounts` | Linked bank accounts with primary flag |
| `PaymentSession` | `payment_sessions` | Ephemeral session keys for secure packet exchange |
| `QRSession` | `qr_sessions` | Web-to-mobile QR login sessions |
| `RiskLog` | `risk_logs` | Per-transaction ML risk scores and decisions |
| `ActivityLog` | `activity_logs` | User activity audit trail |
| `Alert` | `alerts` | System alerts for users |
| `UserModePreferences` | `user_mode_preferences` | Preferred transfer modes per user |
| `Contact` | `contacts` | Contact book with favorites |
| `Device` | `devices` | Multi-device tracking (key rotation) |
| `KYCDocument` | `kyc_documents` | Identity verification documents |
| `Dispute` | `disputes` | Transaction disputes and chargebacks |

---

## 🖼️ Screenshots & Demo

### Landing Page

The web landing page features:
- 🎨 **Animated mesh gradient background** with 5 floating color blobs
- 🌀 **3D torus knot** rendered with Three.js + `@react-three/fiber`
- ⭐ **Particle constellation** star field
- 🖱️ **Mouse-tracking glow** effect
- 📊 **Interactive environment simulator** — toggle sensors, adjust noise/light levels, watch AI channel selection update in real-time
- 📱 **GSAP scroll-triggered** device-to-device demo animation
- 💬 **Animated FAQ accordion** with Framer Motion

### Mobile App

The mobile app features:
- 🌑 Premium dark theme with **glassmorphism** cards
- 🔵 Animated **VU meter** during ultrasonic transfers
- 📈 **Brightness graph** during Li-Fi transfers
- 🤝 **Handshake indicator** for BLE/NFC connections
- 🔒 **App Lock screen** with PIN + biometric
- 🔔 **Real-time push notifications** on payment receipt

---

## 🧪 Testing

### Backend Tests (pytest)

```bash
cd AURA/backend

# Run all tests
python -m pytest tests/ -v

# Run specific test files
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_wallet.py -v
python -m pytest tests/test_transactions.py -v
python -m pytest tests/test_risk_engine.py -v
```

### Mobile Tests (Jest)

```bash
cd AURA/mobile

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

| Test Suite | Tests | Coverage |
|-----------|-------|----------|
| `test_auth.py` | OTP flow, JWT generation | Auth module |
| `test_wallet.py` | Fund/withdraw/balance | Wallet service |
| `test_transactions.py` | Create, double-spend, risk | Transaction engine |
| `test_risk_engine.py` | ONNX inference, heuristic fallback | Risk engine |
| `SoundService.test.js` | FSK encode/decode, CRC | Sound protocol |
| `OfflineOutboxService.test.js` | Queue/drain/retry | Offline sync |

---

## 🗺️ Roadmap

### ✅ Completed

- [x] 5 transport modes (QR, BLE, NFC, Sound, Light)
- [x] RSA-2048 device keypairs + RSA-PSS token signing
- [x] AES-256-GCM encrypted payment packets
- [x] RS256 JWT with refresh tokens
- [x] ML risk engine (ONNX)
- [x] Push notifications (FCM)
- [x] Email receipts for large transactions
- [x] Contact book with favorites
- [x] Transaction search & filters
- [x] Redis OTP caching
- [x] Docker Compose deployment
- [x] Biometric auth (Face ID / fingerprint)
- [x] KYC verification (simulated)
- [x] Dispute resolution system
- [x] Multi-device support
- [x] i18n (English, Hindi, Telugu)
- [x] Accessibility (screen reader support)
- [x] Rate limiting on auth endpoints
- [x] Audit logging middleware
- [x] Daily/monthly transaction limits (₹2L / ₹10L)

### 🔮 Future

- [ ] Real payment gateway production integration (Razorpay/UPI live)
- [ ] E2E test suite (Detox for mobile, Playwright for web)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] App Store / Play Store submission
- [ ] Real KYC provider integration (Aadhaar/PAN API)
- [ ] WebSocket real-time transaction updates
- [ ] Multi-currency support
- [ ] Merchant POS integration
- [ ] Transaction analytics ML insights

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **Backend:** PEP 8 + type hints
- **Mobile/Web:** ESLint + Prettier
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/ruthwikreddy07">Ruthwik Reddy</a></strong>
</p>

<p align="center">
  <sub>If you found this project interesting, please consider giving it a ⭐</sub>
</p>
