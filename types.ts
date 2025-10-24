export enum Role {
  Admin = 'ADMIN',
  Student = 'STUDENT',
}

export enum EventType {
  Entry = 'ENTRY',
  Exit = 'EXIT',
}

// Represents the data encoded in the QR code, following the new secure structure.
export interface QrPayload {
  s: string; // sessionId
  e: number; // expiresAt timestamp in milliseconds
  t: string; // HMAC signature token
}

// Represents a session record on the "backend" for validation purposes.
export interface Session {
  id: string; // Corresponds to QrPayload.s
  eventType: EventType;
  token: string; // The "HMAC" signature to verify against QrPayload.t
  expiresAt: number; // Corresponds to QrPayload.e
  createdAt: number;
}


export interface AttendanceRecord {
  studentId: string;
  sessionId: string; // from QrPayload.s
  eventType: EventType; // from the validated Session
  deviceInfo: {
    deviceId: string;
    ipAddress: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface GeolocationState {
    loading: boolean;
    error: GeolocationPositionError | null;
    data: GeolocationCoordinates | null;
}