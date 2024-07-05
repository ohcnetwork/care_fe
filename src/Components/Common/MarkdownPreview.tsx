import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const MarkdownPreview = ({ markdown }: { markdown: string }) => {
  const processedMarkdown = markdown
    .replace(
      /!\[mention_user\]\(user_id:(\d+), username:([^)]+)\)/g,
      (_, userId, username) =>
        `<a class="rounded bg-blue-100 px-1 font-normal text-slate-800 no-underline hover:underline" data-user-id="${userId}" data-username="${username}">@${username}</a>`,
    )
    .replace(/~(.*?)~/g, (_, text) => `<del>${text}</del>`);

  return (
    <ReactMarkdown className="prose" rehypePlugins={[rehypeRaw]}>
      {processedMarkdown}
    </ReactMarkdown>
  );
};

export default MarkdownPreview;
