import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to run generation with primary model and automatic fallback
async function generateWithFallback(params: {
  contents: string;
  systemInstruction?: string;
  responseSchema?: any;
}) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
        },
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, attempting next model if available. Error:`, err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Generate complete video script and storyboard
app.post('/api/generate-script', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.' 
      });
      return;
    }

    const systemInstruction = `You are an elite cinematic video director, screenwriter, and visual concept artist.
Your mission is to translate user ideas into a rich, professional, production-ready video storyboard and script.
Create a structured project with 4 to 6 compelling sequential scenes.
Each visualPrompt should be an evocative, photorealistic or cinematic description (lighting, composition, motion, mood, lens, color palette) suitable for generating stunning visuals.`;

    const userPrompt = `Task: Create a cinematic video script and storyboard for: "${prompt.trim()}".
Target Aspect Ratio: ${aspectRatio}.

Guidelines:
1. Provide a punchy, memorable video title.
2. Provide a 1-sentence synopsis.
3. Break down into 4 to 6 sequential scenes.
4. For each scene:
   - title: Short descriptive scene name (e.g. "Dawn Over the Metropolis").
   - script: Voiceover narration or monologue for this scene (rich and natural).
   - visualPrompt: Detailed prompt for image/video generation (camera angle, lighting, atmosphere, cinematic detail, no text overlays).
   - description: Technical director and lighting notes.
   - duration: Realistic scene duration in seconds (between 4 and 8 seconds).
   - mediaType: "video" or "image".
   - shotType: e.g. "Wide Establishing Shot", "Cinematic Drone Flyover", "Dramatic Medium Shot", "Slow Tracking Shot".`;

    const parsed = await generateWithFallback({
      contents: userPrompt,
      systemInstruction,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          synopsis: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                script: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                mediaType: { type: Type.STRING, enum: ['image', 'video'] },
                shotType: { type: Type.STRING },
              },
              required: ['title', 'script', 'visualPrompt', 'duration', 'mediaType'],
            },
          },
        },
        required: ['title', 'scenes'],
      },
    });

    // Assign scene identifiers and high-quality curated visual seed URLs
    const scenes = (parsed.scenes || []).map((scene: any, idx: number) => {
      const seed = encodeURIComponent(`${parsed.title || 'video'}-${idx}-${scene.title}`);
      return {
        id: `scene-${Date.now()}-${idx}`,
        title: scene.title || `Scene ${idx + 1}`,
        script: scene.script || '',
        visualPrompt: scene.visualPrompt || '',
        description: scene.description || scene.shotType || 'Cinematic shot',
        duration: Number(scene.duration) || 5,
        mediaType: scene.mediaType === 'video' ? 'video' : 'image',
        shotType: scene.shotType || 'Wide Establishing Shot',
        thumbnailUrl: `https://picsum.photos/seed/${seed}/640/360`,
        mediaUrl: `https://picsum.photos/seed/${seed}/1280/720`,
      };
    });

    res.json({
      title: parsed.title || 'Untitled Cinematic Project',
      synopsis: parsed.synopsis || '',
      aspectRatio,
      scenes,
    });
  } catch (error: any) {
    console.error('Error generating video script:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate video storyboard with Gemini.',
    });
  }
});

// Refresh or enhance an individual scene
app.post('/api/refresh-scene', async (req, res) => {
  try {
    const { videoTitle, sceneTitle, prompt, shotType } = req.body;
    
    const userPrompt = `Refine and generate a fresh, ultra-detailed visual prompt and narration script for a scene in a video titled "${videoTitle || 'Cinematic Film'}".
Scene Concept: "${sceneTitle || prompt}".
Shot Type requested: "${shotType || 'Cinematic Shot'}".
Return JSON with updated "title", "script", "visualPrompt", "description", and "duration" (4 to 8s).`;

    const parsed = await generateWithFallback({
      contents: userPrompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.NUMBER },
        },
        required: ['title', 'script', 'visualPrompt', 'duration'],
      },
    });

    const newSeed = encodeURIComponent(`refreshed-${Date.now()}-${parsed.title || 'scene'}`);

    res.json({
      title: parsed.title,
      script: parsed.script,
      visualPrompt: parsed.visualPrompt,
      description: parsed.description,
      duration: Number(parsed.duration) || 5,
      thumbnailUrl: `https://picsum.photos/seed/${newSeed}/640/360`,
      mediaUrl: `https://picsum.photos/seed/${newSeed}/1280/720`,
    });
  } catch (error: any) {
    console.error('Error refreshing scene:', error);
    res.status(500).json({
      error: error?.message || 'Failed to refresh scene.',
    });
  }
});

// Mount Vite in dev, or serve static dist in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vividly AI Server running at http://0.0.0.0:${PORT}`);
});
