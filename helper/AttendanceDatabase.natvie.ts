import NetInfo from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

interface ApiStudent {
  student_id: string;   // Adjust these keys based on your actual API JSON
  full_name: string;
  avatar_url?: string;  
  class_id: string;
}

// Ensure database is initialized before use
const ensureDbInitialized = async () => {
  if (db) return db;
  if (initPromise) {
    await initPromise;
    return db;
  }
  await initAttendanceDB();
  return db;
};

// Initialize Database
export const initAttendanceDB = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      if (db) {
        // console.log('✅ Database already initialized');
        return;
      }

      db = await SQLite.openDatabaseAsync('attendance.db');
      await db.execAsync(`
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS students;
    `);
      // Create Students Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          avatar TEXT,
          class TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create Attendance Records Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL,
          date TEXT NOT NULL,
          is_present INTEGER NOT NULL,
          synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, date),
          FOREIGN KEY (student_id) REFERENCES students(id)
        );
      `);

      // Create Index for better performance
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
        CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance(synced);
        CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
      `);

      // console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      db = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

// Check if class data exists in DB
export const ensureClassDataExists = async (classValue: string) => {
  // console.log("---");
  // console.log("---ensureClassDataExists|", classValue);
  
  try {
    const database = await ensureDbInitialized();
    
    if (!database) throw new Error('Database not initialized');

    const result = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM students WHERE class = ?',
      [classValue]
    ) as { count: number } | null;

    if (!result || result.count === 0) {
      // No data exists, fetch and insert dummy/API data
      await seedClassData(classValue);
    }
  } catch (error) {
    console.error('Error ensuring class data:', error);
    throw error;
  }
};

export const seedClassData = async (classValue: string) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) throw new Error('Database not initialized');

    // 1. FETCH DATA FROM SERVER
    // console.log(`Fetching students for class: ${classValue}...`);
    const dummyStudents = [
          { student_id: `${classValue}-1`, full_name: 'Aarav Kumar', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-2`, full_name: 'Priya Sharma', avatar_url: '👧', class: classValue },
          { student_id: `${classValue}-3`, full_name: 'Rohan Patel', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-4`, full_name: 'Ananya Singh', avatar_url: '👧', class: classValue },
          { student_id: `${classValue}-5`, full_name: 'Arjun Verma', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-6`, full_name: 'Diya Reddy', avatar_url: '👧', class: classValue },
          { student_id: `${classValue}-7`, full_name: 'Kabir Joshi', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-9`, full_name: 'Ishaan Dead', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-10`, full_name: 'Ishaan Delia', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-11`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-12`, full_name: 'Ishaan Deaf', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8sdf`, full_name: 'Ishaan Dexia', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8xfv`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8cvsd`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8vdf`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-vv8`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8vsd`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8d`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8dds`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8dsf`, full_name: 'Ishaan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8f`, full_name: 'Isan Desai', avatar_url: '🧑', class: classValue },
          { student_id: `${classValue}-8hghgdsf`, full_name: 'Iaan Desai', avatar_url: '🧑', class: classValue },
        ];
    
    // Example: GET https://api.com/students?class=1
    // const response = await fetch(`${API_BASE_URL}/students?class=${classValue}`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // 'Authorization': 'Bearer YOUR_TOKEN_HERE', // Add token if needed
    //   },
    // });

    // if (!response.ok) {
    //   throw new Error(`API Error: ${response.status} ${response.statusText}`);
    // }

    // const apiData: ApiStudent[] = await response.json();
    const apiData = dummyStudents;

    if (!apiData || apiData.length === 0) {
      console.warn(`No students found on server for class ${classValue}`);
      return;
    }

    // console.log(`Received ${apiData.length} students. Saving to SQLite...`);

    // 2. INSERT INTO SQLITE (Using Transaction for Speed & Safety)
    await database.withTransactionAsync(async () => {
      for (const student of apiData) {
        
        // Handle Avatar: Use API string, or default to Emoji if null
        const avatar = student.avatar_url || (Math.random() > 0.5 ? '🧑' : '👧');

        await database.runAsync(
          `INSERT OR IGNORE INTO students (id, name, avatar, class) VALUES (?, ?, ?, ?)`,
          [
            student.student_id,  // Map API ID
            student.full_name,   // Map API Name
            avatar,              // Map Avatar
            classValue           // Ensure Class matches the requested one
          ]
        );
      }
    });

    // console.log(`✅ Successfully synced class: ${classValue}`);

  } catch (error) {
    console.error('Error seeding data from API:', error);
    // Optional: Re-throw error if you want the UI to show an alert
    throw error;
  }
};


// Seed dummy data for a class (replace with API call in production)
// const seedClassData = async (classValue: string) => {
//   const dummyStudents = [
//     { id: `${classValue}-1`, name: 'Aarav Kumar', avatar: '🧑', class: classValue },
//     { id: `${classValue}-2`, name: 'Priya Sharma', avatar: '👧', class: classValue },
//     { id: `${classValue}-3`, name: 'Rohan Patel', avatar: '🧑', class: classValue },
//     { id: `${classValue}-4`, name: 'Ananya Singh', avatar: '👧', class: classValue },
//     { id: `${classValue}-5`, name: 'Arjun Verma', avatar: '🧑', class: classValue },
//     { id: `${classValue}-6`, name: 'Diya Reddy', avatar: '👧', class: classValue },
//     { id: `${classValue}-7`, name: 'Kabir Joshi', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-9`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-10`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-11`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-12`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8sdf`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8xfv`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8cvsd`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8vdf`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-vv8`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8vsd`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8d`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8dds`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//     { id: `${classValue}-8dsf`, name: 'Ishaan Desai', avatar: '🧑', class: classValue },
//   ];

//   try {
//     const database = await ensureDbInitialized();
//     if (!database) throw new Error('Database not initialized');

//     for (const student of dummyStudents) {
//       await database.runAsync(
//         'INSERT OR IGNORE INTO students (id, name, avatar, class) VALUES (?, ?, ?, ?)',
//         [student.id, student.name, student.avatar, student.class]
//       );
//     }
//     // console.log(`✅ Seeded data for class: ${classValue}`);
//   } catch (error) {
//     console.error('Error seeding data:', error);
//     throw error;
//   }
// };

// Get students by class with their attendance for a specific date
export const getStudentsByClass = async (classValue: string, date?: string) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) {
      console.error('Database not initialized');
      return [];
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const students = await database.getAllAsync(`
      SELECT 
        s.id,
        s.name,
        s.avatar,
        s.class,
        COALESCE(a.is_present, 1) as isPresent,
        COALESCE(a.synced, 0) as synced
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      WHERE s.class = ?
      ORDER BY s.name
    `, [targetDate, classValue]);

    return students.map((s: any) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      isPresent: s.isPresent === 1,
      synced: s.synced === 1
    }));
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

// Mark attendance locally
export const markLocalAttendance = async (studentId: string, date: string, isPresent: boolean) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) throw new Error('Database not initialized');

    await database.runAsync(`
      INSERT INTO attendance (student_id, date, is_present, synced, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, date) 
      DO UPDATE SET 
        is_present = excluded.is_present,
        synced = 0,
        updated_at = CURRENT_TIMESTAMP
    `, [studentId, date, isPresent ? 1 : 0]);
    
    // console.log(`✅ Marked ${studentId} as ${isPresent ? 'present' : 'absent'} for ${date}`);
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Get all pending (unsynced) attendance records
export const getPendingAttendance = async () => {
  try {
    const database = await ensureDbInitialized();
    if (!database) {
      console.error('Database not initialized');
      return [];
    }

    const pending = await database.getAllAsync(`
      SELECT 
        a.id,
        a.student_id,
        a.date,
        a.is_present,
        s.name,
        s.class
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.synced = 0
      ORDER BY a.date DESC, s.name
    `);
    
    return pending;
  } catch (error) {
    console.error('Error getting pending attendance:', error);
    return [];
  }
};

// Get count of pending records
export const getPendingCount = async () => {
  try {
    const database = await ensureDbInitialized();
    if (!database) {
      console.error('Database not initialized');
      return 0;
    }

    const result = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM attendance WHERE synced = 0'
    ) as { count: number } | null;
    
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
};

// Mark records as synced
export const markAsSynced = async (studentId: string, date: string) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) throw new Error('Database not initialized');

    await database.runAsync(
      'UPDATE attendance SET synced = 1, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND date = ?',
      [studentId, date]
    );
  } catch (error) {
    console.error('Error marking as synced:', error);
    throw error;
  }
};

// Delete old synced attendance (keep only recent data)
export const deleteOldSyncedAttendance = async (beforeDate: string) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) throw new Error('Database not initialized');

    const result = await database.runAsync(
      'DELETE FROM attendance WHERE synced = 1 AND date < ?',
      [beforeDate]
    );
    
    // console.log(`🗑️ Deleted ${result.changes} old synced records before ${beforeDate}`);
    return result.changes;
  } catch (error) {
    console.error('Error deleting old attendance:', error);
    return 0;
  }
};

// Get attendance statistics for a date range
export const getAttendanceStats = async (classValue: string, startDate: string, endDate: string) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) return null;

    const stats = await database.getFirstAsync(`
      SELECT 
        COUNT(DISTINCT a.student_id) as totalStudents,
        SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END) as absentCount,
        COUNT(DISTINCT a.date) as totalDays
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.class = ? AND a.date BETWEEN ? AND ?
    `, [classValue, startDate, endDate]);
    
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
};

// Check network connectivity
export const checkNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Sync attendance to server
export const syncAttendanceToServer = async (apiEndpoint: string) => {
  try {
    // Check network first
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      return { success: false, message: 'No internet connection', synced: 0 };
    }

    const pending = await getPendingAttendance();
    
    if (pending.length === 0) {
      return { success: true, message: 'Nothing to sync', synced: 0 };
    }

    // Prepare data for API
    const syncData = pending.map((record: any) => ({
      student_id: record.student_id,
      date: record.date,
      is_present: record.is_present === 1,
      class: record.class,
      name: record.name
    }));

    // Make API call (replace with your actual endpoint)
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers as needed
      },
      body: JSON.stringify({ attendance: syncData })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();

    // Mark all as synced
    for (const record of pending) {
      // await markAsSynced(record?.student_id, record?.date);
    }

    // Clean up old data (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await deleteOldSyncedAttendance(sevenDaysAgo.toISOString().split('T')[0]);

    return { 
      success: true, 
      message: 'Sync completed successfully', 
      synced: pending.length 
    };

  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Sync failed', 
      synced: 0 
    };
  }
};

// Get attendance calendar data for teacher view
export const getTeacherAttendanceCalendar = async (teacherId: string, month: number, year: number) => {
  try {
    const database = await ensureDbInitialized();
    if (!database) return [];

    // This would fetch teacher's own attendance
    // Implement based on your teacher attendance table structure
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    // Placeholder - implement teacher-specific query
    return [];
  } catch (error) {
    console.error('Error getting teacher calendar:', error);
    return [];
  }
};

// Export database instance for advanced queries
export const getDatabase = () => db;







// import { dummyUsers } from "@/app/data/dummy";
// import * as SQLite from 'expo-sqlite';

// const db = SQLite.openDatabaseSync('school.db');

// export interface Student {
//   id: string;
//   name: string;
//   avatar: string;
//   studentClass: string; // Added Class
//   isPresent: boolean;
// }

// // 1. Initialize Tables
// export const initAttendanceDB = () => {
//   db.execSync(`
//     CREATE TABLE IF NOT EXISTS students (
//       id TEXT PRIMARY KEY,
//       name TEXT,
//       avatar TEXT,
//       student_class TEXT
//     );
    
//     CREATE TABLE IF NOT EXISTS attendance (
//       student_id TEXT,
//       date TEXT,
//       status TEXT, 
//       is_synced INTEGER DEFAULT 0,
//       PRIMARY KEY (student_id, date)
//     );
//   `);
// };

// // 2. Load Students by Class + Attendance Status
// export const getStudentsByClass = (className: string): Student[] => {
//   const query = `
//     SELECT s.id, s.name, s.avatar, s.student_class, a.status 
//     FROM students s
//     LEFT JOIN attendance a ON s.id = a.student_id 
//     WHERE s.student_class = ?
//   `;
  
//   const rows: any[] = db.getAllSync(query, [className]);

//   return rows.map(row => ({
//     id: row.id,
//     name: row.name,
//     avatar: row.avatar,
//     studentClass: row.student_class,
//     isPresent: row.status === 'present' // Default false if null
//   }));
// };

// // 3. Mark Attendance
// export const markLocalAttendance = (studentId: string, date: string, isPresent: boolean) => {
//   const status = isPresent ? 'present' : 'absent';
//   db.runSync(
//     `INSERT OR REPLACE INTO attendance (student_id, date, status, is_synced) VALUES (?, ?, ?, 0)`,
//     [studentId, date, status]
//   );
// };

// // 4. Seed Dummy Data (Run this once to fill DB from your dummy.ts)
// // Import your dummy data

// export const seedDatabaseFromDummy = () => {
//   const count: any = db.getFirstSync("SELECT COUNT(*) as c FROM students");
//   if (count.c === 0) {
//     // console.log("Seeding Database...");
//     dummyUsers.students.forEach(s => {
//       db.runSync(
//         'INSERT INTO students (id, name, avatar, student_class) VALUES (?, ?, ?, ?)', 
//         [s.studentAdmissionNumber, s.studentName, "👨‍🎓", s.studentClass]
//       );
//     });
//   }
// };

// export const ensureClassDataExists = async (className: string) => {
//   try {
//     // 1. Check if we already have students for this class locally

//     // console.log("--- ensureClassDataExists|", className);
    
//     const result: any = db.getFirstSync(
//       "SELECT COUNT(*) as c FROM students WHERE student_class = ?", 
//       [className]
//     );

//     // If count > 0, we already have data. No need to seed.
//     if (result.c > 0) {
//       // console.log(`Data for ${className} already exists locally.`);
//       return; 
//     }

//     // console.log(`Fetching data for ${className}...`);

//     // 2. SIMULATE API CALL / GET FROM DUMMY
//     // In a real app, you would do: const apiData = await fetch(`/students?class=${className}`);
//     // For now, we filter your dummy file:
//     const classStudents = dummyUsers.students.filter(
//       (s: any) => s.studentClass === className || s.classId === className // Adjust based on your dummy data structure
//     );

//     if (classStudents.length === 0) {
//       console.warn(`No students found in dummy data for class: ${className}`);
//       return;
//     }

//     // 3. Bulk Insert into SQLite
//     // Using a transaction is faster for bulk inserts
//     db.withTransactionSync(() => {
//       classStudents.forEach((s: any) => {
//         db.runSync(
//           'INSERT INTO students (id, name, avatar, student_class) VALUES (?, ?, ?, ?)', 
//           [s.studentAdmissionNumber, s.studentName, "👨‍🎓", className] // Ensure className matches strictly
//         );
//       });
//     });

//     // console.log(`Seeded ${classStudents.length} students for ${className}`);

//   } catch (error) {
//     console.error("Error seeding class data:", error);
//   }
// };

// // 5. Submit Logic
// export const getPendingAttendance = () => {
//   return db.getAllSync(`SELECT * FROM attendance WHERE is_synced = 0`);
// };

// export const markAsSynced = (studentId: string, date: string) => {
//   db.runSync(`UPDATE attendance SET is_synced = 1 WHERE student_id = ? AND date = ?`, [studentId, date]);
// };

// export const deleteOldSyncedAttendance = (cutoffDate: string) => {
//   try {
//     // Log before deleting to see what's happening
//     const count: any = db.getFirstSync(
//       `SELECT COUNT(*) as c FROM attendance WHERE date < ? AND is_synced = 1`,
//       [cutoffDate]
//     );

//     if (count.c > 0) {
//       db.runSync(
//         `DELETE FROM attendance WHERE date < ? AND is_synced = 1`,
//         [cutoffDate]
//       );
//       // console.log(`Cleanup: Deleted ${count.c} old synced records older than ${cutoffDate}`);
//     } else {
//       // console.log("Cleanup: No old records to delete.");
//     }
//   } catch (error) {
//     console.error("Error deleting old records:", error);
//   }
// };
