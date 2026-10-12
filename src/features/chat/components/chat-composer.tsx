'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { UserSummary } from '@/types/api';

const MAX_LENGTH = 5000;
const MAX_SUGGESTIONS = 6;
/** "@" at the start or after a space, then the name typed so far, right before the caret. */
const MENTION_AT_CARET = /(^|\s)@([^\s@]{0,30})$/;

type ChatComposerProps = {
  /** Who can be mentioned: the project's active members (not you). */
  members: UserSummary[];
  pending: boolean;
  /** Resolves true when sent, so the composer clears; false keeps the text for a retry. */
  onSend: (input: { body: string; mentions: string[] }) => Promise<boolean>;
};

/**
 * Enter sends, Shift+Enter is a new line. Typing "@" suggests project members; picking one inserts
 * "@Name" and remembers who it was, so the API can notify them (only names still in the text
 * when sending count).
 */
export function ChatComposer({ members, pending, onSend }: ChatComposerProps) {
  const listId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<UserSummary[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const suggestions =
    query === null
      ? []
      : members
          .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, MAX_SUGGESTIONS);
  const open = suggestions.length > 0;
  const activeIndex = Math.min(active, suggestions.length - 1);

  /** Is the caret right after "@something"? Then show suggestions for "something". */
  const readMentionQuery = (el: HTMLTextAreaElement) => {
    const match = el.value.slice(0, el.selectionStart).match(MENTION_AT_CARET);
    setQuery(match ? match[2] : null);
    setActive(0);
  };

  const pick = (member: UserSummary) => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = el.value.slice(0, caret).replace(/@[^\s@]*$/, `@${member.name} `);
    const next = before + el.value.slice(caret);
    setText(next);
    setPicked((list) => (list.some((m) => m.id === member.id) ? list : [...list, member]));
    setQuery(null);
    // Put the caret after the inserted name once React has rendered the new value.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const send = async () => {
    const body = text.trim();
    if (!body || pending) return;
    const mentions = picked.filter((m) => body.includes(`@${m.name}`)).map((m) => m.id);
    if (await onSend({ body, mentions })) {
      setText('');
      setPicked([]);
      setQuery(null);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + step + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(suggestions[activeIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault(); // close the suggestions, not the page's dialog or anything else
        setQuery(null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;
  return (
    <div className="relative border-t border-line p-3">
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Mention someone"
          className="absolute right-3 bottom-full left-3 mb-1 rounded-md border border-line-strong bg-surface p-1 shadow-pop"
        >
          {suggestions.map((member, i) => (
            <li
              key={member.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              // mousedown, not click: keep focus in the textarea.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(member);
              }}
              className={cn(
                'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                i === activeIndex && 'bg-sunken',
              )}
            >
              <Avatar name={member.name} src={member.avatarUrl} />
              {member.name}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          rows={2}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="Message… (@ to mention)"
          aria-label="Message"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optionId(activeIndex) : undefined}
          className="max-h-40 min-h-16 resize-none"
          onChange={(event) => {
            setText(event.target.value);
            readMentionQuery(event.target);
          }}
          onSelect={(event) => readMentionQuery(event.currentTarget)}
          onBlur={() => setQuery(null)}
          onKeyDown={onKeyDown}
        />
        <Button
          size="icon"
          variant="primary"
          aria-label="Send message"
          disabled={!text.trim() || pending}
          onClick={send}
        >
          <SendHorizontal aria-hidden />
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-ink-3">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
