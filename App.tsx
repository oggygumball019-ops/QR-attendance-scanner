
import React, { useState } from 'react';
import AdminView from './components/AdminView';
import StudentView from './components/StudentView';
import { Role } from './types';
import { UserGroupIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);

  const RoleSelector: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-primary tracking-tight">QR Attendance System</h1>
        <p className="text-slate-600 mt-2">Secure, real-time, mobile-first attendance tracking.</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold text-center text-slate-700">Select Your Role</h2>
        <button
          onClick={() => setRole(Role.Admin)}
          className="w-full bg-white border-2 border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white transition-all duration-300 font-semibold py-4 px-6 rounded-lg shadow-md flex items-center justify-center space-x-3"
        >
          <UserGroupIcon className="h-6 w-6" />
          <span>I am an Admin</span>
        </button>
        <button
          onClick={() => setRole(Role.Student)}
          className="w-full bg-brand-primary text-white hover:bg-brand-dark transition-all duration-300 font-semibold py-4 px-6 rounded-lg shadow-md flex items-center justify-center space-x-3"
        >
          <QrCodeIcon className="h-6 w-6" />
          <span>I am a Student</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (role) {
      case Role.Admin:
        return <AdminView onBack={() => setRole(null)} />;
      case Role.Student:
        return <StudentView onBack={() => setRole(null)} />;
      default:
        return <RoleSelector />;
    }
  };

  return (
    <main className="bg-slate-100 min-h-screen antialiased">
      {renderContent()}
    </main>
  );
};

export default App;
