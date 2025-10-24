import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (data: string | null) => void;
  onError: (error: Html5QrcodeError) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        scannerContainerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        false 
      );

      const handleSuccess = (decodedText: string, result: Html5QrcodeResult) => {
        scanner.clear();
        onScan(decodedText);
      };

      const handleError = (errorMessage: string, error: Html5QrcodeError) => {
        // We can ignore certain errors if needed, but for now, pass all up.
        // if (errorMessage.includes('No QR code found')) return;
        onError(error);
      };

      scanner.render(handleSuccess, handleError);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("Failed to clear QR scanner", err);
        });
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={scannerContainerId} className="w-full"></div>;
};

export default QrScanner;