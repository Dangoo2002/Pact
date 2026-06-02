'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { fetchPopularResources } from '@/lib/api';
import { Search, Plus, Video, FileText, Code, ExternalLink } from 'lucide-react';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularResources(20).then(data => {
      setResources(data.resources || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getResourceIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={16} className="text-red-500" />;
      case 'article': return <FileText size={16} className="text-blue-500" />;
      default: return <Code size={16} className="text-green-500" />;
    }
  };

  const filteredResources = resources.filter(r => 
    r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Resource Library</h1>
            <p className="text-muted-foreground">Manage learning resources</p>
          </div>
          <Button>
            <Plus size={16} className="mr-2" />
            Add Resource
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.resource_id} className="flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getResourceIcon(resource.resource_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{resource.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{resource.resource_type}</p>
                </div>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="flex justify-between items-center mt-auto pt-3 border-t text-xs text-muted-foreground">
                <span>Quality: {Math.round((resource.quality_score || 0.7) * 100)}%</span>
                <button className="text-primary hover:underline">Edit</button>
              </div>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">No resources found.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}