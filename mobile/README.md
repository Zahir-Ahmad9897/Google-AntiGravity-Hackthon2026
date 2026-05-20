# CIRO Mobile App

A React Native (Expo) mobile application for the Crisis Intelligence & Response Orchestrator (CIRO).

## Prerequisites
- Node.js 20+
- Expo CLI
- Android Studio (for emulator) or Xcode (for iOS Simulator)
- Python 3.10+ (for FastAPI backend)

## Setup
1. Open terminal in `d:\Antigravity_Hackthon\mobile\ciro_mobile`
2. Run `npm install` (dependencies are already installed during bootstrap)

## Running the App
- **Android Emulator**: `npx expo run:android` or start the emulator and run `npm start`, then press `a`.
- **iOS Simulator**: `npx expo run:ios` (Requires macOS)
- **Expo Go**: `npx expo start` and scan the QR code.

## Connecting to Backend
The app communicates with the CIRO FastAPI backend.
1. Start backend: `cd d:\Antigravity_Hackthon` -> `uvicorn main:app --port 8000`
2. Open the mobile app.
3. If on Android emulator, the default URL `http://10.0.2.2:8000` is used.
4. If running on a physical device, go to **Settings** in the app and change the URL to your computer's local IP (e.g., `http://192.168.1.10:8000`).

## Folder Structure
- `src/config/`: Theme and App Configurations.
- `src/services/`: API Service (Axios calls to FastAPI).
- `src/store/`: Zustand state management for scenarios and pipeline.
- `src/screens/`: React Navigation screen components.
- `src/components/`: Reusable UI widgets and custom animated components.
- `src/navigation/`: AppNavigator and ResultsTabs configurations.

## Assumptions
- Uses Google Fonts (Inter) via Expo.
- All actions are strictly simulated. No external mapping libraries (Google Maps) are used; the maps are drawn entirely in React Native SVG with Reanimated.
- Backend must be running for scenarios to load and pipeline to execute.
