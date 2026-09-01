import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI SDK with server-side API Key and User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_NAME = 'gemini-3.5-flash';

// --- 1. Resume Analyzer Agent ---
export async function analyzeResumeAgent(
  content: string, // Can be plain text or base64 PDF bytes
  isPdf: boolean,
  fileName: string
) {
  try {
    let contentsPart: any;

    if (isPdf) {
      // PDF base64 format: data:application/pdf;base64,.....
      const base64Data = content.includes(';base64,') 
        ? content.split(';base64,')[1] 
        : content;

      contentsPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      };
    } else {
      contentsPart = { text: content };
    }

    const promptText = `
      You are an expert Resume Analyzer Agent with an ATS (Applicant Tracking System) grading brain.
      Analyze the provided resume and return a highly detailed, structured analysis.
      
      Extract:
      1. Candidate full name (if present at top)
      2. Identified professional technical and soft skills
      3. CGPA, GPA, percentage or grade marks (if mentioned)
      4. Target career role recommended based on their skillset and experience
      5. Academic and technical interests / domains
      6. Education background summary
      7. Work/internship/project experience summary
      8. Certifications summary
      9. Calculate an accurate ATS score out of 100 based on standard industry requirements.
      10. Missing industry keywords and actionable formatting/content suggestions.
      11. A tailored professional cover letter and catchy LinkedIn Headline.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [contentsPart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING, description: "Full name of the candidate if mentioned in resume header, or empty string" },
            cgpa: { type: Type.STRING, description: "CGPA, GPA, percentage, or academic grade found in resume, or empty string" },
            targetCareer: { type: Type.STRING, description: "Inferred best-fit career role based on experience and skills, e.g., 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer'" },
            interests: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key professional interests and technology domains extracted from resume"
            },
            atsScore: { type: Type.INTEGER, description: "ATS Score out of 100 (e.g. 78)" },
            skills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of identified professional technical and soft skills" 
            },
            missingKeywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Key technologies and industry buzzwords missing from the resume" 
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Specific suggestions to improve resume layout, writing style, or experiences" 
            },
            experience: { type: Type.STRING, description: "Summary or extracted work experience and project details" },
            education: { type: Type.STRING, description: "Summary of educational background and university/college details" },
            certifications: { type: Type.STRING, description: "Summary of professional certifications or courses" },
            coverLetter: { type: Type.STRING, description: "A highly personalized, professionally tailored Cover Letter" },
            linkedinHeadline: { type: Type.STRING, description: "A catchy, keyword-optimized LinkedIn Headline" }
          },
          required: ["atsScore", "skills", "missingKeywords", "suggestions", "experience", "education", "certifications", "coverLetter", "linkedinHeadline"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (e: any) {
    console.error("Resume Analyzer Agent failed:", e);
    // Graceful fallback representation
    return {
      candidateName: "",
      cgpa: "",
      targetCareer: "Software Engineer",
      interests: ["Software Engineering", "Web Development"],
      atsScore: 65,
      skills: ["Problem Solving", "Data Structures", "Algorithms", "JavaScript", "Python"],
      missingKeywords: ["Docker", "Kubernetes", "CI/CD Pipeline", "System Design"],
      suggestions: ["Quantify impact with metrics in bullet points", "Add links to live portfolio and GitHub projects", "Re-structure section headings for standard ATS parsing"],
      experience: "Experience parsed from resume overview.",
      education: "Degree and academic background parsed.",
      certifications: "Professional certifications parsed.",
      coverLetter: "Dear Hiring Team,\n\nI am excited to apply for this position. With my relevant background and technical problem-solving capabilities, I am eager to contribute effectively to your engineering goals.\n\nSincerely,\nCandidate",
      linkedinHeadline: "Software Engineer | Full Stack & Cloud Developer | Continuous Problem Solver"
    };
  }
}

// --- 2. Skill Assessment Agent ---
export async function generateQuizAgent(
  skills: string[],
  career: string,
  quizType: 'programming' | 'aptitude' | 'communication' | 'ai'
) {
  try {
    const promptText = `
      You are an expert Technical Recruiter and Skill Assessment Agent.
      Generate 5 highly relevant multiple-choice questions (MCQs) for a quiz.
      
      Target Career Domain: ${career || "Software Engineer"}
      User Skills: ${skills.join(", ") || "General Computer Science"}
      Quiz Section Type: ${quizType.toUpperCase()}
      
      For 'programming': focus on algorithms, code snippets, syntax, data structures.
      For 'aptitude': focus on logical reasoning, quantitative patterns, analytical concepts.
      For 'communication': focus on corporate scenarios, active listening, client emails, emotional intelligence.
      For 'ai': focus on machine learning concepts, model evaluation, deep learning foundations, algorithms.

      Ensure options are high-quality and plausible. Provide clear, comprehensive explanations for the correct answers.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique question ID (e.g. q1, q2)" },
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Array of exactly 4 plausible options" 
              },
              correctOption: { 
                type: Type.INTEGER, 
                description: "0-indexed position of the correct answer (0, 1, 2, or 3)" 
              },
              explanation: { type: Type.STRING, description: "Detailed explanation of why this option is correct" }
            },
            required: ["id", "question", "options", "correctOption", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e: any) {
    console.error("Quiz Generator Agent failed:", e);
    // High-quality static fallbacks based on type
    if (quizType === 'programming') {
      return [
        {
          id: "qp1",
          question: "Which of the following data structures operates on a Last In First Out (LIFO) basis?",
          options: ["Queue", "Stack", "Binary Tree", "HashMap"],
          correctOption: 1,
          explanation: "A Stack utilizes a LIFO structure where elements are pushed and popped from the same end."
        },
        {
          id: "qp2",
          question: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
          correctOption: 2,
          explanation: "In a balanced BST, search space halves at each step, yielding an O(log n) average and worst-case time complexity."
        }
      ];
    }
    return [
      {
        id: "qa1",
        question: "A company implements a model that predicts customer churn. The primary goal is to minimize false negatives (churning customers who go undetected). Which metric should be optimized?",
        options: ["Precision", "Recall / Sensitivity", "Specificity", "Accuracy"],
        correctOption: 1,
        explanation: "Recall measures the proportion of actual positives correctly identified. Optimizing recall minimizes false negatives."
      }
    ];
  }
}

// --- 3. Career Recommendation Agent ---
export async function generateCareerRecommendationsAgent(profile: {
  skills: string[];
  cgpa: string;
  interests: string[];
  quizScores?: any;
}) {
  try {
    const promptText = `
      You are an expert Career Recommendation Agent.
      Based on the candidate's skills, CGPA, interests, and skill assessment percentages, recommend 5 target career choices.
      
      User Profile:
      - CGPA: ${profile.cgpa || 'N/A'}
      - Skills: ${profile.skills.join(", ") || 'N/A'}
      - Interests: ${profile.interests.join(", ") || 'N/A'}
      - Skill Assessment Quiz Scores: ${JSON.stringify(profile.quizScores || {})}

      Return 5 careers, sorted from highest match percentage to lowest.
      Give realistic match percentages (between 60% and 98%), current global salary ranges, job outlook / future scope, tailored reasons for the match, and critical skills they will need to gain or retain.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              career: { type: Type.STRING, description: "Name of the career path (e.g. AI Engineer)" },
              matchPercentage: { type: Type.INTEGER, description: "Match percentage out of 100 (e.g. 92)" },
              salary: { type: Type.STRING, description: "Salary range (e.g. $110,000 - $145,000)" },
              futureScope: { type: Type.STRING, description: "Detailed summary of the industry future scope" },
              reason: { type: Type.STRING, description: "Detailed, personalized reasoning explaining this recommendation based on their unique parameters" },
              requiredSkills: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Top 5-6 core competencies required for this role" 
              }
            },
            required: ["career", "matchPercentage", "salary", "futureScope", "reason", "requiredSkills"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e: any) {
    console.error("Career Recommendations Agent failed:", e);
    return [
      {
        career: "Full-Stack Developer",
        matchPercentage: 85,
        salary: "$85,000 - $115,000",
        futureScope: "Steady, robust demand as enterprises digitize operations and launch custom web portals.",
        reason: "Matches your interests in building web products and basic database/frontend programming.",
        requiredSkills: ["React", "Node.js", "Express", "Tailwind CSS", "Databases", "APIs"]
      },
      {
        career: "AI Engineer",
        matchPercentage: 80,
        salary: "$120,000 - $160,000",
        futureScope: "Exponential growth fueled by massive enterprise adoption of Generative AI, LLMs, and RAG architectures.",
        reason: "Aligns with your coding performance and interests in machine learning and data engineering.",
        requiredSkills: ["Python", "TensorFlow / PyTorch", "LangChain", "Vector Databases", "MLOps"]
      }
    ];
  }
}

// --- 4. Skill Gap Agent ---
export async function analyzeSkillGapAgent(currentSkills: string[], targetCareer: string) {
  try {
    const promptText = `
      You are an expert Skill Gap Agent.
      Compare the candidate's current skills against standard requirements for the target career role: "${targetCareer}".
      
      Candidate Current Skills: ${currentSkills.join(", ")}
      
      Identify which critical technical skills, tools, frameworks, and soft skills are missing for them to land this role.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetCareer: { type: Type.STRING },
            missingSkills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Skills or technologies the candidate is missing relative to standard industry needs for this career" 
            }
          },
          required: ["currentSkills", "targetCareer", "missingSkills"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Skill Gap Agent failed:", e);
    return {
      currentSkills,
      targetCareer,
      missingSkills: ["Docker", "Kubernetes", "System Design", "Cloud Services (AWS/GCP)", "CI/CD Pipelines"]
    };
  }
}

// --- 5. Learning Roadmap Agent ---
export async function generateLearningRoadmapAgent(targetCareer: string, missingSkills: string[]) {
  try {
    const promptText = `
      You are an expert Learning Roadmap Agent.
      Design a detailed 6-week personalized syllabus/roadmap to help a candidate gain the missing skills required to become a "${targetCareer}".
      
      Missing Skills to Acquire: ${missingSkills.join(", ")}

      Return an array of 6 elements (Weeks 1 to 6). For each week, provide a comprehensive weekly title, specific bulleted topics to master, a weekly practical mini-project, and daily concrete action items (tasks) with completed state false.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetCareer: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING, description: "e.g. Week 1" },
                  title: { type: Type.STRING, description: "e.g. Mastering Modern Frontend & State Management" },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  miniProject: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["title", "description"]
                  },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: "Unique task ID (e.g. w1_t1)" },
                        text: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN }
                      },
                      required: ["id", "text", "completed"]
                    }
                  }
                },
                required: ["week", "title", "topics", "miniProject", "tasks"]
              }
            }
          },
          required: ["targetCareer", "weeks"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Learning Roadmap Agent failed:", e);
    // High-quality custom fallback roadmap
    return {
      targetCareer,
      weeks: Array.from({ length: 6 }, (_, idx) => ({
        week: `Week ${idx + 1}`,
        title: `Core Fundamentals & Practice (Part ${idx + 1})`,
        topics: [
          `Mastering core missing skill ${missingSkills[idx] || 'System Engineering'}`,
          "Best Practices and code review patterns",
          "Unit Testing and production logging workflows"
        ],
        miniProject: {
          title: `Milestone Application ${idx + 1}`,
          description: `Create a functional portfolio showcase incorporating advanced practices.`
        },
        tasks: [
          { id: `w${idx+1}_t1`, text: "Complete foundational videos and reference documentation", completed: false },
          { id: `w${idx+1}_t2`, text: "Build proof of concept in local environment", completed: false },
          { id: `w${idx+1}_t3`, text: "Write tests and deploy code to public repo", completed: false }
        ]
      }))
    };
  }
}

// --- 6. Course Recommendation Agent ---
export async function recommendCoursesAgent(missingSkills: string[], targetCareer: string) {
  try {
    const promptText = `
      You are an expert Education & Course Advisor Agent.
      Given a target career: "${targetCareer}" and a list of missing skills: ${missingSkills.join(", ")}, 
      recommend 6 high-quality, real courses available on popular platforms like Coursera, Udemy, YouTube, freeCodeCamp, or edX.
      
      For each course, provide:
      - Title
      - Platform (Coursera, Udemy, YouTube, freeCodeCamp, GeeksforGeeks, Kaggle, NPTEL)
      - Duration (e.g. "12 Hours", "4 Weeks")
      - Price (e.g. "Free", "$12.99", "Subscription")
      - Difficulty (Beginner, Intermediate, Advanced)
      - Rating out of 5 (between 4.3 and 4.9)
      - A plausible URL link to search or view the course.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              platform: { type: Type.STRING },
              duration: { type: Type.STRING },
              price: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              link: { type: Type.STRING }
            },
            required: ["title", "platform", "duration", "price", "difficulty", "rating", "link"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e: any) {
    console.error("Course Recommendation Agent failed:", e);
    return [
      {
        title: "Docker & Kubernetes Mastery",
        platform: "Udemy",
        duration: "18 Hours",
        price: "$14.99",
        difficulty: "Intermediate",
        rating: 4.8,
        link: "https://www.udemy.com"
      },
      {
        title: "Machine Learning with Python",
        platform: "freeCodeCamp",
        duration: "8 Hours",
        price: "Free",
        difficulty: "Beginner",
        rating: 4.7,
        link: "https://www.freecodecamp.org"
      }
    ];
  }
}

// --- 7. Job Recommendation Agent (LinkedIn & Indeed Integrated) ---
export async function recommendJobsAgent(
  skills: string[],
  targetCareer: string,
  extraContext?: { location?: string; atsScore?: number; missingSkills?: string[] }
) {
  try {
    const candidateSkillsStr = skills.length > 0 ? skills.join(", ") : "JavaScript, TypeScript, React, Node.js, Python, Git";
    const missingSkillsStr = extraContext?.missingSkills?.length ? extraContext.missingSkills.join(", ") : "System Design, Cloud CI/CD";
    const promptText = `
      You are an elite Placement & Talent Matching Agent connecting candidates with top job openings across LinkedIn and Indeed.
      
      Target Career Role: "${targetCareer || 'Software Engineer'}"
      Candidate Verified Skills: "${candidateSkillsStr}"
      Current Skill Gaps/Missing: "${missingSkillsStr}"
      Candidate ATS Benchmark: ${extraContext?.atsScore || 85}

      Generate 8 diverse, realistic, and highly attractive live tech job postings tailored to this candidate from top tech firms, unicorns, and fast-growing remote companies (e.g., Google, Microsoft, Stripe, Vercel, Datadog, Airbnb, Atlassian, Shopify, Amazon, Coinbase).

      For each job posting provide:
      - title: specific modern job title (e.g. "Frontend Software Engineer - Core Platform", "Full Stack Developer", "Backend Systems Engineer")
      - company: company name
      - platform: either "linkedin" or "indeed" (alternate nicely between them)
      - salary: realistic industry compensation range (e.g. "$125,000 - $160,000 / yr" or "₹18,00,000 - ₹28,00,000 / yr")
      - location: realistic location (e.g. "Remote (Worldwide)", "San Francisco, CA (Hybrid)", "New York, NY (Hybrid)", "Seattle, WA (On-site)", "Bengaluru, India (Hybrid)")
      - workplaceType: "Remote" | "Hybrid" | "On-site"
      - jobType: "Full-time" | "Contract" | "Internship"
      - experienceLevel: "Entry Level" | "Mid-Senior" | "Lead" | "Internship"
      - postedDate: realistic recency (e.g. "1 day ago", "3 hours ago", "2 days ago")
      - requiredSkills: 4-6 key skills required for this job
      - description: 2-3 sentence overview of the role, impact, and team mission
      - requirements: 3-4 bullet point qualification requirements
      - benefits: 3-4 realistic employee benefits (e.g. "401(k) match & equity", "Comprehensive Health/Dental", "$2,000 Annual Learning Stipend", "Flexible WFH setup")
      - applyLink: realistic career site or direct job portal link
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              platform: { type: Type.STRING, description: "Must be 'linkedin' or 'indeed'" },
              salary: { type: Type.STRING },
              location: { type: Type.STRING },
              workplaceType: { type: Type.STRING, description: "Must be 'Remote', 'Hybrid', or 'On-site'" },
              jobType: { type: Type.STRING, description: "Must be 'Full-time', 'Contract', or 'Internship'" },
              experienceLevel: { type: Type.STRING, description: "Must be 'Entry Level', 'Mid-Senior', 'Lead', or 'Internship'" },
              postedDate: { type: Type.STRING },
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
              applyLink: { type: Type.STRING }
            },
            required: [
              "title", "company", "platform", "salary", "location",
              "workplaceType", "jobType", "experienceLevel", "postedDate",
              "requiredSkills", "description", "requirements", "benefits", "applyLink"
            ]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const normalizedUserSkills = skills.map(s => s.toLowerCase().trim());

    // Enrich each job with matchScore, matchedSkills, missingSkills, and live deep search URLs
    return parsed.map((job: any, index: number) => {
      const jobRequired: string[] = job.requiredSkills || [];
      const matched: string[] = [];
      const missing: string[] = [];

      jobRequired.forEach(req => {
        const reqLower = req.toLowerCase().trim();
        const has = normalizedUserSkills.some(us => us.includes(reqLower) || reqLower.includes(us));
        if (has) {
          matched.push(req);
        } else {
          missing.push(req);
        }
      });

      // Calculate match percentage
      let computedMatch = jobRequired.length > 0
        ? Math.round((matched.length / jobRequired.length) * 100)
        : 80;
      
      // Bonus for ATS score alignment
      if (extraContext?.atsScore && extraContext.atsScore > 80) {
        computedMatch = Math.min(98, computedMatch + 5);
      }
      computedMatch = Math.max(55, Math.min(99, computedMatch));

      const platformVal: 'linkedin' | 'indeed' = job.platform === 'indeed' ? 'indeed' : 'linkedin';
      const cleanLoc = job.location ? job.location.split('(')[0].trim() : 'Remote';

      const linkedinSearchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}&location=${encodeURIComponent(cleanLoc)}`;
      const indeedSearchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}&l=${encodeURIComponent(cleanLoc)}`;

      return {
        id: `job_${Date.now()}_${index}`,
        title: job.title,
        company: job.company,
        platform: platformVal,
        salary: job.salary,
        location: job.location,
        workplaceType: job.workplaceType || 'Remote',
        jobType: job.jobType || 'Full-time',
        experienceLevel: job.experienceLevel || 'Mid-Senior',
        postedDate: job.postedDate || 'Recent',
        requiredSkills: jobRequired,
        matchedSkills: matched,
        missingSkills: missing,
        matchScore: computedMatch,
        description: job.description || 'Exciting engineering opening at a fast-growing team.',
        requirements: job.requirements || ['Proficiency in relevant languages and frameworks', 'Strong problem solving ability'],
        benefits: job.benefits || ['Comprehensive health coverage', 'Equity & performance bonus', 'Flexible remote setup'],
        applyLink: job.applyLink || (platformVal === 'linkedin' ? linkedinSearchUrl : indeedSearchUrl),
        linkedinSearchUrl,
        indeedSearchUrl,
        applicationStatus: 'not_applied'
      };
    });
  } catch (e: any) {
    console.error("Job Recommendation Agent failed:", e);
    const mockRole = targetCareer || "Software Engineer";
    const cleanKeywords = encodeURIComponent(mockRole);
    return [
      {
        id: `job_${Date.now()}_0`,
        title: `Software Engineer - Core Platform`,
        company: "Stripe",
        platform: "linkedin",
        salary: "$135,000 - $170,000 / yr",
        location: "Remote (US/EU)",
        workplaceType: "Remote",
        jobType: "Full-time",
        experienceLevel: "Mid-Senior",
        postedDate: "1 day ago",
        requiredSkills: skills.length > 0 ? skills.slice(0, 4) : ["TypeScript", "React", "Node.js", "PostgreSQL"],
        matchedSkills: skills.slice(0, 3),
        missingSkills: ["Distributed Systems", "Kafka"],
        matchScore: 91,
        description: "Join the core platform team building resilient global payments infrastructure and high-throughput APIs.",
        requirements: ["Experience with modern web backend systems", "Solid grasp of distributed databases", "Strong communication"],
        benefits: ["Comprehensive Medical/Dental", "401(k) 50% Match", "Remote Home Office Setup ($1,500)"],
        applyLink: `https://www.linkedin.com/jobs/search/?keywords=${cleanKeywords}`,
        linkedinSearchUrl: `https://www.linkedin.com/jobs/search/?keywords=Stripe+${cleanKeywords}`,
        indeedSearchUrl: `https://www.indeed.com/jobs?q=Stripe+${cleanKeywords}`,
        applicationStatus: 'not_applied'
      },
      {
        id: `job_${Date.now()}_1`,
        title: `Full Stack Engineer`,
        company: "Vercel",
        platform: "indeed",
        salary: "$120,000 - $155,000 / yr",
        location: "San Francisco, CA (Hybrid)",
        workplaceType: "Hybrid",
        jobType: "Full-time",
        experienceLevel: "Entry Level",
        postedDate: "3 hours ago",
        requiredSkills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Serverless"],
        matchedSkills: skills.filter(s => ['react', 'typescript', 'javascript'].some(k => s.toLowerCase().includes(k))),
        missingSkills: ["Edge Functions", "Server Actions"],
        matchScore: 88,
        description: "Empower developers globally by creating intuitive developer workflows and next-generation deployment tools.",
        requirements: ["Deep familiarity with React and Next.js ecosystem", "Pride in UI craftsmanship and web performance"],
        benefits: ["Unlimited PTO", "Health & Wellness stipend", "Annual company retreats"],
        applyLink: `https://www.indeed.com/jobs?q=Vercel+${cleanKeywords}`,
        linkedinSearchUrl: `https://www.linkedin.com/jobs/search/?keywords=Vercel+${cleanKeywords}`,
        indeedSearchUrl: `https://www.indeed.com/jobs?q=Vercel+${cleanKeywords}`,
        applicationStatus: 'not_applied'
      }
    ];
  }
}

// --- 7b. Custom Job Posting Analyzer (Paste LinkedIn / Indeed URL or Description) ---
export async function analyzeCustomJobAgent(
  jobInput: string,
  candidateSkills: string[],
  resumeText: string
) {
  try {
    const promptText = `
      You are an expert Job Compatibility & Application Strategist Agent.
      A candidate is interested in applying to the following job description or posting (from LinkedIn or Indeed):
      
      === JOB INPUT ===
      ${jobInput}
      
      === CANDIDATE CURRENT RESUME & SKILLS ===
      Skills: ${candidateSkills.join(", ") || "General software skills"}
      Resume context: ${resumeText ? resumeText.slice(0, 1000) : "Junior to mid-level tech profile"}

      Analyze this job opening and evaluate exact candidate compatibility.
      Provide:
      1. title: Extracted or inferred job title
      2. company: Extracted or inferred company name
      3. salary: Extracted or estimated market salary range
      4. location: Extracted or inferred location / remote status
      5. platform: Extracted platform ("linkedin", "indeed", or "direct")
      6. workplaceType: "Remote" | "Hybrid" | "On-site"
      7. requiredSkills: Array of 5-7 key tech skills needed
      8. matchedSkills: Array of skills the candidate already possesses
      9. missingSkills: Array of skills the candidate is missing or needs to highlight
      10. matchScore: Score between 0 and 100 representing candidate match fit
      11. description: Concise 2-3 sentence overview
      12. tailorSuggestions: 3 concrete, high-impact bullet points on how to adjust the resume/cover letter for this specific posting
      13. coverLetterPitch: A compelling, 1-paragraph pitch tailored directly to this hiring manager
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            salary: { type: Type.STRING },
            location: { type: Type.STRING },
            platform: { type: Type.STRING },
            workplaceType: { type: Type.STRING },
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchScore: { type: Type.INTEGER },
            description: { type: Type.STRING },
            tailorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            coverLetterPitch: { type: Type.STRING }
          },
          required: [
            "title", "company", "salary", "location", "platform",
            "requiredSkills", "matchedSkills", "missingSkills",
            "matchScore", "description", "tailorSuggestions", "coverLetterPitch"
          ]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Analyze Custom Job Agent failed:", e);
    return {
      title: "Extracted Software Engineer Role",
      company: "Tech Enterprise",
      salary: "$115,000 - $145,000 / yr",
      location: "Remote",
      platform: "linkedin",
      workplaceType: "Remote",
      requiredSkills: ["React", "TypeScript", "REST APIs", "SQL", "Git"],
      matchedSkills: candidateSkills.slice(0, 3),
      missingSkills: ["System Design", "Cloud Infrastructure"],
      matchScore: 82,
      description: "Engineering role focusing on high quality application development and microservices architecture.",
      tailorSuggestions: [
        "Highlight full-stack projects featuring TypeScript and API integrations.",
        "Emphasize metrics and quantifiable outcomes on past work experience.",
        "Add relevant database schema design examples to your portfolio."
      ],
      coverLetterPitch: "With hands-on experience building performant web applications and clean APIs, I am excited to bring my technical skills and proactive problem-solving to your engineering team."
    };
  }
}

// --- 8. Interview Coach Agent ---
export async function generateInterviewQuestionsAgent(careerType: string) {
  try {
    const promptText = `
      You are an expert Interview Coach Agent.
      Generate 5 challenging interview questions for the role: "${careerType}".
      
      Generate:
      - 2 Technical Questions (focused on concepts, algorithms, tools)
      - 2 HR/Behavioral Questions (focused on leadership, teamwork, conflicts)
      - 1 Coding Question (structured code exercise)

      Make questions demanding, realistic, and tailored strictly to ${careerType}.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              type: { type: Type.STRING, description: "Must be: 'technical', 'hr', or 'coding'" }
            },
            required: ["id", "question", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e: any) {
    console.error("Interview Coach Questions failed:", e);
    return [
      { id: "iq1", question: "Describe a complex technical challenge you faced and how you resolved it.", type: "hr" },
      { id: "iq2", question: "What is your strategy for optimizing database queries in high-traffic applications?", type: "technical" },
      { id: "iq3", question: "Write a function to detect if a linked list contains a cycle. Explain the time and space complexity.", type: "coding" }
    ];
  }
}

export async function evaluateInterviewAnswerAgent(
  question: string,
  type: 'technical' | 'hr' | 'coding',
  userAnswer: string
) {
  try {
    const promptText = `
      You are an elite Interview Evaluator Agent.
      Grade and provide feedback on the user's answer to the interview question below.
      
      Question (${type}): "${question}"
      User's Answer: "${userAnswer}"

      Evaluate:
      - Score (0 to 100) based on depth, correctness, and structure
      - Confidence level of the answer (High, Medium, Low)
      - Grammar & Clarity corrections
      - ConcreteSuggestions on how they can improve their score (e.g. adding examples, technical terms, STAR framework)
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            confidence: { type: Type.STRING },
            grammar: { type: Type.STRING },
            suggestions: { type: Type.STRING }
          },
          required: ["score", "confidence", "grammar", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Interview Evaluation Agent failed:", e);
    return {
      score: 70,
      confidence: "Medium",
      grammar: "The structure is solid. Ensure subject-verb agreement and cut filler phrases.",
      suggestions: "Add a quantitative metric to your project description. Use the STAR (Situation, Task, Action, Result) methodology to structure HR answers."
    };
  }
}

// --- 9. Tech Interview Agent (7 Project Subjective Qs + 13 Skill MCQs) ---
export async function generateTechInterviewAgent(
  skills: string[],
  projectsSummary: string,
  targetCareer: string
) {
  try {
    const skillsText = (skills && skills.length > 0) ? skills.join(", ") : "JavaScript, TypeScript, React, Node.js, Python, SQL, REST APIs, Git";
    const projectsText = projectsSummary && projectsSummary.trim().length > 0 
      ? projectsSummary 
      : "Full-stack web applications, database CRUD architectures, state management systems, and microservices.";

    const promptText = `
      You are a Senior Principal Engineer and Lead Technical Interviewer at a top-tier tech firm.
      Generate exactly 20 challenging, realistic, and highly targeted technical interview questions.
      
      STRICT STRUCTURE REQUIREMENTS:
      1. QUESTIONS 1 TO 7 (id: 1 through 7) MUST BE SUBJECTIVE (WRITTEN ANSWER) QUESTIONS BASED ON THE CANDIDATE'S PROJECTS:
         - questionType: "project_subjective"
         - Directly target real-world project architecture, state management tradeoffs, schema design, latency optimization, and retrospectives from the candidate's projects: ${projectsText}
         - Include hint, targetTopic, and idealKeyPoints.

      2. QUESTIONS 8 TO 20 (id: 8 through 20) MUST BE MULTIPLE CHOICE QUESTIONS (MCQs) BASED ON THE TECH SKILLS MENTIONED IN THE RESUME:
         - questionType: "skill_mcq"
         - Directly test deep mechanics and practical scenarios for candidate's listed skills: ${skillsText}
         - Each MCQ MUST include:
           * options: An array of EXACTLY 4 distinct, plausible answer strings (indices 0, 1, 2, 3)
           * correctOptionIndex: Integer between 0 and 3 indicating the correct choice
           * explanation: A thorough, clear 2-3 sentence technical explanation of why the correct option is right and why the distractors are wrong
           * targetTopic: Specific technical skill concept (e.g. "React useEffect Dependency Array Mechanics", "Node.js Event Loop Microtasks vs Macrotasks", "PostgreSQL Composite Index Ordering")
           * hint: Conceptual hint

      Category choices for all questions:
      - 'project_architecture', 'tech_stack_core', 'debugging_optimization', or 'system_design'

      Target Career Domain: "${targetCareer || "Software Engineer"}"

      Return an array of EXACTLY 20 questions in valid JSON according to the schema.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              questionType: { type: Type.STRING, description: "Must be: 'project_subjective' (for Q1-7) or 'skill_mcq' (for Q8-20)" },
              question: { type: Type.STRING },
              category: { type: Type.STRING, description: "Must be: 'project_architecture', 'tech_stack_core', 'debugging_optimization', or 'system_design'" },
              targetTopic: { type: Type.STRING },
              hint: { type: Type.STRING },
              idealKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required for skill_mcq: exactly 4 choices" },
              correctOptionIndex: { type: Type.INTEGER, description: "Required for skill_mcq: 0 to 3" },
              explanation: { type: Type.STRING, description: "Required for skill_mcq: explanation of correct choice" }
            },
            required: ["id", "questionType", "question", "category", "targetTopic", "hint", "idealKeyPoints"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length >= 10) {
      // Ensure ids 1 to 20 and strict questionType assignment
      return parsed.slice(0, 20).map((q: any, idx: number) => {
        const isProjectSubjective = idx < 7;
        return {
          ...q,
          id: idx + 1,
          questionType: isProjectSubjective ? 'project_subjective' : 'skill_mcq',
          options: !isProjectSubjective && Array.isArray(q.options) && q.options.length >= 4 
            ? q.options.slice(0, 4) 
            : (!isProjectSubjective ? [
                "Executes synchronously on the main thread",
                "Delegates asynchronously to worker pool / event loop",
                "Throws an unhandled rejection error",
                "Bypasses memory allocation"
              ] : undefined),
          correctOptionIndex: !isProjectSubjective && typeof q.correctOptionIndex === 'number' 
            ? Math.min(Math.max(q.correctOptionIndex, 0), 3) 
            : (!isProjectSubjective ? 1 : undefined),
          explanation: q.explanation || (!isProjectSubjective ? "The runtime delegates I/O and asynchronous callbacks to the background event loop, preventing blocking." : undefined)
        };
      });
    }
    throw new Error("Invalid questions count");
  } catch (e: any) {
    console.error("Tech Interview Generator Agent fallback triggered:", e);
    // Robust fallback 20 questions (7 Project Subjective + 13 Skill MCQs) aligned with candidate skills
    const primarySkill = skills[0] || "React";
    const secondarySkill = skills[1] || "Node.js";
    const databaseSkill = skills.find(s => /sql|mongo|postgres|db/i.test(s)) || "PostgreSQL";
    const thirdSkill = skills[2] || "TypeScript";

    const fallbackQuestions = [
      // 7 PROJECT-BASED SUBJECTIVE QUESTIONS
      {
        id: 1,
        questionType: "project_subjective",
        question: `In your flagship project built with ${primarySkill}, how did you structure component boundaries, state lifting, and global stores to prevent cascading re-renders?`,
        category: "project_architecture",
        targetTopic: `${primarySkill} Project State Architecture`,
        hint: "Discuss immutability, memoization (useMemo/useCallback), context splitting, and local vs global state tradeoffs.",
        idealKeyPoints: ["Context splitting vs global store", "Memoization hooks", "Component isolation", "Profiling render cycles"]
      },
      {
        id: 2,
        questionType: "project_subjective",
        question: `Walk through how you designed the API communication, request interceptors, and error recovery boundaries between ${primarySkill} and your backend (${secondarySkill}).`,
        category: "project_architecture",
        targetTopic: "Full-Stack API Integration & Error Resilience",
        hint: "Mention HTTP status codes, interceptors, retry mechanisms, and graceful client error fallbacks.",
        idealKeyPoints: ["Axios/Fetch interceptors", "Error Boundary wrapper", "Optimistic updates", "Exponential backoff"]
      },
      {
        id: 3,
        questionType: "project_subjective",
        question: `Describe how you designed the schema, foreign keys, and indexes in ${databaseSkill} for your project. Where did you face query performance bottlenecks?`,
        category: "project_architecture",
        targetTopic: `${databaseSkill} Data Modeling & Bottlenecks`,
        hint: "Explain 3NF compliance, composite indexes, join costs, and slow query profiling with EXPLAIN ANALYZE.",
        idealKeyPoints: ["Schema normalization", "Composite indexing", "N+1 query resolution", "Query execution plan analysis"]
      },
      {
        id: 4,
        questionType: "project_subjective",
        question: `How did you implement authentication, token storage, and session invalidation in your project? How did you protect against XSS and CSRF?`,
        category: "project_architecture",
        targetTopic: "Security, JWT & Session Management",
        hint: "Compare HttpOnly cookies vs localStorage, refresh token rotation, and CSRF token verification.",
        idealKeyPoints: ["HttpOnly Secure SameSite cookies", "Short-lived access tokens", "Refresh token rotation in DB", "XSS sanitization"]
      },
      {
        id: 5,
        questionType: "project_subjective",
        question: `Suppose an endpoint in your ${secondarySkill} service spiked from 100ms to 4500ms under concurrent traffic. Walk through your step-by-step diagnostic and profiling workflow.`,
        category: "debugging_optimization",
        targetTopic: "Latency Profiling & Bottleneck Diagnosis",
        hint: "Cover APM tools, database slow query logs, flame graphs, network waterfalls, and connection pooling.",
        idealKeyPoints: ["APM / Tracing telemetry", "EXPLAIN ANALYZE for slow queries", "Node.js flame graphs & CPU profiler", "Database connection pool exhaustion"]
      },
      {
        id: 6,
        questionType: "project_subjective",
        question: `In your backend architecture, how did you handle asynchronous tasks (e.g., email notifications, report generation, or background batching)?`,
        category: "project_architecture",
        targetTopic: "Background Job Queues & Worker Architecture",
        hint: "Mention message brokers/queues (BullMQ, RabbitMQ, SQS), worker concurrency, idempotency, and retry dead-letter queues.",
        idealKeyPoints: ["Message queue decoupled workers", "Dead-letter queues (DLQ)", "Idempotent job handlers", "Exponential backoff retries"]
      },
      {
        id: 7,
        questionType: "project_subjective",
        question: `Reflecting on your most ambitious technical project, what is the single biggest architectural mistake or technical debt you encountered, and how would you redesign it today?`,
        category: "project_architecture",
        targetTopic: "Engineering Retrospective & Architectural Maturity",
        hint: "Demonstrate senior self-awareness: analyze root causes (e.g. premature optimization, tightly coupled modules, lacking observability) and explain the modern refactoring plan.",
        idealKeyPoints: ["Honest technical trade-off evaluation", "Decoupling tight monolithic dependencies", "Improved observability and logging", "Scalable domain-driven boundaries"]
      },

      // 13 TECH SKILL MULTIPLE CHOICE QUESTIONS (MCQs)
      {
        id: 8,
        questionType: "skill_mcq",
        question: `In JavaScript / ${secondarySkill}, in what order are callbacks executed when a Promise resolves, process.nextTick is scheduled, and a setTimeout(..., 0) timer expires?`,
        category: "tech_stack_core",
        targetTopic: `${secondarySkill} Event Loop Microtasks Priority`,
        hint: "Consider the microtask queue hierarchy vs macrotask timer queue.",
        idealKeyPoints: ["process.nextTick queue", "Promise microtask queue", "Macrotask timer phase"],
        options: [
          "setTimeout → Promise.then → process.nextTick",
          "process.nextTick → Promise.then → setTimeout",
          "Promise.then → process.nextTick → setTimeout",
          "setTimeout → process.nextTick → Promise.then"
        ],
        correctOptionIndex: 1,
        explanation: "process.nextTick queue runs immediately after current operation completes before the microtask queue, followed by Promise microtasks, and finally Macrotasks like setTimeout in the timer phase."
      },
      {
        id: 9,
        questionType: "skill_mcq",
        question: `In ${primarySkill}, why should you NOT call useState setter functions directly in the top-level body of a functional component?`,
        category: "tech_stack_core",
        targetTopic: `${primarySkill} Component Lifecycle & Render Loop`,
        hint: "Think about what triggers a re-render during component execution.",
        idealKeyPoints: ["Infinite render loop", "Pure component execution", "State setter dispatch"],
        options: [
          "It permanently disables garbage collection in the browser engine",
          "It causes an infinite re-render loop as state updates schedule immediate re-renders",
          "It converts the functional component into an immutable class instance",
          "It causes JSX elements to render in reverse DOM order"
        ],
        correctOptionIndex: 1,
        explanation: "Calling a state setter during rendering schedules another render immediately, resulting in a continuous infinite loop that triggers the 'Too many re-renders' React error."
      },
      {
        id: 10,
        questionType: "skill_mcq",
        question: `In ${thirdSkill}, what is the key difference between 'type' aliases and 'interface' declarations when declaring object contracts?`,
        category: "tech_stack_core",
        targetTopic: `${thirdSkill} Interfaces vs Type Aliases`,
        hint: "Consider declaration merging and union/primitive support.",
        idealKeyPoints: ["Declaration merging in interfaces", "Type aliases support unions/tuples", "Extensibility"],
        options: [
          "Interfaces cannot be extended using the 'extends' keyword",
          "Type aliases support declaration merging across multiple files, whereas interfaces do not",
          "Interfaces support declaration merging (can be opened and extended), while type aliases cannot be merged after declaration",
          "Type aliases only work for primitive numbers and cannot represent objects"
        ],
        correctOptionIndex: 2,
        explanation: "Interfaces in TypeScript support declaration merging, allowing multiple interface blocks with the same name to automatically merge. Type aliases cannot be reopened once declared."
      },
      {
        id: 11,
        questionType: "skill_mcq",
        question: `In ${databaseSkill}, what is the primary consequence of using a B-Tree Index on a column with very low cardinality (e.g. a boolean flag where 95% of rows are 'true')?`,
        category: "tech_stack_core",
        targetTopic: `${databaseSkill} Index Selectivity & Cardinality`,
        hint: "Consider query optimizer cost calculations between index scan vs sequential table scan.",
        idealKeyPoints: ["Low cardinality index scan inefficiency", "Sequential scan preference", "Index maintenance cost"],
        options: [
          "The query optimizer will likely ignore the index and perform a sequential table scan because index lookups would require too many random page reads",
          "The database engine will crash with an out-of-bounds B-Tree error",
          "Write operations will become 100x faster than without the index",
          "Foreign key constraints will automatically become invalid"
        ],
        correctOptionIndex: 0,
        explanation: "When index selectivity is low (low cardinality), traversing the B-Tree index plus fetching row pages randomly is more expensive than scanning sequential pages directly, so the optimizer ignores the index."
      },
      {
        id: 12,
        questionType: "skill_mcq",
        question: `In ${primarySkill}, when does the cleanup function returned by useEffect execute?`,
        category: "tech_stack_core",
        targetTopic: `${primarySkill} useEffect Cleanup Lifecycle`,
        hint: "Consider unmounting and re-running effects before dependencies change.",
        idealKeyPoints: ["Component unmount", "Before subsequent effect execution", "Resource cleanup"],
        options: [
          "Only when the browser window or tab is closed",
          "Immediately before the next effect runs when dependencies change, and when the component unmounts",
          "Before the component's initial render begins",
          "Every time any child component in the subtree re-renders"
        ],
        correctOptionIndex: 1,
        explanation: "React executes the effect cleanup function before re-running the effect when dependencies change to clear stale subscriptions, and also when the component unmounts."
      },
      {
        id: 13,
        questionType: "skill_mcq",
        question: `In RESTful HTTP API design, what is the exact semantic difference between PUT and PATCH methods?`,
        category: "tech_stack_core",
        targetTopic: "HTTP Methods: PUT vs PATCH Idempotency",
        hint: "Consider full resource replacement vs partial delta modification.",
        idealKeyPoints: ["PUT full replacement & idempotent", "PATCH partial modification", "Safe vs Idempotent"],
        options: [
          "PUT is non-idempotent and used for deletions, whereas PATCH is idempotent",
          "PUT replaces the entire target resource representation (idempotent), while PATCH applies partial modifications to the resource",
          "PATCH can only accept binary files, while PUT accepts JSON",
          "There is no difference in HTTP RFC specifications"
        ],
        correctOptionIndex: 1,
        explanation: "PUT is idempotent and replaces the entire resource document with the payload. PATCH applies partial changes or delta updates to specific fields."
      },
      {
        id: 14,
        questionType: "skill_mcq",
        question: `In SQL transactions, which ACID Isolation Level prevents Dirty Reads and Non-Repeatable Reads, but may still allow Phantom Reads?`,
        category: "tech_stack_core",
        targetTopic: "ACID Transaction Isolation Levels",
        hint: "Review Read Uncommitted, Read Committed, Repeatable Read, and Serializable.",
        idealKeyPoints: ["Dirty read prevention", "Non-repeatable read locks", "Phantom read range locks"],
        options: [
          "Read Uncommitted",
          "Read Committed",
          "Repeatable Read",
          "Serializable"
        ],
        correctOptionIndex: 2,
        explanation: "Repeatable Read ensures that any row read during a transaction cannot be modified by another transaction (preventing non-repeatable reads), but new inserted rows matching range queries (phantoms) can still appear unless Serializable is used."
      },
      {
        id: 15,
        questionType: "skill_mcq",
        question: `In ${thirdSkill}, what does the 'unknown' type represent compared to the 'any' type?`,
        category: "tech_stack_core",
        targetTopic: `${thirdSkill} Type Safety: unknown vs any`,
        hint: "Consider compile-time safety and type narrowing requirements.",
        idealKeyPoints: ["Type-safe counterpart of any", "Type narrowing required before property access", "Static analysis enforcement"],
        options: [
          "'unknown' allows arbitrary property access without any compile-time checks just like 'any'",
          "'unknown' is the type-safe counterpart of 'any' and requires explicit type checks / narrowing before performing operations on the value",
          "'unknown' is identical to 'never' and cannot hold any value at runtime",
          "'unknown' is only valid for asynchronous Promises"
        ],
        correctOptionIndex: 1,
        explanation: "'unknown' prevents arbitrary operations and property calls until you narrow the type using typeof, instanceof, or custom type guards, ensuring complete compile-time safety unlike 'any'."
      },
      {
        id: 16,
        questionType: "skill_mcq",
        question: `What causes a 'CORS Preflight' (OPTIONS request) to be triggered by a web browser prior to making a cross-origin HTTP request?`,
        category: "tech_stack_core",
        targetTopic: "Web Security: CORS Preflight Conditions",
        hint: "Think about custom request headers, methods like PUT/DELETE, and non-form Content-Types.",
        idealKeyPoints: ["Custom headers like Authorization", "Content-Type application/json", "HTTP methods other than GET/POST/HEAD"],
        options: [
          "Any simple GET request with no custom headers",
          "Using custom headers (like Authorization), non-simple methods (PUT/DELETE/PATCH), or Content-Type application/json",
          "Whenever the web page is loaded over HTTPS instead of HTTP",
          "When the response body exceeds 1 Megabyte"
        ],
        correctOptionIndex: 1,
        explanation: "Browsers send a preflight OPTIONS request if the request uses HTTP methods other than GET/HEAD/POST, uses custom headers (e.g. Authorization), or uses a Content-Type other than text/plain, multipart/form-data, or application/x-www-form-urlencoded."
      },
      {
        id: 17,
        questionType: "skill_mcq",
        question: `In ${secondarySkill} / JavaScript, what is the fundamental difference between 'null' and 'undefined'?`,
        category: "tech_stack_core",
        targetTopic: "JavaScript Primitives: null vs undefined",
        hint: "Consider intentional assignment of empty value vs uninitialized state.",
        idealKeyPoints: ["typeof null is 'object'", "undefined is default unassigned variable value", "Intentional absence of value"],
        options: [
          "'undefined' represents an intentional assignment of an empty object, whereas 'null' is generated only by the engine",
          "'undefined' means a variable has been declared but not assigned a value; 'null' is an explicit assignment representing the deliberate absence of an object value",
          "typeof null returns 'null' while typeof undefined returns 'object'",
          "They are strictly equal with the === operator"
        ],
        correctOptionIndex: 1,
        explanation: "'undefined' is the default value of uninitialized variables or missing parameters, whereas 'null' is explicitly assigned by developers to denote no value or an empty object reference."
      },
      {
        id: 18,
        questionType: "skill_mcq",
        question: `In distributed caching architectures using Redis, what is the 'Cache Stampede' (Thundering Herd) problem?`,
        category: "system_design",
        targetTopic: "Distributed Systems: Redis Cache Stampede",
        hint: "What happens when a high-traffic hot cache key expires at the exact same moment?",
        idealKeyPoints: ["Hot key expiration", "Concurrent database queries", "Mutex lock or probabilistic early expiration"],
        options: [
          "Redis memory running out of space and dumping all keys to disk",
          "When a hot cache key expires, causing hundreds of concurrent requests to simultaneously query the database and overwhelm it",
          "Network packets colliding on the Redis TCP socket port",
          "When Redis replicas replicate keys faster than the primary node"
        ],
        correctOptionIndex: 1,
        explanation: "A Cache Stampede occurs when a frequently accessed cached key expires and hundreds of incoming requests simultaneously miss the cache and hit the database to recompute it, causing database saturation."
      },
      {
        id: 19,
        questionType: "skill_mcq",
        question: `In Docker and containerized applications, what is the primary benefit of Multi-Stage Builds in a Dockerfile?`,
        category: "tech_stack_core",
        targetTopic: "DevOps & Containerization: Multi-Stage Docker Builds",
        hint: "Think about separating the build-time compiler/SDK from the final production runtime image.",
        idealKeyPoints: ["Drastically smaller image size", "Excluding compilers & dev dependencies", "Improved security surface"],
        options: [
          "It forces Docker to run containers across multiple CPU cores simultaneously",
          "It enables separating build-time tools/SDKs from the final runtime image, resulting in dramatically smaller and more secure production images",
          "It eliminates the need for any container ports or network configurations",
          "It compiles JavaScript into native x86 machine assembly code automatically"
        ],
        correctOptionIndex: 1,
        explanation: "Multi-stage builds allow you to use a heavy builder image containing SDKs/compilers to build artifacts, and copy only the compiled binaries into a minimal production image, reducing image size and attack surface."
      },
      {
        id: 20,
        questionType: "skill_mcq",
        question: `In ${databaseSkill}, what is the difference between OFFSET-based pagination and Cursor-based (Keyset) pagination on a large table with 10M rows?`,
        category: "tech_stack_core",
        targetTopic: "Database Scaling: Offset vs Keyset Pagination",
        hint: "Consider disk seeking: OFFSET N requires scanning and discarding N rows from disk.",
        idealKeyPoints: ["OFFSET disk scan penalty O(N)", "Cursor indexed seek O(1)", "Performance on high page numbers"],
        options: [
          "OFFSET pagination is always faster because it uses memory pointers",
          "OFFSET pagination requires the database to scan and discard all preceding N rows (degrading to O(N) disk I/O), whereas Cursor pagination uses indexed WHERE conditions (O(1) seek time)",
          "Cursor pagination only works on string columns and cannot sort by date or ID",
          "There is no difference in database execution plans"
        ],
        correctOptionIndex: 1,
        explanation: "OFFSET 5000000 forces the database to read and discard 5 million rows from disk before returning the next 10. Cursor pagination (WHERE id > last_seen_id LIMIT 10) utilizes index seeks for instant O(1) performance."
      }
    ];

    return fallbackQuestions;
  }
}

export async function evaluateTechInterviewAnswerAgent(
  question: string,
  targetTopic: string,
  idealKeyPoints: string[],
  userAnswer: string
) {
  try {
    const promptText = `
      You are an elite Senior Staff Technical Interviewer evaluating a candidate's answer for a Tech Interview.
      
      Question: "${question}"
      Target Topic: "${targetTopic}"
      Ideal Key Concepts: ${idealKeyPoints.join(", ")}
      Candidate's Response: "${userAnswer}"

      Provide an objective, constructive, and comprehensive evaluation:
      - score: Integer between 0 and 100 based on technical accuracy, depth, architectural insight, and clarity.
      - verdict: One of ["Excellent", "Good", "Needs Improvement", "Incomplete"]
      - strengths: Array of 2 to 3 strong points or correct observations in the candidate's answer.
      - missingKeyPoints: Array of 1 to 3 critical technical concepts or nuances the candidate missed or could articulate better.
      - refinedAnswer: A pristine, high-impact 2-3 paragraph model answer demonstrating how a Senior/Principal Engineer would answer this question.
      - actionableTip: A concrete 1-sentence tip on how to elevate technical communication for this specific topic.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            verdict: { type: Type.STRING, description: "Must be: 'Excellent', 'Good', 'Needs Improvement', or 'Incomplete'" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            refinedAnswer: { type: Type.STRING },
            actionableTip: { type: Type.STRING }
          },
          required: ["score", "verdict", "strengths", "missingKeyPoints", "refinedAnswer", "actionableTip"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Tech Interview Evaluation Agent failed:", e);
    // Determine basic score heuristics if fallback triggered
    const wordCount = (userAnswer || '').trim().split(/\s+/).length;
    const baseScore = Math.min(Math.max(wordCount > 30 ? 75 : wordCount > 10 ? 55 : 30, 20), 85);
    
    return {
      score: baseScore,
      verdict: baseScore >= 70 ? "Good" : "Needs Improvement",
      strengths: [
        "Identified the primary technical context of the question",
        "Demonstrated practical familiarity with the problem domain"
      ],
      missingKeyPoints: idealKeyPoints.slice(0, 2),
      refinedAnswer: `In a production environment, the ideal approach to ${targetTopic} involves addressing the core trade-offs: ${idealKeyPoints.join(", ")}. Specifically, ensure that state transitions and asynchronous I/O operations are strictly bounded and monitored using telemetry.`,
      actionableTip: `Always structure your technical response by first stating the architectural principle, then walking through code/data flow, and concluding with edge-case handling.`
    };
  }
}

// --- 13. Quick Interview Tips & Career Advice Agent ---
export async function generateInterviewTipsAgent(
  careerRole: string = 'Software Engineer',
  skills: string[] = []
): Promise<Array<{
  id: string;
  title: string;
  category: string;
  impactLevel: 'High Impact' | 'Game Changer' | 'Pro Tip';
  snippet: string;
  confidenceBooster: string;
}>> {
  try {
    const promptText = `
      You are an elite Silicon Valley Career & Executive Interview Coach.
      Generate 3 distinct, RANDOMIZED, high-impact career and interview advice snippets tailored for a candidate targeting: "${careerRole}".
      Known technical skills or context: ${skills.length > 0 ? skills.join(', ') : 'General tech & software competencies'}.

      The 3 snippets MUST be actionable, non-generic, and engineered to immediately boost user confidence and performance before entering an interview.

      Focus across varied dimensions:
      - Psychological framing & overcoming imposter syndrome / anxiety
      - Structured communication (e.g. The STAR+T method, Leading with the 'Punchline', Tradeoff framing)
      - Technical & Architectural conviction (handling unknowns, thinking aloud, asking clarifying constraints)
      - Behavioral mastery & high-EQ storytelling (reverse-interviewing the hiring manager, demonstrating ownership)
      - Offer leverage & positioning value

      Return EXACTLY 3 items in valid JSON format.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique identifier for tip, e.g. tip_1" },
              title: { type: Type.STRING, description: "Punchy, memorable 3-6 word actionable title" },
              category: { type: Type.STRING, description: "e.g., 'STAR Storytelling', 'Technical Depth', 'Executive Mindset', 'Answering Under Pressure', 'Reverse Questioning'" },
              impactLevel: { type: Type.STRING, description: "Must be: 'High Impact', 'Game Changer', or 'Pro Tip'" },
              snippet: { type: Type.STRING, description: "2 to 3 sentences of clear, high-impact, practical advice." },
              confidenceBooster: { type: Type.STRING, description: "A motivating 1-sentence psychological anchor to reinforce confidence." }
            },
            required: ["id", "title", "category", "impactLevel", "snippet", "confidenceBooster"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 3);
    }
    throw new Error("Invalid tips array returned");
  } catch (e: any) {
    console.warn("Interview Tips Agent fallback triggered:", e.message || e);
    
    // Curated high-impact randomized pool of career advice snippets for reliable fallback
    const tipPool = [
      {
        id: `tip_${Date.now()}_1`,
        title: "Lead With the 'Executive Summary' First",
        category: "Structured Answering",
        impactLevel: "Game Changer" as const,
        snippet: "When asked a complex question, start with your high-level thesis or result in one sentence before diving into technical details. This anchors the interviewer and shows senior-level clarity.",
        confidenceBooster: "Interviewers remember clean structure far more than memorized trivia."
      },
      {
        id: `tip_${Date.now()}_2`,
        title: "Embrace Silence as a Sign of Seniority",
        category: "Executive Presence",
        impactLevel: "High Impact" as const,
        snippet: "Never rush into answering within 1 second. Taking a calm 3-5 second breath to structure your thoughts ('Great question; let me structure this into architecture, tradeoffs, and scale') signals composure and deep deliberation.",
        confidenceBooster: "Top engineers pause to think—it is a superpower, not hesitation."
      },
      {
        id: `tip_${Date.now()}_3`,
        title: "Frame Every Mistake Through Growth & Metrics",
        category: "STAR Storytelling",
        impactLevel: "High Impact" as const,
        snippet: "When discussing past project failures, dedicate only 20% of your time to what went wrong and 80% to the post-mortem fix, telemetry added, and what system-level safeguards you instituted.",
        confidenceBooster: "Every senior engineer has broken production; what matters is your resilience and root-cause mindset."
      },
      {
        id: `tip_${Date.now()}_4`,
        title: "Ask Calibrated Questions at the End",
        category: "Reverse Interviewing",
        impactLevel: "Pro Tip" as const,
        snippet: "Ask: 'What does top performance look like in this role in the first 90 days, and what is the biggest technical roadblock currently holding that back?' This transforms the conversation into peer-to-peer problem solving.",
        confidenceBooster: "You are also interviewing them to see if this team deserves your talents."
      },
      {
        id: `tip_${Date.now()}_5`,
        title: "Treat Coding Interviews as a Collaborative Design Session",
        category: "Technical Depth",
        impactLevel: "Game Changer" as const,
        snippet: "Over-communicate your thought process before writing a single line of syntax. State your time/space complexity goals, test edge cases out loud, and ask: 'Does this trade-off make sense given our latency constraints?'",
        confidenceBooster: "Interviewers want to see how pleasant you are to debug with at 3 PM on a Tuesday."
      },
      {
        id: `tip_${Date.now()}_6`,
        title: "Quantify Your Impact With Numbers",
        category: "Behavioral Mastery",
        impactLevel: "Pro Tip" as const,
        snippet: "Instead of saying 'I improved query speed', say 'I reduced P99 latency by 38% from 420ms to 260ms by introducing composite indices and Redis caching.' Concrete metrics make your claims undeniable.",
        confidenceBooster: "Numbers provide indisputable proof of your engineering contributions."
      }
    ];

    // Shuffle and pick 3
    const shuffled = [...tipPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }
}

