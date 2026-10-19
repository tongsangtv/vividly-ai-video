/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Video, 
  Play, 
  Pause, 
  Settings, 
  Share2, 
  Download, 
  Clock, 
  Layers, 
  Image as ImageIcon, 
  Type as TextIcon, 
  Music, 
  ChevronLeft, 
  ChevronRight,
  Wand2, 
  Trash2, 
  Sparkles, 
  Layout,
  AlertCircle,
  RefreshCw,
  Film,
  CheckCircle2,
  Copy,
  Sliders,
  Volume2,
  VolumeX,
  Smartphone,
  Tv
} from 'lucide-react';
import { generateVideoScript, refreshSceneContent } from './services/geminiService';
import { VideoProject, Scene } from './types';

export default function App() {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingScene, setIsRefreshingScene] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Playback timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && project && project.scenes.length > 0) {
      const current = project.scenes[activeSceneIndex];
      const durationMs = (current?.duration || 5) * 1000;

      timer = setTimeout(() => {
        if (activeSceneIndex < project.scenes.length - 1) {
          setActiveSceneIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setActiveSceneIndex(0);
        }
      }, durationMs);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeSceneIndex, project]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const result = await generateVideoScript(prompt, aspectRatio);
      const newProject: VideoProject = {
        id: Math.random().toString(36).substring(2, 11),
        title: result.title || 'Untitled Project',
        synopsis: result.synopsis || '',
        prompt,
        scenes: (result.scenes || []) as Scene[],
        aspectRatio,
        voiceoverEnabled: true,
        createdAt: Date.now(),
      };
      setProject(newProject);
      setActiveSceneIndex(0);
      setShowPromptInput(false);
    } catch (error: any) {
      console.error('Error generating script:', error);
      setErrorMsg(error?.message || 'Failed to generate video script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshCurrentScene = async () => {
    if (!project || !currentScene || isRefreshingScene) return;

    setIsRefreshingScene(true);
    try {
      const updated = await refreshSceneContent(
        project.title,
        currentScene.title,
        prompt || currentScene.description,
        currentScene.shotType
      );

      setProject((prev) => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[activeSceneIndex] = {
          ...newScenes[activeSceneIndex],
          ...updated,
        };
        return { ...prev, scenes: newScenes };
      });
    } catch (err: any) {
      console.error('Failed to refresh scene:', err);
      setErrorMsg('Failed to refresh scene. Please try again.');
    } finally {
      setIsRefreshingScene(false);
    }
  };

  const handleUpdateScript = (text: string) => {
    if (!project) return;
    setProject((prev) => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[activeSceneIndex] = {
        ...newScenes[activeSceneIndex],
        script: text,
      };
      return { ...prev, scenes: newScenes };
    });
  };

  const handleDeleteScene = (idxToDelete: number) => {
    if (!project || project.scenes.length <= 1) return;
    setProject((prev) => {
      if (!prev) return null;
      const newScenes = prev.scenes.filter((_, i) => i !== idxToDelete);
      return { ...prev, scenes: newScenes };
    });
    if (activeSceneIndex >= project.scenes.length - 1) {
      setActiveSceneIndex(Math.max(0, project.scenes.length - 2));
    }
  };

  const handleAddScene = () => {
    if (!project) return;
    const newIdx = project.scenes.length;
    const newScene: Scene = {
      id: `scene-${Date.now()}-${newIdx}`,
      title: `Scene ${newIdx + 1}: Climax`,
      description: 'Cinematic climax visual transition',
      script: 'As the journey reaches its peak, the vision unfolds into clarity.',
      duration: 5,
      visualPrompt: `Cinematic continuation shot for ${project.title}, atmospheric lighting, golden hour, 4k ultra realism`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(`new-scene-${newIdx}`)}/640/360`,
      mediaUrl: `https://picsum.photos/seed/${encodeURIComponent(`new-scene-${newIdx}`)}/1280/720`,
      mediaType: 'video',
      shotType: 'Dramatic Tracking Shot',
    };

    setProject((prev) => (prev ? { ...prev, scenes: [...prev.scenes, newScene] } : null));
    setActiveSceneIndex(newIdx);
  };

  const handleCopyFullScript = () => {
    if (!project) return;
    const fullText = project.scenes
      .map((s, i) => `Scene ${i + 1} (${s.title}):\n${s.script}\n[Visual: ${s.visualPrompt}]`)
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const currentScene = project?.scenes[activeSceneIndex];
  const totalDuration = project?.scenes.reduce((acc, s) => acc + (s.duration || 5), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/40 relative overflow-hidden flex flex-col">
      {/* Dynamic ambient gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
            <Video size={18} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white">VIVIDLY AI</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium truncate max-w-[200px] md:max-w-xs">
              {project ? project.title : 'New Project'}
            </span>
          </div>

          {project && (
            <button 
              onClick={() => {
                setShowPromptInput(true);
                setErrorMsg(null);
              }}
              className="ml-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 font-medium"
              title="New Project"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Script</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg items-center gap-2 shadow-inner">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-tight">
              GEMINI 3.8 FLASH: {isGenerating ? 'GENERATING...' : 'ONLINE'}
            </span>
          </div>

          {project && (
            <>
              <button 
                onClick={handleCopyFullScript}
                className="p-2 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-slate-300 hover:text-white flex items-center gap-1.5 text-xs"
                title="Copy full script"
              >
                {copiedScript ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span className="hidden md:inline">{copiedScript ? 'Copied' : 'Copy Script'}</span>
              </button>

              <button 
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Download size={14} />
                <span>EXPORT VIDEO</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 flex items-center justify-between text-xs text-red-200 backdrop-blur-md z-40">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white font-mono uppercase text-[10px] underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {showPromptInput ? (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col items-center justify-center px-6 py-10 overflow-y-auto"
            >
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                    <Sparkles size={13} />
                    <span>Powered by Gemini 3.8 Flash AI</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Transform ideas into cinematic video scripts.
                  </h2>
                  <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                    Describe your story, vision, or campaign. We will generate director-level storyboards, visual prompts, and voiceover scripts in seconds.
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="relative group text-left">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-blue-500/30 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                  <div className="relative flex flex-col gap-3 p-3 bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="e.g. A thrilling cinematic trailer about deep-sea explorers discovering a bioluminescent alien ecosystem beneath Europa's icy crust, 4k ultra-realistic, Hans Zimmer style mood..."
                      className="w-full bg-transparent p-4 min-h-[130px] focus:outline-none resize-none text-base placeholder:text-slate-500 text-white leading-relaxed"
                    />

                    {/* Controls row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Ratio:</span>
                        {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              aspectRatio === ratio
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {ratio === '16:9' && <Tv size={13} />}
                            {ratio === '9:16' && <Smartphone size={13} />}
                            {ratio === '1:1' && <Layout size={13} />}
                            {ratio}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        {project && (
                          <button
                            type="button"
                            onClick={() => setShowPromptInput(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isGenerating || !prompt.trim()}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Directing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={15} />
                              <span>Generate Script</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Inspiration chips */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 block">
                    Inspiration Prompts
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left">
                    {[
                      { title: 'Cyberpunk Metropolis', text: 'Neon-drenched cyberpunk thriller set in Neo-Tokyo in 2099' },
                      { title: 'Patagonia Wildlife', text: 'Stunning 4K documentary following pumas hunting across glacial peaks' },
                      { title: 'Mars First Colony', text: 'The emotional first sunrise of humanity arriving on a red Martian outpost' },
                      { title: 'Artisan Coffee Craft', text: 'Macro cinematic story of single-origin coffee beans roasted in Kyoto' }
                    ].map((item) => (
                      <button
                        key={item.title}
                        onClick={() => {
                          setPrompt(item.text);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all text-left group"
                      >
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex"
            >
              {/* Left Sidebar Tools */}
              <aside className="w-16 md:w-20 border-r border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col items-center py-6 gap-6 shrink-0">
                <button 
                  onClick={() => setShowPromptInput(true)}
                  className="flex flex-col items-center gap-1 group text-indigo-400"
                  title="Prompt AI"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30 shadow-sm transition-all group-hover:bg-indigo-500/25 group-hover:scale-105">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">AI Magic</span>
                </button>
                
                <button 
                  onClick={handleAddScene}
                  className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white"
                  title="Add Scene"
                >
                  <div className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all border border-transparent hover:border-white/10">
                    <Plus size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">Add</span>
                </button>

                <button 
                  onClick={handleCopyFullScript}
                  className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white"
                  title="Copy Script"
                >
                  <div className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all border border-transparent hover:border-white/10">
                    <TextIcon size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">Script</span>
                </button>

                <button 
                  onClick={() => setAudioMuted(!audioMuted)}
                  className={`flex flex-col items-center gap-1 group ${audioMuted ? 'text-slate-500' : 'text-cyan-400'}`}
                  title="Toggle Soundtrack"
                >
                  <div className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-all border border-transparent hover:border-white/10">
                    {audioMuted ? <VolumeX size={18} /> : <Music size={18} />}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{audioMuted ? 'Mute' : 'Audio'}</span>
                </button>

                <div className="mt-auto pb-2 flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    title="Export"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </aside>

              {/* Main Workspace Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Upper Zone: Storyboard column + Preview & Inspector */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Storyboard List */}
                  <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto bg-slate-950/40 backdrop-blur-sm shrink-0">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storyboard</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {project?.scenes.length} Scenes · {totalDuration}s Total
                        </div>
                      </div>
                      <button 
                        onClick={handleAddScene}
                        className="text-slate-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                        title="Add Scene"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="p-3 space-y-2.5">
                      {project?.scenes.map((scene, idx) => (
                        <button
                          key={scene.id}
                          onClick={() => setActiveSceneIndex(idx)}
                          className={`w-full p-3 rounded-xl transition-all text-left border ${
                            activeSceneIndex === idx 
                              ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                              : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-slate-900 border border-white/10">
                            <img 
                              src={scene.thumbnailUrl} 
                              alt={scene.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono backdrop-blur-md border border-white/10 text-white">
                              {scene.duration}s
                            </div>
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-indigo-300">
                              #{idx + 1}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`text-xs font-bold truncate ${activeSceneIndex === idx ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {scene.title}
                            </h3>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                              {scene.shotType?.split(' ')[0] || 'Shot'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {scene.script}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scene Preview & Workspace */}
                  <div className="flex-1 flex flex-col bg-slate-950/20 overflow-y-auto">
                    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                      {/* Video Player Display */}
                      <div className="relative aspect-video w-full group overflow-hidden rounded-2xl shadow-2xl bg-black border border-white/15">
                        {currentScene && (
                          <img 
                            src={currentScene.mediaUrl || currentScene.thumbnailUrl} 
                            alt="Scene Preview"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 text-white flex items-center gap-1.5">
                            <Film size={12} className="text-indigo-400" />
                            Scene {activeSceneIndex + 1} of {project?.scenes.length}
                          </span>
                          <span className="bg-indigo-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono border border-indigo-500/30 text-indigo-300">
                            {currentScene?.shotType || 'Cinematic Shot'}
                          </span>
                        </div>

                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-mono border border-white/10 text-slate-300">
                          {project?.aspectRatio} · 1080p · {currentScene?.duration}s
                        </div>

                        {/* Narration subtitle overlay during preview */}
                        {currentScene?.script && (
                          <div className="absolute bottom-20 left-6 right-6 text-center pointer-events-none">
                            <span className="inline-block bg-black/75 backdrop-blur-md text-white text-xs md:text-sm font-medium px-4 py-2 rounded-xl border border-white/10 shadow-lg max-w-2xl leading-relaxed">
                              "{currentScene.script}"
                            </span>
                          </div>
                        )}

                        {/* Player Controls Bar */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/20 shadow-2xl">
                          <button 
                            onClick={() => setActiveSceneIndex((prev) => Math.max(0, prev - 1))}
                            disabled={activeSceneIndex === 0}
                            className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                            title="Previous Scene"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          
                          <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/40"
                            title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                          >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
                          </button>

                          <button 
                            onClick={() => setActiveSceneIndex((prev) => Math.min((project?.scenes.length || 1) - 1, prev + 1))}
                            disabled={!project || activeSceneIndex >= project.scenes.length - 1}
                            className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                            title="Next Scene"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Scene Inspector & Editor */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                                {currentScene?.title}
                              </h2>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                              <span className="flex items-center gap-1"><Clock size={13} /> {currentScene?.duration} seconds</span>
                              <span>·</span>
                              <span className="text-indigo-400 flex items-center gap-1">
                                <Sparkles size={13} /> AI Scripted
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleRefreshCurrentScene}
                              disabled={isRefreshingScene}
                              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                              title="Regenerate this scene with Gemini"
                            >
                              <RefreshCw size={14} className={isRefreshingScene ? 'animate-spin' : ''} />
                              <span className="hidden sm:inline">Regenerate</span>
                            </button>

                            <button 
                              onClick={() => handleDeleteScene(activeSceneIndex)}
                              disabled={!project || project.scenes.length <= 1}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 disabled:opacity-30 disabled:hover:bg-red-500/10"
                              title="Delete Scene"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Editor Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Script Editor */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                              <span>Narration Script</span>
                              <span className="text-[10px] text-slate-500 lowercase">Editable</span>
                            </label>
                            <textarea 
                              value={currentScene?.script || ''}
                              onChange={(e) => handleUpdateScript(e.target.value)}
                              rows={5}
                              className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:border-indigo-500/60 focus:outline-none transition-all resize-none leading-relaxed"
                              placeholder="Voiceover narration for this scene..."
                            />
                            <p className="text-[11px] text-slate-500">
                              Estimated speech duration: ~{Math.ceil((currentScene?.script || '').split(' ').length / 2.5)} seconds.
                            </p>
                          </div>

                          {/* Visual Prompt Spec */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                              <span>AI Visual Directive</span>
                              <span className="text-[10px] text-indigo-400 font-mono">Generation Ready</span>
                            </label>
                            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-indigo-200/90 leading-relaxed min-h-[125px] flex flex-col justify-between">
                              <p className="italic">
                                {currentScene?.visualPrompt || 'No visual prompt specified.'}
                              </p>
                              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                                <span>Shot: {currentScene?.shotType || 'Cinematic'}</span>
                                <button 
                                  onClick={handleRefreshCurrentScene}
                                  disabled={isRefreshingScene}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1"
                                >
                                  <Sparkles size={11} /> Remix Visual
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Strip */}
                    <div className="mt-auto border-t border-white/10 bg-slate-950/90 backdrop-blur-xl flex flex-col">
                      <div className="h-9 border-b border-white/5 flex items-center px-6 justify-between text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-400 font-bold">TIMELINE</span>
                          <span>Active Scene: {activeSceneIndex + 1} / {project?.scenes.length}</span>
                        </div>
                        <span>Duration: {totalDuration}s</span>
                      </div>

                      <div className="p-4 space-y-2">
                        {/* Video Sequence Track */}
                        <div className="flex gap-2 items-center">
                          <div className="w-20 md:w-28 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                            Visuals
                          </div>
                          <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                            {project?.scenes.map((scene, idx) => (
                              <button 
                                key={scene.id}
                                onClick={() => setActiveSceneIndex(idx)}
                                style={{ flexGrow: scene.duration }}
                                className={`h-11 min-w-[90px] rounded-lg border px-3 flex items-center justify-between transition-all shrink-0 relative overflow-hidden group ${
                                  activeSceneIndex === idx 
                                    ? 'bg-indigo-600/30 border-indigo-400 shadow-md shadow-indigo-600/20' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <span className="text-xs font-semibold truncate text-slate-200">
                                  {scene.title}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 ml-1.5 shrink-0">
                                  {scene.duration}s
                                </span>
                              </button>
                            ))}
                            <button 
                              onClick={handleAddScene}
                              className="h-11 w-11 flex items-center justify-center rounded-lg border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors shrink-0"
                              title="Append Scene"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Audio Track */}
                        <div className="flex gap-2 items-center">
                          <div className="w-20 md:w-28 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                            Audio
                          </div>
                          <div className="flex-1 bg-cyan-950/20 border border-cyan-500/20 rounded-lg h-9 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono">
                              <Music size={13} />
                              <span>Cinematic Orchestral Ambient Mix</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400/80">
                              Stereo · 48kHz
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Export / Download Modal */}
      <AnimatePresence>
        {showExportModal && project && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Export Project</h3>
                  <p className="text-xs text-slate-400">Ready for video production pipeline</p>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Project:</span>
                    <span className="font-semibold text-white">{project.title}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Scenes:</span>
                    <span className="font-semibold text-white">{project.scenes.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Aspect Ratio:</span>
                    <span className="font-semibold text-white">{project.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estimated Duration:</span>
                    <span className="font-semibold text-white">{totalDuration} seconds</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `${project.title.toLowerCase().replace(/\s+/g, '-')}-storyboard.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      setShowExportModal(false);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <Download size={15} /> Download Storyboard Spec (JSON)
                  </button>

                  <button 
                    onClick={() => {
                      handleCopyFullScript();
                      setShowExportModal(false);
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Copy size={15} /> Copy Full Script & Prompts
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
