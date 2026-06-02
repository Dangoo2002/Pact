'use client';

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { concept, language, errorMessage } = await request.json();
    
    const prompt = `You are a programming tutor. Student is struggling with ${concept} in ${language}. Error: ${errorMessage || 'None'}. Explain the likely misconception and how to fix it. Keep response under 150 words.`;
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a patient programming tutor. Give clear, concise explanations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || 'Unable to generate explanation at this time.';
    
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json({ explanation: 'AI service temporarily unavailable. Please try again later.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
