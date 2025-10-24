import { AttendanceRecord, EventType, QrPayload, Session } from '../types';

// In-memory store to simulate the database tables
const activeSessions = new Map<string, Session>();
const submittedRecords = new Set<string>();
const MOCK_HMAC_SECRET = 'super-secret-key-for-frontend-simulation';

// Helper function to calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coords2.latitude - coords1.latitude) * (Math.PI / 180);
  const dLon = (coords2.longitude - coords1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * (Math.PI / 180)) *
      Math.cos(coords2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simulate HMAC signing using the Web Crypto API for a more realistic token.
async function createHmacSignature(sessionId: string, expiresAt: number): Promise<string> {
  const data = `${sessionId}.${expiresAt}.${MOCK_HMAC_SECRET}`;
  if (crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      // Return a shortened hash as the token
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }
  // Fallback for older browsers or non-secure contexts
  return `sim-token-${Math.random().toString(36).substring(2, 10)}`;
}


const attendanceService = {
  // Called by Admin to create a session and get a QR payload
  createSession: async (eventType: EventType, expiresInSeconds: number): Promise<QrPayload> => {
    const now = Date.now();
    const newSession: Session = {
      id: self.crypto.randomUUID(),
      eventType,
      expiresAt: now + expiresInSeconds * 1000,
      createdAt: now,
      token: '', // Will be set after signing
    };

    newSession.token = await createHmacSignature(newSession.id, newSession.expiresAt);
    activeSessions.set(newSession.id, newSession);

    // Clean up expired sessions from memory
    setTimeout(() => {
      activeSessions.delete(newSession.id);
    }, expiresInSeconds * 1000 + 5000);

    return {
      s: newSession.id,
      e: newSession.expiresAt,
      t: newSession.token,
    };
  },

  // Called by Student to submit their attendance
  submitAttendance: (
    payload: QrPayload,
    partialRecord: Omit<AttendanceRecord, 'sessionId' | 'eventType'>
  ): Promise<{ success: boolean; message: string; serverTimestamp: string; }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // 1. Validate session existence
          const session = activeSessions.get(payload.s);
          if (!session) {
            throw new Error('Invalid or expired session. Please scan a new QR code.');
          }

          // 2. Verify HMAC signature/token
          if (session.token !== payload.t) {
            throw new Error('QR code signature is invalid. Possible tampering detected.');
          }

          // 3. Verify expiration (authoritative server-side check)
          if (Date.now() > session.expiresAt) {
            activeSessions.delete(payload.s); // Clean up expired session
            throw new Error('QR code has expired. Please ask for a new one.');
          }

          // 4. Prevent duplicate submissions
          const submissionKey = `${session.id}-${partialRecord.deviceInfo.deviceId}`;
          if (submittedRecords.has(submissionKey)) {
            throw new Error('Attendance has already been marked for this session on this device.');
          }

          // 5. Verify location proximity
          const campusLocation = { latitude: 34.0522, longitude: -118.2437 }; // Example: Los Angeles
          const distance = calculateDistance(partialRecord.location, campusLocation);
          if (distance > 5.0) { // 5km radius for demo
            throw new Error(`Location verification failed. You are too far from campus. (Distance: ${distance.toFixed(2)} km)`);
          }

          // All checks passed, create the full attendance record
          const fullRecord: AttendanceRecord = {
            ...partialRecord,
            sessionId: session.id,
            eventType: session.eventType,
          };
          
          submittedRecords.add(submissionKey);
          console.log('Attendance Submitted:', fullRecord);
          
          const serverTimestamp = new Date().toISOString();

          resolve({
            success: true,
            message: `Attendance for ${fullRecord.eventType} session marked successfully!`,
            serverTimestamp: serverTimestamp,
          });

        } catch (error: any) {
          reject(new Error(error.message || 'Failed to submit attendance.'));
        }
      }, 1500); // 1.5 second delay
    });
  },
};

export default attendanceService;