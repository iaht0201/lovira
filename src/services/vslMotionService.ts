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

    // Add common conversational aliases / phrase mappings
    const ALIAS_MAP: Record<string, string> = {
      'xin chào': 'chao',
      'chào bạn': 'chao',
      'chào': 'chao',
      'tôi là': 'chung_toi_ai_tu',
      'tôi tên là': 'chung_toi_ai_tu',
      'tên tôi là': 'chung_toi_ai_tu',
      'tôi': 'chung_toi_ai_tu',
      'bạn': 'ban',
      'các bạn': 'cac_ban',
      'tôi yêu bạn': 'toi_yeu_ban_ay',
      'tôi yêu bạn ấy': 'toi_yeu_ban_ay',
      'bạn yêu tôi': 'ban_yeu_toi',
      'bạn ấy yêu tôi': 'ban_ay_yeu_toi',
      'khám bệnh': 'chua_benh',
      'chữa bệnh': 'chua_benh',
      'bệnh nhân': 'benh_nhan',
      'bệnh': 'benh_nhan',
      'bác sĩ': 'chua_benh',
      'cảm ơn': 'khong_co_chi',
      'không có chi': 'khong_co_chi',
      'không có gì': 'khong_co_chi',
      'không muốn': 'khong_muon',
      'muốn': 'muon_khong',
      'không cần': 'khong_can',
      'cần': 'can_khong',
      'đăng ký': 'ang_ky',
      'đăng nhập': 'ang_nhap',
      'yêu nước việt nam': 'yeu_nuoc_viet_nam',
      'mệt không': 'met_khong',
      'đói không': 'oi_khong',
      'sợ không': 'so_khong',
      'phải không': 'phai_khong',
      'đúng không': 'ung_khong',
      'số không': '0_so_khong',
    };

    // Precompute normalized labels and sort by word count descending (Greedy Match longest phrases first)
    const combinedEntries: Array<{ slug: string; labelWords: string[] }> = [];

    // 1. Add custom high-priority aliases
    Object.entries(ALIAS_MAP).forEach(([phrase, slug]) => {
      combinedEntries.push({
        slug,
        labelWords: phrase.split(' '),
      });
    });

    // 2. Add dictionary entries
    dict.forEach((item) => {
      const cleanLabel = item.label
        .toLowerCase()
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[.,!?;:"]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanLabel) {
        combinedEntries.push({
          slug: item.slug,
          labelWords: cleanLabel.split(' '),
        });
      }
    });

    const dictMap = combinedEntries.sort((a, b) => b.labelWords.length - a.labelWords.length);

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
