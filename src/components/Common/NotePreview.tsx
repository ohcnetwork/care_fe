import DOMPurify from "dompurify";
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

const NotePreview = ({
  initialNote,
  mentioned_users = [],
}: {
  initialNote: string;
  mentioned_users?: UserBareMinimum[];
}) => {
  const mentionedUsersMap = Object.fromEntries(
    mentioned_users.map((u) => [u.username, u]),
  );

  const [hoveredUserData, setHoveredUserData] = useState<{
    username: string;
    position: { x: number; y: number };
  } | null>(null);

  const processText = (content: string) => {
    const withLineBreaks = content.replace(/\n/g, "<br />");
    const mentionRegex = /@([a-zA-Z0-9_]{3,30})/g;

    const withMentions = withLineBreaks.replace(mentionRegex, (_, username) => {
      const user = mentionedUsersMap[username];
      if (!user) return `@${username}`;

      return `<span class="cursor-pointer font-medium text-primary hover:underline" data-username="${username}">@${username}</span>`;
    });

    return DOMPurify.sanitize(withMentions, {
      ADD_ATTR: ["data-username"],
    });
  };

  useEffect(() => {
    const handleMentionHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-username]")) return;

      const username = target.getAttribute("data-username");
      if (!username) return;

      if (event.type === "mouseenter") {
        const rect = target.getBoundingClientRect();
        setHoveredUserData({
          username,
          position: { x: rect.left, y: rect.top },
        });
      } else {
        setHoveredUserData(null);
      }
    };

    document.addEventListener("mouseenter", handleMentionHover, true);
    document.addEventListener("mouseleave", handleMentionHover, true);

    return () => {
      document.removeEventListener("mouseenter", handleMentionHover, true);
      document.removeEventListener("mouseleave", handleMentionHover, true);
    };
  }, []);

  return (
    <div className="relative prose text-sm prose-p:m-0">
      <div dangerouslySetInnerHTML={{ __html: processText(initialNote) }} />
      {hoveredUserData && mentionedUsersMap[hoveredUserData.username] && (
        <div
          className="fixed z-50 transition-opacity duration-300 ease-in-out"
          style={{
            top: `${hoveredUserData.position.y - 100}px`,
            left: `${hoveredUserData.position.x}px`,
          }}
        >
          <UserCard user={mentionedUsersMap[hoveredUserData.username]} />
          <div className="absolute left-2 -bottom-1 h-4 w-4 rotate-45 transform bg-gray-200"></div>
        </div>
      )}
    </div>
  );
};

export default NotePreview;
