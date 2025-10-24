import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { QrPayload, EventType } from '../types';
import attendanceService from '../services/attendanceService';
import { ArrowLeftIcon, ClockIcon, QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const QR_EXPIRATION_SECONDS = 120; // 2 minutes

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

interface SessionCardProps {
  session: QrPayload | null;
  timeLeft: number;
  eventType: EventType;
  onGenerate: (eventType: EventType) => void;
  colors: {
    bg: string;
    hoverBg: string;
    text: string;
    timerBg: string;
    timerText: string;
  };
}

const SessionCard: React.FC<SessionCardProps> = ({ session, timeLeft, eventType, onGenerate, colors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full">
      {session ? (
        <>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Scan for Attendance: {eventType}</h2>
          <p className="text-slate-500 mb-4">Students can scan this QR code to mark their attendance.</p>
          
          <div className="relative inline-block p-4 bg-slate-50 rounded-lg">
            <QRCode
              value={JSON.stringify(session)}
              size={220}
              level={'H'}
              includeMargin={true}
              className="rounded-lg"
            />
          </div>

          <div className={`mt-6 flex items-center justify-center space-x-2 font-mono px-4 py-2 rounded-full text-lg ${timeLeft > 20 ? `${colors.timerBg} ${colors.timerText}` : 'bg-red-100 text-red-800'}`}>
            <ClockIcon className="h-6 w-6" />
            <span>Expires in: {formatTime(timeLeft)}</span>
          </div>
           <button
              onClick={() => onGenerate(eventType)}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-300 font-semibold py-2 px-4 rounded-lg"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Regenerate QR</span>
            </button>
        </>
      ) : (
        <>
          <QrCodeIcon className={`h-16 w-16 ${eventType === EventType.Entry ? 'text-brand-secondary' : 'text-red-500'} mx-auto mb-4`} />
          <h2 className="text-xl font-semibold text-slate-800">{eventType} Session</h2>
          <p className="text-slate-500 mt-2 mb-6">Generate a unique, time-sensitive QR code for students to scan.</p>
          <div className="space-y-4">
            <button
              onClick={() => onGenerate(eventType)}
              className={`w-full ${colors.bg} ${colors.text} ${colors.hoverBg} transition-colors duration-300 font-semibold py-3 px-6 rounded-lg`}
            >
              Start {eventType} Session
            </button>
          </div>
        </>
      )}
    </div>
  );
};


const AdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [entrySession, setEntrySession] = useState<QrPayload | null>(null);
  const [exitSession, setExitSession] = useState<QrPayload | null>(null);
  const [entryTimeLeft, setEntryTimeLeft] = useState(0);
  const [exitTimeLeft, setExitTimeLeft] = useState(0);

  const generateSession = useCallback(async (eventType: EventType) => {
    const payload = await attendanceService.createSession(eventType, QR_EXPIRATION_SECONDS);
    if (eventType === EventType.Entry) {
      setEntrySession(payload);
      setEntryTimeLeft(QR_EXPIRATION_SECONDS);
    } else {
      setExitSession(payload);
      setExitTimeLeft(QR_EXPIRATION_SECONDS);
    }
  }, []);

  // Timer for Entry session
  useEffect(() => {
    if (!entrySession) return;
    const timer = setInterval(() => {
      setEntryTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setEntrySession(null);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [entrySession]);

  // Timer for Exit session
  useEffect(() => {
    if (!exitSession) return;
    const timer = setInterval(() => {
      setExitTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setExitSession(null);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exitSession]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4">
      <header className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-slate-700" />
        </button>
        <h1 className="text-2xl font-bold text-brand-primary">Admin Dashboard</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start py-4">
        <div className="w-full max-w-md space-y-8">
            <SessionCard
                session={entrySession}
                timeLeft={entryTimeLeft}
                eventType={EventType.Entry}
                onGenerate={generateSession}
                colors={{
                    bg: 'bg-brand-primary',
                    hoverBg: 'hover:bg-brand-dark',
                    text: 'text-white',
                    timerBg: 'bg-green-100',
                    timerText: 'text-green-800'
                }}
            />
            <SessionCard
                session={exitSession}
                timeLeft={exitTimeLeft}
                eventType={EventType.Exit}
                onGenerate={generateSession}
                colors={{
                    bg: 'bg-red-600',
                    hoverBg: 'hover:bg-red-700',
                    text: 'text-white',
                    timerBg: 'bg-green-100',
                    timerText: 'text-green-800'
                }}
            />
        </div>
      </main>
    </div>
  );
};

export default AdminView;