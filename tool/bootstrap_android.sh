#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../mobile"
if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter SDK is required. Install Flutter stable first." >&2
  exit 1
fi
if [ ! -d android ]; then
  flutter create --platforms=android --org com.nassersoft --project-name nasser_soft .
fi
flutter pub get
flutter analyze
flutter build apk --release
