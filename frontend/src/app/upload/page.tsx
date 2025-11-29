'use client';

import FileUpload from '@/components/FileUpload';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    // Optionally navigate to files page after upload
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload File</h1>
        <p className="text-gray-600 mt-2">
          Upload a file to generate its SHA-256 hash and ensure its integrity
        </p>
      </div>

      <FileUpload onUploadComplete={handleUploadComplete} />

      <div className="mt-8 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          How File Integrity Works
        </h3>
        <ul className="text-blue-700 text-sm space-y-2">
          <li>
            • When you upload a file, we generate a unique SHA-256 hash that
            represents its exact content
          </li>
          <li>
            • Each time you download the file, we recalculate the hash and
            compare it with the original
          </li>
          <li>
            • If the hashes match, the file is verified as authentic and
            unchanged
          </li>
          <li>
            • If they don&apos;t match, the system flags the file as corrupted or
            tampered
          </li>
        </ul>
      </div>
    </div>
  );
}
