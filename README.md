# 🍕 HungryBeggar

**HungryBeggar** is a community-driven office food squad app built with **React Native (Expo)** and **Supabase**. It streamlines office lunch ordering by allowing team members to vote on meals, track group orders, and manage payment histories.

---

## ✨ Features

* 🔐 **Secure Authentication**: Email-based signup and login with mandatory email verification to ensure only office members join.
* 🗳️ **Real-time Polls**: Create and participate in food polls. Includes advanced logic for withdrawing votes, re-voting, and a "View Votes" list to see who voted for what.
* 💬 **Interactive Chat**: Real-time messaging with support for threaded replies, emoji reactions, and admin-only database clearing tools.
* 💸 **Debt Management**: Track "Pending" and "Settled" status for orders. Users can see their history, and 'Runners' can settle debts with a single tap.
* 🏃 **Runner Assignment**: A global status bar identifies the "Savior" (Runner) for the day and tracks order progress.
* 🔑 **Password Recovery**: Secure password reset flow using custom deep-links that redirect users directly back into the app.

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18+)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* A [Supabase](https://supabase.com/) project with configured tables for `messages`, `polls`, and `app_settings`.

### Installation & Local Build

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/HungryBegger.git
   cd HungryBegger

2. **Install dependencies:**
   ```bash
   npm install

3. **Configure Environment:** Ensure your `lib/supabase.ts` contains your specific Supabase URL and Anon Key.

4. **Build Android APK Locally:**
   ```bash
   npx expo prebuild
   cd android
   ./gradlew assembleRelease

### 📦 Build Output

Once the build process is complete, your generated APK will be located at:

`android/app/build/outputs/apk/release/app-release.apk`

## 🛠️ Tech Stack

* **Frontend**: React Native with Expo
* **Backend**: Supabase (PostgreSQL, Auth, and Realtime Listeners)
* **Storage**: AsyncStorage for persistent user sessions
* **Icons**: Ionicons

---

## 📱 URL Configuration

To enable email verification and password resets, the following deep linking scheme is configured:

* **Scheme**: `hungrybeggars://`
* **Password Reset Path**: `hungrybeggars://reset-password`

---

## 🤝 Contributing

Contributions make the office lunch experience better!

1. **Fork the Project.**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`).
4. **Push to the Branch** (`git push origin feature/AmazingFeature`).
5. **Open a Pull Request.**

## 📬 Contact

**Himangshu Roy** - [himangshuroy05@gmail.com](mailto:himangshuroy05@gmail.com)

**Project Link**: [https://github.com/your-username/HungryBegger](https://github.com/your-username/HungryBegger)

---

### 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
