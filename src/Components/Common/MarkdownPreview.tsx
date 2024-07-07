import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { UserModel } from "../Users/models";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

interface UserCardProps {
  user: UserModel;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => (
  <div className="flex w-64 items-center space-x-3 rounded-lg bg-white p-3 shadow-lg">
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

const MarkdownPreview: React.FC<{ markdown: string }> = ({ markdown }) => {
  const [userCache, setUserCache] = useState<Record<string, UserModel>>({});
  const facilityId = "81092ced-8720-44cb-b4c5-3f0ad0540153";

  const { data: facilityUsers } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
  });

  useEffect(() => {
    if (facilityUsers?.results) {
      const newCache: Record<string, UserModel> = {};
      facilityUsers.results.forEach((user) => {
        if (user.username) {
          newCache[user.username] = user as UserModel;
        }
      });
      setUserCache(newCache);
    }
  }, [facilityUsers]);

  const processedMarkdown = markdown
    .replace(
      /!\[mention_user\]\(user_id:(\d+), username:([^)]+)\)/g,
      (_, userId, username) =>
        `<a class="user-mention" href="/user/profile/${username}" data-user-id="${userId}" data-username="${username}">@${username}</a>`,
    )
    .replace(/~(.*?)~/g, (_, text) => `<del>${text}</del>`);

  const CustomLink: React.FC<any> = (props) => {
    if (props.className?.includes("user-mention")) {
      const username = props["data-username"];
      return (
        <span className="group relative inline-block">
          <a
            {...props}
            className="cursor-pointer rounded bg-blue-100 px-1 font-normal text-slate-800 no-underline hover:underline"
          />
          {userCache[username] && (
            <div className="tooltip-text invisible absolute left-1/2 z-10 mt-1 -translate-x-1/2 opacity-0 transition-opacity duration-300 ease-in-out group-hover:visible group-hover:opacity-100">
              <UserCard user={userCache[username]} />
            </div>
          )}
        </span>
      );
    }
    return <a {...props} />;
  };

  return (
    <ReactMarkdown
      className="prose"
      rehypePlugins={[rehypeRaw]}
      components={{
        a: CustomLink,
      }}
    >
      {processedMarkdown}
    </ReactMarkdown>
  );
};

export default MarkdownPreview;
