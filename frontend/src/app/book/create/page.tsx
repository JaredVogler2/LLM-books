'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { StepChildInfo } from '@/components/wizard/StepChildInfo';
import { StepBookOptions } from '@/components/wizard/StepBookOptions';
import { StepReview } from '@/components/wizard/StepReview';
import { StepPhotoUpload } from '@/components/wizard/StepPhotoUpload';
import { useWizardStore } from '@/lib/store';

const STEPS = [
  { label: 'Child Info', description: 'Tell us about the child' },
  { label: 'Photo', description: 'Upload a reference photo' },
  { label: 'Book Options', description: 'Customize your book' },
  { label: 'Review', description: 'Review and order' },
];

export default function CreateBookPage() {
  const { currentStep, setStep } = useWizardStore();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="font-display text-3xl font-bold text-gray-900 text-center">
            Create Your Book
          </h1>
          <p className="mt-2 text-center text-gray-600">
            {STEPS[currentStep].description}
          </p>

          <WizardProgress steps={STEPS} currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 0 && <StepChildInfo onNext={handleNext} />}
            {currentStep === 1 && <StepPhotoUpload onNext={handleNext} onBack={handleBack} />}
            {currentStep === 2 && <StepBookOptions onNext={handleNext} onBack={handleBack} />}
            {currentStep === 3 && <StepReview onBack={handleBack} />}
          </div>
        </div>
      </main>
    </>
  );
}
