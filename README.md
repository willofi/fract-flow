# 🧠 MindMap AI (마인드맵 AI)

> **당신의 생각을 시각화하고 실시간으로 동기화하세요.**  
> 현대적인 창의적 워크플로우를 위해 구축된 프리미엄 고성능 마인드맵 애플리케이션입니다.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-11-FF0071?style=flat-square)](https://reactflow.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 목차
- [프로젝트 개요](#-프로젝트-개요)
- [기술 스택](#-기술-스택)
- [주요 기능](#-주요-기능)
- [상세 문서](#-상세-문서)
- [시작하기](#-시작하기)

---

## 🌟 프로젝트 개요

**MindMap AI**는 개인과 팀이 복잡한 아이디어를 시각적으로 정리할 수 있도록 설계된 전문가급 화이트보드 도구입니다. 무한 캔버스와 실시간 클라우드 영속성을 결합하여 브레인스토밍과 실행 사이의 원활한 가교 역할을 합니다.

### ✨ 하이라이트
- **수학적 정밀도**: 간격 없는 정렬과 픽셀 단위로 완벽한 노드 연결.
- **마크다운 & 코드 지원**: 노드 내 마크다운 렌더링 및 **실시간 코드 문법 하이라이팅** 지원.
- **마이크로 인터랙션 디자인**: 직관적인 조작을 위한 맞춤형 50/25/본체 인터랙션 모델 및 애니메이션 기반 UI.
- **SaaS 지원 아키텍처**: 전체 다크 모드 최적화, 실시간 자동 저장 및 헤더 기반 상태 동기화.

---

## 🛠 기술 스택

| 레이어 | 기술 | 용도 |
| :--- | :--- | :--- |
| **프론트엔드** | [Next.js 15 (App Router)](https://nextjs.org/) | 고성능의 현대적인 React 프레임워크. |
| **시각화** | [React Flow](https://reactflow.dev/) | 무한 캔버스 및 노드-엣지 관리. |
| **에디터** | [PrismJS](https://prismjs.com/) | 노드 내 실시간 코드 구문 분석 및 하이라이팅. |
| **백엔드** | [Supabase](https://supabase.com/) | 실시간 데이터베이스(PostgreSQL) 및 인증(Auth). |
| **상태 관리** | [Zustand](https://zustand-demo.pmnd.rs/) | 가볍고 견고한 클라이언트 측 상태 관리. |
| **데이터 페칭** | [TanStack Query](https://tanstack.com/query) | 서버 상태 동기화 및 캐싱. |
| **스타일링** | [Tailwind CSS v4](https://tailwindcss.com/) | 유틸리티 우선의 고성능 CSS. |
| **컴포넌트** | [shadcn/ui](https://ui.shadcn.com/) | 접근성이 뛰어나고 아름답게 디자인된 UI 프리미티브. |

---

## 🚀 주요 기능

### 1. 고급 노드 인터랙션
모든 노드는 세 개의 정밀한 영역으로 나뉩니다:
- **중앙 50%**: 직관적인 연결을 위한 앵커 포인트.
- **외부 25%**: 고정밀 크기 조절 핸들.
- **본체 내부**: 클릭 및 드래그를 통한 이동 워크스페이스.
- **실시간 편집**: 더블 클릭 시 즉각적인 마크다운 에디터 활성화 (코드 하이라이팅 포함).

### 2. 지능형 자동 저장 & 상태 동기화
"저장" 버튼이 따로 필요하지 않습니다. 애플리케이션은 유의미한 데이터 변경 사항을 모니터링하고 필요한 경우에만 Supabase에 동기화합니다. 현재 저장 상태(Syncing/Saved)는 상단 헤더에서 실시간으로 확인할 수 있습니다.

### 3. 전문가 수준의 미학
콘텐츠에 집중할 수 있도록 불필요한 요소를 배제한 단색 슬레이트(Slate) 테마와 함께 다크/라이트 모드를 완벽하게 지원합니다. 다크 모드에서는 가독성을 위해 노드 색상이 지능적으로 조정됩니다.

---

## 📑 상세 문서

기술적 구현에 대해 더 자세히 알아보려면 다음 모듈을 살펴보세요:

- [🛰️ **아키텍처 및 데이터 흐름**](./docs/ARCHITECTURE.md) - 시스템 디자인 및 로직 분석.
- [🔗 **인터랙션 모델**](./docs/INTERACTION.md) - 50/25/본체 영역 로직 및 연결 시스템.
- [💅 **디자인 시스템**](./docs/DESIGN.md) - 테마 일관성 및 CSS 엔지니어링.

---

## 🏁 시작하기

1. **클론 및 설치**
   ```bash
   git clone https://github.com/yourusername/mind-map.git
   npm install
   ```

2. **환경 설정**
   `.env.local` 파일을 생성합니다:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

---

## 📄 라이선스
MIT © [Eden](https://github.com/eden)
