import React, { useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { QrPayload } from '../types';
import useGeolocation from '../hooks/useGeolocation';
import attendanceService from '../services/attendanceService';
import QrScanner from './QrScanner';
import Spinner from './common/Spinner';

type Status = 'scanning' | 'submitting' | 'success' | 'error';

const StudentView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [status, setStatus] = useState<Status>('scanning');
  const [message, setMessage] = useState('');
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const { getLocation, error: geoError } = useGeolocation();

  // Get a persistent device ID from localStorage or create one
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = self.crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };
  
  const handleScan = async (data: string | null) => {
    if (!data || status === 'submitting') return;
    setStatus('submitting');
    setMessage('Verifying QR and capturing location...');

    try {
      const payload: QrPayload = JSON.parse(data);

      if (!payload.s || !payload.e || !payload.t) {
        throw new Error('Invalid QR code format.');
      }

      if (Date.now() > payload.e) {
        throw new Error('QR code has expired. Please ask for a new one.');
      }
      
      const coords = await getLocation();
      if (!coords) {
        throw new Error(geoError?.message || 'Could not get location. Please enable location services.');
      }

      const partialRecord = {
        studentId: 'student_' + getDeviceId().substring(0, 8), // Simulated student ID
        deviceInfo: {
          deviceId: getDeviceId(),
          // NOTE: Retrieving a user's real IP address from client-side JavaScript is not possible
          // for security and privacy reasons. We are simulating this with a placeholder.
          ipAddress: 'simulated-ip-address',
        },
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      };

      setMessage('Submitting attendance...');
      const result = await attendanceService.submitAttendance(payload, partialRecord);

      setStatus('success');
      setMessage(result.message);
      setServerTimestamp(result.serverTimestamp);

    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'An unknown error occurred.');
    }
  };

  const handleScanError = (error: any) => {
    // Avoid setting error if we are already submitting or have a result
    if (status === 'submitting' || status === 'success' || status === 'error') return;
    setStatus('error');
    setMessage(error?.message || 'Failed to start camera. Please check permissions.');
  };

  const reset = () => {
    setStatus('scanning');
    setMessage('');
    setServerTimestamp(null);
  };

  const FeedbackView = ({ status, message, timestamp }: { status: 'success' | 'error', message: string, timestamp: string | null }) => (
    <div className="text-center">
      {status === 'success' ? (
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
      ) : (
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
      )}
      <h2 className={`text-xl font-semibold ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
        {status === 'success' ? 'Success!' : 'Submission Failed'}
      </h2>
      <p className="text-slate-600 mt-2 mb-6">{message}</p>
      {status === 'success' && timestamp && (
        <div className="text-sm text-slate-500 bg-slate-100 rounded-md p-3 mb-6 font-mono">
          <p>Confirmed At: {new Date(timestamp).toLocaleString()}</p>
        </div>
      )}
      <button onClick={reset} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors duration-300 font-semibold py-3 px-6 rounded-lg">
        Scan Again
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4">
      <header className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-2xl font-bold text-brand-primary">Student Portal</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center">
         <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md min-h-[350px] flex flex-col justify-center">
          {status === 'scanning' ? (
             <QrScanner onScan={handleScan} onError={handleScanError} />
          ) : status === 'submitting' ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-slate-600">{message}</p>
            </div>
          ) : ( // success or error
            <FeedbackView status={status} message={message} timestamp={serverTimestamp} />
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentView;