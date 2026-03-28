<p align="center">
  <img src="./public/favicon.svg" alt="FractFlow Logo" width="88" />
</p>

# FractFlow

짧고 빠르게 생각을 연결하는 마인드맵 워크스페이스.
모바일/데스크톱 모두에서 Markdown 기반으로 노드를 편집하고, 흐름 중심으로 정리할 수 있습니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-11-FF0071?style=flat-square)](https://reactflow.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 핵심 기능

- 모바일 최적화 인터랙션
  - 선택/추가/연결/크기 모드 분리
  - 롱프레스 액션시트, 모드 힌트, 터치 우선 HUD
  - 모바일 전용 가이드(헤더 `?`) + 코치마크
- Markdown 노드 편집
  - 노드 내부 Markdown 작성/렌더링
  - 데스크톱/모바일 모두 편집 플로우 지원
- 권한 기반 읽기 전용 모드
  - 링크 조회는 가능
  - 수정/삭제는 소유자만 가능 (RLS + UI 가드)
  - 비소유자는 공유 중심 UX
- 안정적인 저장 경험
  - 자동 저장 + 수동 저장
  - 헤더에서 `Syncing` / `Saved` 상태 확인
- i18n 지원
  - 한국어 / 영어

## 기술 스택

- Next.js 16 (App Router)
- React Flow
- Supabase (Auth + Postgres + RLS)
- Zustand + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- next-intl
- Sonner (toast)

## 시작하기

1. 설치

```bash
git clone https://github.com/yourusername/fract-flow.git
cd fract-flow
npm install
```

2. 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

3. 개발 서버 실행

```bash
npm run dev
```

## 문서

- [아키텍처](./docs/ARCHITECTURE.md)
- [인터랙션 모델](./docs/INTERACTION.md)
- [디자인 시스템](./docs/DESIGN.md)
- [RLS 정책 예시](./docs/security/maps-rls.sql)

## 라이선스

MIT © [Eden](https://github.com/eden)
