import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('school_chat.db');

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface DBMessage {
  id: string;
  chatId: string;
  text: string;
  sender: 'me' | 'other';
  senderName?: string;
  timestamp: number;
  status: MessageStatus;
  synced?: boolean; // true if sent to backend
}

/* ================= DB INIT ================= */
export const initChatDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        text TEXT NOT NULL,
        sender TEXT NOT NULL,
        senderName TEXT,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        synced INTEGER DEFAULT 0
      )
    `);

    db.execSync(`CREATE INDEX IF NOT EXISTS idx_chat_id ON messages(chat_id)`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_status ON messages(status)`);
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

/* ================= ADD / UPDATE MESSAGE ================= */
export const addMessageToDB = (chatId: string, msg: DBMessage) => {
  try {
    db.runSync(
      `INSERT OR REPLACE INTO messages 
       (id, chat_id, text, sender, senderName, timestamp, status, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msg.id,
        chatId,
        msg.text,
        msg.sender,
        msg.senderName ?? '',
        msg.timestamp,
        msg.status,
        msg.synced ? 1 : 0
      ]
    );
  } catch (error) {
    console.error('Error adding message to DB:', error);
  }
};

/* ================= GET MESSAGES ================= */
export const getMessagesFromDB = (
  chatId: string,
  offset = 0,
  limit = 20
): DBMessage[] => {
  try {
    return db.getAllSync(
      `SELECT id, chat_id as chatId, text, sender, senderName, timestamp, status, synced
       FROM messages 
       WHERE chat_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ? OFFSET ?`,
      [chatId, limit, offset]
    ) as DBMessage[];
  } catch (error) {
    console.error('Error fetching messages from DB:', error);
    return [];
  }
};

/* ================= PENDING MESSAGES ================= */
export const getPendingMessages = (chatId: string): DBMessage[] => {
  try {
    return db.getAllSync(
      `SELECT id, chat_id as chatId, text, sender, senderName, timestamp, status, synced
       FROM messages 
       WHERE chat_id = ? AND status = 'pending' AND synced = 0
       ORDER BY timestamp ASC`,
      [chatId]
    ) as DBMessage[];
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return [];
  }
};

/* ================= UPDATE STATUS ================= */
export const markMessageAsSent = (messageId: string) => {
  try {
    db.runSync(
      `UPDATE messages SET status = 'sent', synced = 1 WHERE id = ?`,
      [messageId]
    );
  } catch (error) {
    console.error('Error marking message as sent:', error);
  }
};

export const markMessageAsDelivered = (messageId: string) => {
  try {
    db.runSync(
      `UPDATE messages SET status = 'delivered' WHERE id = ? AND status = 'sent'`,
      [messageId]
    );
  } catch (error) {
    console.error('Error marking message as delivered:', error);
  }
};

export const markMessageAsRead = (messageId: string) => {
  try {
    db.runSync(
      `UPDATE messages SET status = 'read' WHERE id = ? AND status IN ('sent','delivered')`,
      [messageId]
    );
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/* ================= DELETE OLD MESSAGES ================= */
export const deleteOldMessages = (chatId: string, keepCount: number = 1000) => {
  try {
    db.runSync(
      `DELETE FROM messages 
       WHERE chat_id = ? AND id NOT IN (
         SELECT id FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?
       )`,
      [chatId, chatId, keepCount]
    );
  } catch (error) {
    console.error('Error deleting old messages:', error);
  }
};

/* ================= GET LAST MESSAGE ================= */
export const getLastMessage = (chatId: string): DBMessage | any => {
  try {
    const result = db.getAllSync(
      `SELECT id, chat_id as chatId, text, sender, senderName, timestamp, status, synced
       FROM messages 
       WHERE chat_id = ? 
       ORDER BY timestamp DESC LIMIT 1`,
      [chatId]
    );
      return result[0] ?? null;
  } catch (error) {
    console.error('Error fetching last message:', error);
    return null;
  }
};

/* ================= CLEAR CHAT ================= */
export const clearChat = (chatId: string) => {
  try {
    db.runSync(`DELETE FROM messages WHERE chat_id = ?`, [chatId]);
  } catch (error) {
    console.error('Error clearing chat:', error);
  }
};



