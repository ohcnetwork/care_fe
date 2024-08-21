import React, { useEffect, useState, useMemo } from "react";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import useSlug from "../../../Common/hooks/useSlug";

interface MentionsDropdownProps {
  onSelect: (user: { id: string; username: string }) => void;
  position: { top: number; left: number };
  editorRef: React.RefObject<HTMLDivElement>;
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

  useEffect(() => {
    if (editorRef.current) {
      const editorRect = editorRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: position.top - editorRect.top + editorRef.current.scrollTop,
        left: position.left - editorRect.left,
      });
    }
  }, [position, editorRef]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().startsWith(filter.toLowerCase()),
    );
  }, [users, filter]);

  return (
    <div
      className="absolute z-10 max-h-36 w-64 overflow-y-scroll rounded-md bg-white text-sm shadow-lg"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
    >
      {loading && <div className="p-2 text-gray-500">Loading...</div>}
      {filteredUsers.length > 0 && !loading ? (
        filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100"
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
