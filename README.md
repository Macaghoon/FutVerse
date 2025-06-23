# ⚽ Football Club Platform (FutVerse)

A modern web platform for football clubs, players, and managers to connect, manage teams, share posts, and communicate. Built with **React**, **Chakra UI**, and **Firebase**.

---

## 🚀 Features

- **User Authentication** (Firebase Auth)
- **Profile Management**: Player & Manager profiles, experience badges, profile photo upload
- **Team Management**: Create, join, and manage teams, team profiles, member roles
- **Posts**: Share images and captions, view and delete your posts
- **Recruitment**: Managers can recruit players, players can receive and respond to requests
- **Chat**: Direct messaging between users
- **Notifications**: Recruitment, team, and chat notifications
- **Responsive UI**: Beautiful, mobile-friendly design with Chakra UI

---

## 📺 Demo Video

[![Watch the demo](https://img.youtube.com/vi/1y9hSW3HcD0Z0whinP9ZaU6zR9iRXcGe0/0.jpg)](https://drive.google.com/file/d/1y9hSW3HcD0Z0whinP9ZaU6zR9iRXcGe0/view?usp=sharing)

> [Click here to watch the full demo video on Google Drive.](https://drive.google.com/file/d/1y9hSW3HcD0Z0whinP9ZaU6zR9iRXcGe0/view?usp=sharing)

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Chakra UI
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Other**: React Router, React Icons

---

## 📸 Screenshots

### App UI

**Landing Page**  
![Landing Page](screenshots/landing-page.png)

**Teams List**  
![Teams List](screenshots/teams-list.png)

---

### Firebase Setup

**Firebase Authentication**  
![Firebase Auth](screenshots/firebase-auth.png)

**Firebase Storage**  
![Firebase Storage](screenshots/firebase-storage.png)

**Firestore Database**  
![Firestore Database](screenshots/firestore-db.png)

---

## 📦 Getting Started

### 1. **Clone the repository**

```bash
git clone https://github.com/your-username/football-club-platform.git
cd football-club-platform
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Firebase Setup**

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable **Authentication** (Email/Password)
- Create a **Firestore** database
- Enable **Storage**
- Copy your Firebase config and replace the contents of `src/firebaseConfig.ts`:

```ts
// src/firebaseConfig.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
export default firebaseConfig;
```

- Set your Firestore and Storage rules for development (see `SETUP_IMAGE_UPLOAD.md` and `NOTIFICATION_SYSTEM.md` for details).

### 4. **Run the app**

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
src/
  components/      # Reusable UI components (NavBar, Loader, etc.)
  context/         # Global state management
  hooks/           # Custom React hooks
  pages/           # Main app pages (Profile, UserProfile, TeamProfile, etc.)
  utils/           # Firestore, Storage, and helper utilities
  assets/          # Images and static assets
  firebaseConfig.ts# Firebase config
```

---

## 📝 Usage

- Register as a player or manager
- Create or join a team
- Update your profile and upload a profile picture
- Share posts and images
- Chat with other users
- Manage team members and recruitment

---

## 🤝 Contributing

1. Fork this repo
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🐞 Issues & Support

- Found a bug? Have a feature request? [Open an issue](https://github.com/your-username/football-club-platform/issues)
- For questions, contact [your-email@example.com]

---

## 📄 License

MIT License

---

**Enjoy building your football community!**
