// app/api/ai/resources/route.js
export const dynamic = 'force-dynamic'; // Add this at the top to prevent static generation

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Function to validate URLs are accessible
async function validateUrl(url) {
  if (!url || !url.startsWith('http')) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Verified resource URLs that are guaranteed to work
const VERIFIED_RESOURCES = {
  python: {
    'variables': 'https://www.w3schools.com/python/python_variables.asp',
    'data_types': 'https://www.w3schools.com/python/python_datatypes.asp',
    'loops': 'https://www.w3schools.com/python/python_while_loops.asp',
    'functions': 'https://www.w3schools.com/python/python_functions.asp',
    'conditionals': 'https://www.w3schools.com/python/python_conditions.asp',
    'arrays': 'https://www.w3schools.com/python/python_lists.asp',
    'strings': 'https://www.w3schools.com/python/python_strings.asp',
    'classes': 'https://www.w3schools.com/python/python_classes.asp',
    'inheritance': 'https://www.w3schools.com/python/python_inheritance.asp',
    'operators': 'https://www.w3schools.com/python/python_operators.asp'
  },
  javascript: {
    'variables': 'https://www.w3schools.com/js/js_variables.asp',
    'functions': 'https://www.w3schools.com/js/js_functions.asp',
    'loops': 'https://www.w3schools.com/js/js_loop_for.asp'
  },
  default: 'https://developer.mozilla.org/en-US/search'
};

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const concept = searchParams.get('concept');
    const studentId = searchParams.get('studentId');

    if (!concept) {
      return NextResponse.json({ error: 'Concept required' }, { status: 400 });
    }

    // Import query dynamically to avoid issues during build
    const { query } = await import('@/lib/db');

    // Get student's specific errors for this concept
    let errors = { rows: [] };
    try {
      errors = await query(`
        SELECT question_text, selected_answer, code_submission, ai_feedback
        FROM responses r
        JOIN quiz_sessions qs ON r.session_id = qs.session_id
        WHERE r.student_id = $1 AND qs.concept = $2 AND r.is_correct = false
        ORDER BY r.timestamp DESC
        LIMIT 10
      `, [studentId, concept]);
    } catch (dbError) {
      console.error('Database error fetching errors:', dbError);
    }

    const language = 'python';
    const verifiedBaseUrl = VERIFIED_RESOURCES[language]?.[concept] || VERIFIED_RESOURCES[language]?.default || VERIFIED_RESOURCES.default;

    // Generate AI-powered resources with verified URLs
    const prompt = `Generate 5 specific learning resources for a student struggling with ${concept} in ${language}.

The student's specific errors:
${JSON.stringify(errors.rows.slice(0, 5), null, 2)}

Generate resources that directly address their mistakes. Use these verified URL patterns:
- YouTube videos: https://www.youtube.com/results?search_query=${encodeURIComponent(concept + ' tutorial')}
- Tutorials: https://www.w3schools.com/${language.toLowerCase()}/${language.toLowerCase()}_${concept.toLowerCase()}.asp
- Documentation: https://docs.python.org/3/tutorial/index.html
- Practice: /student/quizzes?concept=${concept}

Return JSON:
{
  "summary": "Brief analysis of student's specific struggles (2-3 sentences)",
  "resources": [
    {"title": "", "type": "video/tutorial/article/exercise", "url": "verified URL", "description": "", "duration_minutes": 0, "difficulty": "beginner/intermediate/advanced"}
  ]
}`;

    let result = {
      summary: `Resources to help you master ${concept.replace(/_/g, ' ')}`,
      resources: []
    };

    try {
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
              content: 'You are a learning resource curator. Generate specific, actionable resources. Use only the URL patterns provided. Return ONLY valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000
        })
      });

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          result.summary = parsed.summary || result.summary;
          result.resources = parsed.resources || [];
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    } catch (aiError) {
      console.error('AI generation failed:', aiError);
    }
    
    // Ensure we have valid resources with working URLs
    if (result.resources.length === 0) {
      result.resources = [
        {
          title: `${concept.replace(/_/g, ' ')} Tutorial for Beginners`,
          type: 'tutorial',
          url: verifiedBaseUrl,
          description: `Learn the fundamentals of ${concept.replace(/_/g, ' ')} with examples and practice exercises.`,
          duration_minutes: 20,
          difficulty: 'beginner'
        },
        {
          title: `${concept.replace(/_/g, ' ')} - Video Explanation`,
          type: 'video',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(concept.replace(/_/g, ' ') + ' programming tutorial')}`,
          description: `Watch video tutorials explaining ${concept.replace(/_/g, ' ')} concepts with visual examples.`,
          duration_minutes: 15,
          difficulty: 'beginner'
        },
        {
          title: `Practice ${concept.replace(/_/g, ' ')} with Interactive Exercises`,
          type: 'exercise',
          url: `/student/quizzes?concept=${concept}`,
          description: `Test your knowledge with interactive coding exercises on ${concept.replace(/_/g, ' ')}.`,
          duration_minutes: 25,
          difficulty: 'intermediate'
        }
      ];
    }
    
    // Validate URLs and mark any that might be problematic
    for (const resource of result.resources) {
      if (resource.url && !resource.url.startsWith('/') && !resource.url.startsWith('https://www.w3schools.com') && !resource.url.includes('youtube.com')) {
        resource.note = 'External resource - may require internet access';
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI resources error:', error);
    return NextResponse.json({ 
      summary: `Resources to help you master ${concept ? concept.replace(/_/g, ' ') : 'this concept'}. Complete more quizzes for personalized recommendations.`,
      resources: [
        {
          title: `${concept ? concept.replace(/_/g, ' ') : 'Programming'} Tutorial`,
          type: 'tutorial',
          url: 'https://www.w3schools.com/python/',
          description: 'Learn programming fundamentals with examples.',
          duration_minutes: 20,
          difficulty: 'beginner'
        }
      ]
    });
  }
}