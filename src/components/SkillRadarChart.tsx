import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from 'recharts';
import {
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Info,
  ChevronDown,
  Zap,
  BookOpen,
  Award
} from 'lucide-react';

export interface SkillDimensionData {
  dimension: string;
  category: string;
  userScore: number;
  requiredScore: number;
  fullMark: number;
  userSkills: string[];
  requiredSkills: string[];
  recommendation: string;
}

interface SkillRadarChartProps {
  currentSkills: string[];
  missingSkills?: string[];
  targetCareer: string;
  assessmentScores?: {
    programming: number;
    logical: number;
    communication: number;
    aptitude: number;
    takenAt?: string | null;
  } | null;
  interviewScore?: number | null;
  techInterviewScore?: number | null;
  atsScore?: number | null;
  resumeExists: boolean;
  onNavigateToRoadmap?: () => void;
  onNavigateToAssessment?: () => void;
  onNavigateToTechInterview?: () => void;
}

// Standard industry benchmarks for prominent career paths
const CAREER_ROLE_BENCHMARKS: Record<
  string,
  {
    title: string;
    description: string;
    dimensions: Array<{
      dimension: string;
      category: string;
      requiredScore: number;
      requiredSkills: string[];
      matchKeywords: string[];
      recommendation: string;
    }>;
  }
> = {
  'Software Engineer': {
    title: 'Software Engineer',
    description: 'Generalist software engineering focusing on algorithms, backend systems, and clean code.',
    dimensions: [
      {
        dimension: 'Core DSA & Coding',
        category: 'Algorithms',
        requiredScore: 85,
        requiredSkills: ['Data Structures', 'Algorithms', 'LeetCode/Competitive', 'Time Complexity'],
        matchKeywords: ['dsa', 'algorithms', 'data structures', 'c++', 'java', 'python', 'leetcode', 'problem solving'],
        recommendation: 'Practice tree traversals, dynamic programming, and hash table optimizations.'
      },
      {
        dimension: 'Backend & APIs',
        category: 'Architecture',
        requiredScore: 80,
        requiredSkills: ['RESTful APIs', 'Node.js/Express/Django/Go', 'Microservices', 'Auth'],
        matchKeywords: ['backend', 'node', 'express', 'django', 'fastapi', 'spring', 'go', 'golang', 'rest', 'api', 'graphql', 'auth', 'jwt'],
        recommendation: 'Build scalable REST & GraphQL microservices with JWT authentication and caching.'
      },
      {
        dimension: 'Frontend & UI',
        category: 'Client',
        requiredScore: 65,
        requiredSkills: ['React/Vue/Angular', 'TypeScript', 'Responsive Design', 'State Management'],
        matchKeywords: ['react', 'vue', 'angular', 'next.js', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'redux'],
        recommendation: 'Master modern React patterns, server state management, and component architecture.'
      },
      {
        dimension: 'Databases & SQL',
        category: 'Data Storage',
        requiredScore: 75,
        requiredSkills: ['PostgreSQL/MySQL', 'MongoDB/NoSQL', 'Indexing', 'Schema Design'],
        matchKeywords: ['sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'database', 'prisma', 'orm', 'drizzle', 'nosql'],
        recommendation: 'Deep dive into database query optimization, indexing strategies, and relational modeling.'
      },
      {
        dimension: 'DevOps & Tooling',
        category: 'Infrastructure',
        requiredScore: 70,
        requiredSkills: ['Docker', 'Git/GitHub CI-CD', 'Linux', 'Cloud Deployment'],
        matchKeywords: ['docker', 'kubernetes', 'git', 'github', 'ci/cd', 'linux', 'aws', 'gcp', 'cloud', 'nginx', 'devops'],
        recommendation: 'Set up automated CI/CD deployment pipelines using GitHub Actions and containerization.'
      },
      {
        dimension: 'System Design',
        category: 'Engineering',
        requiredScore: 75,
        requiredSkills: ['Scalability', 'Load Balancing', 'Caching', 'Message Queues'],
        matchKeywords: ['system design', 'scalability', 'distributed systems', 'redis', 'kafka', 'rabbitmq', 'microservices', 'caching'],
        recommendation: 'Study distributed systems patterns, sharding, and high-throughput architectural trade-offs.'
      },
      {
        dimension: 'Aptitude & Soft Skills',
        category: 'Communication',
        requiredScore: 80,
        requiredSkills: ['Technical Communication', 'STAR Interviewing', 'Logical Reasoning'],
        matchKeywords: ['communication', 'teamwork', 'leadership', 'agile', 'scrum', 'problem solving', 'verbal'],
        recommendation: 'Refine structured behavioral storytelling using the STAR framework in mock interviews.'
      }
    ]
  },
  'Full Stack Developer': {
    title: 'Full Stack Developer',
    description: 'End-to-end web applications combining modern frontend frameworks, backend APIs, and cloud services.',
    dimensions: [
      {
        dimension: 'Frontend & UI',
        category: 'Client',
        requiredScore: 90,
        requiredSkills: ['React/Next.js', 'TypeScript', 'Tailwind CSS', 'State Management'],
        matchKeywords: ['react', 'next.js', 'typescript', 'javascript', 'html5', 'css3', 'tailwind', 'redux', 'ui/ux', 'frontend'],
        recommendation: 'Build interactive dashboards with modern component libraries and performance optimization.'
      },
      {
        dimension: 'Backend & APIs',
        category: 'Server',
        requiredScore: 85,
        requiredSkills: ['Node.js', 'Express/Fastify', 'REST/GraphQL', 'Authentication'],
        matchKeywords: ['node', 'nodejs', 'express', 'nestjs', 'fastapi', 'rest', 'api', 'graphql', 'jwt', 'oauth', 'backend'],
        recommendation: 'Implement robust API security, rate limiting, and structured middleware architectures.'
      },
      {
        dimension: 'Databases & ORM',
        category: 'Data Storage',
        requiredScore: 80,
        requiredSkills: ['PostgreSQL', 'MongoDB', 'Prisma/Drizzle', 'Migrations'],
        matchKeywords: ['sql', 'postgres', 'postgresql', 'mongodb', 'prisma', 'drizzle', 'mongoose', 'redis', 'database'],
        recommendation: 'Design normalized database schemas, handle database migrations, and write optimized queries.'
      },
      {
        dimension: 'Core DSA & Logic',
        category: 'Foundations',
        requiredScore: 75,
        requiredSkills: ['Data Structures', 'Algorithms', 'Logic & Debugging'],
        matchKeywords: ['dsa', 'algorithms', 'data structures', 'javascript', 'problem solving', 'debugging'],
        recommendation: 'Strengthen data structure fundamentals and practice front-to-back debugging techniques.'
      },
      {
        dimension: 'DevOps & Deployment',
        category: 'Cloud',
        requiredScore: 75,
        requiredSkills: ['Docker', 'CI/CD Pipelines', 'Vercel/AWS/Cloud Run', 'Git'],
        matchKeywords: ['docker', 'git', 'github actions', 'ci/cd', 'aws', 'cloud run', 'vercel', 'nginx', 'linux'],
        recommendation: 'Deploy production applications with Docker containerization and continuous integration.'
      },
      {
        dimension: 'System Architecture',
        category: 'Design',
        requiredScore: 70,
        requiredSkills: ['WebSockets', 'Caching', 'API Gateways', 'SSR/SSG'],
        matchKeywords: ['websockets', 'redis', 'caching', 'architecture', 'ssr', 'nextjs', 'microservices'],
        recommendation: 'Implement real-time WebSocket communication and Redis server-side caching.'
      },
      {
        dimension: 'Collaboration & Soft Skills',
        category: 'Process',
        requiredScore: 80,
        requiredSkills: ['Agile/Scrum', 'Code Reviews', 'Product Sense', 'Communication'],
        matchKeywords: ['agile', 'scrum', 'git', 'communication', 'jira', 'documentation', 'product'],
        recommendation: 'Participate in peer code reviews and document API specifications cleanly.'
      }
    ]
  },
  'AI / Machine Learning Engineer': {
    title: 'AI / Machine Learning Engineer',
    description: 'Building intelligent applications, neural networks, LLM integrations, and predictive pipelines.',
    dimensions: [
      {
        dimension: 'Machine Learning Core',
        category: 'Modeling',
        requiredScore: 90,
        requiredSkills: ['PyTorch/TensorFlow', 'Scikit-Learn', 'Deep Learning', 'Math/Stats'],
        matchKeywords: ['pytorch', 'tensorflow', 'keras', 'scikit-learn', 'machine learning', 'deep learning', 'cnn', 'rnn', 'transformer'],
        recommendation: 'Train and fine-tune deep neural network architectures using PyTorch.'
      },
      {
        dimension: 'LLMs & GenAI',
        category: 'Applied AI',
        requiredScore: 85,
        requiredSkills: ['Gemini API/OpenAI', 'LangChain/LlamaIndex', 'RAG', 'Prompt Engineering'],
        matchKeywords: ['gemini', 'openai', 'llm', 'langchain', 'llamaindex', 'rag', 'vector database', 'pinecone', 'embeddings', 'nlp'],
        recommendation: 'Build Retrieval-Augmented Generation (RAG) pipelines with vector databases and prompt engineering.'
      },
      {
        dimension: 'Python & Data Engineering',
        category: 'Data Prep',
        requiredScore: 85,
        requiredSkills: ['Python', 'Pandas', 'NumPy', 'Data Cleaning & ETL'],
        matchKeywords: ['python', 'pandas', 'numpy', 'scipy', 'etl', 'data processing', 'jupyter', 'data analysis'],
        recommendation: 'Master high-performance data manipulation with Pandas, NumPy, and parallel processing.'
      },
      {
        dimension: 'Model Deployment (MLOps)',
        category: 'Infrastructure',
        requiredScore: 75,
        requiredSkills: ['Docker', 'FastAPI', 'MLflow/Kubeflow', 'Model Serving'],
        matchKeywords: ['mlops', 'fastapi', 'docker', 'mlflow', 'triton', 'torchserve', 'onnx', 'aws sagemaker', 'cloud'],
        recommendation: 'Serve models with low-latency FastAPI endpoints and containerize using Docker.'
      },
      {
        dimension: 'Algorithms & Math',
        category: 'Foundations',
        requiredScore: 85,
        requiredSkills: ['Linear Algebra', 'Calculus', 'Probability', 'Optimization'],
        matchKeywords: ['math', 'statistics', 'probability', 'linear algebra', 'calculus', 'optimization', 'algorithms'],
        recommendation: 'Solidify mathematical intuition behind gradient descent, backpropagation, and loss functions.'
      },
      {
        dimension: 'Backend Integration',
        category: 'APIs',
        requiredScore: 70,
        requiredSkills: ['REST APIs', 'Asynchronous Queues', 'Databases'],
        matchKeywords: ['backend', 'api', 'celery', 'redis', 'sql', 'fastapi', 'flask'],
        recommendation: 'Connect AI inference services with asynchronous task workers like Celery and Redis.'
      },
      {
        dimension: 'Aptitude & Research',
        category: 'Reasoning',
        requiredScore: 80,
        requiredSkills: ['Paper Implementation', 'Critical Thinking', 'Technical Writing'],
        matchKeywords: ['research', 'communication', 'paper', 'problem solving', 'analytical'],
        recommendation: 'Summarize cutting-edge arXiv papers and implement model prototypes from scratch.'
      }
    ]
  },
  'Cloud & DevOps Engineer': {
    title: 'Cloud & DevOps Engineer',
    description: 'Cloud infrastructure orchestration, continuous deployment automation, security, and site reliability.',
    dimensions: [
      {
        dimension: 'Cloud Platforms (AWS/GCP)',
        category: 'Infrastructure',
        requiredScore: 90,
        requiredSkills: ['AWS/GCP/Azure', 'IAM & Security', 'VPC & Networking', 'Serverless'],
        matchKeywords: ['aws', 'gcp', 'azure', 'cloud', 'iam', 'vpc', 'ec2', 's3', 'lambda', 'cloud run'],
        recommendation: 'Master core cloud networking, managed services, and multi-region architectural resilience.'
      },
      {
        dimension: 'Containers & Orchestration',
        category: 'Compute',
        requiredScore: 90,
        requiredSkills: ['Docker', 'Kubernetes', 'Helm', 'Container Security'],
        matchKeywords: ['docker', 'kubernetes', 'k8s', 'helm', 'containered', 'podman', 'cluster'],
        recommendation: 'Deploy and manage multi-node Kubernetes clusters with Helm charts and ingress controllers.'
      },
      {
        dimension: 'CI/CD & Automation',
        category: 'Pipelines',
        requiredScore: 85,
        requiredSkills: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'Automated Testing'],
        matchKeywords: ['ci/cd', 'github actions', 'gitlab', 'jenkins', 'pipeline', 'automation', 'sonarqube'],
        recommendation: 'Build automated delivery pipelines with security scanning, unit testing, and canary releases.'
      },
      {
        dimension: 'Infrastructure as Code (IaC)',
        category: 'Provisioning',
        requiredScore: 80,
        requiredSkills: ['Terraform', 'Ansible', 'CloudFormation'],
        matchKeywords: ['terraform', 'ansible', 'iac', 'cloudformation', 'pulumi'],
        recommendation: 'Provision cloud environments declaratively using modular Terraform configurations.'
      },
      {
        dimension: 'Linux & Scripting',
        category: 'OS & Shell',
        requiredScore: 85,
        requiredSkills: ['Linux/Bash', 'Python Scripting', 'Networking Protocols (DNS/HTTP/SSL)'],
        matchKeywords: ['linux', 'bash', 'shell', 'python', 'networking', 'dns', 'tcp/ip', 'ssl', 'ssh'],
        recommendation: 'Automate system administration tasks with robust Bash and Python scripts.'
      },
      {
        dimension: 'Monitoring & Observability',
        category: 'Operations',
        requiredScore: 75,
        requiredSkills: ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'Alerting'],
        matchKeywords: ['prometheus', 'grafana', 'datadog', 'elk', 'logging', 'monitoring', 'sentry'],
        recommendation: 'Set up real-time alerting dashboards and distributed tracing using Prometheus & Grafana.'
      },
      {
        dimension: 'Incident & Communication',
        category: 'SRE Culture',
        requiredScore: 75,
        requiredSkills: ['Post-Mortems', 'On-Call Operations', 'SRE Best Practices'],
        matchKeywords: ['sre', 'incident', 'communication', 'agile', 'postmortem'],
        recommendation: 'Practice structured root-cause analysis and blameless post-mortem writing.'
      }
    ]
  },
  'Data Scientist / Analyst': {
    title: 'Data Scientist / Analyst',
    description: 'Extracting actionable insights from complex datasets via statistical modeling, visualization, and SQL.',
    dimensions: [
      {
        dimension: 'Advanced SQL & Data Querying',
        category: 'Data Extraction',
        requiredScore: 90,
        requiredSkills: ['Complex SQL', 'Window Functions', 'CTEs', 'Query Tuning'],
        matchKeywords: ['sql', 'postgres', 'mysql', 'bigquery', 'snowflake', 'redshift', 'window functions', 'cte'],
        recommendation: 'Master advanced SQL analytical queries, partitioning, and aggregation techniques.'
      },
      {
        dimension: 'Python/R Analytics & Pandas',
        category: 'Processing',
        requiredScore: 85,
        requiredSkills: ['Python', 'Pandas', 'NumPy', 'Data Wrangling'],
        matchKeywords: ['python', 'pandas', 'numpy', 'r', 'data science', 'wrangling', 'jupyter'],
        recommendation: 'Perform comprehensive exploratory data analysis (EDA) and feature engineering with Pandas.'
      },
      {
        dimension: 'Statistical Modeling & ML',
        category: 'Inference',
        requiredScore: 80,
        requiredSkills: ['Hypothesis Testing', 'Regression', 'Classification', 'Scikit-Learn'],
        matchKeywords: ['statistics', 'hypothesis testing', 'a/b testing', 'scikit-learn', 'machine learning', 'regression'],
        recommendation: 'Design and evaluate rigorous A/B test experiments with statistical significance tests.'
      },
      {
        dimension: 'Data Visualization & BI',
        category: 'Storytelling',
        requiredScore: 85,
        requiredSkills: ['Tableau', 'Power BI', 'Matplotlib/Seaborn', 'Executive Dashboards'],
        matchKeywords: ['tableau', 'power bi', 'matplotlib', 'seaborn', 'plotly', 'visualization', 'dashboard'],
        recommendation: 'Create high-impact executive dashboards and narrative visual charts.'
      },
      {
        dimension: 'Core DSA & Algorithms',
        category: 'Foundations',
        requiredScore: 70,
        requiredSkills: ['Data Structures', 'Algorithm Efficiency', 'Data Pipelines'],
        matchKeywords: ['dsa', 'algorithms', 'python', 'data structures', 'problem solving'],
        recommendation: 'Optimize data transformation scripts for memory efficiency and execution speed.'
      },
      {
        dimension: 'Data Engineering Basics',
        category: 'Pipelines',
        requiredScore: 75,
        requiredSkills: ['Airflow', 'dbt', 'Data Warehousing', 'ETL'],
        matchKeywords: ['airflow', 'dbt', 'etl', 'data warehouse', 'spark', 'kafka'],
        recommendation: 'Schedule automated data transformation jobs using modern orchestration tools.'
      },
      {
        dimension: 'Business Acumen & Presentation',
        category: 'Communication',
        requiredScore: 85,
        requiredSkills: ['Stakeholder Communication', 'Metric Definition', 'Presentation'],
        matchKeywords: ['business', 'communication', 'presentation', 'insights', 'roi', 'kpi'],
        recommendation: 'Translate technical analytical findings into clear business growth strategies.'
      }
    ]
  },
  'Frontend Developer': {
    title: 'Frontend Developer',
    description: 'Specialist in modern client-side user interfaces, browser architecture, web performance, and state management.',
    dimensions: [
      {
        dimension: 'JavaScript & TypeScript',
        category: 'Core Language',
        requiredScore: 90,
        requiredSkills: ['TypeScript', 'ES6+ JavaScript', 'Async Programming', 'DOM'],
        matchKeywords: ['javascript', 'typescript', 'es6', 'async', 'promises', 'event loop'],
        recommendation: 'Deepen understanding of TypeScript generics, utility types, and browser event loops.'
      },
      {
        dimension: 'React & Modern Frameworks',
        category: 'Frameworks',
        requiredScore: 90,
        requiredSkills: ['React', 'Next.js', 'Custom Hooks', 'Server Components'],
        matchKeywords: ['react', 'next.js', 'vue', 'svelte', 'hooks', 'jsx', 'frontend'],
        recommendation: 'Master React performance optimization (memoization, virtualization) and SSR.'
      },
      {
        dimension: 'CSS, Tailwind & Design',
        category: 'Styling',
        requiredScore: 85,
        requiredSkills: ['Tailwind CSS', 'Responsive UI', 'Framer Motion', 'Accessibility (a11y)'],
        matchKeywords: ['css', 'tailwind', 'framer motion', 'motion', 'animations', 'responsive', 'ui', 'ux', 'a11y'],
        recommendation: 'Implement fluid micro-interactions and ensure WCAG AA accessibility compliance.'
      },
      {
        dimension: 'State & API Management',
        category: 'Data Layer',
        requiredScore: 80,
        requiredSkills: ['TanStack Query', 'Zustand/Redux', 'REST/GraphQL', 'WebSockets'],
        matchKeywords: ['redux', 'zustand', 'react-query', 'tanstack', 'graphql', 'rest', 'api', 'websockets'],
        recommendation: 'Integrate optimistic UI updates, infinite scrolling, and real-time socket listeners.'
      },
      {
        dimension: 'Web Performance & SEO',
        category: 'Optimization',
        requiredScore: 80,
        requiredSkills: ['Core Web Vitals', 'Code Splitting', 'Lighthouse', 'SEO Meta'],
        matchKeywords: ['performance', 'lighthouse', 'web vitals', 'seo', 'optimization', 'bundle size'],
        recommendation: 'Optimize bundle size with dynamic imports, image optimization, and caching.'
      },
      {
        dimension: 'Testing & Build Tools',
        category: 'Quality',
        requiredScore: 75,
        requiredSkills: ['Jest/Vitest', 'React Testing Library', 'Vite/Webpack', 'Git'],
        matchKeywords: ['jest', 'vitest', 'testing library', 'cypress', 'playwright', 'vite', 'git'],
        recommendation: 'Write end-to-end user journey tests with Playwright and unit test critical components.'
      },
      {
        dimension: 'UI/UX & Communication',
        category: 'Soft Skills',
        requiredScore: 75,
        requiredSkills: ['Figma to Code', 'Design System Architecture', 'Cross-Browser QA'],
        matchKeywords: ['figma', 'design system', 'communication', 'teamwork', 'ui/ux'],
        recommendation: 'Convert complex Figma design files into modular, reusable design system components.'
      }
    ]
  }
};

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  currentSkills,
  missingSkills = [],
  targetCareer,
  assessmentScores,
  interviewScore,
  techInterviewScore,
  atsScore,
  resumeExists,
  onNavigateToRoadmap,
  onNavigateToAssessment,
  onNavigateToTechInterview
}) => {
  // Available roles
  const availableRoles = Object.keys(CAREER_ROLE_BENCHMARKS);

  // Determine initial selected benchmark
  const initialRole = useMemo(() => {
    if (!targetCareer) return 'Software Engineer';
    const found = availableRoles.find(
      r => r.toLowerCase().includes(targetCareer.toLowerCase()) || targetCareer.toLowerCase().includes(r.toLowerCase())
    );
    return found || 'Software Engineer';
  }, [targetCareer]);

  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [activeDimensionIndex, setActiveDimensionIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'gaps' | 'strengths'>('all');

  // Normalize user skills list
  const normalizedUserSkills = useMemo(() => {
    return currentSkills.map(s => s.toLowerCase().trim());
  }, [currentSkills]);

  // Compute radar data points based on user's real skills, test scores & target role benchmark
  const radarData: SkillDimensionData[] = useMemo(() => {
    const benchmark = CAREER_ROLE_BENCHMARKS[selectedRole] || CAREER_ROLE_BENCHMARKS['Software Engineer'];

    return benchmark.dimensions.map(dim => {
      // 1. Check keyword overlap from candidate skills
      const matchedSkills: string[] = [];
      dim.matchKeywords.forEach(kw => {
        const found = currentSkills.find(s => s.toLowerCase().includes(kw) || kw.includes(s.toLowerCase()));
        if (found && !matchedSkills.includes(found)) {
          matchedSkills.push(found);
        }
      });

      // 2. Base skill score calculation
      let calculatedScore = 0;

      if (matchedSkills.length > 0) {
        // If candidate has 1 match => ~50, 2 matches => ~70, 3+ => ~85-95
        calculatedScore = Math.min(95, 40 + matchedSkills.length * 16);
      } else if (resumeExists) {
        // If resume exists but no direct match in this specific domain
        calculatedScore = 25;
      } else {
        // No resume yet
        calculatedScore = 15;
      }

      // 3. Modulate with Assessment & Quiz scores if relevant
      if (assessmentScores && assessmentScores.takenAt) {
        if (dim.dimension.toLowerCase().includes('dsa') || dim.dimension.toLowerCase().includes('coding') || dim.dimension.toLowerCase().includes('algorithm')) {
          if (assessmentScores.programming > 0) {
            calculatedScore = Math.round(calculatedScore * 0.5 + assessmentScores.programming * 0.5);
          }
        } else if (dim.dimension.toLowerCase().includes('aptitude') || dim.dimension.toLowerCase().includes('logic') || dim.dimension.toLowerCase().includes('math')) {
          if (assessmentScores.logical > 0) {
            calculatedScore = Math.round(calculatedScore * 0.5 + ((assessmentScores.logical + assessmentScores.aptitude) / 2) * 0.5);
          }
        } else if (dim.dimension.toLowerCase().includes('soft') || dim.dimension.toLowerCase().includes('communication')) {
          if (assessmentScores.communication > 0) {
            calculatedScore = Math.round(calculatedScore * 0.5 + assessmentScores.communication * 0.5);
          }
        }
      }

      // 4. Modulate with Tech Interview & Mock scores
      if (techInterviewScore && techInterviewScore > 0) {
        if (dim.dimension.toLowerCase().includes('backend') || dim.dimension.toLowerCase().includes('architecture') || dim.dimension.toLowerCase().includes('system')) {
          calculatedScore = Math.round(calculatedScore * 0.6 + techInterviewScore * 0.4);
        }
      }

      if (interviewScore && interviewScore > 0) {
        if (dim.dimension.toLowerCase().includes('soft') || dim.dimension.toLowerCase().includes('communication')) {
          const scaledScore = Math.min(100, interviewScore * 10);
          calculatedScore = Math.round(calculatedScore * 0.5 + scaledScore * 0.5);
        }
      }

      // 5. Modulate with ATS score if high
      if (atsScore && atsScore > 75) {
        calculatedScore = Math.min(100, calculatedScore + 4);
      }

      // 6. Check if marked in missingSkills
      const isExplicitMissing = missingSkills.some(ms =>
        dim.matchKeywords.some(kw => ms.toLowerCase().includes(kw) || kw.includes(ms.toLowerCase()))
      );
      if (isExplicitMissing && calculatedScore > 65) {
        calculatedScore = Math.max(45, calculatedScore - 18);
      }

      // Clamp between 10 and 98
      const finalUserScore = Math.max(10, Math.min(98, Math.round(calculatedScore)));

      return {
        dimension: dim.dimension,
        category: dim.category,
        userScore: finalUserScore,
        requiredScore: dim.requiredScore,
        fullMark: 100,
        userSkills: matchedSkills,
        requiredSkills: dim.requiredSkills,
        recommendation: dim.recommendation
      };
    });
  }, [
    selectedRole,
    currentSkills,
    missingSkills,
    assessmentScores,
    interviewScore,
    techInterviewScore,
    atsScore,
    resumeExists
  ]);

  // Overall match computation
  const { overallMatchPercentage, strengthsCount, gapsCount, topStrength, topGap } = useMemo(() => {
    let totalUser = 0;
    let totalReq = 0;
    let strengths = 0;
    let gaps = 0;
    let maxSurplus = -999;
    let maxDeficit = -999;
    let bestDim: SkillDimensionData | null = null;
    let worstDim: SkillDimensionData | null = null;

    radarData.forEach(item => {
      totalUser += item.userScore;
      totalReq += item.requiredScore;
      const diff = item.userScore - item.requiredScore;

      if (diff >= 0) {
        strengths++;
        if (diff > maxSurplus) {
          maxSurplus = diff;
          bestDim = item;
        }
      } else {
        gaps++;
        if (Math.abs(diff) > maxDeficit) {
          maxDeficit = Math.abs(diff);
          worstDim = item;
        }
      }
    });

    const matchPct = totalReq > 0 ? Math.min(100, Math.max(15, Math.round((totalUser / totalReq) * 100))) : 0;

    return {
      overallMatchPercentage: matchPct,
      strengthsCount: strengths,
      gapsCount: gaps,
      topStrength: bestDim,
      topGap: worstDim
    };
  }, [radarData]);

  // Filtered dimensions for list view
  const displayDimensions = useMemo(() => {
    if (filterMode === 'strengths') {
      return radarData.filter(d => d.userScore >= d.requiredScore);
    }
    if (filterMode === 'gaps') {
      return radarData.filter(d => d.userScore < d.requiredScore);
    }
    return radarData;
  }, [radarData, filterMode]);

  const activeDimension = activeDimensionIndex !== null ? radarData[activeDimensionIndex] : null;

  // Custom Chart Tooltip
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SkillDimensionData;
      const gap = data.userScore - data.requiredScore;
      const isMet = gap >= 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="font-bold text-white text-sm">{data.dimension}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-extrabold bg-slate-800 text-slate-300">
              {data.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-indigo-950/60 p-2 rounded-lg border border-indigo-500/30">
              <p className="text-[10px] text-indigo-300 font-semibold">Your Score</p>
              <p className="text-base font-extrabold text-indigo-400">{data.userScore}%</p>
            </div>
            <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30">
              <p className="text-[10px] text-emerald-300 font-semibold">Role Requirement</p>
              <p className="text-base font-extrabold text-emerald-400">{data.requiredScore}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">Benchmark Delta:</span>
            <span className={`font-bold flex items-center gap-1 ${isMet ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isMet ? `+${gap}% (Target Met)` : `${gap}% (Gap)`}
            </span>
          </div>

          {data.userSkills.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">Detected in your profile:</p>
              <div className="flex flex-wrap gap-1">
                {data.userSkills.map((s, idx) => (
                  <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Skill Competency vs. Target Role Benchmark
              </h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                Radar Vector
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-axis evaluation comparing your resume, quiz metrics, and interview readiness against standard hiring expectations.
            </p>
          </div>
        </div>

        {/* Role Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">Benchmark Role:</label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 text-xs font-bold rounded-xl py-2 pl-3 pr-8 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role} {role === targetCareer ? '(Your Target)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart Visual + Key Analytics */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive Radar Chart (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[380px] bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
          <div className="w-full h-[360px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid gridType="polygon" stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  stroke="#cbd5e1"
                />

                {/* Target Benchmark Radar (Emerald) */}
                <Radar
                  name="Target Role Benchmark"
                  dataKey="requiredScore"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
                />

                {/* User Current Profile Radar (Indigo) */}
                <Radar
                  name="Your Current Skill Level"
                  dataKey="userScore"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.35}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4338ca', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#312e81', stroke: '#ffffff', strokeWidth: 2 }}
                />

                <Tooltip content={<CustomRadarTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 600 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              Your Current Profile
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              Industry Standard Target
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Metrics & Actionable Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Match Score Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                  Target Role Readiness
                </p>
                <h4 className="text-xl font-black text-white mt-0.5">
                  {CAREER_ROLE_BENCHMARKS[selectedRole]?.title || selectedRole}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-400">
                  {overallMatchPercentage}%
                </span>
                <p className="text-[10px] text-slate-400 font-semibold">Match Index</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${overallMatchPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Current Standing</span>
                <span>Hiring Target (100%)</span>
              </div>
            </div>

            {/* Micro Stats Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  <strong className="text-white">{strengthsCount}</strong> Categories Met
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  <strong className="text-white">{gapsCount}</strong> Growth Areas
                </span>
              </div>
            </div>
          </div>

          {/* Quick Insights Cards */}
          <div className="space-y-3">
            {/* Top Strength Highlight */}
            {topStrength && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-900">Key Strength: {topStrength.dimension}</p>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {topStrength.userScore}% / {topStrength.requiredScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5 line-clamp-1">
                    {topStrength.userSkills.length > 0
                      ? `Proficient in: ${topStrength.userSkills.slice(0, 3).join(', ')}`
                      : 'High alignment with standard benchmarks.'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Gap / Upskill Recommendation */}
            {topGap && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900">Primary Gap: {topGap.dimension}</p>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {topGap.userScore}% / {topGap.requiredScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-tight">
                    {topGap.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onNavigateToRoadmap && (
              <button
                onClick={onNavigateToRoadmap}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Fix Gaps in Roadmap</span>
              </button>
            )}
            {onNavigateToTechInterview && (
              <button
                onClick={onNavigateToTechInterview}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test Tech Skills</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Dimension Breakdown Cards Accordion / List */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dimension-by-Dimension Breakdown
            </h4>
            <p className="text-[11px] text-slate-500">
              Granular point gaps and required skills for {selectedRole}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Dimensions ({radarData.length})
            </button>
            <button
              onClick={() => setFilterMode('gaps')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'gaps'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              Gaps ({gapsCount})
            </button>
            <button
              onClick={() => setFilterMode('strengths')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'strengths'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Strengths ({strengthsCount})
            </button>
          </div>
        </div>

        {/* Grid of Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {displayDimensions.map((dim, idx) => {
            const gap = dim.userScore - dim.requiredScore;
            const isMet = gap >= 0;

            return (
              <div
                key={dim.dimension}
                className={`p-4 rounded-xl border transition-all ${
                  isMet
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : 'bg-white border-amber-200/80 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {dim.category}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 mt-1">{dim.dimension}</h5>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isMet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isMet ? `+${gap}% Met` : `${gap}% Gap`}
                  </span>
                </div>

                {/* Mini Comparison Bar */}
                <div className="space-y-1 my-2.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span className="text-indigo-600 font-bold">You: {dim.userScore}%</span>
                    <span className="text-emerald-700 font-bold">Req: {dim.requiredScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${dim.userScore}%` }}
                    ></div>
                    {/* Benchmark vertical tick mark */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-emerald-600"
                      style={{ left: `${dim.requiredScore}%` }}
                      title={`Target: ${dim.requiredScore}%`}
                    ></div>
                  </div>
                </div>

                {/* Skills chips */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold">Key Role Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {dim.requiredSkills.map((reqSkill, rIdx) => {
                      const hasSkill = dim.userSkills.some(
                        us => us.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(us.toLowerCase())
                      );
                      return (
                        <span
                          key={rIdx}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            hasSkill
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                              : 'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {hasSkill ? '✓ ' : ''}{reqSkill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {!isMet && dim.recommendation && (
                  <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 italic line-clamp-2">
                    💡 {dim.recommendation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
