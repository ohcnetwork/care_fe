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
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
    try {
      const url = new URL(href);
      if (!["http:", "https:"].includes(url.protocol)) {
        return text;
      }
      href = url.toString();
    } catch {
      return text;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${
      title || ""
    }">${text}</a>`;
  };

  const processedMarkdown = markdown
    .replace(/@([a-zA-Z0-9_]{3,30})/g, (_, username) => {
      const user = MentionedUsers[username];
      if (user) {
        const sanitizedUsername = username.replace(/[<>"'&]/g, "");
        return `<span class="mention cursor-pointer font-medium text-primary hover:underline" data-username="${sanitizedUsername}">@${sanitizedUsername}</span>`;
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
    const listeners: Array<{
      element: Element;
      enter: () => void;
      leave: () => void;
    }> = [];

    mentionElements.forEach((ele) => {
      const handleEnter = () => {
        const username = ele.getAttribute("data-username");
        if (username) {
          setHoveredUser(username);
          const rect = ele.getBoundingClientRect();
          setHoverPosition({
            x: rect.left,
            y: rect.top,
          });
        }
      };
      const handleLeave = () => {
        setHoveredUser(null);
        setHoverPosition(null);
      };

      ele.addEventListener("mouseenter", handleEnter);
      ele.addEventListener("mouseleave", handleLeave);

      listeners.push({
        element: ele,
        enter: handleEnter,
        leave: handleLeave,
      });
    });

    return () => {
      listeners.forEach(({ element, enter, leave }) => {
        element.removeEventListener("mouseenter", enter);
        element.removeEventListener("mouseleave", leave);
      });
    };
  }, [sanitizedHtml]);

  return (
    <div className="relative prose text-sm prose-p:m-0">
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      {hoveredUser && hoverPosition && MentionedUsers[hoveredUser] && (
        <div
          className="fixed z-50 transition-opacity duration-300 ease-in-out"
          style={{
            top: `${hoverPosition.y - 100}px`,
            left: `${hoverPosition.x}px`,
          }}
        >
          <UserCard user={MentionedUsers[hoveredUser]} />
          <div className="absolute left-2 -bottom-1 h-4 w-4 rotate-45 transform bg-gray-200"></div>
        </div>
      )}
    </div>
  );
};

export default MarkdownPreview;
