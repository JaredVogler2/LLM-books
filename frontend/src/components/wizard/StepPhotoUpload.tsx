'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWizardStore } from '@/lib/store';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepPhotoUpload({ onNext, onBack }: Props) {
  const { referenceImage, setReferenceImage } = useWizardStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setReferenceImage(acceptedFiles[0]);
      }
    },
    [setReferenceImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
  });

  return (
    <div className="card space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Upload a Reference Photo
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Upload a clear photo of the child so we can create a character that looks like them.
          This step is optional but recommended for the best results.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : referenceImage
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        {referenceImage ? (
          <div>
            <div className="mx-auto w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
              <img
                src={URL.createObjectURL(referenceImage)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-medium text-green-700">{referenceImage.name}</p>
            <p className="text-xs text-gray-500 mt-1">Click or drag to replace</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop the photo here' : 'Drag and drop a photo, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <div className="flex gap-3">
          <button onClick={onNext} className="btn-secondary">
            Skip This Step
          </button>
          <button
            onClick={onNext}
            disabled={!referenceImage}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Book Options
          </button>
        </div>
      </div>
    </div>
  );
}
