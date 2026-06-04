import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, studentId, context } = await request.json();

    // Call Mistral AI directly
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
            content: `You are PACT AI Tutor, a helpful programming assistant for students. 
            Provide clear, accurate answers about programming concepts.
            Use examples when helpful. Keep responses concise (under 150 words).
            Be encouraging and supportive.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      "I'm here to help with programming! Could you rephrase your question?";

    // Store the conversation in database for insights (optional)
    // await saveChatHistory(studentId, message, aiResponse);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Mistral chat error:', error);
    return NextResponse.json({ 
      response: "I'm having trouble connecting. Please try again in a moment." 
    }, { status: 500 });
  }
}