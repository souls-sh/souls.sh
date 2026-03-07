'use client';

import { Check, Copy } from 'geist-icons';
import { useState } from 'react';

interface CopyCodeProps {
  command: string;
  label?: string;
  showPrompt?: boolean;
}

export default function CopyCode({ command, label, showPrompt = true }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const isMultiline = /[\r\n]/.test(command);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <h2 className="text-foreground mb-3.5 w-full text-left font-mono text-sm font-medium tracking-normal uppercase">
          {label}
        </h2>
      )}
      <div
        className={`text-foreground flex w-full justify-between gap-4 rounded-md border-none bg-(--ds-gray-100)/80 px-4 py-3 font-mono text-sm ${
          isMultiline ? 'items-start' : 'items-center'
        }`}
      >
        <pre className="text-foreground m-0 min-w-0 flex-1 break-words whitespace-pre-wrap">
          {showPrompt ? `$ ${command}` : command}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded p-1.5 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
