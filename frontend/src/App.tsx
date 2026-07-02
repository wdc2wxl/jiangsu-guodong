import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import CoolingSpotList from './pages/projects/CoolingSpotList';
import ServicePointList from './pages/projects/ServicePointList';
import ParkingList from './pages/projects/ParkingList';
import MuseumList from './pages/projects/MuseumList';
import AlarmList from './pages/projects/AlarmList';
import AuditProcess from './pages/audit/AuditProcess';
import AuditTasks from './pages/audit/AuditTasks';
import AuditRecords from './pages/audit/AuditRecords';
import ReservationList from './pages/booking/ReservationList';
import RentalList from './pages/booking/RentalList';
import BookingRules from './pages/booking/BookingRules';
import UserAccess from './pages/stats/UserAccess';
import ResourceQuery from './pages/stats/ResourceQuery';
import ReservationStats from './pages/stats/ReservationStats';
import RentalStats from './pages/stats/RentalStats';
import UtilizationStats from './pages/stats/UtilizationStats';
import ReportList from './pages/stats/ReportList';
import UserList from './pages/system/UserList';
import ParamList from './pages/system/ParamList';
import LogList from './pages/system/LogList';
import AnnouncementList from './pages/system/AnnouncementList';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* 数据管理 */}
        <Route path="projects" element={<ProjectList />} />
        <Route path="cooling" element={<CoolingSpotList />} />
        <Route path="services" element={<ServicePointList />} />
        <Route path="parking" element={<ParkingList />} />
        <Route path="museums" element={<MuseumList />} />
        <Route path="alarms" element={<AlarmList />} />
        {/* 数据审核 */}
        <Route path="audit/process" element={<AuditProcess />} />
        <Route path="audit/tasks" element={<AuditTasks />} />
        <Route path="audit/records" element={<AuditRecords />} />
        {/* 预约租赁 */}
        <Route path="booking/reservations" element={<ReservationList />} />
        <Route path="booking/rentals" element={<RentalList />} />
        <Route path="booking/rules" element={<BookingRules />} />
        {/* 统计分析 */}
        <Route path="stats/user-access" element={<UserAccess />} />
        <Route path="stats/resource-query" element={<ResourceQuery />} />
        <Route path="stats/reservation" element={<ReservationStats />} />
        <Route path="stats/rental" element={<RentalStats />} />
        <Route path="stats/utilization" element={<UtilizationStats />} />
        <Route path="stats/reports" element={<ReportList />} />
        {/* 系统管理 */}
        <Route path="system/users" element={<UserList />} />
        <Route path="system/params" element={<ParamList />} />
        <Route path="system/logs" element={<LogList />} />
        <Route path="system/announcements" element={<AnnouncementList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
