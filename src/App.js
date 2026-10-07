

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Welcome from "./pages/Welcome";
// import Courses from "./pages/Courses";
// import CourseDetails from "./pages/CourseDetails";
// import Login from "./pages/Login";
// import TeacherDashboard from "./pages/TeacherDashboard";
// import StudentDashboard from "./pages/StudentDashboard";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Welcome />} />
//         <Route path="/courses" element={<Courses />} />
//         <Route path="/course/:id" element={<CourseDetails />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
//         <Route path="/student-dashboard" element={<StudentDashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import PrivateRoute from "./components/PrivateRoute";
import UpcomingLive from "./pages/UpcomingLive";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/upcoming-live" element={<UpcomingLive />} />
        <Route path="/upcoming-batches" element={<UpcomingLive />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - শুধু লগইন করা ইউজার যেতে পারবে */}
        <Route path="/teacher-dashboard" element={
          <PrivateRoute allowedRoles={["TEACHER"]}>
            <TeacherDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/student-dashboard" element={
          <PrivateRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/admin/teachers" element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            {/* Your Admin component */}
            <div>Admin Dashboard</div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;