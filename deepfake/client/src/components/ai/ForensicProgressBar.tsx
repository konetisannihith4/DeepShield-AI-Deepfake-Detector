import React from 'react';
import {
  Film,
  Image as ImageIcon,
  FileAudio,
  CheckCircle2,
  Clock,
  Cpu,
  UploadCloud,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

export interface PipelineStep {
  id: number;
  label: string;
  desc: string;
}

export interface ForensicProgressBarProps {
  mediaType: 'video' | 'image' | 'audio';
  fileName?: string;
  fileSize?: number;
  uploadProgress: number; // 0 - 100
  analysisProgress: number; // 0 - 100
  elapsedSeconds: number; // live ticking seconds (e.g. 14.2)
  estimatedTotalSeconds?: number; // e.g. 28 for video
  activeStepIndex: number;
  steps: PipelineStep[];
  isComplete?: boolean;
}

export const ForensicProgressBar: React.FC<ForensicProgressBarProps> = ({
  mediaType,
  fileName,
  fileSize,
  uploadProgress,
  analysisProgress,
  elapsedSeconds,
  estimatedTotalSeconds = 28,
  activeStepIndex,
  steps,
  isComplete = false
}) => {
  const isUploading = uploadProgress < 100;

  // Format file size nicely
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Uploaded bytes calculation
  const uploadedBytes = fileSize
    ? Math.min(fileSize, Math.round((uploadProgress / 100) * fileSize))
    : 0;

  // Calculate estimated time remaining
  const remainingSeconds = Math.max(
    0,
    Math.round(estimatedTotalSeconds - elapsedSeconds)
  );

  // Overall combined progress percentage
  // Phase 1 (Upload): 0% to 15%
  // Phase 2 (Analysis): 15% to 100%
  const overallPercentage = isComplete
    ? 100
    : isUploading
    ? Math.round((uploadProgress / 100) * 15)
    : Math.min(99, Math.round(15 + (analysisProgress / 100) * 85));

  const activeStep = steps[activeStepIndex] || steps[0];

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'video':
        return <Film className="w-5 h-5 text-[#014BAA]" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-[#014BAA]" />;
      case 'audio':
      default:
        return <FileAudio className="w-5 h-5 text-[#014BAA]" />;
    }
  };

  const getEngineTitle = () => {
    switch (mediaType) {
      case 'video':
        return 'XceptionNet & EfficientNet-B7 Video Pipeline';
      case 'image':
        return 'ConvNeXt-V2 Vision Transformer Engine';
      case 'audio':
      default:
        return 'WavLM-Base Audio Acoustic Pipeline';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white border border-[#BFDAFE] p-5 sm:p-7 shadow-card-md space-y-5 animate-in fade-in duration-300">
      {/* Top Specimen & Engine Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6F0FF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F0FF] border border-[#BFDAFE] flex items-center justify-center shrink-0 shadow-xs">
            {getMediaIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#014BAA] bg-[#E6F0FF] px-2 py-0.5 rounded-full border border-[#BFDAFE]">
                {getEngineTitle()}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#282B4A] truncate max-w-md mt-0.5">
              {fileName || 'Specimen File'}
              {fileSize ? (
                <span className="text-[#5A5E7A] font-normal ml-1.5">
                  ({formatBytes(fileSize)})
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Live State Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </span>
          ) : isUploading ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
              <UploadCloud className="w-3.5 h-3.5 animate-bounce" /> Uploading Payload ({uploadProgress}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF1F5] text-[#014BAA] border border-[#F4B6CC]">
              <span className="w-2 h-2 rounded-full bg-[#014BAA] animate-ping" />
              <Activity className="w-3.5 h-3.5 text-[#014BAA]" /> Analyzing Specimen
            </span>
          )}
        </div>
      </div>

      {/* Primary Measurable Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Progress % */}
        <div className="p-3 rounded-2xl bg-[#E6F0FF]/60 border border-[#BFDAFE] text-left">
          <span className="text-[10px] font-bold text-[#5A5E7A] uppercase tracking-wider block">
            Analysis Progress
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-[#014BAA]">
              {overallPercentage}%
            </span>
            <span className="text-[10px] font-bold text-[#014BAA]">
              {isComplete ? 'Done' : isUploading ? 'Uploading' : 'Inferring'}
            </span>
          </div>
        </div>

        {/* Upload Measurement */}
        <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] text-left">
          <span className="text-[10px] font-bold text-[#5A5E7A] uppercase tracking-wider block">
            Payload Ingested
          </span>
          <div className="mt-0.5">
            <span className="text-sm font-black text-[#282B4A] block">
              {fileSize ? `${formatBytes(uploadedBytes)} / ${formatBytes(fileSize)}` : `${uploadProgress}% Ingested`}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              {uploadProgress >= 100 ? '✅ 100% Uploaded' : `${uploadProgress}% Transferring`}
            </span>
          </div>
        </div>

        {/* Elapsed Timer */}
        <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] text-left">
          <span className="text-[10px] font-bold text-[#5A5E7A] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#014BAA]" /> Elapsed Clock
          </span>
          <div className="mt-0.5">
            <span className="text-sm font-black text-[#282B4A] block font-mono">
              {elapsedSeconds.toFixed(1)}s
            </span>
            <span className="text-[10px] text-[#5A5E7A] font-semibold block">
              Live Neural Timer
            </span>
          </div>
        </div>

        {/* Estimated Remaining */}
        <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] text-left">
          <span className="text-[10px] font-bold text-[#5A5E7A] uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#014BAA]" /> Est. Time
          </span>
          <div className="mt-0.5">
            <span className="text-sm font-black text-[#014BAA] block">
              {isComplete
                ? 'Finalized'
                : remainingSeconds > 0
                ? `~${remainingSeconds}s left`
                : 'Calibrating...'}
            </span>
            <span className="text-[10px] text-[#5A5E7A] font-semibold block">
              Expected ~{estimatedTotalSeconds}s Total
            </span>
          </div>
        </div>
      </div>

      {/* Main Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#014BAA] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#014BAA]" />
            {isUploading ? 'Uploading specimen file to secure AI gateway...' : activeStep?.label}
          </span>
          <span className="font-extrabold text-[#014BAA] font-mono">
            {overallPercentage}%
          </span>
        </div>

        {/* The Bar */}
        <div className="relative w-full h-5 sm:h-6 bg-[#E6F0FF] rounded-full p-1 border border-[#BFDAFE] shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#014BAA] via-[#1D72ED] to-[#014BAA] transition-all duration-300 relative overflow-hidden flex items-center justify-end pr-2"
            style={{ width: `${Math.max(5, overallPercentage)}%` }}
          >
            {/* Shimmer Light Reflection Sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />

            {/* Glowing Accent Indicator */}
            <span className="w-2 h-2 rounded-full bg-white shadow-sm shrink-0" />
          </div>
        </div>

        {/* Live Sub-label Description */}
        <div className="flex items-center justify-between text-[11px] text-[#5A5E7A] px-1">
          <span className="truncate max-w-sm sm:max-w-md">
            {isUploading
              ? `Transferring binary streams (${uploadProgress}% completed)`
              : activeStep?.desc}
          </span>
          <span className="font-semibold text-[#014BAA] shrink-0 ml-2">
            Step {Math.min(steps.length, activeStepIndex + 1)} of {steps.length}
          </span>
        </div>
      </div>

      {/* Pipeline Milestone Steps Checklist */}
      <div className="pt-2 border-t border-[#E6F0FF] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#014BAA] flex items-center gap-1">
            <Layers className="w-3 h-3" /> Neural Execution Pipeline Milestones
          </span>
          <span className="text-[10px] text-[#5A5E7A]">
            {isComplete
              ? 'All milestones validated'
              : `${activeStepIndex} of ${steps.length} completed`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {steps.map((step, idx) => {
            const isStepDone = isComplete || idx < activeStepIndex;
            const isStepActive = !isComplete && idx === activeStepIndex;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  isStepDone
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : isStepActive
                    ? 'bg-[#E6F0FF] border-[#014BAA] text-[#014BAA] shadow-xs ring-1 ring-[#014BAA]/20'
                    : 'bg-[#F8F3F0]/60 border-[#E5D8D0] text-[#888DAA]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isStepDone
                      ? 'bg-emerald-600 text-white'
                      : isStepActive
                      ? 'bg-[#014BAA] text-white animate-pulse'
                      : 'bg-[#E5D8D0] text-[#5A5E7A]'
                  }`}
                >
                  {isStepDone ? '✓' : step.id}
                </span>

                <div className="truncate text-left min-w-0">
                  <span className="block truncate font-bold text-[11px]">
                    {step.label}
                  </span>
                  <span className="text-[10px] opacity-80 block truncate">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
