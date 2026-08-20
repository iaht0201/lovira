import { fetchApi } from './api';

export interface VSLFrame {
  t: number;
  leftHand: { x: number; y: number; z: number; rotation: number; shape: string; detected: boolean };
  rightHand: { x: number; y: number; z: number; rotation: number; shape: string; detected: boolean };
  leftElbow: { x: number; y: number; z: number };
  rightElbow: { x: number; y: number; z: number };
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  head: { x: number; y: number; z: number };
}

export interface VSLMotionData {
  schema: string;
  label: string;
  slug: string;
  duration: number;
  framesCount: number;
  frames: VSLFrame[];
}

class VSLMotionService {
  private cache: Record<string, VSLMotionData> = {};
  private dictionary: Array<{ slug: string; label: string }> | null = null;

  private async loadDictionary() {
    if (this.dictionary) return this.dictionary;
    try {
      const res = await fetch('/assets/vsl-motions/vslDictionary.json');
      this.dictionary = await res.json();
    } catch (e) {
      console.error('[VSLMotionService] Failed to load VSL dictionary', e);
      this.dictionary = [];
    }
    return this.dictionary;
  }

  async getMotion(slug: string): Promise<VSLMotionData | null> {
    if (this.cache[slug]) {
      return this.cache[slug];
    }
    try {
      const response = await fetch(`/assets/vsl-motions/${slug}/motion.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch motion ${slug}`);
      }
      const data: VSLMotionData = await response.json();
      this.cache[slug] = data;
      return data;
    } catch (error) {
      console.error(`[VSLMotionService] Error loading motion ${slug}:`, error);
      return null;
    }
  }

  async translateTextToGlosses(text: string): Promise<string[]> {
    // REAL-TIME LOCAL MATCHING ENGINE (0.01s execution time)
    const dict = await this.loadDictionary();
    if (!dict || dict.length === 0) return [];

    // Normalize text (remove punctuation, keep spaces)
    const cleanText = text.toLowerCase().replace(/[.,!?;:()"]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return [];
    const words = cleanText.split(' ');

    // Precompute normalized labels and sort by word count descending (Greedy Match longest phrases first)
    const dictMap = dict.map(item => ({
      slug: item.slug,
      labelWords: item.label.toLowerCase().replace(/[.,!?;:()"]/g, ' ').replace(/\s+/g, ' ').trim().split(' ')
    })).sort((a, b) => b.labelWords.length - a.labelWords.length);

    const resultGlosses: string[] = [];
    let i = 0;
    
    while (i < words.length) {
      let matched = false;
      
      for (const entry of dictMap) {
        const phraseLen = entry.labelWords.length;
        if (i + phraseLen <= words.length) {
          let isMatch = true;
          for (let j = 0; j < phraseLen; j++) {
            if (words[i + j] !== entry.labelWords[j]) {
              isMatch = false;
              break;
            }
          }
          
          if (isMatch) {
            resultGlosses.push(entry.slug);
            i += phraseLen; // Advance by the number of matched words
            matched = true;
            break; 
          }
        }
      }
      
      if (!matched) {
        i++; // Skip unknown word
      }
    }
    
    console.log(`[VSL Realtime Mapper] "${text}" ->`, resultGlosses);
    return resultGlosses;
  }
}

export const vslMotionService = new VSLMotionService();
