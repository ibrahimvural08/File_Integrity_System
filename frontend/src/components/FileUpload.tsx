'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { filesAPI } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UploadedFile {
  id: number;
  filename: string;
  original_filename: string;
  sha256_hash: string;
  file_size: number;
  is_verified: boolean;
}

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadedFile(null);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedFile(null);
      setError(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await filesAPI.upload(file, setProgress);
      setUploadedFile(result);
      setFile(null);
      toast.success('File uploaded successfully!');
      onUploadComplete?.(result);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadedFile(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Upload File</h2>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or{' '}
          <label className="text-primary-600 cursor-pointer hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </p>
        <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
      </div>

      {/* Selected File */}
      {file && !uploadedFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1 hover:bg-gray-200 rounded"
            disabled={uploading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && !uploading && !uploadedFile && (
        <button onClick={handleUpload} className="btn-primary w-full mt-4">
          Upload File
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Success */}
      {uploadedFile && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <p className="font-medium text-green-800">File uploaded successfully!</p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Filename:</span>{' '}
              <span className="font-medium">{uploadedFile.original_filename}</span>
            </p>
            <p>
              <span className="text-gray-500">Size:</span>{' '}
              <span className="font-medium">{formatBytes(uploadedFile.file_size)}</span>
            </p>
            <p>
              <span className="text-gray-500">SHA-256:</span>{' '}
              <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                {uploadedFile.sha256_hash}
              </code>
            </p>
          </div>
          <button onClick={clearFile} className="btn-secondary mt-4">
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
