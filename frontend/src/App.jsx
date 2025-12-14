import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router";
import AuthProvider from "./AuthContext/AuthProvider";
import {
  EditProfile,
  HomePage,
  Initiative,
  IssuePage,
  Login,
  Register,
  SchemePage,
} from "./pages/Pages";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/initiative" element={<Initiative />} />
          <Route path="/schemes" element={<SchemePage />} />
          <Route path="/issues" element={<IssuePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
