# XIRC: An Extended, Secure, Server-Side Chat Protocol

## Abstract

XIRC (eXtended Internet Relay Chat) is a modern server-side protocol designed to succeed the venerable Internet Relay Chat (IRC) system. Built in Rust for performance, memory safety, and concurrency, XIRC introduces advanced features such as end-to-end encryption for peer-to-peer (P2P) and room-based communication, a federated user account system, support for Markdown and inline image rendering (via S3-compatible storage), bot integration, and a sophisticated permissions framework inspired by Discord. This whitepaper details the server-side architecture, emphasizing its design principles, technical specifications, and operational mechanics.

## 1. Introduction

Since its inception in 1988, IRC has been a cornerstone of real-time text communication. However, its lack of native encryption, rudimentary user management, and absence of modern formatting or media capabilities have made it ripe for replacement. XIRC extends IRC’s lightweight, scalable foundation with contemporary enhancements, leveraging Rust’s strengths to deliver a secure, efficient, and extensible server-side solution.

This document focuses solely on the server-side protocol, leaving client implementation unspecified for flexibility. Key features include:

- End-to-end encryption for P2P messages and entire rooms.
- Federated user accounts tied to home servers (e.g., `@username@domain.com`).
- Support for multiple rooms per server.
- Markdown and inline image rendering with S3-compatible storage.
- Bot support and fine-grained permissions with role-based access control (RBAC).

## 2. Design Principles

XIRC is guided by the following principles:

- **Security**: Encryption is mandatory for all communications.
- **Scalability**: Servers manage multiple rooms and users efficiently using Rust’s async capabilities.
- **Extensibility**: Support for bots and modern formatting ensures adaptability.
- **Federation**: A decentralized model empowers users via home servers.
- **Usability**: Fine-grained permissions and rich text enhance the experience.

## 3. Server Architecture

### 3.1 Federated User Model

XIRC adopts a federated user system inspired by Matrix. Each user is tied to a "home server," identified by a domain, with usernames formatted as `@username@domain.com`. The home server authenticates the user and serves as the primary hub for identity verification and message routing.

- **Authentication**: Home servers use public/private key pairs for user identity. Users sign a challenge with their private key upon login, verified by the server using the public key.
- **Routing**: Messages between users on different servers are relayed via federation, with servers communicating over HTTPS using a RESTful API and encrypted payloads.

### 3.2 Room Management

An XIRC server can host multiple rooms, each identified by a unique ID (e.g., `!roomid@domain.com`). Rooms support:

- **Membership**: Users join via invitations or public discovery.
- **Persistence**: Room history is stored on the server, encrypted at rest with AES-256.
- **Federation**: Rooms can span multiple servers, with the hosting server coordinating state synchronization.

### 3.3 Encryption

XIRC enforces end-to-end encryption for all communications:

- **P2P Messages**: Encrypted using the Double Ratchet Algorithm (as in Signal) with X25519 for key exchange and AES-256-GCM for message encryption.
- **Room Messages**: Each room uses a shared symmetric key, distributed to members via encrypted P2P channels. The key rotates periodically (e.g., every 100 messages or 24 hours) for forward secrecy.
- **Server Communication**: Inter-server federation uses TLS 1.3 for transport security.

### 3.4 Message Formatting

XIRC supports:

- **Markdown**: Parsed server-side into a standardized AST (Abstract Syntax Tree) for consistent rendering. Features include bold, italic, code blocks, and links.
- **Inline Images**: Images are uploaded to an S3-compatible provider (e.g., AWS S3, MinIO). The server generates a presigned URL, embedding it in the message as a Markdown image (`![alt](url)`). Images are stored encrypted with a per-room key.

### 3.5 Bot Integration

Bots are first-class citizens in XIRC:

- **Registration**: Bots authenticate as users with a special flag (`@botname@domain.com`).
- **Commands**: Bots receive messages with a configurable trigger (e.g., `!command`) and can respond with text, Markdown, or images.
- **API Access**: Bots interact via a WebSocket API, receiving real-time events and sending responses.

### 3.6 Permissions System

Inspired by Discord, XIRC implements a role-based access control (RBAC) system with fine-grained permissions:

- **Roles**: Users in a room can be assigned multiple roles (e.g., "Admin," "Moderator").
- **Permissions**: Include "Send Messages," "Manage Room," "Kick Users," "Ban Users," "Pin Messages," etc.
- **Colors & Icons**: Roles support customizable colors (HEX codes) and icons (S3 URLs).
- **Hierarchy**: Permissions are evaluated hierarchically; higher roles override lower ones.

## 4. Technical Specifications

### 4.1 Protocol Overview

XIRC servers communicate internally and with other servers using:

- **WebSocket**: For real-time message delivery within a server.
- **HTTPS/REST**: For federation and S3 interactions.
- **JSON**: As the primary data format for messages and metadata.

### 4.2 Message Structure

A sample message payload:

```json
{
  "id": "msg_123456789",
  "sender": "@alice@example.com",
  "room": "!room123@example.com",
  "timestamp": "2025-03-29T12:00:00Z",
  "content": {
    "type": "text/markdown",
    "body": "Hello **world**! Here's an image: ![cat](https://s3.example.com/cat.jpg)",
    "encrypted": true,
    "ciphertext": "base64_encoded_encrypted_data"
  },
  "signature": "base64_encoded_signature"
}
```

### 4.3 Server Implementation

- **Language**: Rust, using `tokio` for async I/O and `ring` for cryptography.
- **Storage**: SQLite or PostgreSQL for room/user state; S3 for images.
- **Concurrency**: One `tokio` task per room, with a shared `RwLock` for global state.

### 4.4 Federation Workflow

1. User `@alice@example.com` sends a message to `!room123@chat.com`.
2. Her home server (`example.com`) encrypts the message and forwards it to the room’s host server (`chat.com`).
3. The host server decrypts the room key, verifies permissions, and broadcasts the message to all members’ home servers.

## 5. Security Considerations

- **Key Management**: Room keys are rotated and distributed securely; private keys remain on the user’s home server.
- **DDoS Mitigation**: Rate limiting and IP whitelisting for federation endpoints.
- **Data Integrity**: Messages are signed with Ed25519 to prevent tampering.

## 6. Future Work

- Client-side specifications for compatibility.
- Advanced bot features (e.g., slash commands).
- Support for voice/video channels.

## 7. Conclusion

XIRC reimagines IRC for the modern era, extending its legacy with a secure, federated, and feature-rich server-side protocol. Built in Rust, it combines performance with cutting-edge capabilities like encryption, Markdown, inline images, bots, and fine-grained permissions, offering a scalable foundation for decentralized communication.
