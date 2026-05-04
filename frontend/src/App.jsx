import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import CafeDetails from "./pages/CafeDetails";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ManageCafes from "./pages/ManageCafes";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ChatWidget from "./components/ChatWidget";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-cafes"
          element={
            <ProtectedRoute>
              <ManageCafes />
            </ProtectedRoute>
          }
        />
        <Route path="/cafe/:id" element={<CafeDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
    </Router>
  );
}

export default App;

