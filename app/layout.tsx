import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "생일선물 — BirthdayGift",
  description: "사주에 근거한 출생 택일 서비스. 우리 아이에게 가장 좋은 생일을 선물합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
