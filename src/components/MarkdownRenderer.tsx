import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const handleCopyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedBlock(index);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let codeBlockIndex = 0;
    
    // Split by code blocks first
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {renderInlineMarkdown(content.slice(lastIndex, match.index))}
          </span>
        );
      }

      // Add code block
      const language = match[1] || 'code';
      const code = match[2].trim();
      const currentIndex = codeBlockIndex++;
      
      parts.push(
        <div key={`code-${currentIndex}`} className="my-3 rounded-lg overflow-hidden border border-border bg-muted/50">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase">{language}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleCopyCode(code, currentIndex)}
            >
              {copiedBlock === currentIndex ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-3 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {renderInlineMarkdown(content.slice(lastIndex))}
        </span>
      );
    }

    return parts;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let key = 0;
    
    // Process line by line for better control
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        elements.push(<br key={`br-${key++}`} />);
      }
      
      // Process inline elements
      let processed = line;
      const inlineElements: React.ReactNode[] = [];
      let lastIdx = 0;
      
      // Combined regex for inline code, bold, italic
      const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)/g;
      let inlineMatch;
      
      while ((inlineMatch = inlineRegex.exec(processed)) !== null) {
        // Add text before match
        if (inlineMatch.index > lastIdx) {
          inlineElements.push(processed.slice(lastIdx, inlineMatch.index));
        }
        
        const matched = inlineMatch[0];
        
        if (matched.startsWith('`')) {
          // Inline code
          inlineElements.push(
            <code key={`inline-${key++}`} className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm text-primary">
              {matched.slice(1, -1)}
            </code>
          );
        } else if (matched.startsWith('**') || matched.startsWith('__')) {
          // Bold
          inlineElements.push(
            <strong key={`bold-${key++}`} className="font-semibold">
              {matched.slice(2, -2)}
            </strong>
          );
        } else if (matched.startsWith('*') || matched.startsWith('_')) {
          // Italic
          inlineElements.push(
            <em key={`italic-${key++}`} className="italic">
              {matched.slice(1, -1)}
            </em>
          );
        }
        
        lastIdx = inlineMatch.index + matched.length;
      }
      
      // Add remaining text
      if (lastIdx < processed.length) {
        inlineElements.push(processed.slice(lastIdx));
      }
      
      elements.push(...(inlineElements.length > 0 ? inlineElements : [line]));
    });
    
    return elements;
  };

  return (
    <div className="markdown-content text-sm leading-relaxed">
      {renderContent()}
    </div>
  );
}