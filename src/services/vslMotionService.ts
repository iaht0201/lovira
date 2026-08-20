export interface VSLPoint {
  x: number;
  y: number;
  z?: number;
}

export interface VSLFrame {
  t: number;
  head: VSLPoint;
  leftShoulder: VSLPoint;
  rightShoulder: VSLPoint;
  leftElbow: VSLPoint;
  rightElbow: VSLPoint;
  leftHand: VSLPoint;
  rightHand: VSLPoint;
  timestamp?: number;
  joints?: Record<string, VSLPoint>;
  [key: string]: any;
}

export interface VSLMotionData {
  slug?: string;
  label?: string;
  schema?: string;
  gloss?: string;
  duration: number;
  fps?: number;
  framesCount?: number;
  frames: VSLFrame[];
  [key: string]: any;
}

class VSLMotionService {
  private motionCache = new Map<string, VSLMotionData>();
  private availableGlossesCache: string[] | null = null;

  public async getAvailableGlosses(): Promise<string[]> {
    if (this.availableGlossesCache) {
      return this.availableGlossesCache;
    }
    try {
      const res = await fetch('/assets/vsl-motions/vslIndex.json');
      if (res.ok) {
        const list = await res.json();
        this.availableGlossesCache = Array.isArray(list) ? list : [];
        return this.availableGlossesCache;
      }
    } catch (e) {
      console.warn('[VSLMotionService] Could not fetch vslIndex.json:', e);
    }
    return [];
  }

  public async getMotion(gloss: string): Promise<VSLMotionData | null> {
    const cleanGloss = gloss.trim().toLowerCase();
    if (this.motionCache.has(cleanGloss)) {
      return this.motionCache.get(cleanGloss)!;
    }

    try {
      let res = await fetch(`/assets/vsl-motions/${cleanGloss}/motion.json`);
      if (!res.ok) {
        res = await fetch(`/assets/vsl-motions/${cleanGloss}.json`);
      }
      if (res.ok) {
        const data = (await res.json()) as VSLMotionData;
        this.motionCache.set(cleanGloss, data);
        return data;
      }
    } catch (e) {
      console.warn(`[VSLMotionService] Could not fetch motion for ${cleanGloss}:`, e);
    }
    return null;
  }

  public async translateToGlosses(text: string): Promise<string[]> {
    if (!text || !text.trim()) return [];

    try {
      const res = await fetch('/api/gemini/vsl-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovira-client': 'web-app',
        },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[VSLMotionService] Translation API error, falling back:', e);
    }

    // Fallback: simple keyword matching against available glosses
    const available = await this.getAvailableGlosses();
    const clean = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .trim();
    const words = clean.split(/\s+/);
    const matched: string[] = [];

    for (const w of words) {
      if (available.includes(w)) {
        matched.push(w);
      }
    }

    return matched;
  }

  public async translateTextToGlosses(text: string): Promise<string[]> {
    return this.translateToGlosses(text);
  }
}

export const vslMotionService = new VSLMotionService();
