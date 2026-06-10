import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "种草视频 AI 导演台",
  description: "输入脚本和人设，一键生成贴合产品卖点的 AI 视频分镜 Prompt 包。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
