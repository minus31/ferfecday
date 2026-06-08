import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ferfecday — find the perfect day for your baby",
  description: "사주에 근거한 출생 택일 서비스. 우리 아이의 가장 좋은 날을 찾아드립니다.",
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
