type User = {
  id: string;
  username: string;
};

const users: User[] = [
  { id: "1", username: "udaysagar" },
  { id: "2", username: "doctordev" },
  { id: "3", username: "dev-districtadmin" },
  { id: "4", username: "staffdev" },
];

const MentionsDropdown: React.FC<{
  onSelect: (user: User) => void;
  position: { top: number; left: number };
}> = ({ onSelect, position }) => {
  return (
    <div
      className="absolute z-10 w-64 rounded-md bg-white shadow-lg"
      style={{ top: position.top, left: position.left }}
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
