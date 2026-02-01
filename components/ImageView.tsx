import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { generateImage } from '../services/geminiService';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Image = await generateImage(prompt);
      setGeneratedImage(base64Image);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `gemini-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Image Generator
          </h2>
          <p className="text-slate-400">
            Describe what you want to see, and let Gemini create it for you.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars at sunset, cyberpunk style..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
            />
            <div className="absolute bottom-3 right-3">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="min-h-[400px] bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden group">
          {generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt={prompt} 
                className="w-full h-full object-contain max-h-[600px] animate-in fade-in zoom-in-95 duration-500" 
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={downloadImage}
                  className="bg-slate-900/80 backdrop-blur text-white p-3 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-600">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <p className="animate-pulse">Creating your masterpiece...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Sparkles className="w-12 h-12 opacity-20" />
                  <p>Your creation will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageView;
