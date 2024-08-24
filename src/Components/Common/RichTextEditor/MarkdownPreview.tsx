import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { UserBareMinimum } from "../../Users/models";

interface CustomLinkProps {
  className?: string;
  "data-username"?: string;
}

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
  const MentionedUsers: Record<string, UserBareMinimum> = {};
  if (mentioned_users) {
    mentioned_users.forEach((user) => {
      MentionedUsers[user.username] = user;
    });
  }

  const processedMarkdown = markdown
    .replace(/@(\w+)/g, (_, username) => {
      const user = MentionedUsers[username];
      if (user) {
        return `<a href="/user/profile/${username}" data-username="${username}">@${username}</a>`;
      } else {
        return `@${username}`;
      }
    })
    .replace(/~~(.*?)~~/g, (_, text) => `<del>${text}</del>`);

  const CustomLink: React.FC<CustomLinkProps> = (props) => {
    const [isHovered, setIsHovered] = useState(false);

    if (props["data-username"]) {
      const username = props["data-username"];
      return (
        <span
          className="relative inline-block"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="cursor-pointer rounded bg-blue-100 px-1 font-normal text-slate-800 no-underline"
          >
            @{username}
          </span>
          {MentionedUsers[username] && isHovered && (
            <div className="tooltip-text absolute bottom-full z-10 mb-2 transition-opacity duration-300 ease-in-out">
              <UserCard user={MentionedUsers[username]} />
              <div className="absolute left-2 top-full border-8 border-solid border-transparent border-t-gray-200 shadow-md"></div>
            </div>
          )}
        </span>
      );
    }
    return (
      <a
        {...props}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-500 underline"
      />
    );
  };

  return (
    <ReactMarkdown
      className="prose text-sm prose-p:m-0"
      rehypePlugins={[
        rehypeRaw,
        // Todo: Sanitize but keep custom styles
        // rehypeSanitize
      ]}
      components={{
        a: CustomLink,
      }}
    >
      {processedMarkdown}
    </ReactMarkdown>
  );
};

export default MarkdownPreview;
