# Secure File Encrypter (C++ Utility)

A professional-grade command-line utility for secure file encryption using a bitwise XOR cipher. Designed to ensure data privacy with built-in file shredding capabilities.

## Features
- **Symmetric Encryption:** Uses a custom XOR cipher to scramble file data.
- **Secure Shredding:** Automatically deletes the original source file after encryption, ensuring no unencrypted data remains on the disk.
- **Security Logging:** Generates a timestamped audit log of all file operations.
- **Password-Key Iteration:** Uses multi-character keys for robust data protection.

## Getting Started

### Prerequisites
- A C++ compiler (e.g., MinGW/GCC) installed on your system.

### How to Build
1. Open your terminal and navigate to the project folder:
   ```bash
   cd cpp_encryption