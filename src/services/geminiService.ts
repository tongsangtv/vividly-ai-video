import { VideoProject, Scene } from '../types';

export async function generateVideoScript(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<Partial<VideoProject>> {
  const response = await fetch('/api/generate-script', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const data = await response.json();
  return {
    title: data.title,
    synopsis: data.synopsis,
    aspectRatio: data.aspectRatio,
    scenes: data.scenes as Scene[],
  };
}

export async function refreshSceneContent(
  videoTitle: string,
  sceneTitle: string,
  prompt: string,
  shotType?: string
): Promise<Partial<Scene>> {
  const response = await fetch('/api/refresh-scene', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoTitle, sceneTitle, prompt, shotType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to refresh scene');
  }

  return await response.json();
}
