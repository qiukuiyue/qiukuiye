import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "产品种草视频 Prompt 导演",
  description: "把产品文案转换为可编辑、可复制的 AI 视频分镜 Prompt 包。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
