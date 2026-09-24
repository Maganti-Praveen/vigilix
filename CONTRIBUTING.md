# Contributing to Vigilix

Thank you for your interest in contributing to Vigilix.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Android Studio with Android SDK 34/35/36
- Physical Android device (WebRTC video streaming and Camera2 hardware require physical hardware)
- Git

### Getting Started

```bash
# 1. Clone repository
git clone https://github.com/Maganti-Praveen/vigilix.git
cd vigilix

# 2. Install dependencies
cd server && npm install && cd ..
cd mobile && npm install && cd ..

# 3. Start development
cd server && npm run dev          # Terminal 1: Signaling Server (default port: 3001)
cd mobile && npx expo run:android # Terminal 2: Mobile Dev Build
```

### Project Architecture

| Directory | Purpose | Primary Stack |
|-----------|---------|---------------|
| `server/` | WebRTC signaling, account authentication, device registry, FCM wake service | Node.js, Express, Socket.IO, MongoDB |
| `mobile/` | Cross-platform mobile surveillance application | React Native, Expo SDK 54, TypeScript, Native Kotlin |
| `shared/` | Shared event constants and protocol definitions | JavaScript |

## How to Contribute

### Reporting Issues
- Submit bug reports via GitHub Issues.
- Include device model, Android OS version, and logcat output where applicable.
- Provide step-by-step reproduction instructions.

### Proposing Enhancements
- Open a GitHub Issue or Discussion.
- Detail the specific use case, technical design, and expected behavior.

### Pull Request Guidelines
1. Fork the repository and create a feature branch from `main`.
2. Write clean, typed TypeScript for mobile components and documented JavaScript for server modules.
3. Validate changes on a physical Android device.
4. Run `npx tsc --noEmit` within `mobile/` to verify type safety.
5. Keep pull requests focused on a single feature, optimization, or bug fix.

## Code Standards

- Strict typing for all TypeScript modules.
- Functional React components with hooks and clean separation of concerns.
- Utilize design tokens (`src/design/tokens.ts`) for layout, spacing, and typography.
- Use `useTheme()` for theme-aware tokens.
- Explicit and descriptive naming conventions for variables and functions.
- JSDoc comments for exported services and API interfaces.

## Contribution Focus Areas

- Motion detection algorithms and on-device ML inference
- Encrypted local video and audio storage
- iOS client support and Safari WebRTC compatibility
- Unit, component, and end-to-end integration tests
- Documentation, architecture diagrams, and deployment guides
- Internationalization and accessibility compliance

## License

By contributing to Vigilix, you agree that your contributions are licensed under the MIT License.
