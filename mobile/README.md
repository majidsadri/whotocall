# Reachr Mobile App

React Native mobile app for Reachr - Smart Contact Management.

> **Full documentation**: See [../README.md](../README.md) for complete setup guide, API reference, and deployment instructions.

## Quick Start

### Prerequisites

- Node.js 20+ (required for React Native 0.83)
- Xcode 15+ with iOS Simulator
- CocoaPods

### Install

```bash
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

### Run on iOS Simulator

```bash
# Terminal 1: Start Metro (requires Node 20+)
export PATH="/opt/homebrew/Cellar/node@20/20.19.2/bin:$PATH"
node ./node_modules/react-native/cli.js start

# Terminal 2: Build and run
npx react-native run-ios --simulator="iPhone 16 Pro"
```

### Simulator Controls

- **Reload**: `Cmd+R`
- **Dev Menu**: `Cmd+D`
- **Debugger**: `Cmd+Shift+D`

## Project Structure

```
src/
├── components/       # UI components
│   └── businessCard/ # Digital card components
├── screens/          # App screens (Add, Find, Me)
├── hooks/            # Custom hooks (audio, image, location)
├── services/         # API client
├── navigation/       # Tab navigator + deep linking
├── context/          # Auth context
├── lib/              # Supabase config
├── styles/           # Colors and common styles
└── types/            # TypeScript interfaces
```

## Common Issues

**"configs.toReversed is not a function"**: Use Node 20+
```bash
export PATH="/opt/homebrew/Cellar/node@20/20.19.2/bin:$PATH"
```

**"No script URL provided"**: Metro bundler not running. Start it first.

**Clean rebuild**:
```bash
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd ..
npx react-native start --reset-cache
```
