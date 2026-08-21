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
    <div className="p-8 space-y-8 max-w-7xl mx-auto selection:bg-blue-600 selection:text-white">
      <div>
        <h1 className="text-2xl font-extrabold font-display text-white flex items-center gap-3">
          <Cpu className="w-7 h-7 text-purple-400" /> WavLM Neural Network Architecture & Specifications
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep learning feature extraction metrics, EER benchmark accuracy, and calibrated risk scaling parameterization
        </p>
      </div>

      {/* Model Spec Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-lg font-bold text-white font-mono break-all">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Model Benchmark Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 glass-card space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" /> WavLM Model Performance Benchmarks
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-955 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Equal Error Rate (EER)</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-display mt-1 font-mono">0.84%</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-955 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC Score</span>
            <div className="text-2xl font-extrabold text-blue-400 font-display mt-1 font-mono">0.994</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-955 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Temperature Calibration</span>
            <div className="text-2xl font-extrabold text-amber-400 font-display mt-1 font-mono">T = 3.4215</div>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-2">Evaluated Neural Vocoder Attack Vectors:</span>
          <div className="flex flex-wrap gap-2">
            {['HiFi-GAN', 'WaveGlow', 'RVC-v2', 'ElevenLabs Turbo', 'Tortoise-TTS', 'Tacotron2', 'VALL-E', 'Bark-TTS'].map((voc) => (
              <span key={voc} className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold">
                {voc}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
