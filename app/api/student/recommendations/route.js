import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit') || 10;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Call Role 3 API for AI-powered recommendations
    const recUrl = `${process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL}/api/v1/recommend/recommend/${studentId}?limit=${limit}`;
    const response = await fetch(recUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations from Role 3');
    }

    const data = await response.json();
    
    return NextResponse.json({
      recommendations: data.recommendations || [],
      source: 'mistral-ai',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    
    // Fallback recommendations if API fails
    return NextResponse.json({
      recommendations: [
        {
          resource_id: 1,
          title: "Complete Your First Quiz",
          type: "exercise",
          url: "/student/quizzes",
          reason: "Take a quiz to get personalized AI recommendations",
          priority: "high",
          score: 0.8
        },
        {
          resource_id: 2,
          title: "Review Programming Fundamentals",
          type: "article",
          url: "#",
          reason: "Strengthen your basic understanding",
          priority: "medium",
          score: 0.7
        }
      ],
      source: 'fallback'
    });
  }
}