'use client';

import { Check, Copy } from 'geist-icons';
import { useEffect, useRef, useState } from 'react';

function AsciiAnimation({ delay = 100 }: { delay?: number }) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Background layer with box-drawing characters
  const logoBg = `███████╗ ██████╗ ██╗   ██╗██╗     ███████╗
██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝
███████╗██║   ██║██║   ██║██║     ███████╗
╚════██║██║   ██║██║   ██║██║     ╚════██║
███████║╚██████╔╝╚██████╔╝███████╗███████║
╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`;

  // Foreground layer with solid blocks
  const logoFg = `███████  ██████  ██    ██ ██      ███████
██      ██    ██ ██    ██ ██      ██
███████ ██    ██ ██    ██ ██      ███████
     ██ ██    ██ ██    ██ ██           ██
███████  ██████   ██████  ███████ ███████`;

  const duration = 450;

  useEffect(() => {
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      setTimeout(() => setIsReady(true), delay);
    });
  }, [delay]);

  useEffect(() => {
    if (!isReady) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1-t)^3
      const eased = 1 - (1 - t) ** 3;

      setProgress(eased);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
      }
    };

    requestAnimationFrame(animate);
  }, [isReady]);

  const visibleLength = Math.floor(progress * logoFg.length);
  const visibleText = logoFg.slice(0, visibleLength);

  return (
    <div className="relative max-w-[320px] overflow-hidden lg:max-w-97.5">
      {/* Background layer - shadow */}
      <pre className="font-(family-name:--font-fira-mono) text-[12px] leading-[125%] tracking-[-1px] whitespace-pre text-(--ds-gray-700) select-none lg:text-[15px]">
        {logoBg}
      </pre>
      {/* Foreground layer - animated */}
      <pre className="text-foreground absolute top-0 left-0 font-(family-name:--font-fira-mono) text-[12px] leading-[125%] tracking-[-1px] whitespace-pre select-none lg:text-[15px]">
        {visibleText}
        {!isComplete && (
          <span className="bg-foreground animate-blink ml-px inline-block h-[1em] w-[0.6em]" />
        )}
      </pre>
    </div>
  );
}

export default function Header() {
  const [copied, setCopied] = useState(false);
  const [copiedAgent, setCopiedAgent] = useState(false);
  const command = 'npx souls.sh install <identifier>';
  const agentUrl = 'https://souls.sh/skill.md';
  const headingClass =
    'text-sm font-mono font-medium tracking-normal text-foreground uppercase w-full text-left mb-3.5';
  const commandBoxClass =
    'bg-(--ds-gray-100)/80 border-none rounded-md px-4 py-3 font-mono text-sm text-foreground flex items-center justify-between gap-4 w-full';
  const copyButtonClass =
    'p-1.5 rounded cursor-pointer transition-colors text-muted-foreground hover:text-foreground';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAgent = async () => {
    await navigator.clipboard.writeText(agentUrl);
    setCopiedAgent(true);
    setTimeout(() => setCopiedAgent(false), 2000);
  };

  return (
    <header className="mx-auto my-4 grid w-full max-w-6xl grid-cols-1 gap-10 sm:my-5 lg:mt-7 lg:mb-9 lg:grid-cols-[auto_1fr] lg:gap-14">
      <div className="grid grid-cols-1 gap-1 py-1">
        <h1 className="absolute hidden">Souls</h1>

        {/* ASCII Logo with animation */}
        <div className="relative flex w-full items-start justify-center overflow-hidden lg:justify-start">
          <AsciiAnimation delay={100} />
        </div>

        {/* Tagline */}
        <p className="text-primary text-center font-mono text-[15px] font-medium tracking-tight uppercase lg:text-left lg:text-[19px]">
          The OpenClaw Souls Directory
        </p>
      </div>

      <div>
        <p className="text-center text-xl leading-tight tracking-tight text-balance text-(--ds-gray-600) sm:text-2xl lg:text-left lg:text-3xl">
          Souls are SOUL.md personality templates for AI agents. Install them with one command to
          give your agents identity and purpose.
        </p>
      </div>

      {/* Install Commands */}
      <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-20 lg:col-span-2">
        <div>
          <h2 className={headingClass}>Install with CLI</h2>
          <div className={commandBoxClass}>
            <code className="truncate">
              <span className="text-muted-foreground">$</span> {command}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className={copyButtonClass}
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <h2 className={headingClass}>Install with Agent</h2>
          <div className={commandBoxClass}>
            <code className="truncate">{agentUrl}</code>
            <button
              type="button"
              onClick={handleCopyAgent}
              className={copyButtonClass}
              title="Copy to clipboard"
            >
              {copiedAgent ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
