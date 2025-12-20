import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
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

      // Add code block with improved styling
      const language = match[1] || 'code';
      const code = match[2].trim();
      const currentIndex = codeBlockIndex++;
      
      parts.push(
        <div key={`code-${currentIndex}`} className="my-4 rounded-xl overflow-hidden border border-border shadow-sm bg-card">
          {/* Header with language label and copy button */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {getLanguageLabel(language)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-medium hover:bg-primary/10 transition-all"
              onClick={() => handleCopyCode(code, currentIndex)}
            >
              {copiedBlock === currentIndex ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy code
                </>
              )}
            </Button>
          </div>
          {/* Code content with better styling */}
          <div className="relative">
            <pre className="p-4 overflow-x-auto bg-muted/30">
              <code className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {renderCodeWithSyntax(code, language)}
              </code>
            </pre>
          </div>
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

  // Helper to get friendly language labels
  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'bash': 'Bash',
      'sh': 'Shell',
      'sql': 'SQL',
      'jsx': 'JSX',
      'tsx': 'TSX',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'code': 'Code',
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  // Basic syntax highlighting for common patterns
  const renderCodeWithSyntax = (code: string, _language: string): React.ReactNode => {
    // Simple syntax highlighting - keywords, strings, comments
    const lines = code.split('\n');
    
    return lines.map((line, lineIndex) => (
      <span key={lineIndex} className="block">
        {highlightLine(line)}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    ));
  };

  const highlightLine = (line: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Match patterns in order: comments, strings, keywords, numbers
    const patterns = [
      // Comments
      { regex: /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/g, className: 'text-muted-foreground italic' },
      // Strings
      { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'text-green-500 dark:text-green-400' },
      // Keywords
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|def|print|True|False|None)\b/g, className: 'text-purple-500 dark:text-purple-400 font-semibold' },
      // Numbers
      { regex: /\b(\d+\.?\d*)\b/g, className: 'text-orange-500 dark:text-orange-400' },
    ];

    // Simple approach: just return the line with inline code styling
    // Full syntax highlighting would require a proper parser
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return <span className="text-muted-foreground italic">{line}</span>;
    }

    // Highlight strings
    const stringRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    let lastIdx = 0;
    let stringMatch;
    
    while ((stringMatch = stringRegex.exec(line)) !== null) {
      if (stringMatch.index > lastIdx) {
        elements.push(highlightKeywords(line.slice(lastIdx, stringMatch.index), key++));
      }
      elements.push(
        <span key={key++} className="text-green-600 dark:text-green-400">
          {stringMatch[0]}
        </span>
      );
      lastIdx = stringMatch.index + stringMatch[0].length;
    }

    if (lastIdx < line.length) {
      elements.push(highlightKeywords(line.slice(lastIdx), key++));
    }

    return elements.length > 0 ? elements : line;
  };

  const highlightKeywords = (text: string, baseKey: number): React.ReactNode => {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|def|print|True|False|None|public|private|static|void|int|string|boolean)\b/g;
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;
    let key = 0;

    while ((match = keywords.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.slice(lastIdx, match.index));
      }
      elements.push(
        <span key={`${baseKey}-kw-${key++}`} className="text-purple-600 dark:text-purple-400 font-semibold">
          {match[0]}
        </span>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      elements.push(text.slice(lastIdx));
    }

    return elements.length > 0 ? elements : text;
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
          // Inline code with improved styling
          inlineElements.push(
            <code 
              key={`inline-${key++}`} 
              className="px-1.5 py-0.5 rounded-md bg-muted border border-border font-mono text-sm text-primary font-medium"
            >
              {matched.slice(1, -1)}
            </code>
          );
        } else if (matched.startsWith('**') || matched.startsWith('__')) {
          // Bold
          inlineElements.push(
            <strong key={`bold-${key++}`} className="font-semibold text-foreground">
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