// app/api/ai/explain-gap/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { concept, language, errorMessage, codeContext } = await request.json();

    let prompt = '';
    
    if (codeContext) {
      prompt = `You are a patient programming tutor. The student is struggling with ${concept} in ${language}.

CODE CONTEXT:
\`\`\`${language}
${codeContext}
\`\`\`

Error or difficulty: ${errorMessage || 'General difficulty with this code'}

Please provide:
1. Identify what's wrong with the code (specific syntax errors, logical errors, missing elements)
2. Explain the correct approach in simple terms (2-3 sentences)
3. Show the corrected version of the code
4. Give one specific tip to avoid this mistake in the future

Keep response under 200 words. Be specific and helpful.`;
    } else {
      prompt = `You are a patient programming tutor. The student is struggling with ${concept} in ${language}.

Difficulty: ${errorMessage || 'General difficulty with the concept'}

Please:
1. Identify the likely misconception
2. Explain the concept simply (2-3 sentences)
3. Give a concrete example
4. Provide one specific tip to improve

Keep response under 150 words. Be encouraging and specific.`;
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { 
            role: 'system', 
            content: 'You are a friendly, patient programming tutor. Give specific, actionable help. Never use markdown formatting like asterisks or bold. Use plain text with line breaks for clarity.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();
    let explanation = data.choices?.[0]?.message?.content || 
      `Review the fundamentals of ${concept} in ${language}. Practice with simple examples first, then gradually increase complexity.`;

    // Clean up any markdown
    explanation = explanation.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, "'");

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explain gap error:', error);
    return NextResponse.json({ 
      explanation: `Review the fundamentals of ${concept} in ${language}. Practice with simple examples and test your understanding with quizzes.` 
    });
  }
}