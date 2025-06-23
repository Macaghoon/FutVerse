import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";
import Loader from "./components/Loader";
import ManageTeam from "./pages/ManageTeam";
import TeamsList from "./pages/TeamsList";
import TeamProfile from "./pages/TeamProfile";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import TeamRegistration from "./pages/TeamRegistration";
import ChallengeTeam from "./pages/ChallengeTeam";
import ChatPage from "./pages/Chat";
import { GlobalStateProvider } from "./context/GlobalState";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <GlobalStateProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register-team" element={<TeamRegistration />} />
          <Route path="/manage-team" element={<ManageTeam />} />
          <Route path="/teams" element={<TeamsList />} />
          <Route path="/team/:teamId" element={<TeamProfile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/challenge-team" element={<ChallengeTeam />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;