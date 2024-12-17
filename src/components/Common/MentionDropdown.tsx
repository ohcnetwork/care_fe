import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/Common/Avatar";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDisplayName } from "@/Utils/utils";

interface MentionsDropdownProps {
  onSelect: (user: { id: string; username: string }) => void;
  position: { top: number; left: number };
  filter: string;
  containerRef: React.RefObject<HTMLTextAreaElement>;
  parentRef?: React.RefObject<HTMLElement>;
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
  filter,
  containerRef,
  parentRef,
}) => {
  const facilityId = useSlug("facility");
  const { data, isLoading } = useQuery({
    queryKey: [routes.getFacilityUsers.path, facilityId],
    queryFn: query(routes.getFacilityUsers, {
      pathParams: { facility_id: facilityId },
    }),
    enabled: !!facilityId,
  });

  const users = data?.results || [];

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentRect = parentRef?.current?.getBoundingClientRect();

      if (parentRef?.current && parentRect) {
        setDropdownPosition({
          top: rect.top - parentRect.top + position.top,
          left: rect.left - parentRect.left + position.left,
        });
      } else {
        setDropdownPosition({
          top: rect.top + position.top,
          left: rect.left + position.left,
        });
      }
    }
  }, [position, containerRef, parentRef]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().startsWith(filter.toLowerCase()),
    );
  }, [users, filter]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
    [filteredUsers, selectedIndex, onSelect],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  return (
    <div
      className="fixed z-[9999] max-h-36 w-64 overflow-y-auto rounded-md bg-white text-sm shadow-lg"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
      role="listbox"
      aria-label={t("user_mentions")}
    >
      {isLoading ? (
        <div
          className="p-2 text-secondary-500"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block animate-spin">⌛</span> {t("loading")}
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
          {filter ? t("no_matching_users") : t("type_to_search")}
        </div>
      )}
    </div>
  );
};

export default MentionsDropdown;
