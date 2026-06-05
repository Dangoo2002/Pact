import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, studentId, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build context from student's performance data
    const contextPrompt = `
Student Context:
- Performance Level: ${context?.performance?.performanceTier || 'beginner'}
- Average Score: ${Math.round(context?.performance?.averageScore || 0)}%
- Overall Mastery: ${Math.round(context?.performance?.overallMastery || 0)}%
- Knowledge Gaps: ${context?.gaps || 0}
- Recent Topics: ${context?.recentActivity?.map(a => a.concept).join(', ') || 'None'}

Student Question: ${message}

As an AI learning assistant, provide a helpful, educational response. Be encouraging and specific. If they ask about concepts they're struggling with, reference their performance data. Keep responses concise but informative.`;

    const aiResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
            content: `You are a friendly, knowledgeable AI learning assistant for a programming education platform. 
            You help students with programming concepts, explain their knowledge gaps, and provide study advice.
            Be encouraging, use examples when helpful, and keep responses clear and concise.
            If the student asks about specific programming concepts, explain them thoroughly.
            If they ask about their performance, reference their data kindly and offer specific advice.`
          },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await aiResponse.json();
    const reply = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    // Save chat history (optional)
    await query(`
      INSERT INTO chat_history (student_id, message, response, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [studentId, message, reply]);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      reply: "I'm having trouble connecting. Please try again in a moment." 
    }, { status: 500 });
  }
}