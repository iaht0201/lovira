import React, { useEffect, useRef, useState } from 'react';
import { vslMotionService, VSLMotionData, VSLFrame } from '../../services/vslMotionService';
import { RefreshCw } from 'lucide-react';

interface VSLAvatarStickProps {
  text: string;
  width?: number;
  height?: number;
}

export const VSLAvatarStick: React.FC<VSLAvatarStickProps> = ({ text, width = 400, height = 400 }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  // Animation state
  const requestRef = useRef<number>(0);
  const currentMotionRef = useRef<VSLMotionData | null>(null);
  const startTimeRef = useRef<number>(0);
  const motionQueueRef = useRef<VSLMotionData[]>([]);
  const isPlayingRef = useRef(false);
  const lastRenderedPoseRef = useRef<Record<string, {x: number, y: number}> | null>(null);

  // DOM Refs for direct SVG manipulation (60FPS performance)
  const svgRef = useRef<SVGSVGElement>(null);
  const lineLUpperRef = useRef<SVGLineElement>(null);
  const lineLLowerRef = useRef<SVGLineElement>(null);
  const lineRUpperRef = useRef<SVGLineElement>(null);
  const lineRLowerRef = useRef<SVGLineElement>(null);
  const lineShouldersRef = useRef<SVGLineElement>(null);
  const lineSpineRef = useRef<SVGLineElement>(null);

  const headRef = useRef<SVGCircleElement>(null);
  const lShoulderRef = useRef<SVGCircleElement>(null);
  const rShoulderRef = useRef<SVGCircleElement>(null);
  const lElbowRef = useRef<SVGCircleElement>(null);
  const rElbowRef = useRef<SVGCircleElement>(null);
  const lHandRef = useRef<SVGCircleElement>(null);
  const rHandRef = useRef<SVGCircleElement>(null);

  // Default coordinate positions (T-pose fallback)
  const defaultPose = {
    head: { x: 0, y: -0.9 },
    leftShoulder: { x: 0.5, y: 0 },
    rightShoulder: { x: -0.5, y: 0 },
    leftElbow: { x: 1.0, y: 0 },
    rightElbow: { x: -1.0, y: 0 },
    leftHand: { x: 1.5, y: 0 },
    rightHand: { x: -1.5, y: 0 },
  };

  const mapCoord = (x: number, y: number) => {
    const scale = 160;
    // Note: Screen Left = Dataset Right Arm, Screen Right = Dataset Left Arm
    return {
      cx: 300 - x * scale, // Flip X so it mirrors like a camera
      cy: 250 + y * scale
    };
  };

  const updateSVG = (frame: Record<string, {x: number, y: number}>) => {
    const head = mapCoord(frame.head.x, frame.head.y);
    const ls = mapCoord(frame.leftShoulder.x, frame.leftShoulder.y);
    const rs = mapCoord(frame.rightShoulder.x, frame.rightShoulder.y);
    const le = mapCoord(frame.leftElbow.x, frame.leftElbow.y);
    const re = mapCoord(frame.rightElbow.x, frame.rightElbow.y);
    const lh = mapCoord(frame.leftHand.x, frame.leftHand.y);
    const rh = mapCoord(frame.rightHand.x, frame.rightHand.y);
    const spineEnd = { cx: 300, cy: ls.cy + 160 * 1.5 }; // Approximate hip

    // Update Circles
    headRef.current?.setAttribute('cx', String(head.cx));
    headRef.current?.setAttribute('cy', String(head.cy));

    lShoulderRef.current?.setAttribute('cx', String(ls.cx));
    lShoulderRef.current?.setAttribute('cy', String(ls.cy));

    rShoulderRef.current?.setAttribute('cx', String(rs.cx));
    rShoulderRef.current?.setAttribute('cy', String(rs.cy));

    lElbowRef.current?.setAttribute('cx', String(le.cx));
    lElbowRef.current?.setAttribute('cy', String(le.cy));

    rElbowRef.current?.setAttribute('cx', String(re.cx));
    rElbowRef.current?.setAttribute('cy', String(re.cy));

    lHandRef.current?.setAttribute('cx', String(lh.cx));
    lHandRef.current?.setAttribute('cy', String(lh.cy));

    rHandRef.current?.setAttribute('cx', String(rh.cx));
    rHandRef.current?.setAttribute('cy', String(rh.cy));

    // Update Lines
    lineShouldersRef.current?.setAttribute('x1', String(rs.cx));
    lineShouldersRef.current?.setAttribute('y1', String(rs.cy));
    lineShouldersRef.current?.setAttribute('x2', String(ls.cx));
    lineShouldersRef.current?.setAttribute('y2', String(ls.cy));

    lineSpineRef.current?.setAttribute('x1', String((ls.cx + rs.cx) / 2));
    lineSpineRef.current?.setAttribute('y1', String((ls.cy + rs.cy) / 2));
    lineSpineRef.current?.setAttribute('x2', String(spineEnd.cx));
    lineSpineRef.current?.setAttribute('y2', String(spineEnd.cy));

    lineLUpperRef.current?.setAttribute('x1', String(ls.cx));
    lineLUpperRef.current?.setAttribute('y1', String(ls.cy));
    lineLUpperRef.current?.setAttribute('x2', String(le.cx));
    lineLUpperRef.current?.setAttribute('y2', String(le.cy));

    lineLLowerRef.current?.setAttribute('x1', String(le.cx));
    lineLLowerRef.current?.setAttribute('y1', String(le.cy));
    lineLLowerRef.current?.setAttribute('x2', String(lh.cx));
    lineLLowerRef.current?.setAttribute('y2', String(lh.cy));

    lineRUpperRef.current?.setAttribute('x1', String(rs.cx));
    lineRUpperRef.current?.setAttribute('y1', String(rs.cy));
    lineRUpperRef.current?.setAttribute('x2', String(re.cx));
    lineRUpperRef.current?.setAttribute('y2', String(re.cy));

    lineRLowerRef.current?.setAttribute('x1', String(re.cx));
    lineRLowerRef.current?.setAttribute('y1', String(re.cy));
    lineRLowerRef.current?.setAttribute('x2', String(rh.cx));
    lineRLowerRef.current?.setAttribute('y2', String(rh.cy));
  };

  const setRestPose = () => {
    updateSVG(defaultPose);
  };

  const processQueue = () => {
    if (motionQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setRestPose();
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    const motion = motionQueueRef.current.shift()!;
    currentMotionRef.current = motion;
    startTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (!text) return;
    
    const trimMotion = (motion: VSLMotionData) => {
      let startIndex = 0;
      // Trục Y của MediaPipe: Số càng lớn là càng hướng xuống đất. Mốc y > 1.2 là tay đang thõng xuống dưới hông.
      while (startIndex < motion.frames.length - 1 && motion.frames[startIndex].leftHand.y > 1.2 && motion.frames[startIndex].rightHand.y > 1.2) {
        startIndex++;
      }
      
      let endIndex = motion.frames.length - 1;
      while (endIndex > startIndex && motion.frames[endIndex].leftHand.y > 1.2 && motion.frames[endIndex].rightHand.y > 1.2) {
        endIndex--;
      }

      // Giữ lại 1 frame đệm
      if (startIndex > 0) startIndex--;
      if (endIndex < motion.frames.length - 1) endIndex++;

      const trimmed = motion.frames.slice(startIndex, endIndex + 1);
      const startTime = trimmed[0].t;
      
      return {
        ...motion,
        frames: trimmed.map(f => ({ ...f, t: f.t - startTime })),
        duration: trimmed[trimmed.length - 1].t - startTime
      };
    };

    const translateAndPlay = async () => {
      setIsTranslating(true);
      const glosses = await vslMotionService.translateTextToGlosses(text);
      
      const motions: VSLMotionData[] = [];
      for (const slug of glosses) {
        const m = await vslMotionService.getMotion(slug);
        if (m && m.frames && m.frames.length > 0) {
          motions.push(trimMotion(m));
        }
      }
      
      setIsTranslating(false);
      
      if (motions.length > 0) {
        // Thêm một motion "nghỉ" ảo ở cuối để tay tự động hạ xuống mượt mà khi kết thúc câu
        motions.push({
          schema: 'lovira.vsl.rive-motion.v1',
          label: 'Nghỉ',
          slug: 'rest',
          duration: 0.5,
          framesCount: 2,
          frames: [
            { t: 0, ...defaultPose } as VSLFrame,
            { t: 0.5, ...defaultPose } as VSLFrame,
          ]
        });

        motionQueueRef.current = motions;
        if (!isPlayingRef.current) {
          processQueue();
        }
      } else {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setRestPose();
      }
    };
    translateAndPlay();
  }, [text, playCount]);

  useEffect(() => {
    setRestPose(); // Set initial pose on mount

    const animate = () => {
      if (!isPlayingRef.current || !currentMotionRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const motion = currentMotionRef.current;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      if (elapsed >= motion.duration) {
        currentMotionRef.current = null;
        processQueue();
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      let currentFrame = motion.frames[0];
      let nextFrame = motion.frames[motion.frames.length - 1];
      let progress = 0;

      for (let i = 0; i < motion.frames.length - 1; i++) {
        if (elapsed >= motion.frames[i].t && elapsed < motion.frames[i+1].t) {
          currentFrame = motion.frames[i];
          nextFrame = motion.frames[i+1];
          progress = (elapsed - currentFrame.t) / (nextFrame.t - currentFrame.t);
          break;
        }
      }

      // Helper to lerp coordinates
      const lerpCoord = (c1: any, c2: any) => ({
        x: c1.x + (c2.x - c1.x) * progress,
        y: c1.y + (c2.y - c1.y) * progress,
      });

      const interpolatedFrame = {
        head: lerpCoord(currentFrame.head, nextFrame.head),
        leftShoulder: lerpCoord(currentFrame.leftShoulder, nextFrame.leftShoulder),
        rightShoulder: lerpCoord(currentFrame.rightShoulder, nextFrame.rightShoulder),
        leftElbow: lerpCoord(currentFrame.leftElbow, nextFrame.leftElbow),
        rightElbow: lerpCoord(currentFrame.rightElbow, nextFrame.rightElbow),
        leftHand: lerpCoord(currentFrame.leftHand, nextFrame.leftHand),
        rightHand: lerpCoord(currentFrame.rightHand, nextFrame.rightHand),
      };

      // Blend Time: 250ms chuyển mượt giữa từ trước và từ sau
      let finalFrame = interpolatedFrame;
      const blendDuration = 0.25; 
      
      if (lastRenderedPoseRef.current && elapsed < blendDuration) {
        let blendFactor = elapsed / blendDuration;
        // SmoothStep easing function cho cảm giác tự nhiên
        const easedFactor = blendFactor * blendFactor * (3 - 2 * blendFactor); 
        
        const prev = lastRenderedPoseRef.current;
        const blendCoord = (c1: any, c2: any) => ({
          x: c1.x + (c2.x - c1.x) * easedFactor,
          y: c1.y + (c2.y - c1.y) * easedFactor,
        });

        finalFrame = {
          head: blendCoord(prev.head, interpolatedFrame.head),
          leftShoulder: blendCoord(prev.leftShoulder, interpolatedFrame.leftShoulder),
          rightShoulder: blendCoord(prev.rightShoulder, interpolatedFrame.rightShoulder),
          leftElbow: blendCoord(prev.leftElbow, interpolatedFrame.leftElbow),
          rightElbow: blendCoord(prev.rightElbow, interpolatedFrame.rightElbow),
          leftHand: blendCoord(prev.leftHand, interpolatedFrame.leftHand),
          rightHand: blendCoord(prev.rightHand, interpolatedFrame.rightHand),
        };
      }

      lastRenderedPoseRef.current = finalFrame;
      updateSVG(finalFrame);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return (
    <div 
      className="relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-inner group flex items-center justify-center"
      style={{ width, height }}
    >
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
        {/* Glow Effects */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Lines */}
        <g stroke="#3b82f6" strokeWidth="18" strokeLinecap="round" filter="url(#glow)" opacity="0.8">
          <line ref={lineShouldersRef} />
          <line ref={lineSpineRef} />
          <line ref={lineLUpperRef} />
          <line ref={lineLLowerRef} />
          <line ref={lineRUpperRef} />
          <line ref={lineRLowerRef} />
        </g>
        <g stroke="#60a5fa" strokeWidth="8" strokeLinecap="round">
          <line ref={lineShouldersRef} />
          <line ref={lineSpineRef} />
          <line ref={lineLUpperRef} />
          <line ref={lineLLowerRef} />
          <line ref={lineRUpperRef} />
          <line ref={lineRLowerRef} />
        </g>

        {/* Joints (Circles) */}
        <g fill="#1e3a8a">
          <circle ref={headRef} r="45" />
          <circle ref={lShoulderRef} r="16" />
          <circle ref={rShoulderRef} r="16" />
          <circle ref={lElbowRef} r="14" />
          <circle ref={rElbowRef} r="14" />
          <circle ref={lHandRef} r="22" />
          <circle ref={rHandRef} r="22" />
        </g>
        <g fill="#bfdbfe">
          <circle ref={headRef} r="40" />
          <circle ref={lShoulderRef} r="10" />
          <circle ref={rShoulderRef} r="10" />
          <circle ref={lElbowRef} r="8" />
          <circle ref={rElbowRef} r="8" />
          <circle ref={lHandRef} r="14" />
          <circle ref={rHandRef} r="14" />
        </g>
      </svg>

      {isTranslating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10 p-4 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-white font-medium text-sm">Đang tải ký hiệu Người Que...</p>
        </div>
      )}

      {/* Replay Button */}
      {!isTranslating && !isPlaying && text && (
        <button
          onClick={() => setPlayCount(c => c + 1)}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg transform translate-y-2 group-hover:translate-y-0"
          title="Phát lại ký hiệu"
        >
          <RefreshCw size={16} className="text-primary" />
          <span className="text-sm font-medium">Đọc lại</span>
        </button>
      )}
    </div>
  );
};
