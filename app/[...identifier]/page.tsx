import Breadcrumb from '@/components/Breadcrumb';
import CopyCode from '@/components/CopyCode';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { prisma } from '@/lib/db';
import { BadgeCheck } from 'lucide-react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ identifier: string[] }>;
}

type SourceContext =
  | { source: 'github'; owner: string; repo: string; name: string }
  | { source: 'moltbook'; name: string };

function resolveSource(segments: string[]): SourceContext | null {
  if (segments.length === 2 && segments[0] === 'moltbook') {
    return { source: 'moltbook', name: segments[1] };
  }

  if (segments.length === 3) {
    return { source: 'github', owner: segments[0], repo: segments[1], name: segments[2] };
  }

  return null;
}

async function getGitHubSoul(owner: string, repo: string, name: string) {
  try {
    const sourceId = `${owner}/${repo}`;
    return await prisma.soul.findUnique({
      where: {
        source_sourceId_name: {
          source: 'github',
          sourceId,
          name,
        },
      },
    });
  } catch {
    return null;
  }
}

async function getMoltbookSoul(name: string) {
  try {
    return await prisma.soul.findFirst({
      where: {
        source: 'moltbook',
        name: { equals: name, mode: 'insensitive' },
      },
    });
  } catch {
    return null;
  }
}

async function fetchGitHubSoulMarkdown(
  owner: string,
  repo: string,
  name: string
): Promise<string | null> {
  const mainUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/souls/${encodeURIComponent(name)}/SOUL.md`;
  const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/souls/${encodeURIComponent(name)}/SOUL.md`;

  // Also try root-level SOUL.md for single-soul repos
  const mainRootUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/SOUL.md`;
  const masterRootUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/SOUL.md`;

  try {
    // Try souls/<name>/SOUL.md first
    const resMain = await fetch(mainUrl, { next: { revalidate: 3600 } });
    if (resMain.ok) {
      return resMain.text();
    }

    const resMaster = await fetch(masterUrl, { next: { revalidate: 3600 } });
    if (resMaster.ok) {
      return resMaster.text();
    }

    // Try root-level if name matches repo
    if (name === repo) {
      const resMainRoot = await fetch(mainRootUrl, { next: { revalidate: 3600 } });
      if (resMainRoot.ok) {
        return resMainRoot.text();
      }

      const resMasterRoot = await fetch(masterRootUrl, { next: { revalidate: 3600 } });
      if (resMasterRoot.ok) {
        return resMasterRoot.text();
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { identifier } = await params;
  const context = resolveSource(identifier);

  if (!context) {
    return { title: 'Soul Not Found | souls.sh' };
  }

  const soul =
    context.source === 'github'
      ? await getGitHubSoul(context.owner, context.repo, context.name)
      : await getMoltbookSoul(context.name);

  if (!soul) {
    return { title: 'Soul Not Found | souls.sh' };
  }

  const installHint =
    context.source === 'github'
      ? `Install: npx souls.sh install ${context.owner}/${context.repo} --name ${context.name}`
      : `Install: npx souls.sh install moltbook/${soul.name}`;

  return {
    title: `${soul.name} | souls.sh`,
    description: soul.description || `${soul.name} SOUL.md template for AI agents.`,
    openGraph: {
      title: `${soul.name} | souls.sh`,
      description: soul.description || installHint,
      type: 'website',
    },
  };
}

export default async function SoulDetailPage({ params }: PageProps) {
  const { identifier } = await params;
  const context = resolveSource(identifier);

  if (!context) {
    notFound();
  }

  const [soul, markdownContent] =
    context.source === 'github'
      ? await Promise.all([
          getGitHubSoul(context.owner, context.repo, context.name),
          fetchGitHubSoulMarkdown(context.owner, context.repo, context.name),
        ])
      : await Promise.all([getMoltbookSoul(context.name), Promise.resolve(null)]);

  if (!soul) {
    notFound();
  }

  const moltbookMeta =
    context.source === 'moltbook'
      ? ((soul.metadata as { karma?: number; followers?: number }) ?? null)
      : null;

  const installCommand =
    context.source === 'github'
      ? `npx souls.sh install ${context.owner}/${context.repo} --name ${context.name}`
      : `npx souls.sh install moltbook/${soul.name}`;

  const fallbackUrl =
    context.source === 'github'
      ? `https://github.com/${context.owner}/${context.repo}/tree/main/souls/${context.name}`
      : soul.sourceUrl || `https://moltbook.com/u/${soul.name}`;

  const fallbackLabel = context.source === 'github' ? 'View on GitHub' : 'View on Moltbook';

  return (
    <main className="max-w-4xl mx-auto py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={
          context.source === 'github'
            ? [
                { label: 'Souls', href: '/' },
                { label: context.owner },
                { label: context.repo },
                { label: context.name },
              ]
            : [{ label: 'Souls', href: '/' }, { label: 'Moltbook' }, { label: soul.name }]
        }
      />

      {/* Page Title */}
      {context.source === 'moltbook' ? (
        <div className="flex items-center gap-4 mb-4">
          {soul.authorAvatar && (
            <img src={soul.authorAvatar} alt={soul.name} className="w-16 h-16 rounded-full" />
          )}
          <div>
            <h1 className="text-4xl font-bold text-foreground inline-flex items-center gap-4">
              {soul.name}
              {soul.verified && <BadgeCheck size={28} />}
            </h1>
            {moltbookMeta?.karma !== undefined && (
              <p className="text-sm text-(--ds-gray-600) mt-1">
                {moltbookMeta.karma.toLocaleString()} karma
                {moltbookMeta.followers !== undefined &&
                  ` · ${moltbookMeta.followers.toLocaleString()} followers`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-foreground">{context.name}</h1>
          {soul.name !== context.name && (
            <p className="text-xl text-(--ds-gray-600) mt-2">{soul.name}</p>
          )}
        </div>
      )}

      {soul.description && <p className="text-lg text-(--ds-gray-600) mb-10">{soul.description}</p>}

      {/* Install Command */}
      <section className="mb-10">
        <CopyCode command={installCommand} label="Install" />
      </section>

      {/* CLI Options */}
      <section className="mb-10">
        <h2 className="text-sm font-mono font-medium tracking-normal text-foreground uppercase mb-3.5">
          CLI Options
        </h2>
        <div className="space-y-1.5 text-sm text-(--ds-gray-600) font-mono bg-(--ds-gray-100)/50 rounded-md p-4 [&>div]:flex [&>div]:items-baseline [&>div]:gap-4 [&>div>span:first-child]:text-foreground [&>div>span:first-child]:shrink-0">
          <div>
            <span>-n, --name &lt;name&gt;</span>
            <span>Select the soul name in multi-soul GitHub repos</span>
          </div>
          <div>
            <span>-d, --dir &lt;path&gt;</span>
            <span>Use this workspace path directly</span>
          </div>
          <div>
            <span>-b, --backup</span>
            <span>Back up existing SOUL.md before overwriting</span>
          </div>
          <div>
            <span>-f, --force</span>
            <span>Overwrite existing SOUL.md without a backup</span>
          </div>
          <div>
            <span>publish &lt;identifier&gt;</span>
            <span>Publish a GitHub soul to souls.sh</span>
          </div>
          <div>
            <span>publish &lt;identifier&gt; --all</span>
            <span>Publish all souls from a multi-soul GitHub repo</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-(--ds-gray-200) mb-10" />

      {/* Markdown Content */}
      {(context.source === 'github' ? markdownContent : soul.content) ? (
        <article>
          <MarkdownRenderer
            content={
              context.source === 'github' ? (markdownContent as string) : (soul.content as string)
            }
          />
        </article>
      ) : (
        <div className="text-(--ds-gray-600) py-8 text-center border border-dashed border-(--ds-gray-400) rounded-lg">
          <p>SOUL.md content unavailable.</p>
          <p className="text-sm mt-2">
            {fallbackLabel}:{' '}
            <a
              href={fallbackUrl}
              className="text-foreground underline hover:text-(--ds-gray-900)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {context.source === 'github'
                ? `${context.owner}/${context.repo}/souls/${context.name}`
                : soul.name}
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
