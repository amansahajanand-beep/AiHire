import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Brain, Network } from 'lucide-react';

const steps = [
  'Extracting resume information',
  'Understanding job requirements',
  'Matching skills and experience',
  'Calculating candidate scores',
  'Generating AI insights',
];

export default function AIAnalysisProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileCount = location.state?.fileCount || 3;

  const [currentStep, setCurrentStep] = useState(2);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(() => navigate('/candidates'), 1800);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);

    return () => clearInterval(stepInterval);
  }, [navigate]);

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900">AI is analyzing candidates...</h1>
        <p className="text-slate-500 mt-1">This may take a few moments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-10">
        {/* Vertical stepper */}
        <div className="relative pl-2">
          {steps.map((step, index) => {
            const isComplete = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={step} className="relative flex gap-4 pb-8 last:pb-0">
                {index < steps.length - 1 && (
                  <div className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-16px)] ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isComplete || isActive
                      ? isComplete
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'bg-white border-2 border-slate-200'
                  }`}
                >
                  {(isComplete || isActive) ? <Check className="w-4 h-4" strokeWidth={3} /> : null}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${
                    isComplete ? 'text-slate-800' : isActive ? 'text-indigo-700 font-semibold' : 'text-slate-400'
                  }`}>
                    {step}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI brain illustration */}
        <div className="flex justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full blur-2xl opacity-70" />
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-indigo-300/60 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center relative">
                <Brain className="w-16 h-16 text-white" />
                <Network className="w-5 h-5 text-indigo-200 absolute top-4 right-6 animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 p-3">
              <div className="h-1.5 bg-indigo-500 rounded-full mb-1.5 w-full" />
              <div className="h-1.5 bg-emerald-400 rounded-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Status alert */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Network className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Analysis in Progress</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Please don&apos;t close this window. We&apos;ll notify you once the analysis is complete.
            {fileCount ? ` Processing ${fileCount} resumes.` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
