// app/api/ai/instructor-chat/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    const prompt = `You are an AI Teaching Assistant for PACT. Current class metrics:
- Total Students: ${context.totalStudents || 0}
- Active Students: ${context.activeStudents || 0}
- Average Mastery: ${context.averageMastery || 0}%
- At-Risk Students: ${context.atRiskCount || 0}
- Top Gaps: ${context.topGaps?.map(g => `${g.concept.replace(/_/g, ' ')} (${g.struggling_percentage}%)`).join(', ') || 'None'}

Instructor question: "${message}"

Provide a helpful, actionable response based on this data. Be concise (under 200 words). Use plain text, no markdown.`;

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
            content: 'You are a helpful teaching assistant. Give specific, actionable advice based on the data. Never use markdown formatting like asterisks. Use plain text with dashes for lists.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "I'm here to help with your class analytics. What would you like to know?";
    
    // Clean up any markdown
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '');

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Instructor Chat error:', error);
    return NextResponse.json({ 
      reply: "I'm here to help with your class analytics. What would you like to know about your students' performance?" 
    });
  }
}