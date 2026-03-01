# 🛰️ 아키텍처 및 데이터 흐름

이 문서는 MindMap AI의 기술적 중추를 구성하는 상태 관리, 백엔드 통합 및 동기화 로직에 대해 설명합니다.

---

## 🏗 시스템 개요

MindMap AI는 UI 응답성과 데이터 영속성 간의 균형을 맞추기 위해 **"Tri-State"** 동기화 모델을 사용합니다:

1.  **일시적 상태 (Transient State - React Flow)**: 즉각적인 마우스 움직임, 드래그 및 UI 피드백을 추적합니다.
2.  **로직 상태 (Logic State - Zustand)**: 활성 마인드맵의 데이터 소스(Source of Truth)를 저장합니다. "유의미한" 편집과 "일시적인" 노이즈를 구분하기 위해 변경 사항을 버전화합니다.
3.  **영구적 상태 (Persistent State - Supabase)**: 프로젝트의 장기적인 안전을 위한 클라우드 기반 PostgreSQL 저장소입니다.

---

## 🔄 버전 기반 자동 저장 로직

실시간 캔버스 도구에서 가장 까다로운 부분 중 하나는 **언제** 저장할지 결정하는 것입니다. 드래그할 때 모든 픽셀 단위로 저장하면 네트워크 혼잡이 발생하고, "저장" 클릭 시에만 저장하면 데이터 손실 위험이 있습니다.

### 구현 방식
`useMindMapStore.ts`에서 `version` 카운터를 구현했습니다:
- **구조적 변경**: 노드 추가/제거 또는 노드 이동이 완료되면 `version`이 증가합니다.
- **콘텐츠 변경**: 마크다운 편집이 완료되거나 맵 제목이 변경되면 `version`이 증가합니다.
- **일시적 액션**: 앵커 위에 마우스를 올리거나 노드를 선택하는 동작은 버전을 증가시키지 **않습니다**.

`MindMapContent` 컴포넌트는 이 `version`을 구독합니다. 버전이 변경되면 **1.2초 디바운스 타이머**가 시작됩니다. 추가 변경이 발생하지 않으면 데이터가 Supabase로 전송됩니다. 이를 통해 일련의 편집 작업이 단 한 번의 네트워크 요청으로 처리됩니다.

---

## ☁️ 글로벌 상태 동기화 (isSaving)

사용자가 현재 데이터가 안전하게 클라우드에 동기화되었는지 즉각적으로 알 수 있도록 **헤더 기반 상태 표시기**를 구현했습니다.

- **데이터 동기화**: `useMindMap` 훅의 `save.isPending` 상태를 `useMindMapStore`의 `isSaving` 전역 상태와 동기화합니다.
- **헤더 알림**: 전역 상태를 구독하는 `Header` 컴포넌트는 로고 바로 옆에 `Syncing` (애니메이션 포함) 또는 `Saved` 상태를 실시간으로 표시합니다. 이를 통해 사용자는 현재 작업 중인 데이터의 안전성을 한눈에 파악할 수 있습니다.

---

## 📊 데이터 스키마

React Flow 노드와 엣지의 동적인 특성을 지원하기 위해 PostgreSQL의 유연한 JSONB 스키마를 사용합니다:

```sql
CREATE TABLE maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- 소유자 식별
  title TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]', -- React Flow Node 객체
  edges JSONB NOT NULL DEFAULT '[]', -- React Flow Edge 객체
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 왜 JSONB인가요?
노드/엣지를 위한 전통적인 관계형 스키마는 복잡한 조인과 재귀 쿼리가 필요합니다. JSONB를 사용하면 전체 그래프를 **단일 원자성 작업(atomic operation)**으로 로드할 수 있어, PostgreSQL의 인덱싱 성능을 유지하면서도 거의 즉각적인 프로젝트 로딩 속도를 제공합니다.

---

## 🚀 내비게이션 및 ID 동기화

새 맵이 계속 중복 생성되는 "자동 복제(Auto-Cloning)" 버그를 방지하기 위해 **리디렉션 핸드셰이크(Redirection Handshake)** 시스템을 사용합니다:
1. 사용자가 `/map/new`로 진입합니다.
2. 첫 번째 자동 저장이 발생하면 Supabase에 맵이 생성됩니다.
3. 응답으로 새로운 UUID가 반환됩니다.
4. 애플리케이션은 즉시 `router.replace()`를 통해 `/map/[new-uuid]`로 이동합니다.
5. 이후의 저장 사항은 `insert`가 아닌 `update`로 올바르게 식별됩니다.

---

## 📡 기술 통합
- **TanStack Query**: 캐싱 레이어를 관리합니다. 사용자가 페이지를 이동하더라도 맵 데이터는 캐시에서 즉시 제공되며 백그라운드에서 최신 상태로 갱신됩니다.
- **Supabase SSR**: Next.js App Router와 통합되어 인증된 사용자만 자신의 마인드맵에 접근할 수 있도록 보안 정책(RLS)을 강화했습니다.
