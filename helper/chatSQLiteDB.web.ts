export interface DBMessage {
    id: string;
    text: string;
    sender: 'me' | 'other';
    senderName?: string;
    timestamp: number;
  }
  
  export const initChatDB = () => {
    console.warn('SQLite is not supported on Web');
  };
  
  export const addMessageToDB = () => {};
  export const getMessagesFromDB = () => [];
  export const getLastMessageTimestamp = () => 0;
  