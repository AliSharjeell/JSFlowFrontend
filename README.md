# JS Flow - Procom Hackathon Frontend

This is the frontend mobile application for the JS Flow project, built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev/). It serves as the user interface for the banking and agent-based services.

## 🚀 Technological Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 52)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Networking**: [Axios](https://axios-http.com/) for API requests
- **UI Components**: React Native core components + Expo libraries
- **Audio/Speech**: `expo-av`, `expo-speech`

## 📂 Project Structure

```
js-flow-expo/
├── app/                 # Expo Router screens and layouts
│   ├── (tabs)/          # Main tab-based navigation
│   └── _layout.tsx      # Root layout configuration
├── assets/              # Images, fonts, and static assets
├── components/          # Reusable UI components
├── constants/           # App-wide constants (colors, layout)
├── hooks/               # Custom React hooks
├── services/            # API service layers (Backend integration)
├── scripts/             # Utility scripts
└── ...config files
```

## 🔌 Services & API Integration

The application relies on three main service modules located in the `services/` directory to communicate with various backend microservices.

### 1. Agent Service (`services/api.ts`)

Handles communication with the AI Agent backend.

- **Base URL**: `https://ltgnx8hv-8001.inc1.devtunnels.ms/`
- **Key Features**:
  - `AgentService.chat(message, threadId)`: Sends user messages to the AI agent and retrieves responses.
  - Timeout configured to 60000ms to handle AI processing time.

### 2. Banking Service (`services/bankingApi.ts`)

Manages all financial transactions and account data.

- **Base URL**: `https://ltgnx8hv-8000.inc1.devtunnels.ms/api/v1`
- **Key Features**:
  - **Authentication**: Usage of `ngrok-skip-browser-warning` header for dev tunnels.
  - **Accounts**: `getBalance()`
  - **Contacts**: `getContacts()`, `createContact()`
  - **Transfers**: `previewTransfer()`, `executeTransfer()` (Secure PIN-based transfers)
  - **Transactions**: `getTransactions()` with filtering (category, date range)
  - **Bill Pay**: `getBillers()`, `payBill()`
  - **Cards**: `getCards()`, `createVirtualCard()`, `cardAction()` (Freeze/Unfreeze), `updateCardLimit()`
  - **Analytics**: `getSpendingAnalytics()` for financial insights.

### 3. TTS Service (`services/backend_tts.ts`)

Interface for the Text-to-Speech generation backend.

- **Base URL**: `https://ltgnx8hv-8002.inc1.devtunnels.ms/`
- **Key Features**:
  - `getTTSUrl(text, voice)`: Generates a direct streamable URL for the synthesized audio, compatible with `expo-av`.
  - Default Voice: `en-US-ChristopherNeural`

## 🛠️ Setup & Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the App**

   ```bash
   npx expo start
   ```

3. **Run on Device/Emulator**
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Scan the QR code with Expo Go on a physical device

## 📝 Configuration

To point to different backend environments (e.g., local vs production), update the `BASE_URL` or `API_URL` constants in the respective files inside the `services/` folder.
