'use client';

import { useState } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function GapExplainer({ concept, language, errorMessage }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, language, errorMessage })
      });
      const data = await res.json();
      setExplanation(data.explanation || 'Unable to generate explanation at this time.');
      setShowExplainer(true);
    } catch (err) {
      setExplanation('Could not generate explanation. Please try again later.');
      setShowExplainer(true);
    } finally {
      setLoading(false);
    }
  };

  if (showExplainer) {
    return (
      <Card className="mt-3 p-3 bg-muted/50">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">{explanation}</p>
        </div>
        <button
          onClick={() => setShowExplainer(false)}
          className="text-xs text-primary hover:underline mt-2"
        >
          Close
        </button>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleExplain}
      disabled={loading}
      variant="outline"
      size="sm"
      className="mt-2"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin mr-1" />
          Analyzing...
        </>
      ) : (
        <>
          <Bot size={14} className="mr-1" />
          Explain with AI
        </>
      )}
    </Button>
  );
}