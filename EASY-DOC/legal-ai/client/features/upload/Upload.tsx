"use client";

import { useState, ChangeEvent } from 'react';
import { uploadDocument } from './uploadService';

interface UploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function Upload({ onUploadComplete }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);

    try {
      const data = await uploadDocument(file);
      onUploadComplete?.(data);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
