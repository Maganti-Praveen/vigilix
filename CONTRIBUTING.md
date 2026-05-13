# Contributing to Vigilix

Thank you for your interest in contributing to Vigilix! 🎉

## Development Setup

### Prerequisites
- Node.js 18+
- Android Studio with SDK 36
- Physical Android device (WebRTC requires real hardware)
- Git

### Getting Started

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/vigilix.git
cd vigilix

# 2. Install dependencies
cd server && npm install && cd ..
cd mobile && npm install && cd ..

# 3. Start development
cd server && npm run dev          # Terminal 1
cd mobile && npx expo run:android # Terminal 2
```

### Project Overview

| Directory | What | Language |
|-----------|------|----------|
| `server/` | Socket.IO signaling server | JavaScript |
| `mobile/` | React Native Expo app | TypeScript |
| `shared/` | Shared constants | JavaScript |

## How to Contribute

### Reporting Bugs
- Use GitHub Issues
- Include device model, Android version, and logs
- Steps to reproduce

### Suggesting Features
- Open a GitHub Discussion or Issue
- Describe the use case and expected behavior

### Pull Requests
1. Fork the repo and create a branch from `main`
2. Write clean, typed code (TypeScript for mobile)
3. Test on a real Android device
4. Run `npx tsc --noEmit` to verify no type errors
5. Keep PRs focused — one feature/fix per PR

## Code Style

- TypeScript strict mode for mobile code
- Functional components with hooks
- Use the design system tokens (`src/design/tokens.ts`) for all styling
- Use `useTheme()` for theme-aware colors — never hardcode colors
- Meaningful variable names, no abbreviations
- JSDoc comments on exported functions

## Areas Open for Contribution

- 🎯 Motion detection (on-device ML)
- 📹 Local video recording
- 🔔 Push notifications
- 📱 iOS support
- 🧪 Unit and integration tests
- 📖 Documentation improvements
- 🌐 i18n / localization
- ♿ Accessibility improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
