import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { concept, language, errorMessage, studentId } = await request.json();

    const prompt = `You are a patient programming tutor. The student is struggling with ${concept} in ${language}. 
Error: ${errorMessage || 'General difficulty with concept'}

Please:
1. Identify the likely misconception
2. Explain it simply (2-3 sentences)
3. Give one specific tip to improve

Keep response under 120 words.`;

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
            content: 'You are a friendly programming tutor. Give concise, helpful explanations.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || 
      `Review the fundamentals of ${concept} in ${language}. Practice with simple examples first.`;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Mistral explain error:', error);
    return NextResponse.json({ 
      explanation: "Unable to generate explanation. Please try again." 
    });
  }
}