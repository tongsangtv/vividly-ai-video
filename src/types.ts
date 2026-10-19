/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Scene {
  id: string;
  title: string;
  description: string;
  script: string;
  duration: number; // in seconds
  visualPrompt: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  shotType?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  synopsis?: string;
  prompt: string;
  scenes: Scene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  musicGenre?: string;
  voiceoverEnabled: boolean;
  createdAt: number;
}
