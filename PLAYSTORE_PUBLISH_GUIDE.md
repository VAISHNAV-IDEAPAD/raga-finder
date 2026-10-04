# 🎵 Raga Finder — Google Play Store Publishing Guide

This guide details everything you need to build and publish **Raga Finder** to the **Google Play Store**.

---

## 📦 What Was Generated

| Component | Path / Configuration | Purpose |
| :--- | :--- | :--- |
| **Native Android Project** | `android/` | Full Gradle Android project with native AndroidManifest, launcher icons, splash screen, and Gradle build scripts. |
| **App ID / Package Name** | `com.ragafinder.app` | Unique identifier on Google Play Store. |
| **Target SDK** | **Android 15 (API 35)** (min SDK 23) | Fully compliant with Google Play's 2024–2026 target API level requirements. |
| **Release Keystore** | `android/raga-finder-release.keystore` | Cryptographic signing key with **10,000 days validity** (until October 2051). |
| **Web App Manifest** | `public/manifest.json` | PWA manifest with standalone display, theme color (`#d97706`), categories, and shortcuts. |
| **App Icons** | `public/icon-512.png`, `public/icon-192.png`, `android/app/src/main/res/mipmap-*/` | High-res 512×512 icon for Play Store listing + adaptive launcher icons for all Android densities. |
| **Automated Cloud Build** | `.github/workflows/build-android.yml` | GitHub Actions workflow to build and sign both `.apk` and `.aab` in 3 minutes without local Android Studio. |

---

## 🔑 Keystore Credentials

Your production keystore is saved at `android/raga-finder-release.keystore`.  
Keep these credentials safe (Google Play Store requires all future app updates to be signed with this exact key):

* **Keystore File**: `android/raga-finder-release.keystore`
* **Keystore Password**: `ragafinder2026`
* **Key Alias**: `ragafinder`
* **Key Password**: `ragafinder2026`
* **Validity**: 10,000 days (until October 2051)

---

## 🚀 How to Build the APK & Play Store Bundle (AAB)

> [!NOTE]
> **Google Play Store Policy:** Google Play requires an **Android App Bundle (`.aab`)** for all new app releases in the Play Console. The `.apk` file is used for direct sideloading and testing on your personal phone.

### Method 1: Automated 1-Click Cloud Build via GitHub Actions (Recommended)

Since your project is already connected to GitHub (`origin https://github.com/VAISHNAV-IDEAPAD/raga-finder.git`), you can build the release APK and AAB with zero setup:

1. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat(android): Add native Android project, keystore, and GitHub Actions build workflow"
   git push origin main
   ```
2. Open your repository on GitHub: `https://github.com/VAISHNAV-IDEAPAD/raga-finder`
3. Click on the **Actions** tab.
4. Select **Build Android APK & Play Store AAB** on the left sidebar and click **Run workflow**.
5. When the build completes (~3 minutes), scroll down to the **Artifacts** section:
   * **`raga-finder-release-apk`**: Download this to get the `.apk` file to install directly on your Android phone.
   * **`raga-finder-playstore-aab`**: Download this to get the `.aab` file to upload directly to the Google Play Console!

---

### Method 2: Local Build via Android Studio

If you prefer building locally on your machine:

1. Download and open [Android Studio](https://developer.android.com/studio).
2. Click **Open** and select the folder:
   ```
   C:\Users\Tilak\.gemini\antigravity\scratch\raga-finder\android
   ```
3. Let Gradle sync automatically.
4. To build the **Google Play Store Bundle (`.aab`)**:
   * In the top menu, go to **Build > Generate Signed Bundle / APK...**
   * Select **Android App Bundle** and click **Next**.
   * Key store path: browse to `raga-finder-release.keystore` inside the `android/` directory.
   * Passwords: enter `ragafinder2026` for both keystore and key password. Alias: `ragafinder`.
   * Destination: choose where to save your `.aab` file.
   * Build Variant: choose **release**.
   * Click **Create**.
5. To build the **Test APK (`.apk`)**:
   * Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   * Android Studio will compile `app-debug.apk` or `app-release.apk` in `android/app/build/outputs/apk/`.

---

## 🌐 Live Server Connection (Connecting AI & API Routes)

If your app uses server-side AI identification (`/api/identify-raga`) and real-time audio streams, point Capacitor to your live deployment URL:

1. Open `capacitor.config.ts`.
2. Set your live Vercel URL under `server.url`:
   ```ts
   server: {
     androidScheme: 'https',
     url: 'https://your-raga-finder.vercel.app', // Replace with your live Vercel URL
     cleartext: true,
   }
   ```
3. Run `npx cap sync android`.
4. Now, the Android app will load your live web application inside the native Android frame, with 100% working AI engines, database queries, and instant updates!

---

## 📝 Google Play Console Submission Checklist

When uploading to [Google Play Console](https://play.google.com/console):

1. **Create App**:
   * App name: `Raga Finder - Carnatic & Hindustani Musicology`
   * Default language: `English (United States)` or `English (India)`
   * App or game: `App`
   * Free or paid: `Free`
2. **Set up Store Listing**:
   * **Short description** (up to 80 chars):  
     *Identify Carnatic & Hindustani ragas, search 3,200+ songs, & stream 90 raga stations.*
   * **Full description**:  
     *Highlight the 72 Melakarta system, 908 ragas, swara keyboard finder, SOS musician rescue mode, and 90 live classical/film raga radio stations.*
   * **App icon**: Upload `public/icon-512.png` (512×512 PNG, 32-bit color).
   * **Feature graphic**: 1024×500 PNG.
   * **Screenshots**: At least 2 phone screenshots (take screenshots of Raga Finder's homepage, Raga Radio, and Melakarta charts).
3. **App Content & Policy Declarations**:
   * **Privacy Policy URL**: Link to your hosted privacy policy (required by Google Play).
   * **Target Audience**: `13+` or `Everyone`.
   * **Content Rating questionnaire**: Complete the short questionnaire (Entertainment / Music / Education category — usually results in `PEGI 3` / `Everyone`).
   * **Data Safety**: Declare that no sensitive personal data is sold to third parties.
4. **Production Release**:
   * Go to **Production > Releases > Create new release**.
   * Upload your **`app-release.aab`** file.
   * Release notes: *Initial release of Raga Finder — Indian Classical & Cinema Raga Explorer.*
   * Review and rollout to production!
