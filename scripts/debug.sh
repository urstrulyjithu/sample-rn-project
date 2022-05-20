npm run environment:release

echo "Assets deleting..."
set -x
rm -rf android/app/src/main/res/drawable-*
rm -rf android/app/src/main/res/raw/*
set +x
echo "Clean build folder..."
rm -rf android/app/build/*


mkdir -p android/app/src/main/assets

react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

cd android && ./gradlew clean assembleDebug

echo "Open generated build location..."

open app/build/outputs/apk/debug/.
