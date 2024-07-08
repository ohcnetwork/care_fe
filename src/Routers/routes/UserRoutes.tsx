import RichTextEditor from "../../Components/Common/RichTextEditor";
import ManageUsers from "../../Components/Users/ManageUsers";
import { UserAdd } from "../../Components/Users/UserAdd";
import UserProfile from "../../Components/Users/UserProfile";

export default {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
  "/test": () => (
    <RichTextEditor
      initialMarkdown={""}
      onChange={(value) => console.log(value)}
      onAddNote={() => console.log("Add Note")}
    />
  ),
};
