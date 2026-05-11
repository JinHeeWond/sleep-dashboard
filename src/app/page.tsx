"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Eye,
  HelpCircle,
  LineChart,
  Lock,
  Monitor,
  Moon,
  Quote,
  Sparkles,
  Star,
  Timer,
  Waves,
  Zap,
} from "lucide-react";
import FloatingLines from "@/components/floating-lines";
import GlassSurface from "@/components/glass-surface";
import Masonry from "@/components/masonry";
import TiltedCard from "@/components/tilted-card";
import ChromaGrid from "@/components/chroma-grid";
import ScrollReveal from "@/components/scroll-reveal";
import { LanguageToggle } from "@/components/language-toggle";
import { useLang, type Lang } from "@/lib/lang";

type FeatureCard = {
  id: string;
  title: string;
  desc: string;
};

type FaqItem = { q: string; a: string };

type Copy = {
  nav: { features: string; how: string; faq: string; openDashboard: string };
  bar: { name: string; cta: string };
  hero: {
    badge: string;
    title: string;
    sub: string;
    scroll: string;
  };
  intro: { title: string; desc: string };
  big: {
    eyebrow: string;
    title: string;
    body: string;
    cards: {
      visual: { eyebrow: string; title: string; desc: string };
      quote: { text: string; author: string; role: string };
      link: { eyebrow: string; title: string; desc: string; href: string };
    };
  };
  preview: {
    title: string;
    items: { eyebrow: string; title: string; desc: string }[];
  };
  thin: {
    title: string;
    rotating: string[];
    note: string;
  };
  tracking: {
    eyebrow: string;
    title: string;
    desc: string;
    items: FeatureCard[];
  };
  morning: {
    eyebrow: string;
    title: string;
    desc: string;
    items: { id: string; title: string; desc: string }[];
  };
  extra: {
    eyebrow: string;
    title: string;
    items: { id: string; title: string; desc: string }[];
  };
  how: {
    eyebrow: string;
    title: string;
    desc: string;
    steps: { num: string; title: string; desc: string }[];
  };
  faq: { eyebrow: string; title: string; items: FaqItem[] };
  cta: { title1: string; title2: string; desc: string; primary: string; secondary: string };
  bottomHint: string;
  footerLeft: string;
  footerRight: string;
};

const COPY: Record<Lang, Copy> = {
  ko: {
    nav: { features: "기록", how: "사용 방법", faq: "FAQ", openDashboard: "대시보드 열기" },
    bar: { name: "SleepLab", cta: "기록 시작" },
    hero: {
      badge: "착용 기기 없음",
      title: "SleepLab",
      sub: "잠든 사이의 자세를 자동으로 기록합니다.",
      scroll: "아래로",
    },
    intro: {
      title: "잠자는 동안의 자세, 한 화면으로",
      desc: "카메라 한 대로 밤사이 자세를 기록하고, 아침에 정리된 결과를 보여드립니다.",
    },
    big: {
      eyebrow: "장시간 자세 감지",
      title: "한 자세에 너무 오래 머문 시간을\n자동으로 잡아냅니다",
      body: "같은 자세로 30분 이상 이어진 구간을 자동으로 표시합니다. 어깨가 결리는 이유나 허리가 무거운 이유를 추측 대신 데이터로 확인할 수 있어요.",
      cards: {
        visual: {
          eyebrow: "정체 구간",
          title: "장시간 누운 자세 자동 표시",
          desc: "30분을 넘은 구간을 색으로 강조해서 보여드립니다.",
        },
        quote: {
          text: "“불편한 부위가 어느 자세에서 비롯됐는지 추측하지 않아도 되니까 도움이 됩니다.”",
          author: "베타 사용자",
          role: "HCI 연구실, 2026",
        },
        link: {
          eyebrow: "자세 가이드",
          title: "자세별 의미 살펴보기",
          desc: "여섯 가지 자세 분류와 각각의 영향을 정리했습니다.",
          href: "/info",
        },
      },
    },
    preview: {
      title: "어제 밤이 한 화면에",
      items: [
        {
          eyebrow: "자세 분포",
          title: "도넛 차트로 정리",
          desc: "여섯 가지 자세를 시간 비율로.",
        },
        {
          eyebrow: "타임라인",
          title: "잠든 순간부터 깨어난 순간까지",
          desc: "0.5초 간격으로 기록된 자세를 한 줄에 펼칩니다.",
        },
        {
          eyebrow: "움직임",
          title: "자세 전환 횟수",
          desc: "시간대별 활동량과 함께.",
        },
      ],
    },
    thin: {
      title: "침대 옆에 두기만 하면 끝",
      rotating: [
        "적외선 깊이 센서 — 어두운 방에서도 작동",
        "착용 기기 0개 — 평소처럼 자면 됩니다",
        "영상은 저장되지 않음 — 자세 라벨만 추출",
      ],
      note: "* SleepLab은 Kinect 카메라 기반 연구·자기관찰 도구이며, 의료 진단을 대체하지 않습니다.",
    },
    tracking: {
      eyebrow: "기록 항목",
      title: "잠든 시간을 네 가지 시각으로",
      desc: "어떤 자세로 얼마나 머물렀고, 언제 뒤척였는지를 정리해 보여드립니다.",
      items: [
        {
          id: "distribution",
          title: "자세 분포",
          desc: "여섯 가지 자세를 시간 비율로. 가장 오래 머문 자세를 강조해 보여드려요.",
        },
        {
          id: "timeline",
          title: "야간 타임라인",
          desc: "잠든 순간부터 깨어난 순간까지, 0.5초 단위 자세를 시간 축에 펼칩니다.",
        },
        {
          id: "longhold",
          title: "장시간 자세",
          desc: "30분 이상 같은 자세로 머문 구간을 자동으로 표시합니다.",
        },
        {
          id: "movement",
          title: "움직임",
          desc: "자세 전환 횟수와 시간대별 활동량을 정리합니다.",
        },
      ],
    },
    morning: {
      eyebrow: "아침에",
      title: "깨어나면 정리된 결과가 기다립니다",
      desc: "잠자는 동안 모인 데이터가 한 화면에 정돈되어 있어요.",
      items: [
        {
          id: "wake",
          title: "오늘 밤 요약",
          desc: "자세 분포, 정체 구간, 전환 횟수를 한 카드로.",
        },
        {
          id: "report",
          title: "기록 다시 보기",
          desc: "과거 기록을 날짜별로 다시 펼쳐볼 수 있습니다.",
        },
        {
          id: "trend",
          title: "주간 트렌드",
          desc: "이번 주 자세가 어느 쪽으로 쏠렸는지 한눈에.",
        },
      ],
    },
    extra: {
      eyebrow: "그 외에",
      title: "사용하면서 챙기게 되는 것들",
      items: [
        { id: "setup", title: "1분 셋업", desc: "카메라만 거치하면 준비 완료." },
        { id: "privacy", title: "프라이버시", desc: "영상은 저장되지 않고 자세 라벨만 기록됩니다." },
        { id: "darkroom", title: "어두운 방", desc: "적외선 깊이 센서로 불 끈 침실에서도 인식." },
        { id: "open", title: "데이터 직접 접근", desc: "본인 계정에서 직접 조회·삭제할 수 있습니다." },
        { id: "browser", title: "어떤 브라우저든", desc: "결과 확인은 모던 브라우저면 됩니다." },
      ],
    },
    how: {
      eyebrow: "사용 방법",
      title: "세 단계면 끝",
      desc: "카메라 거치 → 잠들기 → 아침에 확인.",
      steps: [
        { num: "01", title: "카메라 거치", desc: "Kinect 카메라를 침대 쪽으로 설치하고 캡처를 시작합니다." },
        { num: "02", title: "잠들기", desc: "평소처럼 자면 됩니다. 자세는 자동으로 기록됩니다." },
        { num: "03", title: "아침에 확인", desc: "대시보드를 열어 자세 분포와 타임라인을 봅니다." },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "자주 묻는 질문",
      items: [
        { q: "데이터는 어디에 저장되나요?", a: "본인 계정에만 저장됩니다. 직접 조회·삭제할 수 있고, 외부로 공유되지 않습니다." },
        { q: "카메라가 영상을 그대로 저장하나요?", a: "아니요. 추출된 자세 라벨만 저장되며, 원본 영상은 남지 않습니다." },
        { q: "어떤 기기가 필요하나요?", a: "자세 캡처는 Kinect 카메라가 연결된 PC에서 동작합니다. 결과 확인은 어떤 브라우저에서든 됩니다." },
        { q: "조명이 어두워도 작동하나요?", a: "적외선 깊이 센서를 사용하기 때문에 불 끈 침실에서도 자세를 인식합니다." },
        { q: "의료 진단으로 쓸 수 있나요?", a: "아니요. SleepLab은 자기관찰을 위한 도구이며, 의료 진단이나 치료를 대체하지 않습니다." },
      ],
    },
    cta: {
      title1: "오늘 밤,",
      title2: "기록을 시작해보세요",
      desc: "카메라 거치 1분이면 준비 완료.\n나머지는 알아서 정리됩니다.",
      primary: "기록 시작",
      secondary: "대시보드 둘러보기",
    },
    bottomHint: "좋은 꿈 꾸세요",
    footerLeft: "SleepLab · HCI Team 5",
    footerRight: "자세 기록 도구",
  },
  en: {
    nav: { features: "What's tracked", how: "How it works", faq: "FAQ", openDashboard: "Open dashboard" },
    bar: { name: "SleepLab", cta: "Start recording" },
    hero: {
      badge: "No wearables",
      title: "SleepLab",
      sub: "Sleep posture, recorded automatically through the night.",
      scroll: "Scroll",
    },
    intro: {
      title: "A night of sleep, organized on one screen",
      desc: "One camera records your posture through the night. The dashboard shows it organized in the morning.",
    },
    big: {
      eyebrow: "Long-hold detection",
      title: "We catch the stretches you held\ntoo long, automatically",
      body: "Anything over 30 minutes in the same posture gets flagged. Find a data answer for that morning shoulder ache instead of guessing.",
      cards: {
        visual: {
          eyebrow: "Held too long",
          title: "Auto-flagged stretches",
          desc: "30-min+ stretches highlighted by color on the timeline.",
        },
        quote: {
          text: "“It's helpful not having to guess which posture caused the soreness.”",
          author: "Beta user",
          role: "HCI lab, 2026",
        },
        link: {
          eyebrow: "Posture guide",
          title: "What each posture means",
          desc: "A walkthrough of the six postures and how they affect your body.",
          href: "/info",
        },
      },
    },
    preview: {
      title: "Last night, on one screen",
      items: [
        { eyebrow: "Distribution", title: "Donut breakdown", desc: "Six postures, by minutes." },
        { eyebrow: "Timeline", title: "Slept to woke", desc: "0.5-second samples laid across the night." },
        { eyebrow: "Movement", title: "Turn count", desc: "With per-hour activity." },
      ],
    },
    thin: {
      title: "Sits next to your bed. That's it.",
      rotating: [
        "Infrared depth sensing — works in the dark",
        "Zero wearables — sleep as you normally would",
        "No raw video stored — only posture labels",
      ],
      note: "* SleepLab is a Kinect-based research and self-tracking tool, not a substitute for medical diagnosis.",
    },
    tracking: {
      eyebrow: "What's tracked",
      title: "Four views of your night",
      desc: "How long you held each posture, when you turned, and where the still stretches were.",
      items: [
        {
          id: "distribution",
          title: "Posture distribution",
          desc: "Six postures by minutes — the longest-held one highlighted.",
        },
        {
          id: "timeline",
          title: "Night timeline",
          desc: "Postures sampled every 0.5 second across the full night.",
        },
        {
          id: "longhold",
          title: "Long holds",
          desc: "Stretches over 30 minutes in one posture, auto-flagged.",
        },
        {
          id: "movement",
          title: "Movement",
          desc: "Posture transition count and per-hour activity.",
        },
      ],
    },
    morning: {
      eyebrow: "In the morning",
      title: "Wake up to a finished read",
      desc: "Captured while you slept, ready by the time you open your eyes.",
      items: [
        {
          id: "wake",
          title: "Tonight's summary",
          desc: "Distribution, long holds, transitions in one card.",
        },
        {
          id: "report",
          title: "Replay sessions",
          desc: "Open any past night by date.",
        },
        {
          id: "trend",
          title: "Weekly trend",
          desc: "See which side took the load this week.",
        },
      ],
    },
    extra: {
      eyebrow: "Other things",
      title: "Quiet niceties you'll notice using it",
      items: [
        { id: "setup", title: "1-minute setup", desc: "Just point the camera at the bed." },
        { id: "privacy", title: "Privacy first", desc: "Raw video isn't stored — only posture labels." },
        { id: "darkroom", title: "Dark-room ready", desc: "Reads posture without any visible light." },
        { id: "open", title: "Direct data access", desc: "Read or delete your own records anytime." },
        { id: "browser", title: "Any modern browser", desc: "Reading the dashboard works anywhere." },
      ],
    },
    how: {
      eyebrow: "How it works",
      title: "Three steps",
      desc: "Mount the camera → sleep → check in the morning.",
      steps: [
        { num: "01", title: "Mount the camera", desc: "Aim the Kinect at the bed and start the capture." },
        { num: "02", title: "Fall asleep", desc: "Sleep as usual. Your posture is logged automatically." },
        { num: "03", title: "Check in the morning", desc: "Open the dashboard to see the distribution and timeline." },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked",
      items: [
        { q: "Where is my data stored?", a: "In your own account only. You can read or delete it directly, and it isn't shared with third parties." },
        { q: "Does the camera save raw video?", a: "No. Only posture labels are extracted and stored — the original video stream is never written to disk." },
        { q: "What hardware do I need?", a: "Posture capture runs on a PC with a Kinect camera attached. Reading the dashboard works on any modern browser." },
        { q: "Does it work in a dark room?", a: "Yes. Infrared depth sensing reads posture without any visible light." },
        { q: "Is this a medical device?", a: "No. SleepLab is a self-tracking tool, not a substitute for medical diagnosis or treatment." },
      ],
    },
    cta: {
      title1: "Tonight,",
      title2: "leave your first record",
      desc: "About a minute to set up the camera.\nThe rest takes care of itself.",
      primary: "Start recording",
      secondary: "Browse dashboard",
    },
    bottomHint: "Sweet dreams",
    footerLeft: "SleepLab · HCI Team 5",
    footerRight: "Posture tracking tool",
  },
};

const EXTRA_ICONS: Record<string, typeof Camera> = {
  setup: Zap,
  privacy: Lock,
  darkroom: Eye,
  open: CheckCircle2,
  browser: Monitor,
};

const STEP_ICONS = [Camera, Moon, LineChart];

const svgUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")}`;

const BED_SVG_URI = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 460"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient><radialGradient id="glow" cx="0.7" cy="0.3" r="0.6"><stop offset="0" stop-color="#8b5cf6" stop-opacity="0.4"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient></defs><rect width="600" height="460" fill="url(#bg)"/><rect width="600" height="460" fill="url(#glow)"/><rect x="100" y="240" width="400" height="100" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(196,181,253,0.35)" stroke-width="1.5"/><rect x="140" y="180" width="140" height="70" rx="14" fill="rgba(196,181,253,0.12)" stroke="rgba(196,181,253,0.4)" stroke-width="1.2"/><rect x="100" y="340" width="400" height="28" rx="6" fill="rgba(255,255,255,0.04)"/><circle cx="430" cy="160" r="10" fill="#f7d488"/><circle cx="430" cy="160" r="18" fill="none" stroke="#f7d488" stroke-opacity="0.4" stroke-width="1.5"/><line x1="430" y1="160" x2="290" y2="240" stroke="rgba(247,212,136,0.4)" stroke-width="1.2" stroke-dasharray="3 4"/></svg>`);

const MASONRY_TILES = [
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="400" height="400" fill="url(#g1)"/><circle cx="200" cy="200" r="100" fill="none" stroke="#8b5cf6" stroke-width="36" stroke-dasharray="160 80" stroke-linecap="round"/><circle cx="200" cy="200" r="100" fill="none" stroke="#f7d488" stroke-width="36" stroke-dasharray="80 160" stroke-dashoffset="-160" stroke-linecap="round"/><circle cx="200" cy="200" r="100" fill="none" stroke="#c4b5fd" stroke-width="36" stroke-dasharray="40 200" stroke-dashoffset="-240" stroke-linecap="round"/><text x="200" y="206" text-anchor="middle" font-family="ui-sans-serif" font-size="34" font-weight="800" fill="#f5f3ff">7h 42m</text><text x="200" y="230" text-anchor="middle" font-family="ui-sans-serif" font-size="11" letter-spacing="2" fill="rgba(245,243,255,0.6)">DISTRIBUTION</text></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient><linearGradient id="bar1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#f7d488"/></linearGradient></defs><rect width="400" height="280" fill="url(#g2)"/><g><rect x="40" y="60" width="320" height="14" rx="7" fill="rgba(255,255,255,0.08)"/><rect x="40" y="60" width="290" height="14" rx="7" fill="url(#bar1)"/><rect x="40" y="92" width="320" height="14" rx="7" fill="rgba(255,255,255,0.08)"/><rect x="40" y="92" width="180" height="14" rx="7" fill="url(#bar1)"/><rect x="40" y="124" width="320" height="14" rx="7" fill="rgba(255,255,255,0.08)"/><rect x="40" y="124" width="240" height="14" rx="7" fill="url(#bar1)"/><rect x="40" y="156" width="320" height="14" rx="7" fill="rgba(255,255,255,0.08)"/><rect x="40" y="156" width="120" height="14" rx="7" fill="url(#bar1)"/><rect x="40" y="188" width="320" height="14" rx="7" fill="rgba(255,255,255,0.08)"/><rect x="40" y="188" width="260" height="14" rx="7" fill="url(#bar1)"/></g><text x="40" y="240" font-family="ui-sans-serif" font-size="11" letter-spacing="2" fill="rgba(245,243,255,0.55)">NIGHT TIMELINE · 0.5s SAMPLES</text></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient><linearGradient id="vbar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#f7d488"/></linearGradient></defs><rect width="400" height="360" fill="url(#g3)"/><g transform="translate(40 60)"><rect x="0" y="120" width="34" height="120" rx="6" fill="url(#vbar)"/><rect x="46" y="60" width="34" height="180" rx="6" fill="url(#vbar)"/><rect x="92" y="160" width="34" height="80" rx="6" fill="url(#vbar)"/><rect x="138" y="40" width="34" height="200" rx="6" fill="url(#vbar)"/><rect x="184" y="100" width="34" height="140" rx="6" fill="url(#vbar)"/><rect x="230" y="80" width="34" height="160" rx="6" fill="url(#vbar)"/><rect x="276" y="140" width="34" height="100" rx="6" fill="url(#vbar)"/></g><text x="40" y="320" font-family="ui-sans-serif" font-size="11" letter-spacing="2" fill="rgba(245,243,255,0.55)">MOVEMENT · TURNS PER HOUR</text></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="400" height="240" fill="url(#g4)"/><text x="40" y="80" font-family="ui-sans-serif" font-size="14" letter-spacing="3" fill="rgba(196,181,253,0.7)">LONGEST HOLD</text><text x="40" y="148" font-family="ui-sans-serif" font-size="56" font-weight="200" fill="#f5f3ff">41 min</text><text x="40" y="180" font-family="ui-sans-serif" font-size="12" fill="rgba(245,243,255,0.55)">supine · 02:14 — 02:55</text><circle cx="350" cy="70" r="6" fill="#f7d488"/></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="400" height="320" fill="url(#g5)"/><g transform="translate(60 60)"><rect x="0" y="0" width="280" height="200" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(196,181,253,0.2)"/><circle cx="140" cy="100" r="60" fill="none" stroke="#8b5cf6" stroke-width="8" stroke-dasharray="220 100"/><text x="140" y="106" text-anchor="middle" font-family="ui-sans-serif" font-size="22" font-weight="700" fill="#f5f3ff">82</text></g><text x="60" y="290" font-family="ui-sans-serif" font-size="11" letter-spacing="2" fill="rgba(245,243,255,0.5)">WEEKLY · % SIDE-SLEEP</text></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><defs><linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="400" height="280" fill="url(#g6)"/><polyline points="40,180 80,160 120,170 160,120 200,140 240,90 280,110 320,80 360,100" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="40,200 80,190 120,195 160,170 200,180 240,150 280,160 320,140 360,150" fill="none" stroke="#f7d488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 4"/><text x="40" y="240" font-family="ui-sans-serif" font-size="11" letter-spacing="2" fill="rgba(245,243,255,0.55)">7-DAY TREND</text></svg>`),
];

const TRACK_TILES = [
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="t1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="240" height="240" fill="url(#t1)"/><circle cx="120" cy="120" r="60" fill="none" stroke="#8b5cf6" stroke-width="22" stroke-dasharray="120 60" stroke-linecap="round"/><circle cx="120" cy="120" r="60" fill="none" stroke="#f7d488" stroke-width="22" stroke-dasharray="60 120" stroke-dashoffset="-120" stroke-linecap="round"/><circle cx="120" cy="120" r="60" fill="none" stroke="#c4b5fd" stroke-width="22" stroke-dasharray="30 150" stroke-dashoffset="-180" stroke-linecap="round"/></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="t2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient><linearGradient id="t2b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#f7d488"/></linearGradient></defs><rect width="240" height="240" fill="url(#t2)"/><g transform="translate(30 70)"><rect x="0" y="0" width="180" height="14" rx="7" fill="url(#t2b)"/><rect x="0" y="28" width="120" height="14" rx="7" fill="url(#t2b)" opacity="0.7"/><rect x="0" y="56" width="160" height="14" rx="7" fill="url(#t2b)" opacity="0.85"/><rect x="0" y="84" width="100" height="14" rx="7" fill="url(#t2b)" opacity="0.6"/></g></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="t3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1645"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient></defs><rect width="240" height="240" fill="url(#t3)"/><circle cx="120" cy="120" r="56" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/><circle cx="120" cy="120" r="56" fill="none" stroke="#f7d488" stroke-width="10" stroke-dasharray="200 152" stroke-linecap="round" transform="rotate(-90 120 120)"/><text x="120" y="116" text-anchor="middle" font-family="ui-sans-serif" font-size="28" font-weight="200" fill="#f5f3ff">41</text><text x="120" y="140" text-anchor="middle" font-family="ui-sans-serif" font-size="10" letter-spacing="2" fill="rgba(245,243,255,0.55)">MIN</text></svg>`),
  svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="t4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0b0a1f"/></linearGradient><linearGradient id="t4v" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#f7d488"/></linearGradient></defs><rect width="240" height="240" fill="url(#t4)"/><g transform="translate(30 60)"><rect x="0" y="80" width="22" height="80" rx="4" fill="url(#t4v)"/><rect x="30" y="40" width="22" height="120" rx="4" fill="url(#t4v)"/><rect x="60" y="100" width="22" height="60" rx="4" fill="url(#t4v)"/><rect x="90" y="20" width="22" height="140" rx="4" fill="url(#t4v)"/><rect x="120" y="60" width="22" height="100" rx="4" fill="url(#t4v)"/><rect x="150" y="50" width="22" height="110" rx="4" fill="url(#t4v)"/></g></svg>`),
];

export default function LandingPage() {
  const { lang } = useLang();
  const t = COPY[lang];
  const [scrolled, setScrolled] = useState(false);
  const [rotIndex, setRotIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setRotIndex((i) => (i + 1) % t.thin.rotating.length),
      2600
    );
    return () => clearInterval(id);
  }, [t.thin.rotating.length]);

  return (
    <div className="animate-fade-in relative">
      {/* ─── Sticky order bar (Withings-style) ─── */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md transition-transform duration-300 ${
          scrolled ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center size-8 rounded-xl bg-gradient-to-br from-primary to-primary-2 shrink-0">
              <Moon className="size-3.5 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {t.bar.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {t.hero.sub}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#tracked" className="hover:text-foreground">{t.nav.features}</a>
            <a href="#how" className="hover:text-foreground">{t.nav.how}</a>
            <a href="#faq" className="hover:text-foreground">{t.nav.faq}</a>
          </div>
          <Link
            href="/record"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-2 text-white text-xs font-semibold whitespace-nowrap hover:shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] transition-shadow"
          >
            {t.bar.cta}
          </Link>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-[1]">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={[10, 14, 18]}
            lineDistance={[8, 6, 4]}
            linesGradient={["#8b5cf6", "#6366f1", "#c4b5fd", "#f7d488"]}
            bendRadius={5}
            bendStrength={-0.5}
            interactive
            parallax
            parallaxStrength={0.15}
            animationSpeed={0.7}
            mixBlendMode="screen"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/55 to-background/95 z-[2] pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 38% at 50% 48%, rgba(11,10,31,0.55), transparent 70%)",
          }}
        />

        {/* Top nav */}
        <nav className="absolute top-0 left-0 right-0 z-10 px-8 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-foreground">
              <span className="relative grid place-items-center size-9 rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)]">
                <Moon className="size-4 text-white" />
                <Sparkles className="size-2.5 text-accent absolute -top-0.5 -right-0.5 animate-pulse-soft" />
              </span>
              Sleep<span className="hero-gradient-text">Lab</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#tracked" className="hover:text-foreground transition-colors">{t.nav.features}</a>
              <a href="#how" className="hover:text-foreground transition-colors">{t.nav.how}</a>
              <a href="#faq" className="hover:text-foreground transition-colors">{t.nav.faq}</a>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-5 py-2 rounded-xl border border-primary-3/50 text-primary-3 text-sm font-semibold hover:bg-primary/15 hover:border-primary-3 transition-colors"
              >
                {t.nav.openDashboard}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero center: badge → title → tagline → product visual */}
        <div className="relative z-10 px-8 max-w-3xl mx-auto pt-24">
          <ScrollReveal direction="up" delay={0.05}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary-3/30 text-[11px] uppercase tracking-[0.18em] text-primary-3 mb-6">
              <CheckCircle2 className="size-3" />
              {t.hero.badge}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.12}>
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-extrabold leading-[1] tracking-tight mb-5 text-foreground">
              <span className="hero-gradient-text">{t.hero.title}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <p
              className="text-lg md:text-xl text-foreground leading-relaxed mb-12 max-w-xl mx-auto font-medium"
              style={{ textShadow: "0 2px 24px rgba(11,10,31,0.7)" }}
            >
              {t.hero.sub}
            </p>
          </ScrollReveal>

          {/* Refined spec strip — replaces the camera card */}
          <ScrollReveal direction="up" delay={0.28}>
            <div className="mx-auto max-w-xl flex items-stretch justify-center divide-x divide-border-strong/40">
              <div className="px-6 md:px-10 py-1 text-center">
                <div className="text-2xl md:text-3xl font-light tracking-tight text-foreground tabular-nums">
                  6
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  postures
                </div>
              </div>
              <div className="px-6 md:px-10 py-1 text-center">
                <div className="text-2xl md:text-3xl font-light tracking-tight text-foreground tabular-nums">
                  0.5<span className="text-muted-foreground/60 text-base font-light">s</span>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  sampling
                </div>
              </div>
              <div className="px-6 md:px-10 py-1 text-center">
                <div className="text-2xl md:text-3xl font-light tracking-tight text-foreground tabular-nums">
                  IR
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  depth sensing
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.5}>
            <div className="mt-12 inline-flex items-center gap-2 text-xs text-muted-foreground/70">
              <ArrowDown className="size-3.5 animate-pulse-soft" /> {t.hero.scroll}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Wordmark marquee ─── */}
      <section className="relative py-10 md:py-12 border-y border-border/40 bg-background-2/40 overflow-hidden">
        <div className="marquee-mask">
          <div className="flex animate-marquee gap-14 md:gap-20 whitespace-nowrap items-center w-max">
            {Array.from({ length: 2 }).flatMap((_, dup) => [
              <span
                key={`a-${dup}`}
                className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-foreground-soft/90"
              >
                Posture Tracking
              </span>,
              <span
                key={`b-${dup}`}
                className="text-2xl md:text-3xl italic font-light text-foreground-soft/70"
              >
                Night Timeline
              </span>,
              <span
                key={`c-${dup}`}
                className="text-2xl md:text-3xl font-medium tracking-[0.22em] uppercase text-primary-3/80"
              >
                IR · Depth
              </span>,
              <span
                key={`d-${dup}`}
                className="text-3xl md:text-4xl font-bold lowercase text-foreground-soft/85"
              >
                long-hold
              </span>,
              <span
                key={`e-${dup}`}
                className="text-2xl md:text-3xl italic text-accent/80"
              >
                Movement Insights
              </span>,
              <span
                key={`f-${dup}`}
                className="text-2xl md:text-3xl font-light text-foreground-soft/70 tracking-wide"
              >
                30-min Holds
              </span>,
              <span
                key={`g-${dup}`}
                className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.18em] text-foreground-soft/85"
              >
                Self-Tracking
              </span>,
              <span
                key={`h-${dup}`}
                className="text-2xl md:text-3xl italic font-light text-primary-3/75"
              >
                Posture Distribution
              </span>,
              <span
                key={`i-${dup}`}
                className="text-2xl md:text-3xl font-medium text-foreground-soft/80 lowercase"
              >
                six positions
              </span>,
              <span
                key={`j-${dup}`}
                className="text-2xl md:text-3xl font-light tracking-[0.3em] uppercase text-muted-foreground/80"
              >
                HCI · 2026
              </span>,
            ])}
          </div>
        </div>
      </section>

      {/* ─── Big intro centered ─── */}
      <section className="px-8 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.15]">
              {t.intro.title}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-lg md:text-xl text-foreground-soft/80 leading-relaxed">
              {t.intro.desc}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Big feature: 2-col header + 3-card row ─── */}
      <section className="px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-primary-3 font-semibold mb-4">
                  {t.big.eyebrow}
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] whitespace-pre-line">
                  {t.big.title}
                </h2>
              </div>
              <div className="md:pt-12">
                <p className="text-base md:text-lg text-foreground-soft/85 leading-relaxed">
                  {t.big.body}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visual card */}
            <ScrollReveal delay={0.05}>
              <GlassSurface
                width="100%"
                height={340}
                borderRadius={24}
                backgroundOpacity={0.18}
                brightness={55}
                opacity={0.9}
                blur={11}
                displace={2}
                distortionScale={-120}
                redOffset={5}
                greenOffset={15}
                blueOffset={25}
                mixBlendMode="screen"
              >
                <div className="relative w-full h-full overflow-hidden rounded-[24px]">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary-2/15 to-accent/15"
                  />
                  <div className="relative z-10 p-6 w-full h-full flex flex-col justify-between text-left">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-primary-3/90 font-semibold">
                      {t.big.cards.visual.eyebrow}
                    </div>
                    <div className="my-2">
                      <div className="space-y-2">
                        <div className="h-3 rounded-full bg-muted-2 overflow-hidden">
                          <div className="h-full w-[72%] bg-gradient-to-r from-primary/40 via-accent/70 to-accent" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground/80 font-mono">
                          <span>23:00</span>
                          <span className="text-accent font-semibold">⚠ 41 min</span>
                          <span>06:30</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1.5">
                        {t.big.cards.visual.title}
                      </h3>
                      <p className="text-sm text-foreground-soft/85 leading-relaxed">
                        {t.big.cards.visual.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassSurface>
            </ScrollReveal>

            {/* Quote card */}
            <ScrollReveal delay={0.1}>
              <GlassSurface
                width="100%"
                height={340}
                borderRadius={24}
                backgroundOpacity={0.18}
                brightness={55}
                opacity={0.9}
                blur={11}
                displace={2}
                distortionScale={-120}
                redOffset={5}
                greenOffset={15}
                blueOffset={25}
                mixBlendMode="screen"
              >
                <div className="relative w-full h-full p-6 flex flex-col justify-between text-left overflow-hidden rounded-[24px]">
                  <Quote className="size-7 text-primary-3/50" />
                  <p className="text-base md:text-lg text-foreground leading-relaxed my-4">
                    {t.big.cards.quote.text}
                  </p>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {t.big.cards.quote.author}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.big.cards.quote.role}
                    </div>
                  </div>
                </div>
              </GlassSurface>
            </ScrollReveal>

            {/* Link card */}
            <ScrollReveal delay={0.15}>
              <Link href={t.big.cards.link.href} className="block group">
                <GlassSurface
                  width="100%"
                  height={340}
                  borderRadius={24}
                  backgroundOpacity={0.18}
                  brightness={55}
                  opacity={0.9}
                  blur={11}
                  displace={2}
                  distortionScale={-120}
                  redOffset={5}
                  greenOffset={15}
                  blueOffset={25}
                  mixBlendMode="screen"
                >
                  <div className="relative w-full h-full p-6 flex flex-col justify-between text-left overflow-hidden rounded-[24px]">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-primary-3/90 font-semibold mb-3">
                        {t.big.cards.link.eyebrow}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {t.big.cards.link.title}
                      </h3>
                      <p className="text-sm text-foreground-soft/85 leading-relaxed">
                        {t.big.cards.link.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-3 mt-6 group-hover:gap-3 transition-all">
                      <span>↗</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                </GlassSurface>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── 3-column app preview ─── */}
      <section className="px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-12 text-center">
              {t.preview.title}
            </h2>
          </ScrollReveal>

          <div
            className="relative w-full mb-6"
            style={{ height: 720 }}
          >
            <Masonry
              items={[
                { id: "tile-1", img: MASONRY_TILES[0], height: 560 },
                { id: "tile-2", img: MASONRY_TILES[1], height: 360 },
                { id: "tile-3", img: MASONRY_TILES[2], height: 500 },
                { id: "tile-4", img: MASONRY_TILES[3], height: 320 },
                { id: "tile-5", img: MASONRY_TILES[4], height: 440 },
                { id: "tile-6", img: MASONRY_TILES[5], height: 380 },
              ]}
              ease="power3.out"
              duration={0.6}
              stagger={0.05}
              animateFrom="bottom"
              scaleOnHover
              hoverScale={0.97}
              blurToFocus
            />
          </div>

        </div>
      </section>

      {/* ─── "Thin" rotating-feature section ─── */}
      <section className="px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground text-center mb-16 leading-[1.1]">
              {t.thin.title}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="up">
              <TiltedCard
                imageSrc={BED_SVG_URI}
                altText="SleepLab — bedside camera setup"
                captionText="Camera at the bedside"
                containerHeight="380px"
                containerWidth="100%"
                imageHeight="380px"
                imageWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip
              />
            </ScrollReveal>

            <div>
              <div className="space-y-3 min-h-[180px]">
                {t.thin.rotating.map((line, i) => (
                  <div
                    key={line}
                    className={`flex items-start gap-3 transition-all duration-500 ${
                      i === rotIndex
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  >
                    <div
                      className={`size-2 rounded-full mt-2.5 transition-colors ${
                        i === rotIndex ? "bg-accent" : "bg-muted-2"
                      }`}
                    />
                    <p
                      className={`text-base md:text-lg leading-relaxed transition-colors ${
                        i === rotIndex ? "text-foreground" : "text-foreground-soft/60"
                      }`}
                    >
                      {line}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-xs text-muted-foreground/70 leading-relaxed">
                {t.thin.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tracking 4-card grid ─── */}
      <section id="tracked" className="px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary-3/20 text-[11px] uppercase tracking-[0.18em] text-primary-3 mb-4">
                <Star className="size-3" /> {t.tracking.eyebrow}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
                {t.tracking.title}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t.tracking.desc}</p>
            </div>
          </ScrollReveal>

          <div className="relative" style={{ minHeight: 460 }}>
            <ChromaGrid
              items={t.tracking.items.map((item, i) => ({
                image: TRACK_TILES[i] ?? TRACK_TILES[0],
                title: item.title,
                subtitle: item.desc,
                handle: item.id.toUpperCase(),
                borderColor: ["#8b5cf6", "#6366f1", "#f7d488", "#c4b5fd"][i],
                gradient: [
                  "linear-gradient(145deg, #8b5cf6, #0b0a1f)",
                  "linear-gradient(145deg, #6366f1, #0b0a1f)",
                  "linear-gradient(165deg, #f7d488, #0b0a1f)",
                  "linear-gradient(145deg, #c4b5fd, #0b0a1f)",
                ][i],
              }))}
              radius={280}
              columns={4}
              rows={1}
              damping={0.5}
              fadeOut={0.5}
            />
          </div>
        </div>
      </section>

      {/* ─── Morning 3-card section ─── */}
      <section className="px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-[11px] uppercase tracking-[0.18em] text-primary-3/80 font-semibold mb-3">
                {t.morning.eyebrow}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
                {t.morning.title}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t.morning.desc}</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.morning.items.map((item, i) => (
              <ScrollReveal key={item.id} delay={0.06 * i}>
                <div className="h-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-md p-6">
                  {/* Mock browser frame */}
                  <div className="rounded-2xl border border-border/60 bg-background/60 overflow-hidden mb-5">
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 bg-muted-2/30">
                      <span className="size-1.5 rounded-full bg-red-400/60" />
                      <span className="size-1.5 rounded-full bg-yellow-400/60" />
                      <span className="size-1.5 rounded-full bg-green-400/60" />
                    </div>
                    <div className="aspect-[4/3] p-4 grid place-items-center">
                      <div className="w-full space-y-2">
                        <div className="h-2 rounded-full bg-muted-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent w-3/4" />
                        </div>
                        <div className="h-2 rounded-full bg-muted-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-2 to-primary-3 w-1/2" />
                        </div>
                        <div className="h-2 rounded-full bg-muted-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent to-primary-3 w-2/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-foreground-soft/80 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Additional features 5-icon grid ─── */}
      <section className="px-8 py-24 border-y border-border/40 bg-background-2/30">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="text-[11px] uppercase tracking-[0.18em] text-primary-3/80 font-semibold mb-3">
                {t.extra.eyebrow}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {t.extra.title}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {t.extra.items.map((item, i) => {
              const Icon = EXTRA_ICONS[item.id] ?? CheckCircle2;
              return (
                <ScrollReveal key={item.id} delay={0.04 * i}>
                  <div className="h-full p-5 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md">
                    <div className="size-10 rounded-xl bg-primary/15 grid place-items-center text-primary-3 mb-4">
                      <Icon className="size-5" />
                    </div>
                    <div className="font-semibold text-foreground text-sm mb-1.5">
                      {item.title}
                    </div>
                    <p className="text-xs text-foreground-soft/75 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="px-8 py-24 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-[11px] uppercase tracking-[0.18em] text-accent mb-4">
              <Clock className="size-3" /> {t.how.eyebrow}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              {t.how.title}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{t.how.desc}</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Camera;
            return (
              <ScrollReveal key={step.num} delay={0.08 * i} direction="up">
                <div className="relative p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md hover:border-primary-3/40 transition-all group">
                  {i < t.how.steps.length - 1 && (
                    <div className="absolute top-1/2 -right-3 w-6 h-px bg-border-strong hidden md:block" />
                  )}
                  <div className="mb-4 size-10 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 grid place-items-center text-primary-3 group-hover:text-accent transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div className="text-[10px] font-mono text-primary-3/70 mb-1 tracking-widest">
                    Step {step.num}
                  </div>
                  <h4 className="font-bold text-foreground mb-1.5 group-hover:text-primary-3 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-sm text-foreground-soft/85 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary-3/20 text-[11px] uppercase tracking-[0.18em] text-primary-3 mb-4">
                <HelpCircle className="size-3" /> {t.faq.eyebrow}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {t.faq.title}
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <ScrollReveal key={item.q} delay={0.05 * i} direction="up">
                <details className="group rounded-2xl border border-border/60 bg-card/30 backdrop-blur-md hover:border-primary-3/40 transition-colors">
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                    <span className="font-semibold text-foreground text-sm md:text-base">
                      {item.q}
                    </span>
                    <span className="size-7 rounded-full border border-border/70 grid place-items-center text-primary-3 transition-transform group-open:rotate-45">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-foreground-soft/85 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-8 py-28 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-primary/15 blur-[150px] rounded-full pointer-events-none"
        />
        <ScrollReveal direction="scale">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground">
              {t.cta.title1}
              <br />
              <span className="hero-gradient-text">{t.cta.title2}</span>
            </h2>
            <p className="text-foreground-soft/90 text-lg mb-10 leading-relaxed whitespace-pre-line">
              {t.cta.desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/record"
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-primary to-primary-2 text-white font-bold rounded-2xl text-lg transition-all hover:shadow-[0_22px_50px_-15px_rgba(139,92,246,0.7)] hover:scale-[1.02] inline-flex items-center justify-center gap-2"
              >
                {t.cta.primary}
                <ArrowUpRight className="size-5" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-border-strong font-bold text-lg hover:border-primary-3/60 transition-all text-foreground"
              >
                {t.cta.secondary}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Bottom hint ─── */}
      <div className="text-center pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 text-sm text-muted-foreground/70">
          <Sparkles className="size-3.5" /> {t.bottomHint}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{t.footerLeft}</span>
          <span>{t.footerRight}</span>
        </div>
      </footer>
    </div>
  );
}
