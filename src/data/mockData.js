export const currentUser = {
  name: 'Aman Sharma',
  email: 'aman@hireai.com',
  role: 'Admin',
  avatar: null,
  company: 'HireAI Inc.',
};

export const dashboardStats = [
  { title: 'Jobs Added This Month', value: '24', change: '+12%', trend: 'up', icon: 'Briefcase' },
  { title: 'Candidates Screened', value: '1,248', change: '+10%', trend: 'up', icon: 'Users' },
  { title: 'Awaiting Human Review', value: '36', change: '-8%', trend: 'down', icon: 'UserCheck' },
  { title: 'Average Match Score', value: '78.4%', change: '+6%', trend: 'up', icon: 'Target' },
];

export const screeningChartData = [
  { month: 'May 1', screened: 120, shortlisted: 70, hired: 20 },
  { month: 'May 8', screened: 160, shortlisted: 95, hired: 35 },
  { month: 'May 15', screened: 145, shortlisted: 80, hired: 28 },
  { month: 'May 22', screened: 180, shortlisted: 110, hired: 42 },
  { month: 'May 29', screened: 155, shortlisted: 90, hired: 30 },
];

export const hiringPipeline = [
  { stage: 'Applied', count: 240, color: '#6366F1' },
  { stage: 'Screened', count: 180, color: '#60A5FA' },
  { stage: 'Interviewed', count: 112, color: '#34D399' },
  { stage: 'Technical Round', count: 36, color: '#FBBF24' },
  { stage: 'Hired', count: 8, color: '#FB7185' },
];

export const candidates = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    job: 'Senior Frontend Developer',
    jobId: '1',
    score: 92,
    status: 'Shortlisted',
    screenedOn: '2026-08-20',
    experience: '7 years',
    location: 'San Francisco, CA',
    avatar: null,
    strengths: [
      'Strong React and TypeScript experience',
      'Relevant industry background',
      'Exceeds required experience',
      'Good problem-solving skills',
    ],
    weaknesses: [
      'No AWS certification',
      'Limited team leadership experience',
    ],
    breakdown: { skills: 95, experience: 88, education: 82, keywords: 91, overall: 92 },
    skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Next.js', 'GraphQL'],
    education: [
      { degree: 'B.S. Computer Science', school: 'Stanford University', year: '2017' },
    ],
    experienceHistory: [
      { title: 'Senior Frontend Engineer', company: 'TechFlow Inc.', duration: '2021 - Present', description: 'Led frontend architecture for SaaS platform serving 50K+ users.' },
      { title: 'Frontend Developer', company: 'StartupXYZ', duration: '2018 - 2021', description: 'Built responsive web applications using React and Redux.' },
      { title: 'Junior Developer', company: 'WebAgency Co.', duration: '2017 - 2018', description: 'Developed client websites and internal tools.' },
    ],
  },
  {
    id: '2',
    name: 'Sarah Lee',
    email: 'sarah.lee@email.com',
    phone: '+1 (555) 234-5678',
    job: 'UI/UX Designer',
    jobId: '2',
    score: 87,
    status: 'Shortlisted',
    screenedOn: '2026-08-19',
    experience: '5 years',
    location: 'New York, NY',
    avatar: null,
    strengths: ['Excellent portfolio with enterprise projects', 'Strong Figma and design system expertise', 'User research experience'],
    weaknesses: ['Limited front-end coding skills', 'No experience in healthcare domain'],
    breakdown: { skills: 90, experience: 85, education: 88, keywords: 86, overall: 87 },
    skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
    education: [{ degree: 'B.F.A. Graphic Design', school: 'Parsons School of Design', year: '2019' }],
    experienceHistory: [
      { title: 'Senior UI/UX Designer', company: 'DesignStudio Pro', duration: '2022 - Present', description: 'Led design for enterprise SaaS products.' },
      { title: 'UI Designer', company: 'CreativeAgency', duration: '2019 - 2022', description: 'Designed mobile and web interfaces for clients.' },
    ],
  },
  {
    id: '3',
    name: 'Alex Kumar',
    email: 'alex.kumar@email.com',
    phone: '+1 (555) 345-6789',
    job: 'Backend Developer',
    jobId: '3',
    score: 74,
    status: 'Human Review',
    screenedOn: '2026-08-18',
    experience: '4 years',
    location: 'Austin, TX',
    avatar: null,
    strengths: ['Solid Python and Django experience', 'Database optimization skills', 'API design expertise'],
    weaknesses: ['Limited cloud infrastructure experience', 'No Kubernetes experience'],
    breakdown: { skills: 78, experience: 72, education: 75, keywords: 70, overall: 74 },
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'REST APIs', 'Docker'],
    education: [{ degree: 'B.S. Software Engineering', school: 'UT Austin', year: '2020' }],
    experienceHistory: [
      { title: 'Backend Developer', company: 'DataServe Corp', duration: '2021 - Present', description: 'Built scalable REST APIs and microservices.' },
      { title: 'Junior Developer', company: 'CodeBase LLC', duration: '2020 - 2021', description: 'Maintained legacy systems and wrote unit tests.' },
    ],
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+1 (555) 456-7890',
    job: 'Senior Frontend Developer',
    jobId: '1',
    score: 68,
    status: 'Pending',
    screenedOn: '2026-08-17',
    experience: '3 years',
    location: 'Chicago, IL',
    avatar: null,
    strengths: ['Good JavaScript fundamentals', 'Experience with Vue.js', 'Strong CSS skills'],
    weaknesses: ['Below required years of experience', 'No TypeScript experience', 'Limited React experience'],
    breakdown: { skills: 65, experience: 60, education: 72, keywords: 68, overall: 68 },
    skills: ['JavaScript', 'Vue.js', 'CSS', 'HTML', 'Webpack'],
    education: [{ degree: 'B.S. Information Technology', school: 'DePaul University', year: '2021' }],
    experienceHistory: [
      { title: 'Frontend Developer', company: 'WebSolutions Inc.', duration: '2021 - Present', description: 'Developed Vue.js applications for e-commerce clients.' },
    ],
  },
  {
    id: '5',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+1 (555) 567-8901',
    job: 'Data Scientist',
    jobId: '5',
    score: 53,
    status: 'Low Match',
    screenedOn: '2026-08-16',
    experience: '2 years',
    location: 'Seattle, WA',
    avatar: null,
    strengths: ['Strong Python skills', 'Machine learning fundamentals'],
    weaknesses: ['Insufficient experience for senior role', 'No production ML deployment experience', 'Missing required PhD qualification'],
    breakdown: { skills: 55, experience: 45, education: 60, keywords: 50, overall: 53 },
    skills: ['Python', 'Pandas', 'Scikit-learn', 'SQL', 'Jupyter'],
    education: [{ degree: 'M.S. Data Science', school: 'University of Washington', year: '2022' }],
    experienceHistory: [
      { title: 'Junior Data Analyst', company: 'Analytics Co.', duration: '2022 - Present', description: 'Performed data analysis and created dashboards.' },
    ],
  },
  {
    id: '6',
    name: 'Emily Chen',
    email: 'emily.chen@email.com',
    phone: '+1 (555) 678-9012',
    job: 'DevOps Engineer',
    jobId: '4',
    score: 89,
    status: 'Shortlisted',
    screenedOn: '2026-08-15',
    experience: '6 years',
    location: 'Denver, CO',
    avatar: null,
    strengths: ['Extensive AWS and Kubernetes experience', 'CI/CD pipeline expertise', 'Infrastructure as Code'],
    weaknesses: ['No GCP experience'],
    breakdown: { skills: 92, experience: 88, education: 85, keywords: 90, overall: 89 },
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'Jenkins', 'Linux'],
    education: [{ degree: 'B.S. Computer Engineering', school: 'Colorado State University', year: '2018' }],
    experienceHistory: [
      { title: 'Senior DevOps Engineer', company: 'CloudScale Inc.', duration: '2020 - Present', description: 'Managed cloud infrastructure for 100+ microservices.' },
      { title: 'DevOps Engineer', company: 'InfraTech', duration: '2018 - 2020', description: 'Built CI/CD pipelines and monitoring systems.' },
    ],
  },
  {
    id: '7',
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    phone: '+1 (555) 789-0123',
    job: 'Product Manager',
    jobId: '6',
    score: 45,
    status: 'Rejected',
    screenedOn: '2026-08-14',
    experience: '2 years',
    location: 'Boston, MA',
    avatar: null,
    strengths: ['Good communication skills', 'Agile methodology knowledge'],
    weaknesses: ['Far below required experience level', 'No B2B SaaS experience', 'Missing MBA or equivalent'],
    breakdown: { skills: 42, experience: 38, education: 50, keywords: 45, overall: 45 },
    skills: ['Agile', 'Jira', 'Product Roadmapping', 'User Stories'],
    education: [{ degree: 'B.A. Business Administration', school: 'Boston University', year: '2022' }],
    experienceHistory: [
      { title: 'Associate Product Manager', company: 'RetailTech', duration: '2022 - Present', description: 'Managed feature backlog for mobile app.' },
    ],
  },
];

export const jobs = [
  { id: '1', title: 'Senior Frontend Developer', department: 'Engineering', location: 'San Francisco, CA', type: 'Full-time', experience: '5+ years', candidates: 48, avgScore: 82, status: 'Published', createdOn: '2026-07-15', description: 'We are looking for a Senior Frontend Developer to lead our UI development efforts.', skills: ['React', 'TypeScript', 'Node.js', 'CSS'], responsibilities: ['Lead frontend architecture', 'Mentor junior developers', 'Code reviews'], qualifications: ['5+ years frontend experience', 'BS in CS or equivalent'] },
  { id: '2', title: 'UI/UX Designer', department: 'Design', location: 'New York, NY', type: 'Full-time', experience: '3+ years', candidates: 32, avgScore: 76, status: 'Published', createdOn: '2026-07-20', description: 'Join our design team to create beautiful, user-centered experiences.', skills: ['Figma', 'User Research', 'Prototyping'], responsibilities: ['Design user interfaces', 'Conduct user research', 'Maintain design system'], qualifications: ['3+ years UX design experience', 'Strong portfolio'] },
  { id: '3', title: 'Backend Developer', department: 'Engineering', location: 'Remote', type: 'Full-time', experience: '4+ years', candidates: 56, avgScore: 71, status: 'Published', createdOn: '2026-06-10', description: 'Build scalable backend systems for our growing platform.', skills: ['Python', 'Django', 'PostgreSQL', 'AWS'], responsibilities: ['Design APIs', 'Optimize database queries', 'Write tests'], qualifications: ['4+ years backend experience', 'Cloud experience preferred'] },
  { id: '4', title: 'DevOps Engineer', department: 'Infrastructure', location: 'Denver, CO', type: 'Full-time', experience: '5+ years', candidates: 24, avgScore: 79, status: 'Published', createdOn: '2026-08-01', description: 'Manage and optimize our cloud infrastructure and deployment pipelines.', skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker'], responsibilities: ['Manage CI/CD', 'Monitor infrastructure', 'Automate deployments'], qualifications: ['5+ years DevOps experience', 'AWS certification preferred'] },
  { id: '5', title: 'Data Scientist', department: 'Data', location: 'Seattle, WA', type: 'Full-time', experience: '5+ years', candidates: 18, avgScore: 68, status: 'Published', createdOn: '2026-07-05', description: 'Apply machine learning to solve complex business problems.', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'], responsibilities: ['Build ML models', 'Analyze data trends', 'Present findings'], qualifications: ['PhD or MS in relevant field', '5+ years experience'] },
  { id: '6', title: 'Product Manager', department: 'Product', location: 'Boston, MA', type: 'Full-time', experience: '7+ years', candidates: 15, avgScore: 62, status: 'Draft', createdOn: '2026-08-10', description: 'Lead product strategy and roadmap for our enterprise platform.', skills: ['Product Strategy', 'Agile', 'Analytics', 'Roadmapping'], responsibilities: ['Define product vision', 'Prioritize features', 'Work with engineering'], qualifications: ['7+ years PM experience', 'B2B SaaS experience required'] },
  { id: '7', title: 'QA Engineer', department: 'Engineering', location: 'Remote', type: 'Contract', experience: '3+ years', candidates: 0, avgScore: 0, status: 'Closed', createdOn: '2026-05-20', description: 'Ensure quality across our product suite through automated and manual testing.', skills: ['Selenium', 'Cypress', 'Jest', 'Test Planning'], responsibilities: ['Write test plans', 'Automate tests', 'Report bugs'], qualifications: ['3+ years QA experience'] },
  { id: '8', title: 'Marketing Manager', department: 'Marketing', location: 'Los Angeles, CA', type: 'Full-time', experience: '4+ years', candidates: 0, avgScore: 0, status: 'Archived', createdOn: '2026-03-15', description: 'Drive marketing campaigns and brand awareness.', skills: ['Digital Marketing', 'SEO', 'Content Strategy'], responsibilities: ['Plan campaigns', 'Manage budget', 'Analyze metrics'], qualifications: ['4+ years marketing experience'] },
];

export const automationAgents = [
  { id: '1', name: 'AI Resume Screener', description: 'Automatically analyzes resumes and matches candidates against job requirements.', status: 'Active', icon: 'FileSearch' },
  { id: '2', name: 'AI Candidate Ranker', description: 'Ranks candidates based on skills, experience, and job compatibility.', status: 'Active', icon: 'BarChart3' },
  { id: '3', name: 'AI Interview Question Generator', description: 'Generates personalized interview questions based on the candidate and job.', status: 'Available', icon: 'MessageSquare' },
  { id: '4', name: 'AI Job Description Optimizer', description: 'Analyzes and improves job descriptions for better candidate matching.', status: 'Available', icon: 'FileEdit' },
  { id: '5', name: 'AI Candidate Summary', description: 'Creates a concise AI-generated summary of candidate strengths and experience.', status: 'Active', icon: 'Sparkles' },
  { id: '6', name: 'AI Hiring Insights', description: 'Generates insights and trends from your recruitment activity.', status: 'Coming Soon', icon: 'TrendingUp' },
];

export const hiringActivities = [
  { id: '1', type: 'screened', title: 'Resume screened', description: 'John Smith analyzed for Senior Frontend Developer', user: 'AI System', timestamp: '2026-08-20T14:30:00', icon: 'FileSearch' },
  { id: '2', type: 'shortlisted', title: 'Candidate shortlisted', description: 'Sarah Lee shortlisted for UI/UX Designer', user: 'Aman Sharma', timestamp: '2026-08-20T11:15:00', icon: 'UserCheck' },
  { id: '3', type: 'job', title: 'New job published', description: 'DevOps Engineer job published', user: 'Aman Sharma', timestamp: '2026-08-19T16:45:00', icon: 'Briefcase' },
  { id: '4', type: 'upload', title: 'Resumes uploaded', description: '5 new resumes uploaded for Senior Frontend Developer', user: 'Aman Sharma', timestamp: '2026-08-19T10:20:00', icon: 'Upload' },
  { id: '5', type: 'review', title: 'Candidate moved to human review', description: 'Alex Kumar moved to human review for Backend Developer', user: 'Aman Sharma', timestamp: '2026-08-18T15:30:00', icon: 'Eye' },
  { id: '6', type: 'screened', title: 'Resume screened', description: 'Michael Brown analyzed for Senior Frontend Developer', user: 'AI System', timestamp: '2026-08-18T09:00:00', icon: 'FileSearch' },
  { id: '7', type: 'shortlisted', title: 'Candidate shortlisted', description: 'Emily Chen shortlisted for DevOps Engineer', user: 'Aman Sharma', timestamp: '2026-08-17T14:00:00', icon: 'UserCheck' },
  { id: '8', type: 'rejected', title: 'Candidate rejected', description: 'David Wilson rejected for Product Manager — low match score', user: 'Aman Sharma', timestamp: '2026-08-16T11:30:00', icon: 'XCircle' },
  { id: '9', type: 'upload', title: 'Resumes uploaded', description: '3 new resumes uploaded for Backend Developer', user: 'Aman Sharma', timestamp: '2026-08-15T09:45:00', icon: 'Upload' },
  { id: '10', type: 'job', title: 'Job saved as draft', description: 'Product Manager job saved as draft', user: 'Aman Sharma', timestamp: '2026-08-14T17:00:00', icon: 'FileText' },
];

export const jobOptions = jobs.filter((j) => j.status === 'Published').map((j) => ({ value: j.id, label: j.title }));

export const statusOptions = ['All', 'Shortlisted', 'Human Review', 'Pending', 'Low Match', 'Rejected'];

export const scoreFilterOptions = ['All Scores', '85+ Excellent', '70-84 Strong', '50-69 Moderate', 'Below 50 Low'];

export const activityTypeOptions = ['All', 'screened', 'shortlisted', 'review', 'upload', 'job', 'rejected'];
