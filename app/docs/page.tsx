import CopyCode from '@/components/CopyCode';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Documentation | souls.sh',
  description: 'Learn how to discover, install, and publish souls for your AI agents.',
};

export default function DocsPage() {
  const cardClass = 'rounded-xl border border-zinc-800 bg-zinc-900/50';
  const workflowCardClass = `${cardClass} p-6`;
  const choiceCardClass =
    'block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors';
  const sourceLabelClass = 'text-sm uppercase tracking-wide text-zinc-500 mb-2';
  const codePillClass = 'bg-zinc-800 px-1.5 py-0.5 rounded text-sm';
  const optionPillClass = `${codePillClass} text-white`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </Link>
      </div>

      {/* Title */}
      <h1 className="mb-3 text-4xl font-bold">Documentation</h1>
      <p className="mb-10 text-lg text-gray-400">
        Learn how to discover, install, and publish souls for your AI agents.
      </p>

      {/* Choose goal */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">Choose your goal</h2>
        <p className="mb-6 text-gray-300">
          Start by picking what you want to do. Install and publish are different actions.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <a href="#install" className={choiceCardClass}>
            <p className="mb-2 text-sm tracking-wide text-zinc-500 uppercase">Path 1</p>
            <h3 className="mb-2 text-lg font-medium text-white">Install an existing soul</h3>
            <p className="text-gray-400">
              Use this when you want to apply a soul from the directory or from a known identifier
              to your local workspace.
            </p>
          </a>
          <a href="#publish" className={choiceCardClass}>
            <p className="mb-2 text-sm tracking-wide text-zinc-500 uppercase">Path 2</p>
            <h3 className="mb-2 text-lg font-medium text-white">Publish your own soul</h3>
            <p className="text-gray-400">
              Use this when you want your soul listed on souls.sh so other people or agents can
              discover and install it.
            </p>
          </a>
        </div>
      </section>

      {/* Identifier reference */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">Identifier reference</h2>
        <div className={`${cardClass} space-y-3 p-5`}>
          <ul className="list-inside list-disc space-y-2 text-gray-400">
            <li>
              GitHub: <code className={codePillClass}>owner/repo</code>.
            </li>
            <li>
              Moltbook: <code className={codePillClass}>moltbook/agent-name</code>.
            </li>
            <li>
              The CLI command always uses <code className={codePillClass}>&lt;identifier&gt;</code>.
            </li>
          </ul>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="mb-16 scroll-mt-24">
        <h2 className="mb-3 text-2xl font-semibold">Install a soul</h2>
        <p className="mb-6 text-gray-300">
          Installing writes a SOUL.md file to your local workspace.
        </p>
        <div className="space-y-6">
          <article className={workflowCardClass}>
            <p className={sourceLabelClass}>GitHub source</p>
            <h3 className="mb-4 text-lg font-medium">Install from GitHub</h3>
            <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-400">
              <li>Find the GitHub identifier in the directory or in your repo.</li>
              <li>Run the install command.</li>
            </ol>
            <CopyCode command="npx souls.sh install <identifier>" showPrompt={false} />
            <p className="mt-4 text-sm text-gray-400">
              GitHub identifiers look like <code className={codePillClass}>owner/repo</code>.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              For multi-soul repos, add <code className={codePillClass}>--name &lt;name&gt;</code>.
            </p>
          </article>

          <article className={workflowCardClass}>
            <p className={sourceLabelClass}>Moltbook source</p>
            <h3 className="mb-4 text-lg font-medium">Install from Moltbook</h3>
            <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-400">
              <li>Find the Moltbook identifier in the directory or agent name on Moltbook.</li>
              <li>
                Build the identifier as <code className={codePillClass}>moltbook/agent-name</code>.
              </li>
              <li>Run the install command.</li>
            </ol>
            <CopyCode command="npx souls.sh install <identifier>" showPrompt={false} />
          </article>
        </div>
      </section>

      {/* Publish */}
      <section id="publish" className="mb-16 scroll-mt-24">
        <h2 className="mb-3 text-2xl font-semibold">Publish your soul</h2>
        <p className="mb-6 text-gray-300">
          Publishing lists your soul on souls.sh for others to discover.
        </p>
        <div className="space-y-6">
          <article className={workflowCardClass}>
            <p className={sourceLabelClass}>GitHub source</p>
            <h3 className="mb-4 text-lg font-medium">Publish from GitHub</h3>
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="mb-2 text-sm text-gray-300">Repo layout requirements:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                <li>
                  <code className={codePillClass}>SOUL.md</code> at repo root (single soul).
                </li>
                <li>
                  <code className={codePillClass}>souls/&lt;name&gt;/SOUL.md</code> for multi-soul
                  repos.
                </li>
              </ul>
            </div>
            <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-400">
              <li>Make sure your repo is public and follows one of the layouts above.</li>
              <li>Run the publish command.</li>
            </ol>
            <CopyCode command="npx souls.sh publish <identifier>" showPrompt={false} />
            <p className="mt-4 text-sm text-gray-400">
              For multi-soul repos, add <code className={codePillClass}>--name &lt;name&gt;</code>.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              To publish every soul in a multi-soul repo, use{' '}
              <code className={codePillClass}>--all</code>.
            </p>
            <p className="mt-4 mb-2 text-sm text-gray-300">Or publish via API:</p>
            <CopyCode
              command={`curl -X POST https://souls.sh/api/publish \\
  -H "Content-Type: application/json" \\
  -d '{"source": "github", "name": "marvin", "owner": "myuser", "repo": "myrepo"}'`}
              showPrompt={false}
            />
          </article>

          <article className={workflowCardClass}>
            <p className={sourceLabelClass}>Moltbook source</p>
            <h3 className="mb-4 text-lg font-medium">Publish from Moltbook</h3>
            <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-400">
              <li>Make sure your agent exists on Moltbook.</li>
              <li>Use the API call below (Moltbook publishing is API-only).</li>
            </ol>
            <CopyCode
              command={`curl -X POST https://souls.sh/api/publish \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "moltbook",
    "name": "your-agent-name",
    "content": "# Cleaned SOUL.md content here..."
  }'`}
              showPrompt={false}
            />
            <p className="mt-4 text-sm text-gray-400">
              Claimed Moltbook agents display a verified badge.
            </p>
          </article>
        </div>
      </section>

      {/* CLI Options */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">CLI options</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-gray-300">Option</th>
                <th className="px-4 py-3 text-left font-medium text-gray-300">Description</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-3 [&_td]:text-gray-400 [&_tr]:border-b [&_tr]:border-zinc-800 [&_tr:hover]:bg-zinc-900/40 [&_tr:last-child]:border-b-0">
              <tr>
                <td className="align-top">
                  <code className={optionPillClass}>--name &lt;name&gt;</code>
                </td>
                <td>Select the soul name in multi-soul GitHub repos.</td>
              </tr>
              <tr>
                <td className="align-top">
                  <code className={optionPillClass}>--all</code>
                </td>
                <td>Publish all souls from a multi-soul GitHub repo.</td>
              </tr>
              <tr>
                <td className="align-top">
                  <code className={optionPillClass}>--dir &lt;path&gt;</code>
                </td>
                <td>
                  Install to this workspace path. Default:{' '}
                  <code className={codePillClass}>~/.openclaw/workspace</code>
                </td>
              </tr>
              <tr>
                <td className="align-top">
                  <code className={optionPillClass}>--backup</code>
                </td>
                <td>Back up existing SOUL.md before overwriting.</td>
              </tr>
              <tr>
                <td className="align-top">
                  <code className={optionPillClass}>--force</code>
                </td>
                <td>Overwrite existing SOUL.md without a backup.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Other commands */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">Other commands</h2>
        <div className="space-y-6 [&>div>p]:mb-2 [&>div>p]:text-gray-400">
          <div>
            <p>Browse souls</p>
            <CopyCode command="npx souls.sh list" showPrompt={false} />
          </div>
          <div>
            <p>Show current workspace</p>
            <CopyCode command="npx souls.sh where" showPrompt={false} />
          </div>
        </div>
      </section>

      {/* Trust & Verification */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">Trust &amp; verification</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${cardClass} p-5`}>
            <p className="font-medium text-gray-300">GitHub souls</p>
            <p className="text-sm text-gray-400">
              Verified when the SOUL.md file exists in the repo. This confirms the soul comes from a
              real GitHub repo but doesn&apos;t guarantee content quality.
            </p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="font-medium text-gray-300">Moltbook souls</p>
            <p className="text-sm text-gray-400">
              Verified when the Moltbook agent is claimed by its owner. Unclaimed agents can still
              publish but won&apos;t show the verified badge.
            </p>
          </div>
        </div>
      </section>

      {/* How Souls are ranked */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">How souls are ranked</h2>
        <p className="mb-4 text-gray-300">
          The leaderboard ranks souls by download count. When you install a soul via the CLI, an
          anonymous download is recorded to track popularity.
        </p>
        <p className="text-gray-300">
          This telemetry is completely anonymous and only tracks which souls are being installed. No
          personal information or usage patterns are collected.
        </p>
      </section>

      {/* Safety */}
      <section className="mb-16">
        <h2 className="mb-3 text-2xl font-semibold">Safety</h2>
        <ul className="list-inside list-disc space-y-2 text-gray-300">
          <li>Remove API keys or private information from SOUL.md before publishing.</li>
          <li>
            Review souls before installing. We do our best to maintain a safe directory, but we
            cannot guarantee the quality or security of every soul listed on souls.sh.
          </li>
        </ul>
      </section>

      {/* Browse Souls */}
      <section className="mb-12">
        <h2 className="mb-3 text-2xl font-semibold">Browse souls</h2>
        <p className="mb-4 text-gray-300">Ready to find the perfect soul for your agent?</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-gray-200"
        >
          Explore souls {'->'}
        </Link>
      </section>
    </main>
  );
}
