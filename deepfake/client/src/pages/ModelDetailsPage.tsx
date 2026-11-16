import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Cpu, CheckCircle, Zap, Shield, Layers, Server, Database, Activity, Code } from 'lucide-react';

export const ModelDetailsPage: React.FC = () => {
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    fetchModelDetails();
  }, []);

  const fetchModelDetails = async () => {
    try {
      const res = await apiClient.get('/model/details');
      if (res.data?.model) setModel(res.data.model);
    } catch (err) {
      console.warn('[ModelDetails Error]:', err);
    }
  };

  const specs = [
    { label: 'Model Name', value: 'DavidCombei/wavLM-base-Deepfake_V2', icon: Cpu, color: 'text-purple-400' },
    { label: 'Architecture', value: 'WavLM Transformer', icon: Layers, color: 'text-blue-400' },
    { label: 'Framework', value: 'PyTorch', icon: Code, color: 'text-orange-400' },
    { label: 'Inference', value: 'FastAPI', icon: Zap, color: 'text-emerald-400' },
    { label: 'Backend', value: 'Node.js', icon: Server, color: 'text-cyan-400' },
    { label: 'Database', value: 'MySQL', icon: Database, color: 'text-indigo-400' },
    { label: 'Calibration', value: 'Temperature Scaling (3.4215)', icon: Activity, color: 'text-amber-400' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#014BAA] selection:text-white">
      <div className="border-b border-[#014BAA]/10 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#E6F0FF] text-[#014BAA] border border-[#014BAA]/20 uppercase tracking-wider">
            Deep Learning Core
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] flex items-center gap-3">
          <Cpu className="w-7 h-7 text-[#014BAA]" /> WavLM Neural Network Architecture & Specifications
        </h1>
        <p className="text-xs sm:text-sm text-[#282B4A]/70 mt-1">
          Deep learning feature extraction metrics, EER benchmark accuracy, and calibrated risk scaling parameterization
        </p>
      </div>

      {/* Model Spec Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-6 rounded-2xl bg-white border border-[#014BAA]/15 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#014BAA] uppercase tracking-wider">{item.label}</span>
                <div className="p-2 rounded-xl bg-[#E6F0FF]">
                  <Icon className="w-5 h-5 text-[#014BAA]" />
                </div>
              </div>
              <p className="text-base font-bold text-[#282B4A] font-mono break-all">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Model Benchmark Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#014BAA]/15 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#014BAA] flex items-center gap-2 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-[#014BAA]" /> WavLM Model Performance Benchmarks
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-[#F8F3F0] border border-[#014BAA]/15">
            <span className="text-[10px] text-[#282B4A]/70 uppercase font-bold tracking-wider">Equal Error Rate (EER)</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-display mt-1 font-mono">0.84%</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F3F0] border border-[#014BAA]/15">
            <span className="text-[10px] text-[#282B4A]/70 uppercase font-bold tracking-wider">ROC-AUC Score</span>
            <div className="text-2xl font-extrabold text-[#014BAA] font-display mt-1 font-mono">0.994</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F3F0] border border-[#014BAA]/15">
            <span className="text-[10px] text-[#282B4A]/70 uppercase font-bold tracking-wider">Temperature Calibration</span>
            <div className="text-2xl font-extrabold text-[#014BAA] font-display mt-1 font-mono">T = 3.4215</div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-[#014BAA] block mb-2 uppercase tracking-wider">Evaluated Neural Vocoder Attack Vectors:</span>
          <div className="flex flex-wrap gap-2">
            {['HiFi-GAN', 'WaveGlow', 'RVC-v2', 'ElevenLabs Turbo', 'Tortoise-TTS', 'Tacotron2', 'VALL-E', 'Bark-TTS'].map((voc) => (
              <span key={voc} className="px-3 py-1 rounded-lg bg-[#E6F0FF] border border-[#014BAA]/20 text-[#014BAA] text-xs font-mono font-bold">
                {voc}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
