# Redis Clone in TypeScript

## Overview

This repository contains my implementation of the ["Build Your Own Redis" Challenge](https://codecrafters.io/challenges/redis). The project, written in TypeScript, replicates essential Redis features such as event loops, the RESP protocol, and commands like `PING`, `SET`, and `GET`.

---

## Completed Stages

### Core Features

- **Basic Commands**: Implemented `PING`, `SET`, `GET`, and `ECHO` commands.
- **Client Management**: Supported multi-client connections.
- **Key Expiry**: Added functionality for key expiration.

### Transactions

- **Transactional Commands**: Implemented `INCR`, `MULTI`, `EXEC`, and `DISCARD`.
- **Queue Management**: Supported command queuing and execution.
- **Error Handling**: Managed transaction errors effectively.

---

## Getting Started

### Prerequisites

Ensure the following is installed:

- [Bun](https://bun.sh/) (v1.1 or later)

### Running the Server

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Start the server:
   ```sh
   ./your_program.sh
   ```

The server logic resides in `app/main.ts`, and the code can be extended to include additional Redis commands.
