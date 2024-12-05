import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/Common/Avatar";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDisplayName } from "@/Utils/utils";

interface MentionsDropdownProps {
  onSelect: (user: { id: string; username: string }) => void;
  position: { top: number; left: number };
  editorRef: React.RefObject<HTMLTextAreaElement>;
  filter: string;
  containerRef: React.RefObject<HTMLTextAreaElement>;
}

const KEYS = {
  ENTER: "Enter",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ESCAPE: "Escape",
} as const;

const MentionsDropdown: React.FC<MentionsDropdownProps> = ({
  onSelect,
  position,
  editorRef,
  filter,
  containerRef,
}) => {
  const facilityId = useSlug("facility");
  const { data, loading } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
  });

  const users = data?.results || [];

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top + position.top,
        left: rect.left + position.left,
      });
    }
  }, [position, containerRef]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().startsWith(filter.toLowerCase()),
    );
  }, [users, filter]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (document.activeElement !== editorRef.current) {
        return;
      }

      if (event.key === KEYS.ENTER && filteredUsers.length > 0) {
        const selectedUser =
          selectedIndex !== null
            ? filteredUsers[selectedIndex]
            : filteredUsers[0];

        onSelect({
          id: selectedUser.id.toString(),
          username: selectedUser.username + " ",
        });
      } else if (event.key === KEYS.ESCAPE) {
        onSelect({ id: "", username: "" });
      } else if (event.key === KEYS.ARROW_DOWN) {
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return 0;
          return Math.min(filteredUsers.length - 1, prevIndex + 1);
        });
      } else if (event.key === KEYS.ARROW_UP) {
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return filteredUsers.length - 1;
          return Math.max(0, prevIndex - 1);
        });
      }
    },
    [filteredUsers, selectedIndex, onSelect, editorRef],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed z-[9999] max-h-36 w-64 overflow-y-auto rounded-md bg-white text-sm shadow-lg"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
      role="listbox"
      aria-label="User mentions"
    >
      {loading ? (
        <div
          className="p-2 text-secondary-500"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block animate-spin">⌛</span> Loading users...
        </div>
      ) : filteredUsers.length > 0 ? (
        filteredUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex cursor-pointer items-center gap-2 p-2 ${
              index === selectedIndex
                ? "bg-secondary-100"
                : "hover:bg-secondary-100"
            }`}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() =>
              onSelect({
                id: user.id.toString(),
                username: user.username + " ",
              })
            }
          >
            <Avatar
              name={formatDisplayName(user)}
              imageUrl={user.read_profile_picture_url}
              className="h-6 w-6 rounded-full text-black/50"
            />
            <span className="truncate" title={user.username}>
              {user.username}
            </span>
          </div>
        ))
      ) : (
        <div
          className="p-2 text-secondary-500"
          role="status"
          aria-live="polite"
        >
          {filter ? "No matching users found" : "Type to search users"}
        </div>
      )}
    </div>
  );
};

export default MentionsDropdown;
