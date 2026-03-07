import Breadcrumb from '@/components/Breadcrumb';
import CopyCode from '@/components/CopyCode';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { prisma } from '@/lib/db';
import { fetchGitHubSoulContent, normalizeName, parseGitHubSoulMetadata } from '@/lib/github-souls';
import { BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';
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
          name: normalizeName(name),
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
  metadataValue: unknown
): Promise<string | null> {
  const metadata = parseGitHubSoulMetadata(metadataValue);
  if (!metadata) {
    return null;
  }

  try {
    return await fetchGitHubSoulContent(owner, repo, metadata, {
      next: { revalidate: 3600 },
    });
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
      ? `Install: npx souls.sh install ${context.owner}/${context.repo} --name ${soul.name}`
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

  const githubSoulPromise =
    context.source === 'github'
      ? getGitHubSoul(context.owner, context.repo, context.name)
      : Promise.resolve(null);

  const [soul, markdownContent] =
    context.source === 'github'
      ? await Promise.all([
          githubSoulPromise,
          githubSoulPromise.then((githubSoul) =>
            githubSoul
              ? fetchGitHubSoulMarkdown(context.owner, context.repo, githubSoul.metadata)
              : Promise.resolve(null)
          ),
        ])
      : await Promise.all([getMoltbookSoul(context.name), Promise.resolve(null)]);

  if (!soul) {
    notFound();
  }

  const moltbookMeta =
    context.source === 'moltbook'
      ? ((soul.metadata as { karma?: number; followers?: number }) ?? null)
      : null;
  const githubMeta = context.source === 'github' ? parseGitHubSoulMetadata(soul.metadata) : null;

  const installCommand =
    context.source === 'github'
      ? `npx souls.sh install ${context.owner}/${context.repo} --name ${soul.name}`
      : `npx souls.sh install moltbook/${soul.name}`;

  const fallbackUrl =
    context.source === 'github'
      ? githubMeta?.htmlUrl
      : soul.sourceUrl || `https://moltbook.com/u/${soul.name}`;

  const fallbackLabel = context.source === 'github' ? 'View on GitHub' : 'View on Moltbook';

  return (
    <main className="mx-auto max-w-4xl py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={
          context.source === 'github'
            ? [
                { label: 'Souls', href: '/' },
                { label: context.owner },
                { label: context.repo },
                { label: soul.name },
              ]
            : [{ label: 'Souls', href: '/' }, { label: 'Moltbook' }, { label: soul.name }]
        }
      />

      {/* Page Title */}
      {context.source === 'moltbook' ? (
        <div className="mb-4 flex items-center gap-4">
          {soul.authorAvatar && (
            <img src={soul.authorAvatar} alt={soul.name} className="h-16 w-16 rounded-full" />
          )}
          <div>
            <h1 className="text-foreground inline-flex items-center gap-4 text-4xl font-bold">
              {soul.name}
              {soul.verified && <BadgeCheck size={28} />}
            </h1>
            {moltbookMeta?.karma !== undefined && (
              <p className="mt-1 text-sm text-(--ds-gray-600)">
                {moltbookMeta.karma.toLocaleString()} karma
                {moltbookMeta.followers !== undefined &&
                  ` · ${moltbookMeta.followers.toLocaleString()} followers`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h1 className="text-foreground text-4xl font-bold">{soul.name}</h1>
        </div>
      )}

      {soul.description && <p className="mb-10 text-lg text-(--ds-gray-600)">{soul.description}</p>}

      {/* Install Command */}
      <section className="mb-10">
        <CopyCode command={installCommand} label="Install" />
      </section>

      {/* CLI Options */}
      <section className="mb-10">
        <h2 className="text-foreground mb-3.5 font-mono text-sm font-medium tracking-normal uppercase">
          CLI Options
        </h2>
        <div className="[&>div>span:first-child]:text-foreground space-y-1.5 rounded-md bg-(--ds-gray-100)/50 p-4 font-mono text-sm text-(--ds-gray-600) [&>div]:flex [&>div]:items-baseline [&>div]:gap-4 [&>div>span:first-child]:shrink-0">
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
      <hr className="mb-10 border-(--ds-gray-200)" />

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
        <div className="rounded-lg border border-dashed border-(--ds-gray-400) py-8 text-center text-(--ds-gray-600)">
          <p>SOUL.md content unavailable.</p>
          {fallbackUrl && (
            <p className="mt-2 text-sm">
              {fallbackLabel}:{' '}
              <a
                href={fallbackUrl}
                className="text-foreground underline hover:text-(--ds-gray-900)"
                target="_blank"
                rel="noopener noreferrer"
              >
                {context.source === 'github' ? fallbackUrl : soul.name}
              </a>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
