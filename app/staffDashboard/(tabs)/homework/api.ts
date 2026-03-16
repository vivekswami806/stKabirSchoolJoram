// api.ts  (MOCK API SERVICE)

export interface ClassItem {
    id: string;
    name: string;
  }
  
  export interface SectionItem {
    id: string;
    classId: string;
    name: string;
  }
  
  export interface SubjectItem {
    id: string;
    classId: string;
    sectionId: string;
    name: string;
  }
  
  export interface HomeworkPayload {
    classId: string;
    sectionId: string;
    subjectId: string;
    description: string;
  }
  
  export interface HomeworkItem {
    id: number;
    subject: string;
    date: string;
    title: string;
    status: "Pending" | "Marked";
  }
  
  // ----------- MOCK DATA -------------
  
  const classes: ClassItem[] = [
    { id: "1", name: "Class 1" },
    { id: "2", name: "Class 2" },
    { id: "3", name: "Class 3" },
  ];
  
  const sections: SectionItem[] = [
    { id: "A", classId: "1", name: "A" },
    { id: "B", classId: "1", name: "B" },
    { id: "A", classId: "2", name: "A" },
    { id: "C", classId: "3", name: "C" },
  ];
  
  const subjects: SubjectItem[] = [
    { id: "eng", classId: "1", sectionId: "A", name: "English" },
    { id: "math", classId: "1", sectionId: "A", name: "Maths" },
    { id: "sci", classId: "2", sectionId: "A", name: "Science" },
  ];
  
  let homeworkList: HomeworkItem[] = [
    { id: 1, subject: "English", date: "4 Sep, 2025", title: "Chapter 2 Summary", status: "Pending" },
    { id: 2, subject: "Maths", date: "4 Sep, 2025", title: "Chapter 5 MCQs", status: "Pending" },
  ];
  
  // ----------- MOCK API FUNCTIONS --------------
  
  export const api = {
    getClasses: () =>
      new Promise<ClassItem[]>((resolve) => {
        setTimeout(() => resolve(classes), 600);
      }),
  
    getSections: (classId: string) =>
      new Promise<SectionItem[]>((resolve) => {
        setTimeout(() => {
          resolve(sections.filter((s) => s.classId === classId));
        }, 600);
      }),
  
    getSubjects: (classId: string, sectionId: string) =>
      new Promise<SubjectItem[]>((resolve) => {
        setTimeout(() => {
          resolve(subjects.filter((s) => s.classId === classId && s.sectionId === sectionId));
        }, 600);
      }),
  
    getHomeworkList: () =>
      new Promise<HomeworkItem[]>((resolve) => {
        setTimeout(() => resolve(homeworkList), 600);
      }),
  
    createHomework: (payload: HomeworkPayload) =>
      new Promise<{ success: boolean }>((resolve) => {
        const newItem: HomeworkItem = {
          id: Date.now(),
          subject: subjects.find(s => s.id === payload.subjectId)?.name || "Unknown",
          date: new Date().toLocaleDateString(),
          title: payload.description,
          status: "Pending",
        };
  
        homeworkList.push(newItem);
  
        setTimeout(() => resolve({ success: true }), 700);
      }),
  };
  