export const courseTypes = [
  { id: 1, name: "Theory" },
  { id: 2, name: "Practical" }
];

export const curriculums = [
  { id: 1, name: "Computer Science Engineering" },
  { id: 2, name: "Information Technology" },
  { id: 3, name: "Electronics and Communication" },
  { id: 4, name: "Mechanical Engineering" }
];

export const terms = [
  { id: 1, name: "Fall 2024" },
  { id: 2, name: "Spring 2025" },
  { id: 3, name: "Summer 2025" },
  { id: 4, name: "Fall 2025" }
];

export const courses = [
  { id: 101, name: "Data Structures" },
  { id: 102, name: "DBMS" },
  { id: 103, name: "Operating Systems" },
  { id: 104, name: "Computer Networks" },
  { id: 105, name: "Software Engineering" },
  { id: 106, name: "Artificial Intelligence" },
  { id: 107, name: "Machine Learning" },
  { id: 108, name: "Web Development" }
];

export const sections = [
  { id: 201, name: "CSE-A" },
  { id: 202, name: "CSE-B" },
  { id: 203, name: "CSE-C" },
  { id: 204, name: "CSE-D" }
];

// Topics organized by course ID
export const topicsByCourse = {
  101: [ // Data Structures
    { id: 301, name: "Arrays" },
    { id: 302, name: "Linked List" },
    { id: 303, name: "Stacks" },
    { id: 304, name: "Queues" },
    { id: 305, name: "Trees" },
    { id: 306, name: "Graphs" },
    { id: 307, name: "Sorting" },
    { id: 308, name: "Searching" }
  ],
  102: [ // DBMS
    { id: 401, name: "ER Diagrams" },
    { id: 402, name: "Normalization" },
    { id: 403, name: "SQL Queries" },
    { id: 404, name: "Transactions" },
    { id: 405, name: "Indexing" },
    { id: 406, name: "Concurrency" }
  ],
  103: [ // Operating Systems
    { id: 501, name: "Process Management" },
    { id: 502, name: "Memory Management" },
    { id: 503, name: "File Systems" },
    { id: 504, name: "CPU Scheduling" },
    { id: 505, name: "Deadlocks" },
    { id: 506, name: "Synchronization" }
  ],
  104: [ // Computer Networks
    { id: 601, name: "OSI Model" },
    { id: 602, name: "TCP/IP" },
    { id: 603, name: "Routing" },
    { id: 604, name: "DNS" },
    { id: 605, name: "HTTP/HTTPS" },
    { id: 606, name: "Network Security" }
  ],
  105: [ // Software Engineering
    { id: 701, name: "SDLC" },
    { id: 702, name: "UML Diagrams" },
    { id: 703, name: "Requirements" },
    { id: 704, name: "Testing" },
    { id: 705, name: "Agile" },
    { id: 706, name: "Project Management" }
  ],
  106: [ // Artificial Intelligence
    { id: 801, name: "Search Algorithms" },
    { id: 802, name: "Neural Networks" },
    { id: 803, name: "NLP" },
    { id: 804, name: "Expert Systems" },
    { id: 805, name: "Game Theory" },
    { id: 806, name: "Planning" }
  ],
  107: [ // Machine Learning
    { id: 901, name: "Linear Regression" },
    { id: 902, name: "Classification" },
    { id: 903, name: "Clustering" },
    { id: 904, name: "Decision Trees" },
    { id: 905, name: "Random Forest" },
    { id: 906, name: "Deep Learning" }
  ],
  108: [ // Web Development
    { id: 1001, name: "HTML/CSS" },
    { id: 1002, name: "JavaScript" },
    { id: 1003, name: "React" },
    { id: 1004, name: "Node.js" },
    { id: 1005, name: "Databases" },
    { id: 1006, name: "REST API" }
  ]
};

export const topics = [
  // Data Structures (101)
  { id: 301, courseId: 101, name: "Arrays" },
  { id: 302, courseId: 101, name: "Linked List" },
  { id: 303, courseId: 101, name: "Stacks" },
  { id: 304, courseId: 101, name: "Queues" },
  { id: 305, courseId: 101, name: "Trees" },
  { id: 306, courseId: 101, name: "Graphs" },
  { id: 307, courseId: 101, name: "Sorting" },
  { id: 308, courseId: 101, name: "Searching" },
  // DBMS (102)
  { id: 401, courseId: 102, name: "ER Diagrams" },
  { id: 402, courseId: 102, name: "Normalization" },
  { id: 403, courseId: 102, name: "SQL Queries" },
  { id: 404, courseId: 102, name: "Transactions" },
  { id: 405, courseId: 102, name: "Indexing" },
  { id: 406, courseId: 102, name: "Concurrency" },
  // Operating Systems (103)
  { id: 501, courseId: 103, name: "Process Management" },
  { id: 502, courseId: 103, name: "Memory Management" },
  { id: 503, courseId: 103, name: "File Systems" },
  { id: 504, courseId: 103, name: "CPU Scheduling" },
  { id: 505, courseId: 103, name: "Deadlocks" },
  { id: 506, courseId: 103, name: "Synchronization" },
  // Computer Networks (104)
  { id: 601, courseId: 104, name: "OSI Model" },
  { id: 602, courseId: 104, name: "TCP/IP" },
  { id: 603, courseId: 104, name: "Routing" },
  { id: 604, courseId: 104, name: "DNS" },
  { id: 605, courseId: 104, name: "HTTP/HTTPS" },
  { id: 606, courseId: 104, name: "Network Security" },
  // Software Engineering (105)
  { id: 701, courseId: 105, name: "SDLC" },
  { id: 702, courseId: 105, name: "UML Diagrams" },
  { id: 703, courseId: 105, name: "Requirements" },
  { id: 704, courseId: 105, name: "Testing" },
  { id: 705, courseId: 105, name: "Agile" },
  { id: 706, courseId: 105, name: "Project Management" },
  // Artificial Intelligence (106)
  { id: 801, courseId: 106, name: "Search Algorithms" },
  { id: 802, courseId: 106, name: "Neural Networks" },
  { id: 803, courseId: 106, name: "NLP" },
  { id: 804, courseId: 106, name: "Expert Systems" },
  { id: 805, courseId: 106, name: "Game Theory" },
  { id: 806, courseId: 106, name: "Planning" },
  // Machine Learning (107)
  { id: 901, courseId: 107, name: "Linear Regression" },
  { id: 902, courseId: 107, name: "Classification" },
  { id: 903, courseId: 107, name: "Clustering" },
  { id: 904, courseId: 107, name: "Decision Trees" },
  { id: 905, courseId: 107, name: "Random Forest" },
  { id: 906, courseId: 107, name: "Deep Learning" },
  // Web Development (108)
  { id: 1001, courseId: 108, name: "HTML/CSS" },
  { id: 1002, courseId: 108, name: "JavaScript" },
  { id: 1003, courseId: 108, name: "React" },
  { id: 1004, courseId: 108, name: "Node.js" },
  { id: 1005, courseId: 108, name: "Databases" },
  { id: 1006, courseId: 108, name: "REST API" }
];

// Helper functions
export const getCourseNameById = (courseId: number): string => {
  const course = courses.find(c => c.id === courseId);
  return course ? course.name : '';
};

export const getSectionNameById = (sectionId: number): string => {
  const section = sections.find(s => s.id === sectionId);
  return section ? section.name : '';
};

export const getTopicNameById = (topicId: number): string => {
  const topic = topics.find(t => t.id === topicId);
  return topic ? topic.name : '';
};

export const getTopicsByCourseId = (courseId: number) => {
  return topicsByCourse[courseId as keyof typeof topicsByCourse] || [];
};

// Mock student data
export const students = [
  { id: 1001, name: "Alice Johnson", email: "alice@example.com", rollNumber: "CSE001" },
  { id: 1002, name: "Bob Smith", email: "bob@example.com", rollNumber: "CSE002" },
  { id: 1003, name: "Charlie Brown", email: "charlie@example.com", rollNumber: "CSE003" },
  { id: 1004, name: "Diana Prince", email: "diana@example.com", rollNumber: "CSE004" },
  { id: 1005, name: "Edward Norton", email: "edward@example.com", rollNumber: "CSE005" },
  { id: 1006, name: "Fiona Green", email: "fiona@example.com", rollNumber: "CSE006" },
  { id: 1007, name: "George Wilson", email: "george@example.com", rollNumber: "CSE007" },
  { id: 1008, name: "Hannah Davis", email: "hannah@example.com", rollNumber: "CSE008" },
  { id: 1009, name: "Ian Miller", email: "ian@example.com", rollNumber: "CSE009" },
  { id: 1010, name: "Julia Roberts", email: "julia@example.com", rollNumber: "CSE010" },
  { id: 1011, name: "Kevin Hart", email: "kevin@example.com", rollNumber: "CSE011" },
  { id: 1012, name: "Laura Palmer", email: "laura@example.com", rollNumber: "CSE012" }
];

// Helper functions for curriculum and term
export const getCurriculumNameById = (curriculumId: number): string => {
  const curriculum = curriculums.find(c => c.id === curriculumId);
  return curriculum ? curriculum.name : '';
};

export const getTermNameById = (termId: number): string => {
  const term = terms.find(t => t.id === termId);
  return term ? term.name : '';
};
