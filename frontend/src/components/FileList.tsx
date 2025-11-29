'use client';

import { useState } from 'react';
import {
  FileIcon,
  Download,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  History,
  MoreVertical,
} from 'lucide-react';
import { filesAPI } from '@/lib/api';
import { formatBytes, formatDate, truncateHash } from '@/lib/utils';
import toast from 'react-hot-toast';

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

interface FileListProps {
  files: FileItem[];
  onFileDeleted?: (fileId: number) => void;
  onFileVerified?: (fileId: number, isValid: boolean) => void;
}

export default function FileList({ files, onFileDeleted, onFileVerified }: FileListProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = async (file: FileItem) => {
    setDownloading(file.id);
    try {
      const response = await filesAPI.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully!');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Download failed';
      toast.error(message);
    } finally {
      setDownloading(null);
    }
  };

  const handleVerify = async (file: FileItem) => {
    setVerifying(file.id);
    try {
      const result = await filesAPI.verify(file.id);
      if (result.is_valid) {
        toast.success('File integrity verified!');
      } else {
        toast.error('File integrity check failed!');
      }
      onFileVerified?.(file.id, result.is_valid);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Verification failed';
      toast.error(message);
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      return;
    }
    try {
      await filesAPI.delete(file.id);
      toast.success('File deleted successfully!');
      onFileDeleted?.(file.id);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Delete failed';
      toast.error(message);
    }
    setActionMenuOpen(null);
  };

  if (files.length === 0) {
    return (
      <div className="card text-center py-12">
        <FileIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No files uploaded yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Upload your first file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SHA-256 Hash
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        Downloads: {file.download_count}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatBytes(file.file_size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {truncateHash(file.sha256_hash)}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {file.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3" />
                      Corrupted
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleVerify(file)}
                      disabled={verifying === file.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Verify Integrity"
                    >
                      {verifying === file.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloading === file.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      {downloading === file.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
