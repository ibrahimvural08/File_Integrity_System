'use client';

import { useEffect, useState, useCallback } from 'react';
import { filesAPI } from '@/lib/api';
import FileList from '@/components/FileList';
import { RefreshCw } from 'lucide-react';

interface FileItem {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string | null;
  sha256_hash: string;
  is_verified: boolean;
  upload_count: number;
  download_count: number;
  created_at: string;
  last_verified_at: string | null;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await filesAPI.list();
      setFiles(data.files);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileDeleted = (fileId: number) => {
    setFiles(files.filter((f) => f.id !== fileId));
    setTotal((prev) => prev - 1);
  };

  const handleFileVerified = (fileId: number, isValid: boolean) => {
    setFiles(
      files.map((f) =>
        f.id === fileId ? { ...f, is_verified: isValid } : f
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
          <p className="text-gray-600 mt-2">
            {total} {total === 1 ? 'file' : 'files'} uploaded
          </p>
        </div>
        <button
          onClick={loadFiles}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <FileList
        files={files}
        onFileDeleted={handleFileDeleted}
        onFileVerified={handleFileVerified}
      />
    </div>
  );
}
