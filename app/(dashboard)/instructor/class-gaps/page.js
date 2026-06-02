'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { fetchClassInsights } from '@/lib/api';
import { BarChart3, TrendingDown } from 'lucide-react';

export default function ClassGapsPage() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassInsights('CS101').then(data => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Class Knowledge Gaps</h1>
          <p className="text-muted-foreground">Identify concepts where students are struggling</p>
        </div>

        <Card>
          <h2 className="font-semibold mb-4">All Concept Gaps</h2>
          {insights?.class_gap_heatmap?.length > 0 ? (
            <div className="space-y-4">
              {insights.class_gap_heatmap.map((gap, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{gap.concept}</span>
                    <span className="text-muted-foreground">{gap.struggling_percentage}% struggling</span>
                  </div>
                  <div className="h-8 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full flex items-center justify-end px-3 text-xs text-white font-medium"
                      style={{ width: `${gap.struggling_percentage}%` }}
                    >
                      {gap.struggling_percentage > 20 && `${gap.struggling_percentage}%`}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{gap.total_attempts} attempts, {gap.correct_count} correct</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No gap data available yet.</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Common Error Patterns</h2>
          {insights?.common_error_patterns?.length > 0 ? (
            <div className="space-y-3">
              {insights.common_error_patterns.map((pattern, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-destructive" />
                    <span className="font-mono text-sm">{pattern.pattern}</span>
                  </div>
                  <span className="text-sm font-medium">{pattern.frequency} occurrences</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No error patterns identified yet.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}