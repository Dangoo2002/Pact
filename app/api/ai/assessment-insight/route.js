// app/api/ai/assessment-insight/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { averageScore, passRate, improvementRate, topGaps, trendData } = await request.json();

    // If no data, return default message
    if (!averageScore && averageScore !== 0) {
      return NextResponse.json({ 
        insight: 'Complete more assessments to enable AI-powered insights. Encourage students to take quizzes to generate data.' 
      });
    }

    const prompt = `Analyze this assessment data and provide a concise insight:

Average Score: ${averageScore || 0}%
Pass Rate: ${passRate || 0}%
Improvement Rate: ${improvementRate || 0}%
Top Knowledge Gaps: ${topGaps?.map(g => `${g.concept} (${g.mastery}%)`).join(', ') || 'None detected'}
Trend: ${trendData?.slice(-3).map(t => `${t.date}: ${t.score}%`).join(' → ') || 'Insufficient data'}

Provide one actionable insight (2-3 sentences) about class performance and recommendations. Be specific and helpful.`;

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            { role: 'system', content: 'You are an assessment analytics expert. Provide concise, actionable insights based on data. Never use markdown. Keep response under 100 words.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      const data = await response.json();
      let insight = data.choices?.[0]?.message?.content || 'Continue monitoring assessment data for more insights.';
      insight = insight.replace(/\*\*/g, '').replace(/\*/g, '');

      return NextResponse.json({ insight });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Provide fallback insight based on data
      let fallbackInsight = '';
      if (averageScore < 50) {
        fallbackInsight = `Class average is ${averageScore}%. Focus intervention on identified knowledge gaps. Schedule review sessions for struggling concepts.`;
      } else if (averageScore < 70) {
        fallbackInsight = `Class average is ${averageScore}%. Students are making progress but need additional practice on key concepts.`;
      } else {
        fallbackInsight = `Class is performing well with ${averageScore}% average. Continue current teaching strategies and monitor at-risk students.`;
      }
      return NextResponse.json({ insight: fallbackInsight });
    }
  } catch (error) {
    console.error('Assessment insight error:', error);
    return NextResponse.json({ insight: 'Complete more assessments to enable AI-powered insights.' });
  }
}