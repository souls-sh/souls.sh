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
        <h2 className="text-sm font-mono font-medium tracking-normal text-foreground uppercase w-full text-left mb-3.5">
          {label}
        </h2>
      )}
      <div
        className={`bg-(--ds-gray-100)/80 border-none rounded-md px-4 py-3 font-mono text-sm text-foreground flex justify-between gap-4 w-full ${
          isMultiline ? 'items-start' : 'items-center'
        }`}
      >
        <pre className="whitespace-pre-wrap break-words text-foreground m-0 min-w-0 flex-1">
          {showPrompt ? `$ ${command}` : command}
        </pre>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded cursor-pointer transition-colors text-muted-foreground hover:text-foreground shrink-0"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
