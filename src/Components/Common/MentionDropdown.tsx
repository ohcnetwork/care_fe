import React, { useEffect, useState } from "react";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import useSlug from "../../Common/hooks/useSlug";

const MentionsDropdown: React.FC<{
  onSelect: (user: any) => void;
  position: { top: number; left: number };
  editorRef: React.RefObject<HTMLDivElement>;
}> = ({ onSelect, position, editorRef }) => {
  const facilityId = useSlug("facility");
  const { data } = useQuery(routes.getFacilityUsers, {
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

  return (
    <div
      className="absolute z-10 max-h-36 w-64 overflow-y-scroll rounded-md bg-white text-sm shadow-lg"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
    >
      {users.map((user) => (
        <div
          key={user.id}
          className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100"
          onClick={() => onSelect(user)}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {user.first_name[0]}
          </span>
          {user.username}
        </div>
      ))}
    </div>
  );
};

export default MentionsDropdown;
