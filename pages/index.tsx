import Head from "next/head";
import PromptDirectorApp from "@/components/PromptDirectorApp";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>种草视频 AI 导演台</title>
        <meta
          name="description"
          content="输入脚本和人设，一键生成贴合产品卖点的 AI 视频分镜 Prompt 包。"
        />
      </Head>
      <PromptDirectorApp />
    </>
  );
}
