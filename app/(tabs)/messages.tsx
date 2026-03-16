import { RootState } from "@/action/store";
import { useSelector } from "react-redux";
import ChatGroupsScreen from "../dashboard/(tabs)/chats/chatGroupScreen";
export default function Messages() {

  let {role}  = useSelector((state: RootState) => state.user);
  
  return <ChatGroupsScreen/>;
}