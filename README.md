# Adventure Academy

Vite + React + TypeScript + Three.js 기반의 정적 싱글플레이 에듀테크
RPG 프로젝트입니다.

현재 구현 범위는 프로젝트 기반과 네 개의 임시 화면입니다.

- `TitleScreen`
- `StoryScreen`
- `BaseCampScreen`
- `DungeonScreen`

## 요구 환경

- Node.js 20.19 이상 또는 22.12 이상
- npm

## 설치 및 로컬 실행

```bash
npm install
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. 앱은
`TitleScreen`에서 시작합니다.

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. 빌드 결과를 로컬에서 확인하려면 다음을
실행합니다.

```bash
npm run preview
```

## 화면 전환 확인

1. 타이틀의 `새로 시작하기`를 눌러 `StoryScreen`으로 이동합니다.
2. 이야기 화면의 `베이스캠프로`를 눌러 `BaseCampScreen`으로 이동합니다.
3. 베이스캠프의 `던전으로`를 눌러 `DungeonScreen`으로 이동합니다.
4. 각 화면의 `타이틀로` 버튼을 눌러 시작 화면으로 돌아갑니다.

화면 전환은 초기 단계에 맞게 React 상태로만 처리하며 React Router는
사용하지 않습니다.

## GitHub Pages base 경로

기본 base 경로는 `/`입니다. 프로젝트 사이트
`https://<사용자명>.github.io/<저장소명>/`에 배포할 때는 빌드 전에
`VITE_BASE_PATH`를 저장소 이름으로 지정합니다.

macOS/Linux:

```bash
VITE_BASE_PATH=저장소명 npm run build
```

Windows PowerShell:

```powershell
$env:VITE_BASE_PATH="저장소명"
npm run build
```

GitHub Actions에서는 빌드 단계의 환경 변수로 설정할 수 있습니다.

```yaml
env:
  VITE_BASE_PATH: ${{ github.event.repository.name }}
```

### GitHub Pages 활성화

저장소의 `Settings` → `Pages` → `Build and deployment`에서 `Source`를
`GitHub Actions`로 선택합니다. 이후 `main` 브랜치에 push하면
`.github/workflows/deploy.yml`이 `npm ci`, 빌드, `dist/` 업로드와 배포를
자동으로 실행합니다.

현재 앱은 URL 라우팅을 사용하지 않으므로 GitHub Pages의 하위 경로에서
직접 새로고침할 때 별도의 SPA fallback 파일이 필요하지 않습니다. 향후
`public/` 에셋을 추가할 때는 루트 절대 경로를 하드코딩하지 말고
`import.meta.env.BASE_URL`을 기준으로 경로를 구성해야 합니다.

## 구현 기준

전체 구현 기준은
`docs/ADVENTURE_ACADEMY_SPEC.md`에 있습니다. 이 문서는 수정하거나
축약하지 않습니다.
