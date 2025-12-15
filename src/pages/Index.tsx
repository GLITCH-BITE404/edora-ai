import { HomeworkChat } from '@/components/HomeworkChat';
import { Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Homework Helper</h1>
            <p className="text-xs text-muted-foreground">Quick answers, no fluff</p>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 container mx-auto max-w-3xl">
        <HomeworkChat />
      </main>
    </div>
  );
};

export default Index;