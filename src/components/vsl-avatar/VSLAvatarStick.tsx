import React, { useEffect, useRef, useState } from 'react';
import { vslMotionService, VSLMotionData, VSLFrame } from '../../services/vslMotionService';
import { RefreshCw } from 'lucide-react';

interface VSLAvatarStickProps {
  text: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  compact?: boolean;
  showReplayOverlay?: boolean;
  onPlaybackStateChange?: (state: { isPlaying: boolean; isTranslating: boolean }) => void;
}

interface Point2D {
  x: number;
  y: number;
}

interface FrameJoints {
  head: Point2D;
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  leftElbow: Point2D;
  rightElbow: Point2D;
  leftHand: Point2D & { shape?: string; rotation?: number; rawY?: number };
  rightHand: Point2D & { shape?: string; rotation?: number; rawY?: number };
}

export const VSLAvatarStick: React.FC<VSLAvatarStickProps> = ({
  text,
  width = 400,
  height = 400,
  className = '',
  compact = false,
  showReplayOverlay = true,
  onPlaybackStateChange,
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    onPlaybackStateChange?.({ isPlaying, isTranslating });
  }, [isPlaying, isTranslating, onPlaybackStateChange]);

  // Animation state
  const requestRef = useRef<number>(0);
  const currentMotionRef = useRef<VSLMotionData | null>(null);
  const startTimeRef = useRef<number>(0);
  const motionQueueRef = useRef<VSLMotionData[]>([]);
  const isPlayingRef = useRef(false);
  const lastRenderedPoseRef = useRef<FrameJoints | null>(null);

  // DOM Refs for direct SVG manipulation (60FPS performance)
  const svgRef = useRef<SVGSVGElement>(null);
  const lineLUpperRef = useRef<SVGLineElement>(null);
  const lineLLowerRef = useRef<SVGLineElement>(null);
  const lineRUpperRef = useRef<SVGLineElement>(null);
  const lineRLowerRef = useRef<SVGLineElement>(null);
  const lineShouldersRef = useRef<SVGLineElement>(null);
  const lineSpineRef = useRef<SVGLineElement>(null);

  const headRef = useRef<SVGCircleElement>(null);
  const headInnerRef = useRef<SVGCircleElement>(null);
  const lShoulderRef = useRef<SVGCircleElement>(null);
  const rShoulderRef = useRef<SVGCircleElement>(null);
  const lElbowRef = useRef<SVGCircleElement>(null);
  const rElbowRef = useRef<SVGCircleElement>(null);
  const lWristRef = useRef<SVGCircleElement>(null);
  const rWristRef = useRef<SVGCircleElement>(null);

  // Facial Features SVG Refs (Expressive Eyes, Eyebrows, Pupils, Nose, Mouth)
  const lEyeGlowRef = useRef<SVGEllipseElement>(null);
  const rEyeGlowRef = useRef<SVGEllipseElement>(null);
  const lEyeRef = useRef<SVGCircleElement>(null);
  const rEyeRef = useRef<SVGCircleElement>(null);
  const lPupilRef = useRef<SVGCircleElement>(null);
  const rPupilRef = useRef<SVGCircleElement>(null);
  const lEyebrowRef = useRef<SVGPathElement>(null);
  const rEyebrowRef = useRef<SVGPathElement>(null);
  const noseRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const mouthGlowRef = useRef<SVGPathElement>(null);
  const blushLeftRef = useRef<SVGCircleElement>(null);
  const blushRightRef = useRef<SVGCircleElement>(null);

  // Hand & 5 Fingers SVG Refs (Bones + Joint vertebrae)
  const lHandBonesGlowRef = useRef<SVGPathElement>(null);
  const lHandBonesRef = useRef<SVGPathElement>(null);
  const lHandJointsRef = useRef<SVGPathElement>(null);
  const lHandJointsCoreRef = useRef<SVGPathElement>(null);

  const rHandBonesGlowRef = useRef<SVGPathElement>(null);
  const rHandBonesRef = useRef<SVGPathElement>(null);
  const rHandJointsRef = useRef<SVGPathElement>(null);
  const rHandJointsCoreRef = useRef<SVGPathElement>(null);

  // Default coordinate positions: Natural standing rest posture (hands hanging at sides)
  const defaultPose: FrameJoints = {
    head: { x: 0, y: -0.9 },
    leftShoulder: { x: 0.5, y: 0 },
    rightShoulder: { x: -0.5, y: 0 },
    leftElbow: { x: 0.65, y: 1.05 },
    rightElbow: { x: -0.65, y: 1.05 },
    leftHand: { x: 0.55, y: 2.15, shape: 'REST', rotation: 0, rawY: 2.15 },
    rightHand: { x: -0.55, y: 2.15, shape: 'REST', rotation: 0, rawY: 2.15 },
  };

  const mapCoord = (x: number, y: number) => {
    const scale = 160;
    // Note: Screen Left = Dataset Right Arm, Screen Right = Dataset Left Arm
    return {
      cx: 300 - x * scale, // Flip X so it mirrors like a camera
      cy: 250 + y * scale,
    };
  };

  /**
   * Generates SVG paths for 5 anatomical fingers with multi-segment joints (đốt sống/đốt ngón tay)
   */
  const computeHandSkeleton = (
    wrist: { cx: number; cy: number },
    elbow: { cx: number; cy: number },
    isLeftHand: boolean,
    shape: string = 'OPEN',
    rawY?: number
  ) => {
    // 1. Forearm directional vector
    let dx = wrist.cx - elbow.cx;
    let dy = wrist.cy - elbow.cy;
    let len = Math.hypot(dx, dy);
    if (len < 1e-4) {
      dx = 0;
      dy = 1;
      len = 1;
    }
    const ux = dx / len;
    const uy = dy / len;

    // Perpendicular lateral vector across the palm
    // isLeftHand is based on screen coordinate mirroring
    const side = isLeftHand ? 1 : -1;
    const nx = -uy * side;
    const ny = ux * side;

    const boneSegments: Array<[Point2D, Point2D]> = [];
    const joints: Array<{ pt: Point2D; radius: number }> = [];

    // Helper to add joint
    const addJoint = (pt: Point2D, radius: number) => {
      joints.push({ pt, radius });
    };

    // Wrist root joint
    addJoint({ x: wrist.cx, y: wrist.cy }, 5.5);

    // Finger specs: [spreadAngleDeg, fingerLengthScale, palmOffsetAlongN, palmOffsetAlongU]
    const fingerConfigs = [
      { name: 'thumb', spread: 42, length: 0.75, offN: 11.0, offU: 4.0, isThumb: true },
      { name: 'index', spread: 14, length: 1.0, offN: 5.0, offU: 12.5, isThumb: false },
      { name: 'middle', spread: 1, length: 1.06, offN: 0.5, offU: 13.8, isThumb: false },
      { name: 'ring', spread: -12, length: 0.96, offN: -4.0, offU: 12.5, isThumb: false },
      { name: 'pinky', spread: -28, length: 0.80, offN: -8.5, offU: 10.0, isThumb: false },
    ];

    const isResting = shape === 'REST' || shape === 'UNKNOWN' || (rawY !== undefined && rawY > 1.35);

    fingerConfigs.forEach((cfg) => {
      // 1. Metacarpal base (khớp bàn ngón MCP)
      const mcpBase: Point2D = {
        x: wrist.cx + ux * cfg.offU + nx * cfg.offN,
        y: wrist.cy + uy * cfg.offU + ny * cfg.offN,
      };

      // Connect wrist to metacarpal base (palm bone)
      boneSegments.push([{ x: wrist.cx, y: wrist.cy }, mcpBase]);
      addJoint(mcpBase, 3.8);

      // Determine curl/extension state per shape
      let isCurled = false;
      let spreadOffset = 0;

      if (isResting) {
        // Natural resting hand: fingers are softly closed together along the arm
        spreadOffset = -cfg.spread * 0.82;
      } else if (shape === 'FIST') {
        isCurled = true;
      } else if (shape === 'POINT') {
        if (!cfg.isThumb && cfg.name !== 'index') isCurled = true;
      } else if (shape === 'PEACE' || shape === 'V') {
        if (cfg.name === 'index') spreadOffset = 10;
        else if (cfg.name === 'middle') spreadOffset = -10;
        else isCurled = true;
      } else if (shape === 'THUMBS_UP') {
        if (!cfg.isThumb) isCurled = true;
      } else if (shape === 'PINCH') {
        if (!cfg.isThumb && cfg.name !== 'index') isCurled = true;
      } else if (shape === 'FLAT') {
        // Flat hand: fingers close together
        spreadOffset = -cfg.spread * 0.6;
      } else if (shape === 'CUSTOM') {
        // Custom / Natural signing posture: slight curvature on ring and pinky
        if (cfg.name === 'pinky' || cfg.name === 'ring') {
          spreadOffset = -4;
        }
      }

      // Base finger angle in radians
      const totalSpreadRad = ((cfg.spread + spreadOffset) * Math.PI) / 180;
      const cosS = Math.cos(totalSpreadRad);
      const sinS = Math.sin(totalSpreadRad);

      // Forward direction for this finger
      const fDirX = ux * cosS + nx * sinS;
      const fDirY = uy * cosS + ny * sinS;
      const fNormX = -fDirY * side;
      const fNormY = fDirX * side;

      if (isCurled) {
        // Curled finger (Đốt gập tạo nắm tay hoặc khớp ngón thu gọn)
        const curlScale = cfg.length * 5.5;
        const pip: Point2D = {
          x: mcpBase.x + fDirX * curlScale,
          y: mcpBase.y + fDirY * curlScale,
        };
        const dip: Point2D = {
          x: pip.x - fNormX * (curlScale * 0.75) + fDirX * 1.5,
          y: pip.y - fNormY * (curlScale * 0.75) + fDirY * 1.5,
        };
        const tip: Point2D = {
          x: dip.x - fDirX * (curlScale * 0.7),
          y: dip.y - fDirY * (curlScale * 0.7),
        };

        boneSegments.push([mcpBase, pip]);
        boneSegments.push([pip, dip]);
        boneSegments.push([dip, tip]);

        addJoint(pip, 3.2);
        addJoint(dip, 2.7);
        addJoint(tip, 2.5);
      } else {
        // Extended / Relaxed finger (3 đốt sống: Đốt gần / Phalanx Proximal, Đốt giữa / Phalanx Medial, Đốt xa / Phalanx Distal & Tip)
        const lenMultiplier = isResting ? 0.72 : 1.0;
        const seg1 = cfg.length * 8.5 * lenMultiplier; // MCP -> PIP
        const seg2 = cfg.length * 7.0 * lenMultiplier; // PIP -> DIP
        const seg3 = cfg.length * 6.0 * lenMultiplier; // DIP -> TIP

        // PIP Joint (Khớp liên đốt ngón gần)
        const pip: Point2D = {
          x: mcpBase.x + fDirX * seg1,
          y: mcpBase.y + fDirY * seg1,
        };

        // DIP Joint (Khớp liên đốt ngón xa) - with slight natural curvature
        const dip: Point2D = {
          x: pip.x + fDirX * seg2 * 0.98 + (isResting ? 0 : fNormX * 0.8),
          y: pip.y + fDirY * seg2 * 0.98 + (isResting ? 0 : fNormY * 0.8),
        };

        // Tip (Đầu ngón tay)
        const tip: Point2D = {
          x: dip.x + fDirX * seg3 * 0.96 + (isResting ? 0 : fNormX * 1.2),
          y: dip.y + fDirY * seg3 * 0.96 + (isResting ? 0 : fNormY * 1.2),
        };

        boneSegments.push([mcpBase, pip]);
        boneSegments.push([pip, dip]);
        boneSegments.push([dip, tip]);

        addJoint(pip, isResting ? 2.8 : 3.5);
        addJoint(dip, isResting ? 2.4 : 3.0);
        addJoint(tip, isResting ? 2.0 : 2.6);
      }
    });

    // Build SVG Path strings
    // 1. Bones path: M x1 y1 L x2 y2 ...
    const bonesPath = boneSegments.map(([p1, p2]) => `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} L ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`).join(' ');

    // 2. Joints path: circles drawn as arc paths
    const jointsPath = joints
      .map(({ pt, radius }) => {
        const r = radius.toFixed(1);
        const x = pt.x.toFixed(1);
        const y = pt.y.toFixed(1);
        return `M ${x} ${y} m -${r},0 a ${r},${r} 0 1,0 ${radius * 2},0 a ${r},${r} 0 1,0 -${radius * 2},0`;
      })
      .join(' ');

    const jointsCorePath = joints
      .map(({ pt, radius }) => {
        const r = Math.max(1, radius * 0.45).toFixed(1);
        const x = pt.x.toFixed(1);
        const y = pt.y.toFixed(1);
        return `M ${x} ${y} m -${r},0 a ${r},${r} 0 1,0 ${parseFloat(r) * 2},0 a ${r},${r} 0 1,0 -${parseFloat(r) * 2},0`;
      })
      .join(' ');

    return { bonesPath, jointsPath, jointsCorePath };
  };

  const updateSVG = (frame: FrameJoints) => {
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
    headInnerRef.current?.setAttribute('cx', String(head.cx));
    headInnerRef.current?.setAttribute('cy', String(head.cy));

    // Update Animated Facial Features with Natural Blink & Emotion
    const now = performance.now();
    // Blink cycle: blinks every ~3.5s for 150ms
    const blinkCycle = now % 3500;
    const isBlinking = blinkCycle > 3350;
    const eyeRadiusY = isBlinking ? 1.0 : 6.0;
    const eyeRadiusX = isBlinking ? 5.5 : 5.0;

    const leftEyePos = { cx: head.cx - 13, cy: head.cy - 7 };
    const rightEyePos = { cx: head.cx + 13, cy: head.cy - 7 };

    lEyeGlowRef.current?.setAttribute('cx', String(leftEyePos.cx));
    lEyeGlowRef.current?.setAttribute('cy', String(leftEyePos.cy));
    lEyeGlowRef.current?.setAttribute('rx', String(eyeRadiusX + 2));
    lEyeGlowRef.current?.setAttribute('ry', String(eyeRadiusY + 2));

    rEyeGlowRef.current?.setAttribute('cx', String(rightEyePos.cx));
    rEyeGlowRef.current?.setAttribute('cy', String(rightEyePos.cy));
    rEyeGlowRef.current?.setAttribute('rx', String(eyeRadiusX + 2));
    rEyeGlowRef.current?.setAttribute('ry', String(eyeRadiusY + 2));

    lEyeRef.current?.setAttribute('cx', String(leftEyePos.cx));
    lEyeRef.current?.setAttribute('cy', String(leftEyePos.cy));
    lEyeRef.current?.setAttribute('r', String(eyeRadiusY));

    rEyeRef.current?.setAttribute('cx', String(rightEyePos.cx));
    rEyeRef.current?.setAttribute('cy', String(rightEyePos.cy));
    rEyeRef.current?.setAttribute('r', String(eyeRadiusY));

    // Pupils follow the active signing hand or camera direction
    const handFocusX = (frame.rightHand.x + frame.leftHand.x) * 0.5;
    const pupilShiftX = Math.max(-2, Math.min(2, -handFocusX * 2));
    const pupilShiftY = isBlinking ? 0 : 0.5;

    lPupilRef.current?.setAttribute('cx', String(leftEyePos.cx + pupilShiftX));
    lPupilRef.current?.setAttribute('cy', String(leftEyePos.cy + pupilShiftY));
    lPupilRef.current?.setAttribute('r', isBlinking ? '0' : '2.5');

    rPupilRef.current?.setAttribute('cx', String(rightEyePos.cx + pupilShiftX));
    rPupilRef.current?.setAttribute('cy', String(rightEyePos.cy + pupilShiftY));
    rPupilRef.current?.setAttribute('r', isBlinking ? '0' : '2.5');

    // Eyebrows (Curved & friendly, slight lift during signing)
    const browLift = isPlayingRef.current ? -2 : 0;
    const lBrowD = `M ${head.cx - 20} ${head.cy - 16 + browLift} Q ${head.cx - 13} ${head.cy - 20 + browLift} ${head.cx - 6} ${head.cy - 17 + browLift}`;
    const rBrowD = `M ${head.cx + 6} ${head.cy - 17 + browLift} Q ${head.cx + 13} ${head.cy - 20 + browLift} ${head.cx + 20} ${head.cy - 16 + browLift}`;
    lEyebrowRef.current?.setAttribute('d', lBrowD);
    rEyebrowRef.current?.setAttribute('d', rBrowD);

    // Nose Bridge (Sleek minimalist anime/cyber stick nose)
    const noseD = `M ${head.cx} ${head.cy - 2} L ${head.cx + 3} ${head.cy + 5} L ${head.cx - 1} ${head.cy + 7}`;
    noseRef.current?.setAttribute('d', noseD);

    // Mouth (Expressive Smile / Speaking loop when active)
    let mouthD: string;
    if (isPlayingRef.current) {
      // Gentle articulation oscillation while signing
      const speechOsc = Math.sin(now * 0.012) * 3;
      mouthD = `M ${head.cx - 11} ${head.cy + 16} Q ${head.cx} ${head.cy + 22 + speechOsc} ${head.cx + 11} ${head.cy + 16}`;
    } else {
      // Natural warm smile when resting
      mouthD = `M ${head.cx - 10} ${head.cy + 16} Q ${head.cx} ${head.cy + 22} ${head.cx + 10} ${head.cy + 16}`;
    }
    mouthRef.current?.setAttribute('d', mouthD);
    mouthGlowRef.current?.setAttribute('d', mouthD);

    // Cute Cheeks Blush
    blushLeftRef.current?.setAttribute('cx', String(head.cx - 18));
    blushLeftRef.current?.setAttribute('cy', String(head.cy + 7));
    blushRightRef.current?.setAttribute('cx', String(head.cx + 18));
    blushRightRef.current?.setAttribute('cy', String(head.cy + 7));

    lShoulderRef.current?.setAttribute('cx', String(ls.cx));
    lShoulderRef.current?.setAttribute('cy', String(ls.cy));

    rShoulderRef.current?.setAttribute('cx', String(rs.cx));
    rShoulderRef.current?.setAttribute('cy', String(rs.cy));

    lElbowRef.current?.setAttribute('cx', String(le.cx));
    lElbowRef.current?.setAttribute('cy', String(le.cy));

    rElbowRef.current?.setAttribute('cx', String(re.cx));
    rElbowRef.current?.setAttribute('cy', String(re.cy));

    lWristRef.current?.setAttribute('cx', String(lh.cx));
    lWristRef.current?.setAttribute('cy', String(lh.cy));

    rWristRef.current?.setAttribute('cx', String(rh.cx));
    rWristRef.current?.setAttribute('cy', String(rh.cy));

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

    // Compute & Render 5-Finger Articulated Skeleton for Left Hand
    const lHandData = computeHandSkeleton(lh, le, true, frame.leftHand.shape || 'OPEN', frame.leftHand.rawY ?? frame.leftHand.y);
    lHandBonesGlowRef.current?.setAttribute('d', lHandData.bonesPath);
    lHandBonesRef.current?.setAttribute('d', lHandData.bonesPath);
    lHandJointsRef.current?.setAttribute('d', lHandData.jointsPath);
    lHandJointsCoreRef.current?.setAttribute('d', lHandData.jointsCorePath);

    // Compute & Render 5-Finger Articulated Skeleton for Right Hand
    const rHandData = computeHandSkeleton(rh, re, false, frame.rightHand.shape || 'OPEN', frame.rightHand.rawY ?? frame.rightHand.y);
    rHandBonesGlowRef.current?.setAttribute('d', rHandData.bonesPath);
    rHandBonesRef.current?.setAttribute('d', rHandData.bonesPath);
    rHandJointsRef.current?.setAttribute('d', rHandData.jointsPath);
    rHandJointsCoreRef.current?.setAttribute('d', rHandData.jointsCorePath);
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
      while (
        startIndex < motion.frames.length - 1 &&
        motion.frames[startIndex].leftHand.y > 1.2 &&
        motion.frames[startIndex].rightHand.y > 1.2
      ) {
        startIndex++;
      }

      let endIndex = motion.frames.length - 1;
      while (
        endIndex > startIndex &&
        motion.frames[endIndex].leftHand.y > 1.2 &&
        motion.frames[endIndex].rightHand.y > 1.2
      ) {
        endIndex--;
      }

      if (startIndex > 0) startIndex--;
      if (endIndex < motion.frames.length - 1) endIndex++;

      const trimmed = motion.frames.slice(startIndex, endIndex + 1);
      const startTime = trimmed[0].t;

      return {
        ...motion,
        frames: trimmed.map((f) => ({ ...f, t: f.t - startTime })),
        duration: trimmed[trimmed.length - 1].t - startTime,
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
        motions.push({
          schema: 'lovira.vsl.rive-motion.v1',
          label: 'Nghỉ',
          slug: 'rest',
          duration: 0.5,
          framesCount: 2,
          frames: [
            { t: 0, ...defaultPose } as unknown as VSLFrame,
            { t: 0.5, ...defaultPose } as unknown as VSLFrame,
          ],
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
    setRestPose();

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
        if (elapsed >= motion.frames[i].t && elapsed < motion.frames[i + 1].t) {
          currentFrame = motion.frames[i];
          nextFrame = motion.frames[i + 1];
          progress = (elapsed - currentFrame.t) / (nextFrame.t - currentFrame.t);
          break;
        }
      }

      // Helper to lerp coordinates
      const lerpCoord = (c1: Point2D, c2: Point2D) => ({
        x: c1.x + (c2.x - c1.x) * progress,
        y: c1.y + (c2.y - c1.y) * progress,
      });

      const interpolatedFrame: FrameJoints = {
        head: lerpCoord(currentFrame.head, nextFrame.head),
        leftShoulder: lerpCoord(currentFrame.leftShoulder, nextFrame.leftShoulder),
        rightShoulder: lerpCoord(currentFrame.rightShoulder, nextFrame.rightShoulder),
        leftElbow: lerpCoord(currentFrame.leftElbow, nextFrame.leftElbow),
        rightElbow: lerpCoord(currentFrame.rightElbow, nextFrame.rightElbow),
        leftHand: {
          ...lerpCoord(currentFrame.leftHand, nextFrame.leftHand),
          shape: currentFrame.leftHand.shape || 'OPEN',
        },
        rightHand: {
          ...lerpCoord(currentFrame.rightHand, nextFrame.rightHand),
          shape: currentFrame.rightHand.shape || 'OPEN',
        },
      };

      // Blend Time: 250ms smoothing
      let finalFrame = interpolatedFrame;
      const blendDuration = 0.25;

      if (lastRenderedPoseRef.current && elapsed < blendDuration) {
        const blendFactor = elapsed / blendDuration;
        const easedFactor = blendFactor * blendFactor * (3 - 2 * blendFactor);

        const prev = lastRenderedPoseRef.current;
        const blendCoord = (c1: Point2D, c2: Point2D) => ({
          x: c1.x + (c2.x - c1.x) * easedFactor,
          y: c1.y + (c2.y - c1.y) * easedFactor,
        });

        finalFrame = {
          head: blendCoord(prev.head, interpolatedFrame.head),
          leftShoulder: blendCoord(prev.leftShoulder, interpolatedFrame.leftShoulder),
          rightShoulder: blendCoord(prev.rightShoulder, interpolatedFrame.rightShoulder),
          leftElbow: blendCoord(prev.leftElbow, interpolatedFrame.leftElbow),
          rightElbow: blendCoord(prev.rightElbow, interpolatedFrame.rightElbow),
          leftHand: {
            ...blendCoord(prev.leftHand, interpolatedFrame.leftHand),
            shape: interpolatedFrame.leftHand.shape,
          },
          rightHand: {
            ...blendCoord(prev.rightHand, interpolatedFrame.rightHand),
            shape: interpolatedFrame.rightHand.shape,
          },
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
      role="img"
      aria-label={`Hình nhân mô phỏng Ngôn ngữ Ký hiệu Việt Nam cho câu: ${text || 'Sẵn sàng'}`}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl group flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Glow Effects */}
        <defs>
          <filter id="bodyGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="handGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="headGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>

        {/* Major Body Glow Lines */}
        <g stroke="#3b82f6" strokeWidth="16" strokeLinecap="round" filter="url(#bodyGlow)" opacity="0.6">
          <line ref={lineShouldersRef} />
          <line ref={lineSpineRef} />
          <line ref={lineLUpperRef} />
          <line ref={lineLLowerRef} />
          <line ref={lineRUpperRef} />
          <line ref={lineRLowerRef} />
          {/* Hips Grounding Base */}
          <line x1="240" y1="520" x2="360" y2="520" />
          <line x1="240" y1="520" x2="220" y2="600" />
          <line x1="360" y1="520" x2="380" y2="600" />
        </g>

        {/* Major Body Core Lines */}
        <g stroke="#60a5fa" strokeWidth="7" strokeLinecap="round">
          <line ref={lineShouldersRef} />
          <line ref={lineSpineRef} />
          <line ref={lineLUpperRef} />
          <line ref={lineLLowerRef} />
          <line ref={lineRUpperRef} />
          <line ref={lineRLowerRef} />
          {/* Hips Grounding Base Core */}
          <line x1="240" y1="520" x2="360" y2="520" />
          <line x1="240" y1="520" x2="220" y2="600" />
          <line x1="360" y1="520" x2="380" y2="600" />
        </g>

        {/* Hand Phalanges (5 Fingers Bones) with Cyber Neon Glow */}
        <g stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#handGlow)" opacity="0.65">
          <path ref={lHandBonesGlowRef} fill="none" />
          <path ref={rHandBonesGlowRef} fill="none" />
        </g>
        <g stroke="#93c5fd" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path ref={lHandBonesRef} fill="none" />
          <path ref={rHandBonesRef} fill="none" />
        </g>

        {/* Major Body Joints (Circles) */}
        <g fill="#1e3a8a">
          <circle ref={headRef} r="46" />
          <circle ref={lShoulderRef} r="16" />
          <circle ref={rShoulderRef} r="16" />
          <circle ref={lElbowRef} r="13" />
          <circle ref={rElbowRef} r="13" />
          <circle ref={lWristRef} r="11" />
          <circle ref={rWristRef} r="11" />
          <circle cx="240" cy="520" r="12" />
          <circle cx="360" cy="520" r="12" />
        </g>
        <g fill="#bfdbfe">
          <circle ref={headInnerRef} r="38" fill="url(#headGrad)" />
          <circle ref={lShoulderRef} r="9" />
          <circle ref={rShoulderRef} r="9" />
          <circle ref={lElbowRef} r="7" />
          <circle ref={rElbowRef} r="7" />
          <circle ref={lWristRef} r="6" />
          <circle ref={rWristRef} r="6" />
          <circle cx="240" cy="520" r="6" />
          <circle cx="360" cy="520" r="6" />
        </g>

        {/* Expressive Facial Features (Mắt, Mũi, Miệng, Lông mày, Má hồng phát sáng) */}
        <g id="avatar-facial-expression">
          {/* Eyebrows (Lông mày biểu cảm) */}
          <path ref={lEyebrowRef} fill="none" stroke="#e0f2fe" strokeWidth="2.8" strokeLinecap="round" />
          <path ref={rEyebrowRef} fill="none" stroke="#e0f2fe" strokeWidth="2.8" strokeLinecap="round" />

          {/* Eye Glow (Quầng sáng mắt) */}
          <ellipse ref={lEyeGlowRef} fill="#38bdf8" opacity="0.4" />
          <ellipse ref={rEyeGlowRef} fill="#38bdf8" opacity="0.4" />

          {/* Eyes (Tròng mắt phát sáng) */}
          <circle ref={lEyeRef} fill="#ffffff" />
          <circle ref={rEyeRef} fill="#ffffff" />

          {/* Pupils (Con ngươi chuyển động linh hoạt theo hướng ký hiệu) */}
          <circle ref={lPupilRef} fill="#0f172a" />
          <circle ref={rPupilRef} fill="#0f172a" />

          {/* Nose (Mũi) */}
          <path ref={noseRef} fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

          {/* Cheeks Blush (Má hồng thân thiện) */}
          <circle ref={blushLeftRef} r="5.5" fill="#f43f5e" opacity="0.3" filter="url(#handGlow)" />
          <circle ref={blushRightRef} r="5.5" fill="#f43f5e" opacity="0.3" filter="url(#handGlow)" />

          {/* Mouth (Miệng tươi cười / nhép khẩu hình sống động) */}
          <path ref={mouthGlowRef} fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" filter="url(#handGlow)" />
          <path ref={mouthRef} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Finger Vertebrae / Joint Nodes (Đốt ngón tay / Khớp MCP, PIP, DIP, Tip) */}
        <path ref={lHandJointsRef} fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
        <path ref={lHandJointsCoreRef} fill="#ffffff" />
        <path ref={rHandJointsRef} fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
        <path ref={rHandJointsCoreRef} fill="#ffffff" />
      </svg>

      {isTranslating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm z-10 p-4 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-white font-medium text-sm">Đang biểu diễn ngôn ngữ ký hiệu...</p>
        </div>
      )}

      {/* Replay Button - Always clearly accessible */}
      {showReplayOverlay && !isTranslating && text && (
        <button
          onClick={() => setPlayCount((c) => c + 1)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 rounded-xl text-slate-200 hover:text-white transition-all shadow-md active:scale-95 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
          title="Phát lại ký hiệu"
          aria-label="Phát lại biểu diễn ký hiệu"
        >
          <RefreshCw size={14} className="text-sky-400" />
          <span>Phát lại</span>
        </button>
      )}
    </div>
  );
};

