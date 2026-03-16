import * as SQLite from "expo-sqlite";

/* ------------------ TYPES ------------------ */
export type DayType = "yesterday" | "today" | "tomorrow";
export type NoteStatus = "pending" | "completed" | "failed";
export type NotePriority = "low" | "medium" | "high";

export interface TeacherNote {
  id?: number;
  title: string;
  description: string;
  dayType: DayType;
  status: NoteStatus;
  priority?: NotePriority;
  category?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface NoteStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number;
}

/* ------------------ DB STATE ------------------ */
let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("teacher_notes.db");
  }
  return db;
};

/* Check if DB is ready to use */
export const isDbReady = (): boolean => {
  return isInitialized && db !== null;
};

/* Wait for DB to be initialized */
export const waitForDbReady = async (): Promise<void> => {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = initDB();
  return initPromise;
};

/* ------------------ MIGRATION ------------------ */
const DATABASE_VERSION = 2;

const migrateDatabase = () => {
  const database = getDatabase();
  
  try {
    // Get current version
    database.execSync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );
    `);
    
    const row = database.getFirstSync<{ version: number }>(
      `SELECT version FROM schema_version LIMIT 1`
    );
    
    const currentVersion = row?.version ?? 0;
    
    if (currentVersion < DATABASE_VERSION) {
      console.log(`Migrating database from v${currentVersion} to v${DATABASE_VERSION}`);
      
      try {
        database.execSync("BEGIN TRANSACTION;");
        
        if (currentVersion < 1) {
          // Initial schema
          database.execSync(`
            CREATE TABLE IF NOT EXISTS notes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              description TEXT,
              dayType TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              createdAt TEXT NOT NULL
            );
          `);
        }
        
        if (currentVersion < 2) {
          // Add new columns if they don't exist
          try {
            database.execSync(`ALTER TABLE notes ADD COLUMN priority TEXT DEFAULT 'medium';`);
          } catch (e) {
            // Column might already exist
          }
          
          try {
            database.execSync(`ALTER TABLE notes ADD COLUMN category TEXT;`);
          } catch (e) {
            // Column might already exist
          }
          
          try {
            database.execSync(`ALTER TABLE notes ADD COLUMN updatedAt TEXT;`);
          } catch (e) {
            // Column might already exist
          }
          
          try {
            database.execSync(`ALTER TABLE notes ADD COLUMN completedAt TEXT;`);
          } catch (e) {
            // Column might already exist
          }
        }
        
        // Update version
        database.runSync(
          `INSERT OR REPLACE INTO schema_version (version) VALUES (?)`,
          [DATABASE_VERSION]
        );
        
        database.execSync("COMMIT;");
        console.log("Database migration completed successfully");
      } catch (error) {
        database.execSync("ROLLBACK;");
        console.error("Migration failed:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

/* ------------------ INIT ------------------ */
export const initDB = async () => {
  if (isInitialized) return;
  
  try {
    const database = getDatabase();

    // Run migration first
    migrateDatabase();

    // Create meta table
    database.execSync(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Create indexes for better performance
    try {
      database.execSync(`
        CREATE INDEX IF NOT EXISTS idx_dayType ON notes(dayType);
        CREATE INDEX IF NOT EXISTS idx_status ON notes(status);
        CREATE INDEX IF NOT EXISTS idx_createdAt ON notes(createdAt);
      `);
    } catch (e) {
      // Indexes might already exist
    }
    
    isInitialized = true;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    isInitialized = false;
    throw error;
  }
};

/* ------------------ DAILY AUTO UPDATE ------------------ */
export const handleDailyUpdate = () => {
  if (!isDbReady()) {
    console.warn("Database not ready for daily update");
    return;
  }

  const database = getDatabase();
  const today = new Date().toDateString();

  try {
    const row = database.getFirstSync<{ value: string }>(
      `SELECT value FROM meta WHERE key='lastOpenDate'`
    );

    if (row?.value === today) return;

    try {
      database.execSync("BEGIN TRANSACTION;");

      // 🔁 Shift day types
      database.execSync(`
        UPDATE notes
        SET 
          dayType = CASE
            WHEN dayType='tomorrow' THEN 'today'
            WHEN dayType='today' THEN 'yesterday'
            ELSE dayType
          END,
          updatedAt = datetime('now')
        WHERE dayType IN ('tomorrow', 'today');
      `);

      // 🧹 Delete old notes (older than 7 days for history)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      database.runSync(
        `DELETE FROM notes WHERE createdAt < ? AND status != 'pending'`,
        [sevenDaysAgo.toISOString()]
      );

      // 📝 Save last open date
      database.runSync(
        `INSERT OR REPLACE INTO meta (key, value) VALUES ('lastOpenDate', ?)`,
        [today]
      );

      database.execSync("COMMIT;");
    } catch (error) {
      database.execSync("ROLLBACK;");
      console.error("Daily update failed:", error);
    }
  } catch (error) {
    console.error("Daily update error:", error);
  }
};

/* Safety wrapper for DB operations */
const withDbReady = <T>(operation: (db: SQLite.SQLiteDatabase) => T, defaultValue: T): T => {
  if (!isDbReady()) {
    console.warn("Database not ready, returning default value");
    return defaultValue;
  }
  
  try {
    return operation(getDatabase());
  } catch (error) {
    console.error("Database operation error:", error);
    return defaultValue;
  }
};

/* ------------------ CRUD ------------------ */
export const addNote = (note: Omit<TeacherNote, "id" | "updatedAt" | "completedAt">) => {
  if (!isDbReady()) {
    throw new Error("Database not initialized");
  }

  const database = getDatabase();
  
  const result = database.runSync(
    `INSERT INTO notes (title, description, dayType, status, priority, category, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      note.title.trim(),
      note.description?.trim() || "",
      note.dayType,
      note.status || "pending",
      note.priority || "medium",
      note.category || null,
      note.createdAt
    ]
  );

  return result.lastInsertRowId;
};

export const getNotes = (filters?: {
  dayType?: DayType;
  status?: NoteStatus;
  priority?: NotePriority;
}): TeacherNote[] => {
  return withDbReady((database) => {
    let query = `SELECT * FROM notes WHERE 1=1`;
    const params: any[] = [];

    if (filters?.dayType) {
      query += ` AND dayType = ?`;
      params.push(filters.dayType);
    }

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ` AND priority = ?`;
      params.push(filters.priority);
    }

    query += ` ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
        ELSE 4
      END,
      createdAt DESC`;

    return database.getAllSync<TeacherNote>(query, params);
  }, []);
};

export const getNoteById = (id: number): TeacherNote | null => {
  return withDbReady((database) => {
    return database.getFirstSync<TeacherNote>(
      `SELECT * FROM notes WHERE id = ?`,
      [id]
    ) || null;
  }, null);
};

export const updateNote = (
  id: number,
  updates: Partial<Omit<TeacherNote, "id" | "createdAt">>
) => {
  if (!isDbReady()) {
    throw new Error("Database not initialized");
  }

  const database = getDatabase();
  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    setClauses.push("title = ?");
    params.push(updates.title.trim());
  }

  if (updates.description !== undefined) {
    setClauses.push("description = ?");
    params.push(updates.description.trim());
  }

  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    params.push(updates.status);

    if (updates.status === "completed" || updates.status === "failed") {
      setClauses.push("completedAt = ?");
      params.push(now);
    }
  }

  if (updates.dayType !== undefined) {
    setClauses.push("dayType = ?");
    params.push(updates.dayType);
  }

  if (updates.priority !== undefined) {
    setClauses.push("priority = ?");
    params.push(updates.priority);
  }

  if (updates.category !== undefined) {
    setClauses.push("category = ?");
    params.push(updates.category);
  }

  setClauses.push("updatedAt = ?");
  params.push(now);

  params.push(id);

  database.runSync(
    `UPDATE notes SET ${setClauses.join(", ")} WHERE id = ?`,
    params
  );
};

export const updateStatus = (id: number, status: NoteStatus) => {
  updateNote(id, { status });
};

export const deleteNote = (id: number) => {
  if (!isDbReady()) {
    throw new Error("Database not initialized");
  }

  const database = getDatabase();
  database.runSync(`DELETE FROM notes WHERE id = ?`, [id]);
};

export const deleteAllNotes = (dayType?: DayType) => {
  if (!isDbReady()) {
    throw new Error("Database not initialized");
  }

  const database = getDatabase();
  
  if (dayType) {
    database.runSync(`DELETE FROM notes WHERE dayType = ?`, [dayType]);
  } else {
    database.runSync(`DELETE FROM notes`);
  }
};

/* ------------------ ANALYTICS ------------------ */
export const getStats = (dayType?: DayType): NoteStats => {
  return withDbReady((database) => {
    let query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
      FROM notes
    `;

    const params: any[] = [];
    
    if (dayType) {
      query += ` WHERE dayType = ?`;
      params.push(dayType);
    }

    const row = database.getFirstSync<{
      total: number;
      completed: number;
      failed: number;
      pending: number;
    }>(query, params);

    const total = row?.total ?? 0;
    const completed = row?.completed ?? 0;
    const failed = row?.failed ?? 0;
    const pending = row?.pending ?? 0;

    return {
      total,
      completed,
      failed,
      pending,
      successRate: total === 0 ? 0 : Math.round((completed / total) * 100)
    };
  }, {
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    successRate: 0
  });
};

export const getYesterdayStats = (): NoteStats => {
  return getStats("yesterday");
};

export const getCategoryStats = (): Array<{ category: string; count: number }> => {
  return withDbReady((database) => {
    return database.getAllSync<{ category: string; count: number }>(`
      SELECT category, COUNT(*) as count
      FROM notes
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
  }, []);
};

/* ------------------ REMINDER CHECK ------------------ */
export const hasPendingYesterdayNotes = (): boolean => {
  return withDbReady((database) => {
    const row = database.getFirstSync<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM notes
      WHERE dayType='yesterday' AND status='pending'
    `);

    return (row?.count ?? 0) > 0;
  }, false);
};

export const getPendingNotesCount = (dayType?: DayType): number => {
  return withDbReady((database) => {
    let query = `SELECT COUNT(*) as count FROM notes WHERE status='pending'`;
    const params: any[] = [];

    if (dayType) {
      query += ` AND dayType = ?`;
      params.push(dayType);
    }

    const row = database.getFirstSync<{ count: number }>(query, params);
    return row?.count ?? 0;
  }, 0);
};

/* ------------------ BACKUP & RESTORE ------------------ */
export const exportNotes = (): TeacherNote[] => {
  return withDbReady((database) => {
    return database.getAllSync<TeacherNote>(`SELECT * FROM notes ORDER BY createdAt DESC`);
  }, []);
};

export const importNotes = (notes: TeacherNote[]) => {
  if (!isDbReady()) {
    throw new Error("Database not initialized");
  }

  const database = getDatabase();
  
  try {
    database.execSync("BEGIN TRANSACTION;");
    
    notes.forEach(note => {
      database.runSync(
        `INSERT INTO notes (title, description, dayType, status, priority, category, createdAt, updatedAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          note.title,
          note.description || "",
          note.dayType,
          note.status,
          note.priority || "medium",
          note.category || null,
          note.createdAt,
          note.updatedAt || null,
          note.completedAt || null
        ]
      );
    });
    
    database.execSync("COMMIT;");
  } catch (error) {
    database.execSync("ROLLBACK;");
    console.error("Import failed:", error);
    throw error;
  }
};

/* ------------------ RESET (FOR DEVELOPMENT) ------------------ */
export const resetDatabase = () => {
  if (!isDbReady()) {
    console.warn("Database not initialized, cannot reset");
    return;
  }

  const database = getDatabase();
  
  try {
    database.execSync("BEGIN TRANSACTION;");
    database.execSync(`DROP TABLE IF EXISTS notes;`);
    database.execSync(`DROP TABLE IF EXISTS meta;`);
    database.execSync(`DROP TABLE IF EXISTS schema_version;`);
    database.execSync("COMMIT;");
    
    // Reinitialize
    isInitialized = false;
    initDB();
    console.log("Database reset successfully");
  } catch (error) {
    database.execSync("ROLLBACK;");
    console.error("Reset failed:", error);
    throw error;
  }
};