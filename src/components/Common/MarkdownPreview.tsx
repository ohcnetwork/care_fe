import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useState } from "react";

import { UserBareMinimum } from "@/components/Users/models";

const UserCard = ({ user }: { user: UserBareMinimum }) => (
  <div className="z-10 flex w-64 items-center space-x-3 rounded-lg bg-gray-200 px-3 pb-3 shadow-lg">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
      {user.first_name[0]}
    </div>
    <div className="space-y-0">
      <h3 className="text-sm font-semibold text-gray-800">
        {user.first_name} {user.last_name}
      </h3>
      <p className="text-xs text-gray-500">@{user.username}</p>
      <p className="text-xs text-gray-500">{user.user_type}</p>
    </div>
  </div>
);

const MarkdownPreview = ({
  markdown,
  mentioned_users,
}: {
  markdown: string;
  mentioned_users?: UserBareMinimum[];
}) => {
  const MentionedUsers = Object.fromEntries(
    mentioned_users?.map((u) => [u.username, u]) ?? [],
  );

  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  const renderer = new marked.Renderer();
  renderer.link = function ({
    href,
    title,
    text,
  }: {
    href: string;
    title?: string | null;
    text: string;
  }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${
      title || ""
    }">${text}</a>`;
  };

  const processedMarkdown = markdown
    .replace(/@(\w+)/g, (_, username) => {
      const user = MentionedUsers[username];
      if (user) {
        return `<span class="mention" data-username="${username}">@${username}</span>`;
      } else {
        return `@${username}`;
      }
    })
    .replace(/~~(.*?)~~/g, (_, text) => `<del>${text}</del>`);

  const html = marked
    .parse(processedMarkdown, {
      gfm: true,
      breaks: true,
      renderer: renderer,
    })
    .toString();

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"],
  });

  useEffect(() => {
    const mentionElements = document.querySelectorAll(".mention");
    mentionElements.forEach((ele) => {
      ele.addEventListener("mouseenter", () => {
        const username = ele.getAttribute("data-username");
        if (username) setHoveredUser(username);
      });
      ele.addEventListener("mouseleave", () => {
        setHoveredUser(null);
      });
    });
  }, [sanitizedHtml]);

  return (
    <div className="relative prose text-sm prose-p:m-0">
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      {hoveredUser && MentionedUsers[hoveredUser] && (
        <div className="tooltip-text absolute bottom-full z-10 mb-2 transition-opacity duration-300 ease-in-out">
          <UserCard user={MentionedUsers[hoveredUser]} />
          <div className="absolute left-2 top-full border-8 border-solid border-transparent border-t-gray-200 shadow-md"></div>
        </div>
      )}
    </div>
  );
};

export default MarkdownPreview;
