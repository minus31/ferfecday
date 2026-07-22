import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'birthdaygift',
  brand: {
    displayName: '생일선물',
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: '', // 앱인토스 콘솔에 업로드한 아이콘 이미지 URL로 교체하세요.
  },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build',
    },
  },
  permissions: [],
  outdir: 'out',
});
