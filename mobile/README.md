# CIRO Field Officer App — Expo Run Guide

Expo React Native mobile app for the CIRO field-officer demo. This app uses Expo SDK 54, the existing CIRO backend when `EXPO_PUBLIC_CIRO_API_URL` is set, and local mock data when the backend is unavailable.

## 1. Install Dependencies

From `D:\Antigravity_Hackthon\mobile`:

```powershell
npm install
npx expo install react-dom react-native-web @expo/metro-runtime
```

Optional backend URL for LAN demos:

```powershell
$env:EXPO_PUBLIC_CIRO_API_URL="http://YOUR_LAPTOP_LAN_IP:8082"
```

## 2. Run on Web

```powershell
npm run web
```

Expo prints the local browser URL in the terminal, usually `http://localhost:8081` for SDK 54.

## 3. Run on Android with Expo Go Tunnel

```powershell
npm run start:tunnel
```

Scan the new QR code with Expo Go on Android. Do not reuse old `exp://` or `192.168.x.x` links from a previous Metro session.

## 4. Run on LAN

```powershell
npm run start:lan
```

Use this when the Android phone and laptop are on the same Wi-Fi network. Expo will print a fresh `exp://LOCAL-IP:PORT` URL and QR code.

## 5. Clear Metro Cache

```powershell
npm run start:clear
npm run web:clear
```

## 6. Troubleshooting

- Update Expo Go from the Play Store.
- Confirm the phone and laptop are on the same Wi-Fi network for LAN mode.
- Disable mobile data while testing LAN mode so the phone stays on Wi-Fi.
- Allow Node.js through Windows Firewall on private networks.
- Use tunnel mode if LAN fails due to firewall, VPN, or router client isolation.
- If tunnel mode reports an ngrok connection error, use LAN mode and check ngrok service/network access.
- Do not use old Expo links; restart Metro and scan the newest QR code.
- If web dependencies are missing, rerun `npx expo install react-dom react-native-web @expo/metro-runtime`.
- If Expo reports version mismatches, run `npx expo install --fix`.
- If Expo Go reports an SDK mismatch, update Expo Go and confirm this project is still on Expo SDK 54.

## 7. Demo Flow

1. Grant permission for contextual emergency signal analysis.
2. Select a crisis scenario.
3. Run the iterative CIRO pipeline.
4. View the decision trace.
5. Approve or reject a simulated action.
6. View artifacts and the final report.

## Useful Checks

```powershell
npx expo-doctor
npm run typecheck
```
