import React, { useEffect, useState, useMemo, useCallback } from "react";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import useSlug from "@/common/hooks/useSlug";

interface MentionsDropdownProps {
  onSelect: (user: { id: string; username: string }) => void;
  position: { top: number; left: number };
  editorRef: React.RefObject<HTMLTextAreaElement>;
  filter: string;
}

const MentionsDropdown: React.FC<MentionsDropdownProps> = ({
  onSelect,
  position,
  editorRef,
  filter,
}) => {
  const facilityId = useSlug("facility");
  const { data, loading } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
  });

  const users = data?.results || [];

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      setDropdownPosition({
        top: position.top,
        left: position.left,
      });
    }
  }, [position, editorRef]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().startsWith(filter.toLowerCase()),
    );
  }, [users, filter]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && filteredUsers.length > 0) {
        event.preventDefault();
        if (selectedIndex !== null) {
          onSelect({
            id: filteredUsers[selectedIndex].id.toString(),
            username: filteredUsers[selectedIndex].username,
          });
        } else {
          onSelect({
            id: filteredUsers[0].id.toString(),
            username: filteredUsers[0].username,
          });
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return 0;
          return Math.min(filteredUsers.length - 1, prevIndex + 1);
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return filteredUsers.length - 1;
          return Math.max(0, prevIndex - 1);
        });
      }
    },
    [filteredUsers, selectedIndex, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="absolute z-10 max-h-36 w-64 overflow-y-auto rounded-md bg-white text-sm shadow-lg"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
    >
      {loading && <div className="p-2 text-gray-500">Loading...</div>}
      {filteredUsers.length > 0 && !loading ? (
        filteredUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex cursor-pointer items-center gap-2 p-2 ${
              index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            onClick={() =>
              onSelect({ id: user.id.toString(), username: user.username })
            }
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {user.first_name[0]}
            </span>
            {user.username}
          </div>
        ))
      ) : (
        <div className="p-2 text-gray-500">No users found</div>
      )}
    </div>
  );
};

export default MentionsDropdown;
