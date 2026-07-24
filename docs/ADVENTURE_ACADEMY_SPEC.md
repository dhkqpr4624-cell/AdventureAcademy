# Adventure Academy 개발 명세서

## 5학년 2학기 1단원용 초기 버전

### 턴제 JRPG 전투·PNG 검 뷰모델·데이터 기반 스토리 시스템 반영본

아래 내용을 기준으로 **정적 싱글플레이 에듀테크 RPG 사이트**를 구현한다.

---

# 1. 프로젝트의 핵심 정체성

프로젝트명:

> **Adventure Academy · 어드벤처 아카데미**

장르:

> 퀴즈 학습을 중심으로 한 1인칭 던전 탐험형 에듀테크 RPG

이 프로젝트는 일반적인 RPG가 아니라, **RPG의 형식을 빌린 학습 사이트**다.

가장 중요한 원칙은 다음과 같다.

> 모든 게임 시스템은 학습 동기와 몰입을 높이기 위해 존재하며, 게임 요소가 학습보다 앞서서는 안 된다.

반드시 다음 원칙을 지킨다.

* 퀴즈 풀이와 해설 확인이 핵심 콘텐츠다.
* 정답은 플레이어의 공격 성공, 경험치, 성장 및 보상으로 이어진다.
* 오답은 플레이어의 공격 실패인 `MISS`로 표현한다.
* 오답 자체가 곧바로 플레이어에게 피해를 주는 규칙으로 표현하지 않는다.
* 몬스터는 살아 있다면 자신의 턴에 공격한다.
* 장비나 레벨이 정답을 대신하지 않는다.
* 장비에 따라 학생이 풀어야 할 문제 수가 달라지지 않는다.
* 오답 때문에 추가 문제를 생성하지 않는다.
* 반복 전투와 과도한 파밍을 강요하지 않는다.
* 지나친 확률 의존, 무기 강화, 장비 파괴를 넣지 않는다.
* 학생이 해설을 읽기 전에 화면이 자동으로 넘어가지 않는다.
* 게임 내 실패는 학습 실패로 낙인찍는 방식으로 표현하지 않는다.
* 한 번의 도전에 배정된 학습량은 정답률과 관계없이 고정한다.
* 무작위 요소는 전투 결과보다 연출과 소규모 보너스에만 사용한다.

핵심 문장:

> **고정된 학습량 안에서 문제 순서와 던전 경로는 달라질 수 있다. 정답은 플레이어 공격의 성공으로, 오답은 공격의 MISS로 표현한다. 몬스터는 살아 있는 동안 자신의 턴에 공격하며, 오답 때문에 추가 문제를 강요하지 않는다.**

---

# 2. 기술 스택과 배포

다음 기술을 사용한다.

* Vite
* React
* TypeScript
* Three.js
* GitHub Pages
* localStorage

사용하지 않는 것:

* Supabase
* 별도 서버
* 데이터베이스
* 로그인 시스템
* 실시간 통신
* 멀티플레이

정적 사이트로 완전히 동작해야 한다.

---

# 3. 단원별 독립 사이트 구조

각 교과 단원을 하나의 독립된 GitHub Pages 사이트로 만든다.

예:

```text
adventure-academy-5-2-1
adventure-academy-5-2-2
adventure-academy-5-2-3
```

각 사이트는 다음을 독립적으로 가진다.

* 문제 데이터
* 층 데이터
* 퀘스트
* NPC
* 몬스터
* 아이템
* 세이브 데이터
* 단원별 던전 텍스처
* 단원별 무기 PNG

5학년 2학기 1단원 사이트에서는 기본 무기 형태로 **검**만 사용한다.

다른 단원에서는 필요에 따라 다음 무기 테마로 확장할 수 있게 한다.

* 마법 스태프
* 활
* 지팡이
* 창
* 기타 단원별 무기

무기 시스템은 공통 인터페이스를 사용하되, 초기 버전에서는 검만 실제 구현한다.

---

# 4. 타이틀 화면

타이틀 화면에는 다음을 표시한다.

* Adventure Academy 로고
* 단원명
* 새로 시작하기
* 이어하기
* 설정

## 새로 시작하기

기존 저장 데이터가 없으면 바로 인트로를 시작한다.

기존 저장 데이터가 있다면 확인창을 표시한다.

```text
기존 모험 기록이 있습니다.
새로 시작하면 현재 기록이 초기화됩니다.

[취소] [새로 시작]
```

실수로 저장 데이터를 삭제하지 않도록 한 번 더 확인한다.

## 이어하기

다음 정보를 간단히 표시한다.

* 플레이어 레벨
* 현재 진행 층
* 현재 퀘스트
* 최근 저장 시각
* 플레이 시간

세이브 슬롯은 사이트당 하나만 사용한다.

---

# 5. 저장 시스템

저장은 localStorage를 사용한다.

저장 데이터에는 반드시 버전을 포함한다.

```ts
type SaveData = {
  version: number;

  player: PlayerSaveData;
  inventory: InventorySaveData;
  quests: QuestSaveData;
  stories: StoryProgressSaveData;

  unlockedFloorIds: string[];
  clearedFloorIds: string[];

  currentQuestId?: string;
  currentFloorRun?: FloorRunSaveData;

  learningRecords: LearningRecordSaveData;

  playTimeSeconds: number;
  lastSavedAt: string;
};
```

## 자동 저장 시점

다음 상황에서 자동 저장한다.

* 인트로 종료
* 베이스캠프 진입
* NPC 대화 종료
* 스토리 시작
* 스토리 체크포인트 도달
* 스토리 완료
* 퀘스트 수주
* 새로운 층 개방
* 퀘스트 완료
* 던전 입장
* 층 클리어
* 아이템 획득
* 보물상자 결과 확정
* 장비 장착 및 해제
* 검 교체
* 상점 이용
* 레벨업
* 30초 주기
* `visibilitychange`
* `pagehide`

## 저장 관리

설정 화면에 다음 기능을 둔다.

* 세이브 JSON 내보내기
* 세이브 JSON 불러오기
* 세이브 초기화

최근 자동 백업 3개를 순환 저장한다.

예:

```text
adventureAcademySave_main
adventureAcademySave_backup_1
adventureAcademySave_backup_2
adventureAcademySave_backup_3
```

불러오기 시 데이터 버전을 확인하고 마이그레이션을 수행한다.

---

# 6. 전체 게임 흐름

```text
타이틀
↓
인트로
↓
베이스캠프
↓
NPC와 대화
↓
퀘스트 수주
↓
퀘스트에 연결된 새 층 개방
↓
던전 입장
↓
방 선택·자동 이동·퀴즈·전투·이벤트
↓
마지막 방에서 퀘스트 목표 달성
↓
층 클리어
↓
베이스캠프로 귀환
↓
퀘스트 완료 대화
↓
다음 NPC의 새로운 퀘스트
```

---

# 7. 인트로

처음 시작할 때 해당 단원의 전체 이야기와 세계관을 소개한다.

구성:

* 픽셀 아트 배경
* NPC 초상화
* 대화창
* 다음 버튼
* 건너뛰기 버튼

인트로는 최초 한 번 자동 재생한다.

설정 화면의 **이야기 다시 보기** 메뉴에서 다시 볼 수 있게 한다.

별도의 기록관 NPC는 만들지 않는다.

---

# 7-1. 스토리 시스템의 기본 원칙

인트로, 퀘스트 수주 대화, 층 완료 대화, 던전 이벤트, 최종 보스 등장 및 엔딩은 공통된 **데이터 기반 스토리 시스템**으로 구현한다.

스토리 장면과 대사를 React 컴포넌트 내부에 직접 하드코딩하지 않는다.

```text
StorySequence 데이터
↓
StoryPlayer가 단계별로 읽음
↓
배경·초상화·대사·화면 전환·카메라 연출 실행
```

스토리는 다음 단위로 구성한다.

```text
StorySequence
└── StoryScene
    └── StoryStep
```

* `StorySequence`: 하나의 완전한 이야기 묶음
* `StoryScene`: 같은 장소나 연출 흐름을 공유하는 장면
* `StoryStep`: 실제로 순서대로 실행되는 대사 또는 연출 명령

스토리 시스템은 다음 상황에 공통으로 사용한다.

* 최초 인트로
* 베이스캠프 첫 진입
* NPC와의 퀘스트 수주 대화
* 퀘스트 진행 중 이벤트
* 던전 내부 NPC 조우
* 퀘스트 목표 달성 연출
* 층 클리어 후 귀환 대화
* 최종 보스 등장
* 보스 단계 사이 대사
* 단원 엔딩
* 이야기 다시 보기

## 스토리 진행 원칙

* 대사와 설명은 자동으로 넘어가지 않는다.
* 학생이 직접 `[다음]`을 눌러야 다음 대사로 진행한다.
* 배경 전환, 카메라 이동, 페이드, 짧은 효과 연출처럼 읽기를 요구하지 않는 단계만 자동 진행할 수 있다.
* 전환 중 연속 클릭으로 단계가 건너뛰어지지 않게 한다.
* 스토리 연출이 학습 문제와 해설을 가리거나 방해하지 않게 한다.
* 스토리 진행 중에는 던전 이동, 전투 명령, 인벤토리 등 관계없는 입력을 잠근다.
* 스토리가 끝나면 이전 화면 또는 지정된 다음 화면으로 정상 복귀한다.
* 스토리 재생 중 검 PNG 뷰모델은 기본적으로 숨긴다.
* 배경, 초상화, 대화창은 동시에 표시될 수 있으며 명시적인 변경 단계 전까지 상태를 유지한다.

---

# 7-2. 스토리 데이터 구조

스토리는 TypeScript 데이터 파일로 정의한다.

```ts
type StoryPortraitPosition =
  | "farLeft"
  | "left"
  | "center"
  | "right"
  | "farRight";

type StoryAdvanceMode =
  | "click"
  | "auto";

type StoryTransition =
  | "none"
  | "fade"
  | "slideLeft"
  | "slideRight"
  | "zoom";

type StoryScreenTarget =
  | "title"
  | "story"
  | "baseCamp"
  | "dungeon"
  | "floorResult"
  | "ending";
```

스토리 단계는 판별 가능한 유니언 타입으로 정의한다.

```ts
type StoryStep =
  | {
      id: string;
      type: "setBackground";
      imageUrl: string;
      transition?: StoryTransition;
      durationMs?: number;
      advanceMode?: "auto";
    }
  | {
      id: string;
      type: "showPortrait";
      actorId: string;
      portraitId: string;
      position: StoryPortraitPosition;
      transition?: StoryTransition;
      durationMs?: number;
      advanceMode?: "auto";
    }
  | {
      id: string;
      type: "changePortrait";
      actorId: string;
      portraitId: string;
      durationMs?: number;
      advanceMode?: "auto";
    }
  | {
      id: string;
      type: "movePortrait";
      actorId: string;
      position: StoryPortraitPosition;
      durationMs?: number;
      advanceMode?: "auto";
    }
  | {
      id: string;
      type: "hidePortrait";
      actorId: string;
      durationMs?: number;
      advanceMode?: "auto";
    }
  | {
      id: string;
      type: "dialogue";
      speakerId?: string;
      speakerName: string;
      text: string;
      activeActorId?: string;
      advanceMode: "click";
    }
  | {
      id: string;
      type: "narration";
      text: string;
      advanceMode: "click";
    }
  | {
      id: string;
      type: "systemMessage";
      text: string;
      advanceMode: "click" | "auto";
      durationMs?: number;
    }
  | {
      id: string;
      type: "wait";
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "fade";
      direction: "in" | "out";
      color?: string;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "showBaseCamp";
      mapId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "focusBaseCamp";
      focusPointId: string;
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "highlightBaseCampTarget";
      targetId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "clearBaseCampHighlight";
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "restoreBaseCampCamera";
      durationMs: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "playSound";
      audioId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "playBgm";
      audioId: string;
      fadeInMs?: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "stopBgm";
      fadeOutMs?: number;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "setStoryFlag";
      flagId: string;
      value: boolean | string | number;
      actionId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "questAction";
      action:
        | "setAvailable"
        | "accept"
        | "completeObjective"
        | "complete";
      questId: string;
      actionId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "unlockFloor";
      floorId: string;
      actionId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "checkpoint";
      checkpointId: string;
      advanceMode: "auto";
    }
  | {
      id: string;
      type: "changeScreen";
      screen: StoryScreenTarget;
      advanceMode: "auto";
    };
```

스토리 묶음:

```ts
type StoryScene = {
  id: string;
  steps: StoryStep[];
};

type StorySequence = {
  id: string;
  title: string;
  scenes: StoryScene[];

  replayable: boolean;
  skippable: boolean;

  onCompleteScreen: StoryScreenTarget;
};
```

각 단계에는 고유한 `id`를 부여한다.

퀘스트·층 개방·보상처럼 게임 상태를 바꾸는 단계에는 별도의 고유한 `actionId`도 부여한다.

---

# 7-3. 배경·초상화·대화 연출

한 장면에서 다음 요소를 동시에 표시할 수 있어야 한다.

```text
전체 화면 배경
+
NPC 초상화 1명 이상
+
화자 이름
+
대화 텍스트
+
필요한 경우 화면 효과
```

새로운 대사가 표시되어도 기존 배경과 초상화는 자동으로 사라지지 않는다.

다음과 같은 명시적 단계가 실행될 때만 변경하거나 제거한다.

* `setBackground`
* `changePortrait`
* `movePortrait`
* `hidePortrait`
* 새로운 Scene 시작 시 명시적 초기화 처리

## 초상화 표시 규칙

* 왼쪽, 가운데, 오른쪽 등 지정된 위치에 표시한다.
* 현재 말하는 인물은 밝게 표시한다.
* 현재 말하지 않는 인물은 조금 어둡게 표시한다.
* 화자가 없는 내레이션에서는 모든 초상화를 같은 밝기로 표시할 수 있다.
* 같은 인물의 표정을 바꿀 때 초상화가 순간적으로 사라지거나 깜빡이지 않게 한다.
* 다음 장면에서 사용할 이미지를 미리 로드한다.
* 이미지 로딩 실패 시 전체 스토리를 멈추지 않고 대체 이미지를 표시한다.
* 여러 초상화를 동시에 표시할 수 있다.
* 초상화마다 크기와 세부 오프셋을 데이터로 조정할 수 있게 한다.

## 대화창

대화창은 기본적으로 화면 하단에 표시한다.

구성:

* 화자 이름 영역
* 대사 영역
* 다음 진행 표시
* 필요한 경우 건너뛰기 버튼

다음 원칙을 적용한다.

* 긴 대사는 자동 줄바꿈한다.
* 초상화가 대화창 뒤로 지나치게 가려지지 않게 한다.
* 모바일과 태블릿에서는 초상화 크기와 대화창 높이를 자동 조정한다.
* 대화 단계에서는 `[다음]` 입력을 기다린다.
* 대화창을 클릭하거나 별도 다음 버튼을 눌러 진행할 수 있게 한다.
* 전환 애니메이션 중에는 다음 입력을 잠근다.
* 스토리 화면에서 배경, 초상화와 대화창이 동시에 유지되게 한다.

## 이미지 중심 연출

대화창 없이 배경이나 장면 이미지만 보여 주는 연출도 지원한다.

예:

```text
화면 페이드 아웃
↓
유적 전체 이미지 표시
↓
2초 대기
↓
대화창과 초상화 등장
```

---

# 7-4. 베이스캠프 포커스 연출

스토리 진행 중 베이스캠프 전체 화면 또는 특정 시설과 NPC를 비출 수 있어야 한다.

예:

```text
베이스캠프 전체 모습 표시
↓
상점 쪽으로 카메라 이동
↓
상점 강조
↓
안내자 대사
↓
던전 입구 쪽으로 카메라 이동
↓
던전 입구 강조
↓
일반 베이스캠프 화면으로 복귀
```

베이스캠프 화면은 큰 2D 월드와 이를 보여 주는 Viewport로 구분한다.

```text
BaseCampViewport
└── BaseCampWorld
    ├── Map
    ├── Facilities
    ├── NPCs
    └── HighlightLayer
```

스토리에서 픽셀 좌표를 직접 참조하지 않는다.

미리 정의한 이름 기반 포커스 지점을 사용한다.

```ts
type BaseCampFocusPoint = {
  id: string;

  x: number;
  y: number;
  zoom: number;

  offsetX?: number;
  offsetY?: number;
};

type BaseCampMapDefinition = {
  id: string;
  imageUrl: string;

  width: number;
  height: number;

  focusPoints: BaseCampFocusPoint[];
};
```

포커스 지점 예:

```ts
const MAIN_CAMP_FOCUS_POINTS: BaseCampFocusPoint[] = [
  {
    id: "campCenter",
    x: 1600,
    y: 900,
    zoom: 1,
  },
  {
    id: "shop",
    x: 800,
    y: 720,
    zoom: 1.35,
  },
  {
    id: "dungeonEntrance",
    x: 2450,
    y: 610,
    zoom: 1.4,
  },
  {
    id: "questNpc01",
    x: 1350,
    y: 830,
    zoom: 1.5,
  },
];
```

## 카메라 이동 규칙

* 카메라는 대상 지점으로 즉시 점프하지 않고 부드럽게 이동한다.
* 이동 시간은 스토리 단계 데이터에서 설정한다.
* 이동 중에는 사용자의 베이스캠프 조작을 막는다.
* 이동이 완료된 뒤 다음 단계로 진행한다.
* 화면 비율이 달라도 대상이 화면 밖으로 나가지 않게 카메라 범위를 제한한다.
* 필요하면 포커스 대상에 테두리, 빛, 화살표 또는 펄스 효과를 표시한다.
* 스토리 종료 후 일반 플레이용 카메라 위치로 복귀한다.
* 스토리 연출과 일반 베이스캠프 조작 상태를 분리한다.

## 개발용 좌표 도구

개발 모드에서 베이스캠프 포커스 지점을 쉽게 설정할 수 있는 도구를 둘 수 있다.

* 맵 클릭 시 월드 좌표 표시
* 현재 줌 값 표시
* 좌표와 줌을 JSON으로 복사
* 포커스 지점 이름 입력
* 저장 전 테스트 이동
* 프로덕션 빌드에서는 표시하지 않음

---

# 7-5. 스토리와 퀘스트·층 개방 연결

StoryPlayer가 퀘스트와 층 상태를 직접 변경하지 않는다.

```text
StoryPlayer
→ 명령 전달
→ QuestManager 또는 FloorUnlockManager
→ 실제 상태 변경
→ SaveManager 저장
```

역할을 다음과 같이 분리한다.

* `StoryPlayer`: 스토리 단계 순서와 화면 연출
* `QuestManager`: 퀘스트 상태 변경
* `FloorUnlockManager`: 층 개방
* `SaveManager`: 변경 사항 저장
* `AudioManager`: BGM과 효과음
* `BaseCampCameraController`: 베이스캠프 카메라 이동

퀘스트 수주 및 층 개방 흐름 예:

```text
NPC 대화
↓
퀘스트 설명
↓
학생이 [퀘스트 수락]
↓
QuestManager.acceptQuest()
↓
FloorUnlockManager.unlockFloor()
↓
자동 저장
↓
“새로운 던전이 개방되었습니다.”
```

## 중복 실행 방지

퀘스트 수주, 보상 지급, 층 개방처럼 상태를 변경하는 스토리 단계는 중복 실행되어도 결과가 한 번만 적용되어야 한다.

각 상태 변경 단계에 `actionId`를 두고, 이미 실행된 ID를 저장한다.

```ts
type StoryActionRecord = {
  executedActionIds: string[];
};
```

예:

```text
unlock-floor-01
accept-quest-01
reward-intro-sword
```

같은 `actionId`가 이미 실행되었다면 상태 변경을 다시 수행하지 않는다.

---

# 7-6. 스토리 선택지와 조건 분기

초기 프로토타입에서는 선형 스토리를 우선 구현한다.

기본 StoryPlayer가 안정화된 뒤 다음 기능을 확장할 수 있다.

* 2~4개의 이야기 선택지
* 선택 결과 플래그 저장
* 조건에 따라 다른 대사 재생
* 지정 단계 또는 장면으로 이동
* 특정 조건일 때 단계 건너뛰기

```ts
type StoryChoice = {
  id: string;
  text: string;
  nextSceneId: string;
  setFlag?: {
    flagId: string;
    value: boolean | string | number;
  };
};
```

선택지는 이야기의 표현을 바꿀 수 있지만 다음을 변경해서는 안 된다.

* 필수 학습 문제 수
* 문제 난도
* 핵심 퀘스트 완료 가능 여부
* 필수 층 개방 가능 여부
* 정답 판정
* 최종 학습량

학생의 선택 때문에 필수 진행이 영구적으로 막히지 않게 한다.

---

# 7-7. 스토리 저장과 이어 보기

스토리 진행 상태도 localStorage 세이브에 포함한다.

```ts
type StoryProgressSaveData = {
  completedStoryIds: string[];

  activeStory?: {
    storyId: string;
    checkpointId: string;
  };

  storyFlags: Record<
    string,
    boolean | string | number
  >;

  executedActionIds: string[];
};
```

기존 `SaveData`에 `stories: StoryProgressSaveData`를 포함한다.

```ts
type SaveData = {
  version: number;

  player: PlayerSaveData;
  inventory: InventorySaveData;
  quests: QuestSaveData;
  stories: StoryProgressSaveData;

  unlockedFloorIds: string[];
  clearedFloorIds: string[];

  currentQuestId?: string;
  currentFloorRun?: FloorRunSaveData;

  learningRecords: LearningRecordSaveData;

  playTimeSeconds: number;
  lastSavedAt: string;
};
```

## 저장 시점

스토리의 모든 대사마다 저장하지 않는다.

다음 시점에 저장한다.

* 스토리 시작
* 명시적인 `checkpoint` 단계
* 퀘스트 상태 변경
* 층 개방
* 보상 지급
* 스토리 완료

새로고침이나 페이지 종료 시 마지막 체크포인트부터 재개한다.

## 이야기 다시 보기

설정의 `이야기 다시 보기`에서는 `replayMode`로 스토리를 실행한다.

`replayMode`에서는 다음을 다시 실행하지 않는다.

* 퀘스트 수주
* 퀘스트 완료
* 보상 지급
* 아이템 지급
* 층 개방
* 스토리 진행 저장
* 완료 플래그 변경

즉, 다시 보기는 화면과 대사만 재생한다.

인트로의 `건너뛰기`를 눌렀을 때도 필요한 최종 상태는 정상 적용되어야 한다.

건너뛰기를 구현할 때 중간 단계를 빠르게 모두 실행하지 않는다. 대신 별도로 정의된 안전한 완료 처리 함수를 사용한다.

```ts
completeStorySafely(storyId);
```

이 함수는 해당 스토리에 필요한 필수 플래그와 다음 화면 전환만 한 번 적용한다.

---

# 7-8. 스토리 에셋 구성

권장 에셋 구조:

```text
public/
└── assets/
    └── story/
        ├── backgrounds/
        │   ├── intro-forest.png
        │   ├── intro-camp.png
        │   └── ending.png
        │
        ├── portraits/
        │   ├── guide/
        │   │   ├── neutral.png
        │   │   ├── happy.png
        │   │   ├── worried.png
        │   │   └── surprised.png
        │   │
        │   └── villager/
        │       ├── neutral.png
        │       └── worried.png
        │
        ├── illustrations/
        └── effects/
```

초상화 데이터는 NPC 데이터와 연결한다.

```ts
type NpcPortraitSet = {
  neutral: string;
  happy?: string;
  worried?: string;
  surprised?: string;
  serious?: string;
};

type NpcDefinition = {
  id: string;
  name: string;
  description: string;

  idleSpriteUrl?: string;
  portraits: NpcPortraitSet;
};
```

스토리 데이터에서는 이미지 경로를 반복해서 직접 입력하기보다 `actorId`와 `portraitId`를 참조하는 방식을 우선한다.

---

# 7-9. 테스트용 스토리 예시

```ts
export const INTRO_TEST_STORY: StorySequence = {
  id: "intro-test",
  title: "모험의 시작",

  replayable: true,
  skippable: true,

  onCompleteScreen: "baseCamp",

  scenes: [
    {
      id: "forest-opening",
      steps: [
        {
          id: "forest-background",
          type: "setBackground",
          imageUrl:
            "/assets/story/backgrounds/intro-forest.png",
          transition: "fade",
          durationMs: 600,
          advanceMode: "auto",
        },
        {
          id: "guide-enter",
          type: "showPortrait",
          actorId: "guide",
          portraitId: "neutral",
          position: "right",
          transition: "slideRight",
          durationMs: 350,
          advanceMode: "auto",
        },
        {
          id: "guide-line-01",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "드디어 깨어났구나. 너를 기다리고 있었어.",
          advanceMode: "click",
        },
        {
          id: "guide-happy",
          type: "changePortrait",
          actorId: "guide",
          portraitId: "happy",
          durationMs: 200,
          advanceMode: "auto",
        },
        {
          id: "guide-line-02",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "먼저 우리의 베이스캠프를 소개해 줄게.",
          advanceMode: "click",
        },
      ],
    },
    {
      id: "camp-tour",
      steps: [
        {
          id: "show-main-camp",
          type: "showBaseCamp",
          mapId: "main-camp",
          advanceMode: "auto",
        },
        {
          id: "focus-shop",
          type: "focusBaseCamp",
          focusPointId: "shop",
          durationMs: 1000,
          advanceMode: "auto",
        },
        {
          id: "highlight-shop",
          type: "highlightBaseCampTarget",
          targetId: "shop",
          advanceMode: "auto",
        },
        {
          id: "shop-guide-line",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "이곳에서는 모험에 필요한 물건을 구할 수 있어.",
          advanceMode: "click",
        },
        {
          id: "clear-shop-highlight",
          type: "clearBaseCampHighlight",
          advanceMode: "auto",
        },
        {
          id: "focus-entrance",
          type: "focusBaseCamp",
          focusPointId: "dungeonEntrance",
          durationMs: 1000,
          advanceMode: "auto",
        },
        {
          id: "highlight-entrance",
          type: "highlightBaseCampTarget",
          targetId: "dungeonEntrance",
          advanceMode: "auto",
        },
        {
          id: "entrance-guide-line",
          type: "dialogue",
          speakerId: "guide",
          speakerName: "안내자",
          activeActorId: "guide",
          text: "퀘스트를 받으면 저 던전의 새로운 층이 열릴 거야.",
          advanceMode: "click",
        },
        {
          id: "intro-checkpoint",
          type: "checkpoint",
          checkpointId: "intro-camp-tour-complete",
          advanceMode: "auto",
        },
        {
          id: "restore-camp-camera",
          type: "restoreBaseCampCamera",
          durationMs: 700,
          advanceMode: "auto",
        },
        {
          id: "go-to-base-camp",
          type: "changeScreen",
          screen: "baseCamp",
          advanceMode: "auto",
        },
      ],
    },
  ],
};
```

---

# 8. 베이스캠프

베이스캠프는 2D 픽셀 아트 화면으로 구성한다.

기본 요소:

* 상점
* 여러 NPC
* 던전 입구
* 현재 퀘스트 표시
* 인벤토리 버튼
* 설정 버튼

## 만들지 않는 별도 시설

* 기록관
* 장비 관리 건물
* 무기 강화 대장장이

## 인벤토리

화면 우측 상단 또는 하단에 항상 접근 가능한 **인벤토리 버튼**을 둔다.

인벤토리에서 다음을 관리한다.

* 회복 물약
* 방어 장비
* 검
* 퀘스트 아이템
* 수집품
* 골드

인벤토리 내부에서 다음 행동을 할 수 있다.

* 방어 장비 장착
* 방어 장비 해제
* 검 변경
* 아이템 정보 확인
* 현재 능력치 확인
* 보유 물약 수량 확인
* 획득한 검 목록 확인

---

# 9. NPC 시스템

한 명의 고정 NPC가 모든 퀘스트를 제공하지 않는다.

새로운 층마다 서로 다른 NPC가 퀘스트를 줄 수 있다.

예:

```text
1층
주민이 실종된 가족 찾기 퀘스트 제공

2층
탐험가가 잃어버린 물건 회수 퀘스트 제공

3층
상인이 빼앗긴 물품 찾기 퀘스트 제공

4층
학자가 유적 조사 퀘스트 제공
```

NPC마다 다음 에셋을 연결할 수 있게 한다.

* 베이스캠프용 Idle 스프라이트
* 대화창용 얼굴 초상화
* 표정별 초상화
* 이름
* 설명
* 대사 데이터

가능한 표정:

* 기본
* 기쁨
* 걱정
* 놀람
* 진지함

---

# 10. 퀘스트 수주와 층 개방

새로운 층은 처음부터 모두 개방하지 않는다.

> **해당 층과 연결된 퀘스트를 수주하면 그 층이 개방된다.**

흐름:

```text
NPC와 대화
↓
퀘스트 설명 확인
↓
[퀘스트 수락]
↓
퀘스트 상태가 active로 변경
↓
해당 층이 unlocked 상태로 변경
↓
던전 입구에서 해당 층 선택 가능
```

퀘스트 수주 전에는 해당 층을 선택할 수 없다.

잠긴 층 표시 예:

```text
???층
새로운 의뢰를 받아야 입장할 수 있습니다.
```

퀘스트 수주 직후 다음 안내를 표시한다.

```text
새로운 던전이 개방되었습니다.
```

## 퀘스트 데이터 구조

```ts
type QuestObjectiveType =
  | "reachRoom"
  | "findNpc"
  | "collectItem"
  | "openChest"
  | "defeatEnemy"
  | "investigateObject"
  | "clearFloor"
  | "defeatFinalBoss";

type QuestStatus =
  | "locked"
  | "available"
  | "active"
  | "objectiveComplete"
  | "completed";

type Quest = {
  id: string;
  title: string;
  description: string;

  giverNpcId: string;
  targetFloorId: string;

  objectiveType: QuestObjectiveType;
  targetId?: string;
  requiredAmount?: number;

  introDialogueId: string;
  acceptedDialogueId?: string;
  progressDialogueId?: string;
  completeDialogueId: string;

  prerequisiteQuestIds?: string[];
  unlockFloorIds: string[];

  rewards: QuestReward[];
};
```

## 퀘스트 종류

* 사라진 주민 찾기
* 특정 물건 회수하기
* 위험 지역 조사하기
* 봉인 해제하기
* 몬스터 추적하기
* 지식의 조각 모으기
* 특정 장소에 도착하기
* 중요한 물건 조사하기
* 단원 최종 보스 저지하기

---

# 11. 층 구성 원칙

한 차시의 학습 주제를 한 층으로 구성한다.

교과서가 확정되지 않았으므로 전체 층 수는 고정하지 않는다.

층 데이터는 쉽게 추가하거나 제거할 수 있게 한다.

```ts
type FloorDefinition = {
  id: string;
  order: number;
  title: string;
  lessonTopic: string;
  questId: string;

  questionPoolId: string;
  targetQuestionCount: number;

  mapTemplateIds: string[];

  requiredRoom: RequiredRoomDefinition;
  encounterRules: EncounterRules;

  isFinalBossFloor: boolean;
};
```

---

# 12. 던전의 표현 방식

던전은 Three.js로 구현한다.

고전적인 1인칭 던전처럼 표현하되, 플레이어가 방향키로 자유 이동하지 않는다.

기본 렌더링 요소:

* Plane 기반 벽
* Plane 기반 바닥
* Plane 기반 천장
* 문
* 복도
* 장식물
* 보물상자
* 함정 장치
* Billboard 몬스터
* 카메라에 연결된 검 PNG 뷰모델

픽셀 텍스처에는 다음 설정을 사용한다.

```ts
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.colorSpace = THREE.SRGBColorSpace;
```

픽셀 그래픽이 흐릿해지지 않도록 텍스처 스무딩을 사용하지 않는다.

---

# 13. 던전 이동 방식

W, A, S, D 직접 이동은 사용하지 않는다.

던전에 입장하면 첫 번째 빈방에서 시작한다.

첫 번째 방은 다음 요소만 가진다.

* 벽
* 바닥
* 천장
* 연결된 길
* 이동 선택지

방마다 연결 상태에 따라 이동 버튼을 표시한다.

예:

```text
[왼쪽 길로 가기]
[오른쪽 길로 가기]
```

```text
[앞으로 가기]
```

막다른 방:

```text
[뒤로가기]
```

세 방향이 연결되어 있다면:

```text
[왼쪽 길로 가기]
[앞으로 가기]
[오른쪽 길로 가기]
```

## 자동 이동 연출

이동 버튼을 누르면 다음 방으로 즉시 전환하지 않는다.

```text
이동 버튼 클릭
↓
선택지 비활성화
↓
카메라가 선택한 복도를 따라 자동 이동
↓
필요한 경우 카메라 자동 회전
↓
다음 방 중앙에 도착
↓
방 이벤트 시작
```

권장 이동 시간:

* 짧은 복도: 0.8~1.2초
* 긴 복도: 1.2~1.8초
* 90도 회전: 0.25~0.4초

이동 중에는 다른 버튼을 누를 수 없게 한다.

## 이동 중 검 연출

카메라에 연결된 검은 카메라 이동 중에도 화면 우측 하단에 유지한다.

복도를 이동하는 동안 검에 가벼운 움직임을 준다.

* 위아래 흔들림
* 좌우 흔들림
* 미세한 회전
* 이동 시작과 정지 시 관성

검 흔들림은 과도하지 않게 한다.

```ts
const bobY = Math.sin(elapsedTime * bobSpeed) * bobAmplitudeY;
const bobX = Math.cos(elapsedTime * bobSpeed * 0.5) * bobAmplitudeX;
```

자동 이동을 멈추면 검이 부드럽게 기본 위치로 복귀한다.

## 방 도착 이벤트

다음 방에 도착하면 방 종류에 따라 이벤트가 자동 시작된다.

```text
몬스터 방 도착
↓
검이 준비 자세로 이동
↓
몬스터 등장
↓
전투 시작
```

```text
보물방 도착
↓
보물상자 등장
↓
상자 조사 버튼 표시
```

```text
함정방 도착
↓
함정 작동 연출
↓
문제 출제
```

---

# 14. 던전 내부 구조

던전은 방 노드와 연결 통로로 이루어진 그래프 구조로 관리한다.

```ts
type DungeonRoomType =
  | "start"
  | "empty"
  | "combat"
  | "eliteCombat"
  | "treasure"
  | "trap"
  | "quest"
  | "finalBoss";

type DungeonRoomNode = {
  id: string;
  type: DungeonRoomType;

  position: {
    x: number;
    y: number;
    z: number;
  };

  connections: DungeonConnection[];
  visited: boolean;
  resolved: boolean;

  encounterId?: string;
  questEventId?: string;
};

type DungeonConnection = {
  targetRoomId: string;

  relativeDirection:
    | "forward"
    | "left"
    | "right"
    | "back";

  cameraPathId: string;
};
```

플레이어는 각 방의 중앙에 위치한다.

선택한 연결을 따라 카메라가 다음 방으로 자동 이동한다.

---

# 15. 던전 생성 방식

던전은 다음 방식으로 생성한다.

> **미리 제작한 기본 맵 템플릿 + 일부 방과 이벤트의 랜덤 배치**

완전 무작위 미로 생성은 사용하지 않는다.

## 고정 요소

* 시작 방
* 퀘스트 목표인 마지막 방
* 퀘스트 대상 NPC
* 퀘스트 필수 물건
* 필수 스토리 이벤트
* 최종 보스방
* 시작 방에서 퀘스트 목표 방까지 이어지는 핵심 경로

## 랜덤 요소

* 일반 몬스터 방 위치
* 정예 몬스터 방 유무와 위치
* 보물방 위치
* 함정방 위치
* 빈방 위치
* 갈림길 구성
* 막다른 길 위치
* 장식물
* 문제 출제 순서
* 문제와 이벤트의 배정

---

# 16. 층 생성 필수 규칙

각 층은 다음 조건을 만족해야 한다.

1. 시작 방에서 **퀘스트 목표인 마지막 방까지 반드시 도달할 수 있어야 한다.**
2. 별도의 일반 출구는 필수 요소가 아니다.
3. 마지막 방에서 퀘스트 목표를 달성하면 층이 클리어된다.
4. 보물방 또는 함정방이 최소 하나는 반드시 존재한다.
5. 보물방과 함정방은 동시에 등장할 수 있다.
6. 보물방은 한 층에 최대 1개다.
7. 함정방은 한 층에 최대 1개다.
8. 일반 전투방은 최소 한 곳 이상 존재한다.
9. 퀘스트 필수 방은 누락되면 안 된다.
10. 퀘스트 필수 방은 반드시 도달 가능해야 한다.
11. 막다른 길을 지나치게 많이 만들지 않는다.
12. 막다른 길에는 작은 보상, 단서 또는 짧은 이벤트를 배치할 수 있다.
13. 방 이벤트에 필요한 문제 수가 층의 문제 예산을 초과하면 안 된다.
14. 시작 방 바로 다음 방이 퀘스트 마지막 방이 되지 않게 한다.
15. 미니맵이 없으므로 지나치게 복잡한 순환형 구조를 피한다.
16. 해결한 방에서는 퀴즈나 전투가 다시 발생하지 않는다.

## 생성 결과 예시

```text
예시 A
시작 → 전투 → 갈림길
                ├ 보물방
                └ 빈방 → 전투 → 퀘스트 마지막 방
```

```text
예시 B
시작 → 빈방 → 갈림길
              ├ 함정방 → 전투
              └ 전투
                   ↓
              퀘스트 마지막 방
```

```text
예시 C
시작 → 전투 → 보물방 → 갈림길
                         ├ 함정방
                         └ 정예 전투 → 퀘스트 마지막 방
```

항상 동일한 순서로 방이 등장하지 않게 한다.

---

# 17. 던전 생성 순서

```text
1. 층에 맞는 기본 맵 템플릿 선택
2. 시작 방 배치
3. 퀘스트 목표인 마지막 방 배치
4. 시작 방과 마지막 방을 연결하는 핵심 경로 생성
5. 퀘스트 필수 이벤트 배치
6. 보물방 또는 함정방 최소 한 곳 배치
7. 보물방 최대 1개 조건 확인
8. 함정방 최대 1개 조건 확인
9. 일반 전투방 배치
10. 빈방·갈림길·막다른 길 배치
11. 문제 예산에 맞춰 이벤트 수 조정
12. 모든 필수 방 도달 가능 여부 검사
13. 조건 위반 시 다시 생성
```

---

# 18. 미니맵

미니맵은 구현하지 않는다.

대신 다음 원칙으로 길 찾기 난도를 조정한다.

* 층 규모를 지나치게 크게 만들지 않는다.
* 갈림길 수를 제한한다.
* 복잡한 다중 순환 구조를 피한다.
* 방마다 장식이나 조명을 조금씩 다르게 한다.
* 이미 해결한 방은 시각적으로 상태가 달라지게 한다.
* 뒤로가기로 이전 방에 쉽게 이동할 수 있게 한다.
* 퀘스트 목표 방은 층 후반부에 배치한다.

---

# 19. 방 종류

초기 버전에서 지원할 방:

* 시작 방
* 빈방
* 일반 전투방
* 정예 전투방
* 보물방
* 함정방
* 갈림길 방
* 막다른 방
* 퀘스트 이벤트방
* 구조 대상 NPC 방
* 단원 최종 보스방

층별 보스는 만들지 않는다.

단원 마지막 층에만 최종 보스가 등장한다.

---

# 20. 문제 운영 원칙

## 일반 층

한 층에서 사용하는 문제 수:

> 약 10~15문제

구체적인 수는 차시 내용에 맞춰 층별로 설정한다.

## 최종 보스

단원 마지막 최종 보스전:

> 약 15~20문제

앞선 층에서 학습한 문제들을 단원 복습 형태로 랜덤 출제한다.

## 핵심 규칙

한 번의 층 도전에서는:

* 해당 도전에 배정된 문제만 출제한다.
* 문제 순서를 무작위로 섞는다.
* 동일 문제를 두 번 출제하지 않는다.
* 학생이 틀려도 추가 문제를 생성하지 않는다.
* 해결한 방에서는 다시 문제를 출제하지 않는다.

학생이 사망하여 층을 처음부터 다시 시작하면:

* 문제 순서를 다시 섞는다.
* 방과 문제의 배정을 일부 다시 섞는다.
* 이전에 틀린 문제에 높은 우선순위를 줄 수 있다.
* 새로운 도전에서는 같은 문제가 다시 등장할 수 있다.

> 한 번의 도전 안에서는 문제 중복이 없지만, 재도전에서는 복습을 위해 다시 등장할 수 있다.

---

# 21. 문제 데이터 구조

```ts
type QuestionType =
  | "multipleChoice"
  | "multipleSelect"
  | "trueFalse"
  | "shortAnswer";

type Question = {
  id: string;
  lessonId: string;
  type: QuestionType;

  prompt: string;
  imageUrl?: string;

  options?: string[];
  correctAnswer: string | string[] | boolean;

  explanation: string;
  difficulty?: 1 | 2 | 3;

  tags?: string[];
};
```

---

# 22. 문제 풀이 화면 흐름

전투, 보물방, 함정방 문제는 같은 교육 흐름을 따른다.

```text
문제 표시
↓
학생이 답 입력 또는 선택
↓
답 제출
↓
정답 또는 오답 표시
↓
정답 공개
↓
짧은 해설 표시
↓
학생이 내용을 읽음
↓
[다음으로] 버튼 클릭
↓
전투·보물·함정 결과 연출
```

해설 화면은 자동으로 종료하지 않는다.

학생이 직접 **다음으로** 버튼을 눌러야 한다.

답 제출 후 선택지를 수정할 수 없다.

전투 애니메이션은 해설 확인 전에 재생하지 않는다.

---

# 23. 전투의 기본 구조

전투는 고전적인 JRPG식 교대 턴제로 구성한다.

플레이어 행동:

```text
[공격하기] [아이템]
```

사용하지 않는 행동:

* 방어하기
* 도망가기
* 마법
* 액티브 스킬
* 무기 강화 공격

## 기본 턴 흐름

```text
플레이어 턴
↓
공격하기 또는 아이템 선택
↓
플레이어 행동 처리
↓
몬스터가 살아 있으면 몬스터 턴
↓
몬스터 공격
↓
다음 플레이어 턴
```

정답 여부는 **플레이어 공격의 성공 여부**를 결정한다.

몬스터의 공격 여부는 원칙적으로 정답·오답이 아니라 다음 조건에 따라 결정한다.

* 몬스터가 살아 있는가
* 크리티컬로 기절했는가
* 전투 종료 조건이 충족되었는가

---

# 24. 공격하기

```text
공격하기 선택
↓
전투에 배정된 미출제 문제 표시
↓
학생이 답 제출
↓
정답·오답 및 해설 확인
↓
[다음으로] 클릭
↓
검 공격 애니메이션
↓
몬스터 반응
↓
몬스터가 살아 있으면 몬스터 턴
```

## 정답

```text
문제 정답
↓
검 휘두르기 성공
↓
몬스터 피격
↓
정답 경험치 획득
↓
낮은 확률로 크리티컬 판정
```

정답 시 표시 예:

```text
정답입니다!
공격 성공!
```

## 오답

```text
문제 오답
↓
정답과 해설 확인
↓
검 휘두르기
↓
몬스터가 피하거나 공격이 빗나감
↓
MISS
↓
몬스터가 살아 있으므로 몬스터 턴 진행
```

오답 시 정답 경험치는 없다.

오답 자체가 직접적으로 HP를 깎는 것이 아니다.

플레이어 공격이 실패해 몬스터가 살아 있고, 그 결과 몬스터가 자기 턴에 공격하는 구조다.

## 중요한 원칙

* 정답이라고 해서 몬스터 턴을 자동으로 삭제하지 않는다.
* 오답이라고 해서 몬스터에게 별도의 추가 공격 기회를 주지 않는다.
* 몬스터는 살아 있으면 원래 자신의 턴에 한 번 행동한다.
* 플레이어 공격으로 몬스터가 쓰러지면 해당 몬스터 턴은 발생하지 않는다.

---

# 25. 크리티컬과 기절

크리티컬은 전투의 변화를 주는 소규모 보너스다.

학습 결과를 운으로 뒤집는 기능으로 사용하지 않는다.

## 크리티컬 조건

* 정답 공격에서만 발생한다.
* 오답 공격에서는 절대 발생하지 않는다.
* 기본 확률은 약 8%다.
* 일반 전투당 최대 1회 발생한다.
* 정예 전투당 최대 1회 발생한다.
* 보스전에서는 단계당 최대 1회의 기절 효과만 적용한다.

## 크리티컬 효과

```text
문제 정답
↓
공격 성공
↓
크리티컬 판정 성공
↓
강한 검격 및 화면 효과
↓
CRITICAL
↓
몬스터 기절
↓
이번 몬스터 턴 생략
```

크리티컬은 다음을 변경하지 않는다.

* 문제 수
* 정답 수
* 전투의 학습 판정
* 일반 전투 승리 기준
* 보스전 70% 승리 기준
* 획득하는 정답 경험치

즉, 크리티컬은 **피해를 한 번 덜 받는 작은 행운 보너스**다.

## 무작위성 제한

검이나 장비에 따라 크리티컬 확률을 크게 올리지 않는다.

검별로 크리티컬 이펙트의 모양은 달라질 수 있지만, 기본 발생 확률은 공통으로 유지한다.

---

# 26. 아이템 사용

전투에서 아이템 버튼을 누르면 사용할 수 있는 아이템을 표시한다.

초기 전투 아이템은 회복 물약 위주로 구성한다.

```text
아이템 선택
↓
회복 물약 선택
↓
HP 회복
↓
물약 수량 1 감소
↓
플레이어 턴 종료
↓
몬스터가 살아 있으면 몬스터 공격
↓
다음 플레이어 턴
```

아이템 사용에는 문제가 출제되지 않는다.

아이템 사용은 해당 전투에 예정된 문제 수를 소비하지 않는다.

예:

```text
일반 전투 문제 2개 예정

문제 1개 풀이
→ 물약 사용
→ 문제 1개 풀이

총 출제 문제는 여전히 2개
```

## 회복 물약 제한

* 소지 수량이 있는 경우에만 사용 가능하다.
* 물약 사용 시 수량이 1 감소한다.
* 물약을 연속 두 턴 사용할 수 없다.
* 물약을 사용한 다음 플레이어 턴에는 반드시 공격하기를 선택한다.
* 물약을 사용해도 몬스터 턴은 발생한다.

```ts
type PlayerCombatAction = "attack" | "item";

type CombatState = {
  previousPlayerAction?: PlayerCombatAction;
  mustAttackNextTurn: boolean;

  answeredQuestionCount: number;
  correctAnswerCount: number;

  criticalOccurred: boolean;
  enemyStunned: boolean;
};
```

---

# 27. 일반 전투

일반 전투는 문제 2개를 고정으로 사용한다.

문제 수는 장비, 레벨, 물약 사용, 정답률에 따라 늘거나 줄지 않는다.
몬스터는 살아 있으면 플레이어 행동 뒤에 자신의 턴을 갖는다. 다만 일반 전투와 정예 전투에서 예정된 마지막 문제가 끝났고 정답이 한 개 이상이라면, 최종 결과 판정을 먼저 수행한다. 이때 플레이어의 마무리 공격으로 몬스터가 처치되므로 마지막 문제 뒤의 몬스터 턴은 발생하지 않는다.

## 기본 턴 예시

```text
첫 번째 플레이어 턴
→ 문제 1번
→ 공격 결과
→ 몬스터가 살아 있으면 몬스터 턴

두 번째 플레이어 턴
→ 문제 2번
→ 공격 결과
→ 전투 최종 판정
```

## 2문제 모두 정답

판정:

> 완벽한 승리

연출:

```text
첫 번째 문제 정답
→ 검 공격 성공
→ 몬스터 피해
→ 크리티컬이 아니라면 몬스터 공격 1회

두 번째 문제 정답
→ 강력한 검 공격 성공
→ 몬스터 처치
→ 몬스터 턴 없음
```

결과:

* 몬스터 처치
* 일반적으로 몬스터 공격 1회
* 첫 공격이 크리티컬이었다면 피해 없음
* 두 문제의 정답 경험치 획득
* 기본 골드 획득
* 완벽한 승리 보너스 가능
* 드롭 확률 소폭 증가 가능

기존의 `압도적 승리`라는 명칭 대신 `완벽한 승리`를 기본 명칭으로 사용한다.


## 1문제 정답, 1문제 오답

판정:

> 힘겨운 승리

두 문제 중 한 번의 성공 공격으로 몬스터가 큰 상처를 입는다.

두 문제가 끝났을 때 한 번이라도 정답 공격이 있었다면 추가 문제 없이 마무리 일격을 수행한다.

### 정답 → 오답

```text
첫 번째 문제 정답
→ 공격 성공
→ 몬스터에게 큰 상처
→ 몬스터 공격

두 번째 문제 오답
→ 검 공격 MISS
→ 몬스터가 앞서 입은 상처로 비틀거림
→ 플레이어가 빈틈을 놓치지 않고 마무리 일격
→ 몬스터 처치
→ 몬스터 턴 없음
```

### 오답 → 정답

```text
첫 번째 문제 오답
→ 검 공격 MISS
→ 몬스터 공격

두 번째 문제 정답
→ 약점 공격 성공
→ 몬스터가 치명적인 상처를 입음
→ 바로 마무리 일격
→ 몬스터 처치
```

두 번째 문제의 정답 공격과 마무리 일격은 하나의 연속 공격처럼 연출할 수 있다.

| 정답 순서   | 몬스터 공격 횟수 | 결과           |
| ------- | --------: | ------------ |
| 정답 → 정답 |        1회 | 완벽한 승리       |
| 정답 → 오답 |        1회 | 힘겨운 승리       |
| 오답 → 정답 |        1회 | 힘겨운 승리       |
| 오답 → 오답 |        2회 | 전투 실패·몬스터 도주 |


결과:

* 몬스터 처치
* 정답 1개분 경험치
* 기본 골드 획득
* 완벽 승리 보너스 없음
* 정답과 오답의 순서와 관계없이 몬스터 공격은 기본적으로 1회 발생한다. 첫 번째 턴에 크리티컬 기절이 발생하면 몬스터 공격을 받지 않을 수 있다.
* 정답 공격에서 크리티컬이 발생했다면 공격 1회 감소 가능

## 2문제 모두 오답

판정:

> 전투 실패

```text
첫 번째 문제 오답
→ 검 공격 MISS
→ 몬스터 공격

두 번째 문제 오답
→ 검 공격 MISS
→ 몬스터 공격

문제 2개 종료
→ 플레이어가 전투 태세를 다시 갖춤
→ 몬스터가 경계하거나 포효
→ 몬스터가 복도 반대편으로 달아남
```

결과:

* 몬스터 처치 실패
* 몬스터가 달아남
* 몬스터 공격 2회
* 경험치 없음
* 골드 및 드롭 없음
* 길은 막히지 않음
* 추가 문제 없음
* 방은 해결된 상태로 처리

모두 오답이라고 해서 마지막 공격의 피해를 특별히 강화하지 않는다.

이미 다음 불이익이 있으므로 추가 처벌을 겹치지 않는다.

* 플레이어 피해
* 경험치 없음
* 골드 없음
* 드롭 없음
* 몬스터 처치 실패

퀘스트상 반드시 처치해야 하는 대상은 일반 랜덤 몬스터로 배치하지 않고, 별도 퀘스트 이벤트 규칙을 사용한다.

---

# 28. 정예 전투

정예 몬스터는 문제 3개를 고정 사용한다.

각 플레이어 공격 후 정예 몬스터가 살아 있고 기절하지 않았다면 몬스터 턴을 진행한다.

권장 판정:

| 정답 수 | 결과             |
| ---: | -------------- |
|    3 | 완벽한 승리         |
|    2 | 일반 승리          |
|    1 | 힘겨운 승리         |
|    0 | 전투 실패 및 몬스터 도주 |

정답이 한 개 이상이면 마지막에 추가 문제 없는 마무리 공격을 사용할 수 있다.

정예 몬스터는 일반 몬스터보다:

* 공격 피해가 조금 높음
* 골드 보상이 조금 많음
* 방어 장비 드롭 확률이 조금 높음
* 특별한 검을 획득할 가능성이 있음
* 피격 및 공격 연출이 더 강함

문제 수는 항상 3개다.

---

# 29. 보물방

보물방은 한 층에 최대 1개다.

보물상자를 조사하면 문제 1개가 출제된다.

```text
보물상자 조사
↓
문제 출제
↓
정답 또는 오답 확인
↓
해설 확인
↓
다음으로
```

## 정답

* 상자 열림
* 보물 획득
* 정답 경험치 획득

가능한 보상:

* 골드
* 회복 물약
* 방어 장비
* 특별한 검
* 수집품
* 퀘스트와 무관한 보조 아이템

## 오답

* 보물상자가 강하게 잠김
* 해당 층 도전에서는 다시 열 수 없음
* 보상 획득 불가
* 추가 문제 없음
* 정답과 해설은 정상적으로 확인

---

# 30. 함정방

함정방은 한 층에 최대 1개다.

함정이 작동하면 문제 1개가 출제된다.

```text
함정 작동
↓
문제 출제
↓
정답 또는 오답 확인
↓
해설 확인
↓
다음으로
```

## 정답

* 함정 해제
* 피해 없이 통과
* 정답 경험치 획득

## 오답

* 함정 피해
* 길은 막히지 않음
* 함정이 끝난 뒤 계속 진행
* 추가 문제 없음

함정은 전투가 아니므로 JRPG 교대 턴 규칙을 적용하지 않는다.

---

# 31. 층별 마지막 방과 퀘스트 완료

각 층의 마지막 방은 해당 퀘스트의 목표 방이다.

예:

* 실종된 주민이 있는 방
* 회수할 물건이 있는 방
* 조사해야 할 유물이 있는 방
* 봉인 장치가 있는 방
* 추적 대상이 있는 방

퀘스트 목표 달성 흐름:

```text
퀘스트 목표 달성
↓
짧은 대화 또는 연출
↓
층 클리어 처리
↓
결과 요약 화면
↓
베이스캠프로 귀환
```

별도의 출구 방까지 다시 이동하지 않아도 된다.

결과 화면에는 다음을 표시한다.

* 푼 문제 수
* 정답 수
* 정답률
* 획득 경험치
* 획득 골드
* 획득 아이템
* 새롭게 발견한 검 또는 장비
* 퀘스트 달성 여부

---

# 32. 최종 보스전

단원 마지막 층에만 최종 보스가 등장한다.

층별 보스는 만들지 않는다.

최종 보스전에는 앞선 층에서 등장했던 문제를 단원 복습 형태로 활용한다.

문제 수:

> 15~20문제

문제 순서는 무작위다.

한 번의 보스 도전 안에서는 동일 문제가 중복되지 않는다.

## 단계형 구성

문제 15~20개를 3~4문제 단위의 단계로 나눈다.

예:

```text
1단계: 보스의 방어막 파괴
2단계: 약점 발견
3단계: 보스의 특수 공격 저지
4단계: 핵심 부위 공격
5단계: 최종 결전
```

17문제 예시:

```text
1단계 3문제
2단계 4문제
3단계 3문제
4단계 4문제
5단계 3문제
```

## 보스전 턴 규칙

일반 몬스터처럼 문제 하나마다 보스가 공격하면 총 피해가 지나치게 커질 수 있다.

따라서 보스는 **문제 단계 단위로 자신의 공격 턴을 가진다.**

```text
현재 단계의 문제 3~4개 풀이
↓
각 문제마다
정답: 공격 성공
오답: MISS
↓
현재 단계 종료
↓
보스가 살아 있으면 보스 턴
↓
보스 공격
↓
다음 단계
```

이 방식은 다음을 동시에 만족한다.

* 플레이어와 보스가 번갈아 행동하는 JRPG 느낌
* 15~20문제 동안 HP가 지나치게 빠르게 소모되는 문제 방지
* 단계별 보스 연출 강화
* 문제 묶음별 학습 진행도 확인

## 보스전 크리티컬

현재 단계에서 정답 공격으로 크리티컬이 한 번 이상 발생했다면:

```text
현재 단계 종료
↓
보스가 기절
↓
이번 단계 종료 후 보스 공격 1회 생략
```

같은 단계에서 크리티컬이 여러 번 나와도 보스 공격은 한 번만 생략한다.

크리티컬 때문에 정답률이나 최종 승리 기준이 변경되지는 않는다.

## 단계 사이 연출

* 짧은 보스 대사
* 배경 변화
* 보스 모습 변화
* 카메라 연출
* 현재 단계 표시
* 진행도 표시
* 검 준비 동작
* 보스 특수 공격 예고

## 보스 승리 조건

모든 배정 문제를 푼 뒤 정답률을 계산한다.

### 정답률 70% 이상

* 최종 보스 격파
* 단원 클리어
* 승리 엔딩
* 최종 보상 획득

### 정답률 70% 미만이며 HP가 남아 있음

* 보스가 큰 피해를 입지만 쓰러지지 않음
* 보스가 도망감
* 단원은 아직 클리어되지 않음
* 플레이어는 베이스캠프로 귀환
* 재도전 가능

```text
보스가 흔들리며 뒤로 물러난다.

“이번에는 여기까지다!”

보스가 어둠 속으로 도망쳤다.
조금 더 학습한 뒤 다시 도전해 보자.
```

### 플레이어 HP가 0

* 전투 패배
* 베이스캠프로 귀환
* 보스전 재도전 가능

판정 우선순위:

```text
1. 보스 공격 후 플레이어 HP가 0이면 즉시 패배
2. 모든 문제를 끝내고 생존했다면 정답률 계산
3. 정답률 70% 이상이면 승리
4. 정답률 70% 미만이면 보스 도망
```

---

# 33. 경험치와 레벨업

경험치는 정답 수에 비례한다.

```text
문제 1개 정답
→ 기본 경험치 획득

문제 1개 오답
→ 해당 문제 경험치 없음
```

권장 초기값:

* 일반 문제 정답: 10 EXP
* 난도가 높은 문제 정답: 12~15 EXP
* 층 퀘스트 완료: 20 EXP
* 일반 전투 완벽 정답 보너스: 5 EXP
* 정예 전투 완벽 정답 보너스: 10 EXP
* 최종 보스 격파 보너스: 50 EXP

경험치의 대부분은 문제 정답에서 발생해야 한다.

## 레벨업 효과

* 최대 HP 증가
* 아주 소폭의 기본 방어력 증가 가능
* 특정 레벨에서 물약 지급
* 특정 레벨에서 검 획득 또는 외형 보상 해금 가능

레벨업으로 다음이 달라지면 안 된다.

* 출제 문제 수
* 문제 난이도
* 정답 판정
* 정답 없이 적을 쓰러뜨리는 능력
* 자동 정답
* 문제 건너뛰기

---

# 34. 기본 HP와 피해 밸런스

시작 최대 HP:

> **50**

시작 현재 HP:

> **50**

레벨업 시 최대 HP 증가:

> 레벨당 +5 HP

예:

| 레벨 | 최대 HP |
| -: | ----: |
|  1 |    50 |
|  2 |    55 |
|  3 |    60 |
|  4 |    65 |
|  5 |    70 |
|  6 |    75 |

## 일반 몬스터 피해

몬스터는 정답·오답과 관계없이 살아 있다면 자기 턴에 공격하므로, 기존의 오답 전용 피해보다 낮게 설정한다.

권장 초기값:

```text
1층: 기본 공격 7 피해
2층: 기본 공격 8 피해
3층: 기본 공격 9 피해
4층: 기본 공격 10 피해
이후: 층별 데이터로 조정
```

시작 HP 50 기준:

* 2정답 전투: 일반적으로 몬스터 공격 1회, 약 7 피해
* 1정답 전투: 정답 순서와 관계없이 몬스터 공격 1회, 약 7 피해
* 0정답 전투: 몬스터 공격 2회, 약 14 피해
* 첫 번째 턴에 크리티컬이 발생하면 해당 몬스터 공격이 생략될 수 있다.

| 결과     | 1정답 |    0정답 |
| ------ | --: | -----: |
| 몬스터 처치 |   O |      X |
| 정답 경험치 |   O |      X |
| 골드·드롭  |   O |      X |
| 전투 결과  |  승리 | 몬스터 도주 |
| 기본 몬스터 공격 횟수 | 1회 | 2회 |

0정답에 추가 강공격을 넣지 않는다.

## 정예 몬스터 피해

권장 기본값:

```text
일반 몬스터 피해 +1
```

예:

* 1층 정예: 8
* 2층 정예: 9
* 3층 정예: 10

정예전은 3턴까지 진행될 수 있으므로 일반 몬스터보다 지나치게 높은 피해를 주지 않는다.

## 함정 피해

권장 기본 피해:

```text
8~12 피해
```

예:

* 가벼운 함정: 8
* 일반 함정: 10
* 강한 함정: 12

함정 오답 한 번으로 즉시 사망하지 않게 한다.

## 최종 보스 피해

보스는 문제 단계마다 한 번 공격한다.

권장 기본 피해:

> 단계 종료 시 7 피해

예를 들어 5단계라면 최대 기본 피해는 약 35다.

방어 장비와 물약, 크리티컬 기절을 고려하면 시작 HP 50에서도 생존 가능하다.

보스 피해는 플레이테스트 후 6~8 범위에서 조정한다.

---

# 35. 방어력 계산

방어 장비는 몬스터의 턴 공격 및 함정 피해를 완화한다.

```ts
finalDamage = Math.max(
  minimumDamage,
  baseDamage - totalDefense
);
```

권장 최소 피해:

```text
일반 몬스터 공격: 최소 3
정예 몬스터 공격: 최소 4
보스 공격: 최소 3
함정: 최소 5
```

## 방어 장비 예시

* 낡은 가죽 갑옷: 방어력 +1
* 견고한 가죽 갑옷: 방어력 +2
* 수호자의 갑옷: 방어력 +3
* 작은 부적: 최대 HP +5
* 보호 목걸이: 방어력 +1, 최대 HP +3

장비 하나로 피해가 지나치게 줄어들지 않게 한다.

---

# 36. 방어 장비 밸런스 원칙

방어 장비는 실제 능력치를 가진다.

역할:

* 몬스터 공격 피해 감소
* 최대 HP 증가
* 함정 피해 일부 감소
* 생존 안정성 향상

그러나 방어 장비는 정답을 대신하지 않는다.

## 층별 난도 상승

아래층으로 갈수록 몬스터 피해가 완만하게 증가한다.

다음 원칙을 지킨다.

* 좋은 장비가 없어도 최소 1~2개 층은 충분히 진행 가능해야 한다.
* 특정 무작위 장비가 없으면 진행할 수 없는 구조를 만들지 않는다.
* 무작위 드롭은 필수 조건이 아니라 편의 보너스다.
* 층별 공격력 차이를 지나치게 크게 만들지 않는다.
* 기본 장비는 퀘스트나 상점으로 확보할 수 있게 한다.
* 희귀 장비는 생존을 조금 편하게 만들되 압도적으로 강하지 않게 한다.

```text
퀘스트·상점 장비
→ 해당 시점의 최소 생존력 보장

무작위 드롭 장비
→ 최소 장비보다 조금 더 유리함
```

---

# 37. 검 시스템의 기본 원칙

5학년 2학기 1단원의 무기는 검 종류만 사용한다.

무기 강화는 구현하지 않는다.

검은 내부적으로 공격 수치 차이가 거의 없는 수집·외형 중심 요소다.

그러나 학생 화면에서는 이를 노골적으로 `스킨`이라고 표현하지 않는다.

사용하지 않을 표현:

* 검 스킨
* 외형 전용
* 능력치 차이 없음
* 코스튬 아이템

대신 다음처럼 표현한다.

* 희귀한 검
* 고대의 검
* 기사단이 사용하던 검
* 특별한 힘이 깃든 검
* 보스를 상대하기 위해 제작된 검

학생에게 보이는 정보 예:

```text
숲의 수호검

오래된 숲의 수호자들이 사용했다고 전해지는 검.
가볍고 날카로운 칼날이 어둠 속에서 은은하게 빛난다.
```

```text
수정 기사검

투명한 수정으로 만든 희귀한 검.
휘두를 때마다 빛의 잔상이 남는다.
```

검마다 달라질 수 있는 것:

* 검 PNG
* 크기
* 화면 내 위치
* 들고 있는 각도
* 휘두르기 방향
* 공격 속도
* 베기 잔상
* 타격 효과
* 공격 효과음
* 크리티컬 효과
* 몬스터 피격 반응
* 이름
* 설명
* 희귀도
* 획득 연출
* 마무리 공격 연출

검마다 달라지지 않는 것:

* 출제 문제 수
* 정답 판정
* 기본 전투 승리 기준
* 학습량
* 오답을 정답으로 바꾸는 기능
* 기본 크리티컬 확률
* 보스전 정답률 기준

---

# 38. 검 PNG 뷰모델 구현

플레이어의 손이나 팔 이미지는 사용하지 않는다.

화면 오른쪽 아래에 **검 PNG만 표시**한다.

검은 월드 오브젝트가 아니라 카메라에 연결된 1인칭 뷰모델로 구현한다.

```text
PerspectiveCamera
└── WeaponViewModelRoot
    ├── WeaponPivot
    │   └── SwordPlane
    ├── SlashEffect
    ├── CriticalEffect
    └── HitFlash
```

## 기본 구현 구조

```ts
const weaponRoot = new THREE.Group();
const weaponPivot = new THREE.Group();

camera.add(weaponRoot);
weaponRoot.add(weaponPivot);

scene.add(camera);
```

검 PNG는 투명 배경을 가진 이미지여야 한다.

권장 형식:

* PNG
* 투명 배경
* 검이 이미지 경계에서 잘리지 않음
* 검 주위의 불필요한 빈 공간은 최소화
* 픽셀 그래픽이라면 원본 해상도를 유지
* 검의 손잡이와 칼날 방향이 명확함

## 검 Plane 생성

```ts
const texture = textureLoader.load(sword.imageUrl);

texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.PlaneGeometry(
  sword.viewWidth,
  sword.viewHeight
);

const material = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  alphaTest: 0.1,
  depthTest: false,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
});

const swordPlane = new THREE.Mesh(geometry, material);
weaponPivot.add(swordPlane);
```

검이 벽이나 몬스터에 가려지지 않도록 뷰모델의 렌더 순서를 높게 설정한다.

```ts
swordPlane.renderOrder = 1000;
material.depthTest = false;
material.depthWrite = false;
```

---

# 39. 검 PNG의 2.5D 보정

검은 실제 3D 모델이 아니라 PNG Plane이다.

그러나 Three.js 공간 안에서 위치와 회전을 조절해 마인크래프트의 1인칭 아이템처럼 보이게 한다.

이를 **2.5D 뷰모델**로 구현한다.

## 기본 위치 예시

```ts
weaponRoot.position.set(
  0.55,   // 화면 오른쪽
  -0.55,  // 화면 아래
  -1.15   // 카메라 앞
);
```

카메라의 시야각과 화면 비율에 따라 값을 조정해야 한다.

## 기본 회전 예시

```ts
weaponPivot.rotation.set(
  THREE.MathUtils.degToRad(-12),
  THREE.MathUtils.degToRad(-22),
  THREE.MathUtils.degToRad(-38)
);
```

검 PNG가 단순히 화면에 붙인 2D 이미지처럼 보이지 않도록:

* X축으로 약간 눕힌다.
* Y축으로 안쪽을 향하게 한다.
* Z축으로 대각선 각도를 준다.
* 카메라 원근에 포함되게 한다.
* 공격 시 회전 중심을 손잡이 부근에 둔다.

## 검 회전 중심

PlaneGeometry의 기본 중심은 이미지 중앙이므로 그대로 회전하면 검의 중앙을 기준으로 빙글 도는 것처럼 보일 수 있다.

검의 손잡이 부분을 회전 중심으로 만들기 위해 `WeaponPivot`과 `SwordPlane`의 위치를 분리한다.

```ts
weaponPivot.position.set(0, 0, 0);

swordPlane.position.set(
  sword.pivotOffsetX,
  sword.pivotOffsetY,
  0
);
```

검 PNG마다 손잡이 위치가 다를 수 있으므로 검 데이터에 피벗 보정값을 둔다.

```ts
type SwordViewConfig = {
  width: number;
  height: number;

  rootPosition: [number, number, number];
  idleRotation: [number, number, number];

  pivotOffset: [number, number, number];

  swingRotation: [number, number, number];
  swingPositionOffset: [number, number, number];
};
```

## 선택적 가짜 두께 효과

기본 구현은 Plane 하나만 사용한다.

필요한 경우 검 PNG Plane을 2~3장 아주 조금씩 뒤로 복제해 얇은 두께처럼 표현할 수 있다.

```text
SwordFrontPlane
SwordMiddlePlane
SwordBackPlane
```

각 Plane을 Z축으로 0.003~0.008 정도 간격을 둔다.

다만 픽셀 윤곽이 번지거나 이중으로 보일 수 있으므로 기본값은 비활성화한다.

```ts
usePseudoThickness: false
```

진짜 3D 모델로 변환하는 기능은 초기 버전에 포함하지 않는다.

---

# 40. 검의 기본 상태

검 뷰모델에는 다음 상태를 둔다.

```ts
type WeaponAnimationState =
  | "hidden"
  | "draw"
  | "idle"
  | "moveBob"
  | "attackWindup"
  | "attackSwing"
  | "attackHit"
  | "attackMiss"
  | "critical"
  | "finish"
  | "returnToIdle";
```

## Idle

전투 중이 아닐 때 검은 화면 오른쪽 아래에 안정적으로 위치한다.

아주 약한 호흡 움직임을 넣을 수 있다.

```ts
idleOffsetY = Math.sin(time * 1.5) * 0.006;
idleRotationZ = Math.sin(time * 1.2) * 0.004;
```

움직임은 눈에 거슬리지 않게 한다.

## Draw

몬스터가 등장하면 검이 화면 아래에서 올라오는 준비 동작을 보여준다.

```text
몬스터 등장
↓
검이 아래쪽에서 올라옴
↓
기본 전투 자세
↓
전투 명령 버튼 활성화
```

## Hidden

문제와 해설을 읽는 동안에는 검이 문제 UI를 가리지 않도록 다음 중 하나를 사용한다.

* 검을 약간 아래로 내린다.
* 검의 불투명도를 줄인다.
* 문제 모달이 검보다 앞에 렌더링되게 한다.

검을 완전히 제거할 필요는 없지만 학습 UI를 방해하면 안 된다.

---

# 41. 검 휘두르기 애니메이션

검 공격은 단순한 CSS 이미지 이동이 아니라 Three.js 뷰모델의 위치와 회전을 보간하여 구현한다.

권장 애니메이션 순서:

```text
준비 동작
→ 검을 뒤쪽으로 당김
→ 빠르게 대각선으로 휘두름
→ 타격 또는 MISS 연출
→ 검을 기본 자세로 복귀
```

## 공격 애니메이션 단계

### 1. Wind-up

지속 시간:

> 약 0.10~0.16초

```ts
weaponPivot.rotation.x += windupRotationX;
weaponPivot.rotation.y += windupRotationY;
weaponPivot.rotation.z += windupRotationZ;
```

검을 약간 뒤로 당긴다.

### 2. Swing

지속 시간:

> 약 0.16~0.24초

검을 화면 우측 상단에서 좌측 하단 또는 우측 하단에서 좌측 상단으로 빠르게 휘두른다.

검 종류에 따라 휘두르기 방향을 다르게 할 수 있다.

예:

```ts
type SwordSwingDirection =
  | "downLeft"
  | "downRight"
  | "horizontalLeft"
  | "upLeft";
```

### 3. Hit 또는 MISS

정답이면:

* 몬스터 피격 흔들림
* 짧은 화면 흔들림
* 타격 효과
* 타격음
* 검 잔상
* 작은 빛 번쩍임

오답이면:

* 몬스터가 옆으로 피함
* 검이 몬스터 앞을 스쳐 감
* `MISS` 텍스트
* 공기를 가르는 효과음
* 강한 화면 흔들림은 사용하지 않음

### 4. Return

지속 시간:

> 약 0.18~0.3초

검을 기본 자세로 부드럽게 복귀시킨다.

## 애니메이션 보간

`lerp`, `slerp` 또는 Tween 라이브러리를 사용할 수 있다.

초기 버전에서는 외부 라이브러리를 추가하지 않고 자체 보간 또는 `@tweenjs/tween.js` 중 하나를 사용한다.

검의 위치와 회전을 직접 즉시 변경하지 않고 시간 기반으로 보간한다.

---

# 42. 검 공격의 정답·오답 연출

## 정답 공격

```text
해설 화면에서 [다음으로]
↓
문제 UI 닫힘
↓
검 준비 동작
↓
검 휘두르기
↓
몬스터 피격
↓
공격 성공 표시
↓
크리티컬 판정
↓
몬스터가 살아 있고 기절하지 않았다면 몬스터 턴
```

## 오답 공격

```text
해설 화면에서 [다음으로]
↓
문제 UI 닫힘
↓
검 휘두르기
↓
몬스터 회피 또는 공격 빗나감
↓
MISS 표시
↓
몬스터가 살아 있으므로 몬스터 턴
```

오답이어도 검은 실제로 휘두른다.

단순히 화면에 `오답`만 표시하고 공격 애니메이션을 생략하지 않는다.

## 마무리 공격

1정답 전투의 마지막 마무리 공격은 별도의 문제가 없다.

```text
문제 2개 종료
↓
몬스터가 비틀거림
↓
검이 강한 준비 자세
↓
빠른 마무리 검격
↓
몬스터 처치
```

마무리 공격에는 정답 판정이나 경험치를 추가하지 않는다.

---

# 43. 베기 잔상 및 타격 효과

검 PNG와 별도로 투명 PNG 이펙트를 사용할 수 있다.

예:

```text
slash_white.png
slash_blue.png
slash_fire.png
critical_flash.png
hit_spark.png
```

검 종류마다 잔상 이미지와 효과음을 다르게 설정할 수 있다.

```ts
type SwordDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: SwordRarity;

  imageUrl: string;
  slashEffectUrl?: string;
  criticalEffectUrl?: string;

  swingSoundUrl?: string;
  hitSoundUrl?: string;
  criticalSoundUrl?: string;

  view: SwordViewConfig;
};
```

## 잔상 규칙

* 휘두르기 중 0.08~0.18초만 표시한다.
* 화면 전체를 가리지 않는다.
* 문제나 해설 UI 위에 표시하지 않는다.
* 픽셀 스타일을 유지한다.
* 검의 실제 판정에는 영향을 주지 않는다.

## 화면 흔들림

정답 타격 시 아주 짧은 흔들림을 줄 수 있다.

* 일반 공격: 약한 흔들림
* 마무리 공격: 중간 흔들림
* 크리티컬: 조금 강한 흔들림
* MISS: 화면 흔들림 없음 또는 매우 약함

카메라 월드 위치를 영구 변경하지 않고 별도의 `CameraShakeOffset`으로 적용한다.

---

# 44. 검 교체

인벤토리에서 검을 선택하면 현재 장착 검의 데이터와 텍스처를 변경한다.

검을 교체하기 위해 Three.js Scene 전체를 다시 생성하지 않는다.

```ts
function equipSword(swordId: string): void {
  const sword = getSwordDefinition(swordId);

  weaponViewModel.setTexture(sword.imageUrl);
  weaponViewModel.setViewConfig(sword.view);
  weaponViewModel.setEffects(sword);
}
```

검 교체 시 다음을 갱신한다.

* 검 PNG
* 크기
* 피벗
* 기본 위치
* 기본 각도
* 휘두르기 방향
* 잔상 효과
* 공격음
* 타격음
* 크리티컬 효과
* 마무리 공격 연출

---

# 45. 아이템 구성

초기 아이템:

* 소형 회복 물약
* 중형 회복 물약
* 방어 장비
* 검
* 퀘스트 아이템
* 골드
* 수집품

초기 버전에서 제외:

* 무기 강화석
* 강화 주문서
* 장비 파괴
* 공격력 버프 물약
* 복잡한 상태 이상
* 마나 회복제
* 스킬 포인트
* 제작 시스템

---

# 46. 회복 물약

JRPG 교대 전투에서는 물약 사용 후 몬스터가 공격하므로 회복량을 기존보다 조금 높인다.

권장 회복량:

* 소형 회복 물약: HP 20 회복
* 중형 회복 물약: HP 35 회복

최대 HP 이상으로 회복할 수 없다.

```ts
currentHp = Math.min(
  maxHp,
  currentHp + healAmount
);
```

예를 들어 1층 몬스터에게 소형 물약을 사용한다면:

```text
20 회복
→ 몬스터 공격 7 피해
→ 실질적으로 약 13 회복
```

보스전에서도 물약을 연속으로 사용할 수 없다.

---

# 47. 드롭 시스템

일반 몬스터 처치 시 가능한 보상:

* 골드
* 낮은 확률로 회복 물약
* 낮은 확률로 방어 장비
* 매우 낮은 확률로 특별한 검

정예 몬스터:

* 골드 증가
* 방어 장비 확률 소폭 증가
* 특별한 검 확률 소폭 증가

## 중요한 제한

* 퀘스트 필수 아이템은 무작위 드롭에 맡기지 않는다.
* 무작위 드롭 실패 때문에 퀘스트를 완료하지 못하면 안 된다.
* 장비 드롭 여부가 학습량을 바꾸면 안 된다.
* 희귀 검을 위한 반복 파밍을 강요하지 않는다.
* 동일 검 중복 획득 처리 규칙을 둔다.

중복 검 처리 예:

* 소량의 골드로 변환
* 수집 기록만 유지
* 다른 소모품으로 변환

---

# 48. 플레이어 사망

플레이어 HP가 0이 되면 현재 층 도전에 실패한다.

```text
HP 0
↓
패배 연출
↓
베이스캠프로 귀환
↓
현재 층 재도전 가능
```

재도전 시 현재 층을 처음부터 시작한다.

## 유지되는 것

* 레벨
* 누적 경험치
* 골드
* 장비
* 검
* 확정 획득한 수집품
* 완료한 이전 퀘스트
* 개방된 층

## 초기화되는 것

* 현재 층의 방 방문 상태
* 현재 층의 몬스터 배치
* 보물방과 함정방 위치
* 문제 출제 순서
* 현재 층에서 확정되지 않은 임시 진행
* 현재 층의 퀘스트 목표 상태

재도전 시 이전 오답 문제를 우선 출제할 수 있다.

---

# 49. 퀘스트 실패와 재도전

일반 몬스터가 달아난 것은 층 실패가 아니다.

다음 상황에서만 층 재도전이 필요하다.

* 플레이어 HP가 0이 됨
* 퀘스트 목표 수행에 명시적으로 실패함
* 최종 보스전에서 패배함
* 최종 보스 정답률 기준을 충족하지 못해 보스가 도망감

보물상자 오답은 층 실패가 아니다.

함정 오답도 층 실패가 아니다.

---

# 50. 학습 결과 기록

별도의 기록관 시설은 만들지 않지만 세이브 데이터에는 학습 결과를 저장한다.

저장 가능한 항목:

* 문제별 도전 횟수
* 문제별 정답 횟수
* 문제별 오답 횟수
* 최근 오답 여부
* 층별 최고 정답률
* 최종 보스 최고 정답률

활용 용도:

* 재도전 시 오답 문제 우선 출제
* 결과 화면
* 복습 추천
* 난도 조절 참고

학생에게 지나치게 복잡한 통계를 강요하지 않는다.

---

# 51. 권장 프로젝트 구조

```text
src/
├ app/
│  ├ App.tsx
│  ├ routes.ts
│  └ providers/
│
├ screens/
│  ├ TitleScreen/
│  ├ StoryScreen/
│  ├ BaseCampScreen/
│  ├ DungeonScreen/
│  ├ CombatScreen/
│  ├ QuestionScreen/
│  ├ InventoryScreen/
│  ├ FloorResultScreen/
│  └ EndingScreen/
│
├ components/
│  ├ story/
│  │  ├ StoryDialogueBox.tsx
│  │  ├ StoryPortraitLayer.tsx
│  │  ├ StoryBackgroundLayer.tsx
│  │  ├ StoryFadeLayer.tsx
│  │  └ StoryChoicePanel.tsx
│  │
│  ├ dialogue/
│  ├ buttons/
│  ├ hud/
│  ├ inventory/
│  ├ questions/
│  └ modals/
│
├ game/
│  ├ story/
│  │  ├ StoryPlayer.ts
│  │  ├ StoryStepRunner.ts
│  │  ├ StoryActionExecutor.ts
│  │  ├ StoryAssetPreloader.ts
│  │  └ StoryReplayManager.ts
│  │
│  ├ baseCamp/
│  │  ├ BaseCampCameraController.ts
│  │  ├ BaseCampFocusManager.ts
│  │  └ BaseCampHighlightManager.ts
│  │
│  ├ dungeon/
│  │  ├ DungeonGenerator.ts
│  │  ├ DungeonValidator.ts
│  │  ├ DungeonRuntime.ts
│  │  ├ CameraPathController.ts
│  │  └ RoomEventController.ts
│  │
│  ├ combat/
│  │  ├ CombatEngine.ts
│  │  ├ CombatResolver.ts
│  │  ├ TurnController.ts
│  │  ├ CriticalResolver.ts
│  │  ├ DamageCalculator.ts
│  │  └ BossBattleEngine.ts
│  │
│  ├ questions/
│  │  ├ QuestionSelector.ts
│  │  ├ QuestionSession.ts
│  │  └ AnswerEvaluator.ts
│  │
│  ├ quests/
│  │  ├ QuestManager.ts
│  │  └ FloorUnlockManager.ts
│  │
│  ├ progression/
│  │  ├ ExperienceManager.ts
│  │  └ LevelManager.ts
│  │
│  ├ inventory/
│  │  ├ InventoryManager.ts
│  │  └ EquipmentManager.ts
│  │
│  └ rewards/
│     └ DropResolver.ts
│
├ three/
│  ├ DungeonScene.ts
│  ├ RoomRenderer.ts
│  ├ CorridorRenderer.ts
│  ├ MonsterBillboard.ts
│  ├ CameraRig.ts
│  │
│  ├ weapon/
│  │  ├ WeaponViewModel.ts
│  │  ├ WeaponAnimationController.ts
│  │  ├ WeaponBobController.ts
│  │  ├ WeaponEffectController.ts
│  │  └ SwordTextureLoader.ts
│  │
│  └ effects/
│     ├ CameraShake.ts
│     ├ SlashEffect.ts
│     ├ HitEffect.ts
│     ├ MissEffect.ts
│     └ CriticalEffect.ts
│
├ data/
│  ├ questions/
│  ├ floors/
│  ├ mapTemplates/
│  ├ quests/
│  ├ npcs/
│  ├ monsters/
│  ├ items/
│  ├ swords/
│  ├ stories/
│  ├ baseCamp/
│  ├ dialogues/
│  └ balance/
│
├ save/
│  ├ SaveManager.ts
│  ├ SaveMigration.ts
│  └ SaveTypes.ts
│
├ types/
└ assets/
   ├ textures/
   ├ monsters/
   ├ swords/
   ├ effects/
   ├ npcs/
   ├ story/
   └ audio/
```

인트로 전용 화면 로직을 별도로 중복 구현하지 않는다.

인트로도 하나의 `StorySequence`로 관리하고 공통 `StoryScreen`과 `StoryPlayer`를 사용한다.

---

# 52. 데이터와 로직 분리

다음 요소를 컴포넌트 안에 하드코딩하지 않는다.

* 문제
* 정답
* 해설
* NPC 대사
* NPC 초상화
* 스토리 장면 및 단계
* 스토리 배경과 초상화 배치
* 스토리 전환 시간과 포커스 지점
* 퀘스트
* 층 순서
* 층별 문제 수
* 맵 템플릿
* 몬스터
* 피해량
* 아이템
* 드롭 확률
* 장비 수치
* 검 데이터
* 검 PNG 경로
* 검 위치 및 각도
* 검 피벗
* 검 공격 애니메이션
* 베기 이펙트
* 공격 효과음
* 보물방·함정방 배치 규칙

새로운 검은 데이터 파일과 PNG를 추가하는 방식으로 등록한다.

예:

```ts
export const SWORDS: SwordDefinition[] = [
  {
    id: "basic-sword",
    name: "견습 기사의 검",
    description: "모험을 시작하는 학생에게 지급되는 튼튼한 검.",
    rarity: "common",

    imageUrl: "/assets/swords/basic-sword.png",
    slashEffectUrl: "/assets/effects/slash-white.png",

    swingSoundUrl: "/assets/audio/sword-swing-01.wav",
    hitSoundUrl: "/assets/audio/sword-hit-01.wav",

    view: {
      width: 0.72,
      height: 0.72,

      rootPosition: [0.52, -0.48, -1.05],
      idleRotation: [-0.18, -0.28, -0.62],

      pivotOffset: [0.12, 0.18, 0],

      swingRotation: [-0.55, 0.18, 1.25],
      swingPositionOffset: [-0.2, 0.08, 0],
    },
  },
];
```

---

# 53. 밸런스 데이터 예시

```ts
export const BALANCE = {
  player: {
    startingMaxHp: 50,
    hpPerLevel: 5,
  },

  combat: {
    normalQuestions: 2,
    eliteQuestions: 3,

    criticalChance: 0.08,
    criticalOnlyOnCorrectAnswer: true,

    maxCriticalStunsPerNormalBattle: 1,
    maxCriticalStunsPerEliteBattle: 1,
    maxCriticalStunsPerBossPhase: 1,
  },

  potion: {
    smallHeal: 20,
    mediumHeal: 35,
    preventConsecutiveUse: true,
    monsterActsAfterItemUse: true,
  },

  damage: {
    normalBase: 7,
    normalPerFloor: 1,

    eliteBonus: 1,

    trapDefault: 10,
    bossPhaseAttack: 7,

    minimumNormalDamage: 3,
    minimumEliteDamage: 4,
    minimumBossDamage: 3,
    minimumTrapDamage: 5,
  },

  experience: {
    correctAnswer: 10,
    hardCorrectAnswer: 15,

    perfectNormalBattle: 5,
    perfectEliteBattle: 10,

    questComplete: 20,
    finalBossVictory: 50,
  },

  boss: {
    minQuestions: 15,
    maxQuestions: 20,

    victoryCorrectRate: 0.7,

    minQuestionsPerPhase: 3,
    maxQuestionsPerPhase: 4,

    attackOncePerPhase: true,
  },

  rooms: {
    treasureMin: 0,
    treasureMax: 1,

    trapMin: 0,
    trapMax: 1,

    requireTreasureOrTrap: true,
    minimumNormalCombatRooms: 1,
  },

  weaponViewModel: {
    useHandSprite: false,
    useSwordPngOnly: true,

    usePseudoThickness: false,

    renderOrder: 1000,
    depthTest: false,
    depthWrite: false,

    idleBobEnabled: true,
    movementBobEnabled: true,
  },
} as const;
```

`requireTreasureOrTrap`이 참이므로 다음 조합만 허용한다.

| 보물방 | 함정방 | 허용 |
| --: | --: | -- |
|   0 |   0 | 불가 |
|   1 |   0 | 가능 |
|   0 |   1 | 가능 |
|   1 |   1 | 가능 |
|   2 |   0 | 불가 |
|   0 |   2 | 불가 |

---

# 54. 개발 우선순위

처음부터 모든 시스템을 한꺼번에 구현하지 않는다.

## 1단계: 핵심 화면 및 연출 기반

* 타이틀 화면
* 최소 앱 화면 전환
* localStorage 기본 세이브 구조
* 빈 던전 방 한 곳
* 검 PNG 뷰모델
* 검 기본 위치 및 2.5D 각도
* 검 휘두르기 애니메이션
* 데이터 기반 선형 StoryPlayer
* 배경 이미지 표시 및 교체
* NPC 초상화 표시 및 표정 교체
* 화자 이름과 대화창
* 학생의 `[다음]` 입력을 기다리는 대화 흐름
* 임시 베이스캠프 화면
* 베이스캠프 이름 기반 포커스 카메라
* 특정 시설 또는 NPC 강조

## 2단계: 학습 및 일반 전투

* 여러 문제 유형의 최소 구현
* 정답·오답 및 해설 화면
* 문제 중복 방지
* 정답 공격 성공
* 오답 `MISS`
* 몬스터 교대 공격
* 문제 2개 일반 전투
* 네 가지 정답 조합의 정확한 결과
* HP 및 피해
* 결과 화면
* 검 잔상 및 타격 이펙트

## 3단계: 탐험과 퀘스트

* 방 노드 4~6개
* 이동 선택지
* 카메라 자동 이동
* 방 도착 이벤트
* 보물방 또는 함정방
* 마지막 퀘스트 방
* NPC 대화
* 퀘스트 수주
* 퀘스트 수주 시 층 개방
* StoryPlayer와 QuestManager 연결
* StoryPlayer와 FloorUnlockManager 연결
* 스토리 actionId 중복 실행 방지

## 4단계: 성장 및 탐험 확장

* 경험치
* 레벨업
* 물약 연속 사용 제한
* 사망 및 재도전
* 크리티컬 및 기절
* 여러 맵 템플릿
* 랜덤 방 배치
* 보물방·함정방 규칙
* 정예 몬스터
* 장비 및 검 수집
* 여러 검 PNG 교체
* 검별 피벗 및 애니메이션 데이터

## 5단계: 단원 완성

* 차시별 층 추가
* 모든 퀘스트
* 스토리 체크포인트와 이어 보기
* 이야기 다시 보기의 replayMode
* 필요한 경우 이야기 선택지와 조건 분기
* 최종 보스
* 15~20문제 단계형 전투
* 단계별 보스 공격
* 엔딩 StorySequence
* 전체 밸런스 조정
* 모바일·태블릿 대응
* 다양한 화면 비율에서 검과 스토리 UI 위치 보정

---

# 55. 검 뷰모델 반응형 처리

검의 위치가 화면 해상도마다 달라지지 않도록 반응형 보정을 적용한다.

특히 다음 환경을 확인한다.

* 16:9 PC
* 16:10 노트북
* 4:3 태블릿
* 세로가 짧은 브라우저
* 모바일 가로 화면

검 위치는 픽셀 좌표가 아니라 카메라 로컬 좌표를 사용한다.

필요하면 화면 비율별 설정값을 둔다.

```ts
type WeaponViewportPreset = {
  minAspect: number;
  maxAspect: number;

  positionMultiplier: [number, number, number];
  scaleMultiplier: number;
};
```

문제 모달이 열렸을 때 검이 정답 버튼이나 해설을 가리지 않게 한다.

---

# 56. 구현 시 주의할 점

## 검 PNG에 손을 자동 생성하지 않는다

사용자는 손이나 팔 이미지를 사용하지 않는다.

Codex는 검 PNG만으로 구현한다.

다음 요소를 임의로 추가하지 않는다.

* 사람 손
* 팔
* 장갑
* 캐릭터 신체
* 검 손잡이를 쥔 별도 이미지

## 검 PNG를 진짜 3D 모델로 오해하지 않는다

검은 PNG가 매핑된 Plane이다.

다음 요소를 이용해 3D처럼 보이게 한다.

* 원근 카메라
* 카메라 자식 구조
* 3축 회전
* 손잡이 피벗
* 위치 보간
* 휘두르기
* 흔들림
* 잔상
* 타격 이펙트
* 화면 흔들림

PNG만으로 실제 입체 메시를 자동 생성하는 기능은 초기 구현 범위가 아니다.

## 월드 검과 뷰모델 검을 분리한다

화면 오른쪽 아래에 보이는 검은 충돌 판정을 하지 않는 뷰모델이다.

몬스터 타격 여부는 퀴즈 결과와 전투 로직으로 결정한다.

검 Plane이 실제 몬스터와 접촉하는지를 계산하지 않는다.

```text
검 애니메이션
= 시각적 표현

정답 판정
= 전투 결과의 실제 기준
```

---

# 57. 최종 구현 원칙 요약

Codex는 다음을 최우선으로 지켜야 한다.

1. 퀘스트를 수주해야 해당 층이 개방된다.
2. 한 차시의 학습 주제를 한 층으로 구성한다.
3. 던전 이동은 WASD가 아니라 화면 선택지로 진행한다.
4. 선택지를 누르면 카메라가 복도를 따라 다음 방까지 자동 이동한다.
5. 다음 방에 도착하면 해당 방 이벤트가 자동 시작된다.
6. 층 구조는 제작된 템플릿을 기반으로 일부 랜덤 생성한다.
7. 퀘스트 목표인 마지막 방은 반드시 도달 가능해야 한다.
8. 별도의 일반 출구는 없어도 된다.
9. 보물방 또는 함정방이 매 층 최소 하나는 존재한다.
10. 보물방은 최대 1개다.
11. 함정방은 최대 1개다.
12. 일반 전투는 문제 2개 고정이다.
13. 정예 전투는 문제 3개 고정이다.
14. 전투는 플레이어와 몬스터가 번갈아 행동하는 JRPG 방식이다.
15. 정답이면 플레이어의 검 공격이 성공한다.
16. 오답이면 플레이어의 검 공격이 `MISS`가 된다.
17. 오답 자체가 직접 피해를 주는 규칙으로 구현하지 않는다.
18. 몬스터가 살아 있으면 정답·오답과 관계없이 자기 턴에 공격한다.
19. 플레이어 공격으로 몬스터가 쓰러지면 몬스터 턴은 발생하지 않는다.
20. 정답이라고 해서 몬스터 턴을 자동으로 취소하지 않는다.
21. 정답 공격에서만 약 8% 확률로 크리티컬이 발생한다.
22. 크리티컬 시 몬스터가 기절하여 다음 몬스터 턴을 한 번 생략한다.
23. 크리티컬은 문제 수, 정답 수, 승리 조건을 바꾸지 않는다.
24. 일반 전투에서 한 문제 이상 맞히면 추가 문제 없는 마무리 공격으로 몬스터를 처치한다.
25. 두 문제 모두 틀리면 몬스터를 처치하지 못하고 몬스터가 달아난다.
26. 모두 오답이라고 해서 추가 강공격이나 추가 문제를 주지 않는다.
27. 회복 물약은 소지 수량만큼 사용할 수 있지만 연속 두 번 사용할 수 없다.
28. 물약 사용 후에는 몬스터 턴이 발생한다.
29. 시작 최대 HP는 50이다.
30. 일반 몬스터의 초기 기본 피해는 약 7이다.
31. 소형 물약은 20, 중형 물약은 35 회복을 권장한다.
32. 방어 장비와 레벨업으로 생존력이 완만하게 증가한다.
33. 무기 강화는 없다.
34. 검은 내부적으로 외형 중심이지만 학생에게는 강하고 희귀한 무기로 표현한다.
35. 검의 종류가 문제 수나 학습량을 바꾸지 않는다.
36. 플레이어의 손이나 팔 이미지는 사용하지 않는다.
37. 투명 배경 검 PNG만 화면 오른쪽 아래에 표시한다.
38. 검 PNG는 Three.js PlaneGeometry에 매핑한다.
39. 검은 카메라의 자식인 `WeaponViewModelRoot`에 연결한다.
40. 검은 3축 회전과 원근감으로 마인크래프트 같은 2.5D 뷰모델로 보정한다.
41. 검의 손잡이 부근이 회전 중심이 되도록 검별 피벗 값을 둔다.
42. 검 휘두르기는 준비·스윙·타격 또는 MISS·복귀 단계로 구성한다.
43. 정답과 오답 모두 검 휘두르기 애니메이션을 재생한다.
44. 정답이면 피격 효과, 오답이면 몬스터 회피와 `MISS`를 표시한다.
45. 검별로 PNG, 크기, 각도, 잔상, 소리와 연출을 데이터로 관리한다.
46. 검은 월드 충돌을 사용하지 않는 시각적 뷰모델이다.
47. 최종 보스는 15~20문제를 사용한다.
48. 최종 보스 문제는 3~4문제 단위의 단계로 묶는다.
49. 보스는 문제마다가 아니라 단계 종료 시 한 번 공격한다.
50. 보스전 정답률 70% 이상이면 승리한다.
51. 70% 미만이고 HP가 남아 있으면 보스가 도망간다.
52. HP가 0이 되면 패배한다.
53. 정답과 해설은 자동으로 사라지지 않으며 학생이 `다음으로`를 눌러야 한다.
54. 같은 도전에서는 동일 문제를 중복 출제하지 않는다.
55. 재도전 시 문제 순서를 다시 섞고 이전 오답 문제를 우선 출제할 수 있다.
56. 모든 핵심 데이터는 하드코딩하지 않고 교체 가능한 구조로 만든다.
57. 게임의 모든 연출과 시스템은 항상 학습보다 앞서지 않게 한다.
58. 인트로, 퀘스트 대화, 던전 이벤트와 엔딩은 공통 StoryPlayer를 사용한다.
59. 스토리 내용과 연출 순서는 React 컴포넌트에 하드코딩하지 않고 StorySequence 데이터로 관리한다.
60. 한 화면에서 배경 이미지, 여러 초상화, 화자 이름과 대화 텍스트를 동시에 표시할 수 있어야 한다.
61. 대사는 학생이 직접 `[다음]`을 눌러야 진행한다.
62. 페이드, 카메라 이동, 대기 등 읽기를 요구하지 않는 연출 단계만 자동 진행한다.
63. 현재 화자의 초상화는 밝게, 비화자의 초상화는 조금 어둡게 표현한다.
64. 명시적인 제거 단계가 있기 전까지 배경과 초상화 상태를 유지한다.
65. 스토리 중 베이스캠프의 지정 지점을 이름 기반 focus point로 비출 수 있어야 한다.
66. 베이스캠프 카메라는 포커스 지점으로 부드럽게 이동하고 특정 시설이나 NPC를 강조할 수 있어야 한다.
67. StoryPlayer는 퀘스트와 층 상태를 직접 수정하지 않고 담당 Manager에 명령을 전달한다.
68. 퀘스트 수주, 보상과 층 개방은 actionId를 이용해 중복 실행되지 않게 한다.
69. 스토리 진행은 checkpoint 단위로 저장하고 새로고침 시 마지막 체크포인트부터 재개한다.
70. 이야기 다시 보기에서는 대사와 화면 연출만 재생하고 퀘스트, 보상, 층 상태를 변경하지 않는다.
71. 스토리 선택지가 추가되더라도 필수 문제 수와 핵심 학습 진행 가능 여부를 변경하지 않는다.
72. 스토리 이미지와 초상화는 사전 로드하며 로딩 실패가 전체 진행을 중단시키지 않게 한다.
73. 스토리 연출 중에는 관계없는 이동, 전투와 인벤토리 입력을 잠근다.
74. 스토리 UI는 PC, 태블릿과 모바일 가로 화면에서 초상화와 대화창이 잘리지 않게 반응형으로 구현한다.
75. 스토리 재생 중 검 PNG 뷰모델은 기본적으로 숨기고, 스토리 종료 후 필요한 화면에서만 다시 표시한다.
76. 인트로 건너뛰기는 중간 상태 변경을 무작정 순차 실행하지 않고 안전한 완료 처리로 최종 필수 상태만 한 번 적용한다.

아직 교과서가 확정되지 않았으므로 **전체 층 수, 차시별 문제 데이터, 구체적인 퀘스트 이야기, 검 디자인, 몬스터 디자인 및 최종 보스 디자인**은 추후 데이터와 에셋으로 추가하는 전제로 구현한다.
