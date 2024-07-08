import React, { useEffect, useState } from "react";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

const MentionsDropdown: React.FC<{
  onSelect: (user: any) => void;
  position: { top: number; left: number };
  editorRef: React.RefObject<HTMLDivElement>;
}> = ({ onSelect, position, editorRef }) => {
  const facilityId = "81092ced-8720-44cb-b4c5-3f0ad0540153";
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
      className="absolute z-10 max-h-36 w-64 overflow-y-scroll rounded-md bg-white shadow-lg"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
    >
      {users.map((user) => (
        <div
          key={user.id}
          className="cursor-pointer p-2 hover:bg-gray-100"
          onClick={() => onSelect(user)}
        >
          {user.username}
        </div>
      ))}
    </div>
  );
};

export default MentionsDropdown;
