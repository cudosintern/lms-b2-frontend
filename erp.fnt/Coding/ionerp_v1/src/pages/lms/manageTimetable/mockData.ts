export const courseTypes = [
  { id: 1, name: "Theory" },
  { id: 2, name: "Practical" }
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

// Scheduled classes data
export const scheduledClasses = [
  {
    id: 1,
    courseTypeId: 1,
    courseId: 101,
    sectionId: 201,
    topicId: 301,
    classDate: "2024-01-15",
    course: "Data Structures",
    section: "CSE-A",
    topic: "Arrays",
    location: "Room 101",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
  },
  {
    id: 2,
    courseTypeId: 1,
    courseId: 102,
    sectionId: 201,
    topicId: 401,
    classDate: "2024-01-15",
    course: "Database Management Systems",
    section: "CSE-A",
    topic: "ER Diagrams",
    location: "Online",
    day: "Tuesday",
    startTime: "11:00",
    endTime: "12:00",
  },
  {
    id: 3,
    courseTypeId: 2,
    courseId: 101,
    sectionId: 202,
    topicId: 302,
    classDate: "2024-01-16",
    course: "Data Structures",
    section: "CSE-B",
    topic: "Linked List",
    location: "Lab A",
    day: "Tuesday",
    startTime: "14:00",
    endTime: "15:00",
  },
  {
    id: 4,
    courseTypeId: 1,
    courseId: 103,
    sectionId: 201,
    topicId: 501,
    classDate: "2024-01-16",
    course: "Operating Systems",
    section: "CSE-A",
    topic: "Process Management",
    location: "Room 205",
    day: "Wednesday",
    startTime: "09:00",
    endTime: "10:00",
  },
  {
    id: 5,
    courseTypeId: 1,
    courseId: 104,
    sectionId: 202,
    topicId: 601,
    classDate: "2024-01-17",
    course: "Computer Networks",
    section: "CSE-B",
    topic: "OSI Model",
    location: "Seminar Hall",
    day: "Thursday",
    startTime: "11:00",
    endTime: "12:00",
  }
];
