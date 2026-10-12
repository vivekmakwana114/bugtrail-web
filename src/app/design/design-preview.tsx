'use client';

import { useState, type ReactNode } from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectListItem } from '@/types/api';
import { BUG_STATUSES, STATUS_META } from '@/config/statuses';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectCard } from '@/components/shared/project-card';
import { EmptyState, ErrorState, NoAccessState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { MiniTrail, TrailPath } from '@/components/shared/trail';
import { FormDialog } from '@/components/templates/form-dialog';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { SAMPLE_PROJECTS, SAMPLE_ROWS, SAMPLE_TRAIL } from './samples';

const NEUTRALS = [
  ['bg-bg', 'bg', 'page ground'],
  ['bg-surface', 'surface', 'panels, rows'],
  ['bg-sunken', 'sunken', 'wells, avatars'],
  ['bg-line', 'line', 'hairlines'],
  ['bg-line-strong', 'line-strong', 'inputs, hover'],
  ['bg-ink', 'ink', 'text, primary action'],
  ['bg-ink-2', 'ink-2', 'secondary text'],
  ['bg-ink-3', 'ink-3', 'meta, captions'],
] as const;

const STATUS_SWATCH = {
  reported: 'bg-reported',
  ongoing: 'bg-ongoing',
  resolved: 'bg-resolved',
  pass: 'bg-pass',
  failed: 'bg-failed',
} as const;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-md border border-line bg-surface p-5">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <p className="max-w-prose text-sm text-ink-2">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function DesignPreview() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>('reported');
  const [selectedRow, setSelectedRow] = useState(1);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8">
      <PageHeader
        eyebrow="dev only · /design"
        title="BugTrail design system"
        description="Every token and component in its real states. Rules: docs/design/DESIGN_SYSTEM.md. All data on this page is sample data."
        actions={<ThemeToggle />}
      />

      <Section
        title="Type"
        note="Instrument Sans for people, IBM Plex Mono for machine values. 14px base: this is a dense tool."
      >
        <div className="grid gap-2">
          <p className="text-2xl font-semibold tracking-tight">2xl · Projects</p>
          <p className="text-xl font-semibold">xl · Checkout revamp</p>
          <p className="text-lg font-semibold">lg · Activity</p>
          <p className="text-md">md · Steps: open the cart, apply SAVE10, then apply FREESHIP.</p>
          <p className="text-sm text-ink-2">sm · Assigned to Riya Shah · Module: Payments</p>
          <p className="text-xs font-medium text-ink-3">xs · Updated 14 minutes ago</p>
          <p className="font-mono text-sm">mono · CHK-142 · 6d 4h · 12 Oct 2026, 14:32 · 1,284</p>
        </div>
      </Section>

      <Section
        title="Colour"
        note="Neutrals do the work. Saturated colour only for the five statuses and danger."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NEUTRALS.map(([swatch, name, use]) => (
            <div
              key={name}
              className="flex items-center gap-2.5 rounded-sm border border-line p-1.5"
            >
              <span className={`size-7 rounded-sm border border-line-strong ${swatch}`} />
              <span className="grid">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-ink-3">{use}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {BUG_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-2.5 rounded-sm border border-line p-1.5">
              <span className={`size-7 rounded-sm ${STATUS_SWATCH[s]}`} />
              <span className="text-sm font-medium">
                {STATUS_META[s].label}
                {s === 'failed' && ' / danger'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Status" note="Colour + glyph, never colour alone.">
        <div className="flex flex-wrap gap-2.5">
          {BUG_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <dl className="grid gap-1.5 text-sm">
          {BUG_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <StatusGlyph status={s} />
              <dt className="w-20 font-medium">{STATUS_META[s].label}</dt>
              <dd className="text-ink-2">{STATUS_META[s].meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Controls" note="One primary per view. Buttons say what they do.">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            Report bug
            <Kbd className="border-bg/40 text-bg">c</Kbd>
          </Button>
          <Button>Assign</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete bug</Button>
          <Button
            size="sm"
            onClick={() => toast.success('Moved to Resolved', { description: 'CHK-160' })}
          >
            Show a toast
          </Button>
          <Button
            size="sm"
            onClick={() =>
              toast.error("Couldn't save the bug", {
                description: 'Check your connection and try again.',
              })
            }
          >
            Show an error toast
          </Button>
          <Tooltip label="More actions">
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal aria-hidden />
            </Button>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>CHK-142</DropdownMenuLabel>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Assign to me</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger">Delete bug</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="demo-module" label="Module / screen">
            <Input id="demo-module" defaultValue="Payments" />
          </Field>
          <Field id="demo-status" label="Status">
            <Select
              id="demo-status"
              value={status}
              onValueChange={setStatus}
              options={BUG_STATUSES.map((s) => ({
                value: s,
                label: STATUS_META[s].label,
                icon: <StatusGlyph status={s} />,
              }))}
            />
          </Field>
          <Field
            id="demo-drive"
            label="Attachment"
            error="Use a Google Drive link (drive.google.com or docs.google.com)."
          >
            <Input
              id="demo-drive"
              className="font-mono"
              defaultValue="https://dropbox.com/s/abc"
              aria-invalid
            />
          </Field>
        </div>
        <label className="inline-flex items-center gap-2 text-sm" htmlFor="demo-email">
          <Checkbox id="demo-email" /> Send email to the assignee
        </label>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All users</TabsTrigger>
            <TabsTrigger value="pending">
              Waiting for approval <span className="font-mono text-xs text-ink-3">3</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-3 text-sm text-ink-2">
            Underlined tabs on a hairline.
          </TabsContent>
          <TabsContent value="pending" className="pt-3 text-sm text-ink-2">
            Three people registered today.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Project cards" note="Five-second test: which project is in trouble?">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROJECTS.map(
            ({
              project,
              agedOpen,
              updatedLabel,
            }: {
              project: ProjectListItem;
              agedOpen: number;
              updatedLabel: string;
            }) => (
              <ProjectCard
                key={project.id}
                project={project}
                href="/design"
                agedOpen={agedOpen}
                updatedLabel={updatedLabel}
              />
            ),
          )}
        </div>
      </Section>

      <Section
        title="Ticket grid"
        note="Dense rows, mono for machine values. Click a row: the cursor is an ink edge, not a colour."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute top-2 left-2.5 size-4 text-ink-3"
              aria-hidden
            />
            <Input aria-label="Search bugs" placeholder="Search title or BT-42" className="pl-8" />
          </div>
        </div>
        <Table className="min-w-245">
          <thead>
            <tr>
              <TableHead>Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Trail</TableHead>
              <TableHead className="text-right">Fails</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row, i) => (
              <TableRow
                key={row.key}
                selected={i === selectedRow}
                onClick={() => setSelectedRow(i)}
              >
                <TableCell className="font-mono whitespace-nowrap text-ink-2">{row.key}</TableCell>
                <TableCell className="max-w-90">
                  <span className="block truncate" title={row.title}>
                    {row.title}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-ink-2">{row.module}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  {row.assignee ? (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <Avatar name={row.assignee} />
                      {row.assignee}
                    </span>
                  ) : (
                    <span className="text-ink-3">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <MiniTrail status={row.status} failCount={row.fails} />
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${row.fails ? 'font-semibold text-danger' : 'text-ink-3'}`}
                >
                  {row.fails}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">{row.age}</TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap text-ink-3">
                  {row.updated}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section
        title="The Trail"
        note="CHK-142 (sample): reported, worked on, failed QA twice, passed."
      >
        <TrailPath {...SAMPLE_TRAIL} />
      </Section>

      <Section title="States" note="Every list has all four. Loading is shaped like the content.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2" aria-label="Loading example">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-sm border border-line p-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <EmptyState
            title="No bugs in this project yet"
            description="Reported bugs show up here with their status, assignee and age."
            action={
              <Button variant="primary" size="sm">
                Report the first bug
              </Button>
            }
          />
          <ErrorState
            title="This list didn't load"
            description="The server didn't answer. Check your connection and try again."
            onRetry={() => toast('Retrying…')}
          />
          <NoAccessState />
        </div>
      </Section>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Report bug"
        description="Checkout revamp (CHK)"
        submitLabel="Report bug"
        size="lg"
        footerStart={
          <label className="inline-flex items-center gap-2 text-sm" htmlFor="dlg-email">
            <Checkbox id="dlg-email" /> Send email
          </label>
        }
        onSubmit={(event) => {
          event.preventDefault();
          setDialogOpen(false);
          toast.success('Bug reported', { description: 'CHK-164 · assigned to Riya Shah' });
        }}
      >
        <Field id="dlg-title" label="Title">
          <Input
            id="dlg-title"
            defaultValue="Cart badge count is off by one after removing the last item"
          />
        </Field>
        <Field
          id="dlg-desc"
          label="Steps to reproduce"
          hint="What you did, what you expected, what happened."
        >
          <Textarea id="dlg-desc" />
        </Field>
      </FormDialog>
    </main>
  );
}
