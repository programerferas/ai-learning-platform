export const summaryPrompt = ({ lessonTitle, lessonContent }) => {
  return `You are an expert educational content writer.
Generate a clear, structured summary with:
- A brief overview (2-3 sentences)
- Key concepts (bullet points)
- A closing takeaway
- speaking in just Arabic

Lesson Title: ${lessonTitle}

Lesson Content:
${lessonContent}`;
};

export const chatPrompt = ({ lessonTitle, lessonContent, userMessage, history }) => {
  const historyText = history
    .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `You are an expert educational assistant. Answer only education-related questions.
${lessonTitle ? `Current Lesson: ${lessonTitle}` : ""}
${lessonContent ? `Lesson Content:\n${lessonContent}` : ""}

Conversation so far:
${historyText}

Student: ${userMessage}
Assistant:`;
};

export const quizPrompt = ({ lessonTitle, lessonContent, questionCount }) => {
  return `You are a quiz generator. Respond ONLY with a valid JSON array, no markdown, no explanation and speaking in just Arabic.

Each object must have exactly:
{ "question": "string", "options": ["a","b","c","d"], "correctAnswer": "string" }

Rules:
- correctAnswer must exactly match one of the options
- Generate exactly ${questionCount} questions

Lesson Title: ${lessonTitle}
Lesson Content:
${lessonContent}`;
};

export const recommendationPrompt = ({ completedCourses, recommendedCourses }) => {
  const completedList = completedCourses
    .map((c) => `- ${c.title} (${c.category})`).join("\n");
  const recommendedList = recommendedCourses
    .map((c) => `- ${c.title} (${c.category})`).join("\n");

  return `You are a learning advisor. Respond ONLY with valid JSON, no markdown and speaking in just Arabic.

Format:
{
  "explanations": { "Course Title": "explanation" },
  "overallMessage": "motivational summary"
}

Student completed:
${completedList}

Recommended courses:
${recommendedList}

Explain why each recommended course suits this student.`;
};