import { PlusCircle, Trash2 } from 'lucide-react';

import * as React from 'react';

import { PollOption } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface AddPollDialogProps {
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
}

export function AddPollDialog({ onAddPoll }: AddPollDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [options, setOptions] = React.useState<PollOption[]>([
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' },
  ]);
  const [expiresAt, setExpiresAt] = React.useState('');

  const handleOptionChange = (idx: number, value: string) => {
    setOptions(opts => opts.map((opt, i) => (i === idx ? { ...opt, text: value } : opt)));
  };

  const handleAddOption = () => {
    setOptions(opts => [...opts, { id: crypto.randomUUID(), text: '' }]);
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(opts => (opts.length > 2 ? opts.filter((_, i) => i !== idx) : opts));
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some(opt => !opt.text.trim())) return;
    onAddPoll({ question, options, expiresAt: expiresAt || undefined });
    setQuestion('');
    setOptions([
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ]);
    setExpiresAt('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> New Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Poll question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full text-base"
          />
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex gap-2 items-center">
                <Input
                  placeholder={`Option ${idx + 1}`}
                  value={opt.text}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(idx)}
                    className="h-12 w-12 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Remove option ${idx + 1}`}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="h-11 text-base w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiration Date (Optional)</label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full h-12"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              // reset local state and close dialog without submitting
              setQuestion('');
              setOptions([
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
              ]);
              setExpiresAt('');
              setOpen(false);
            }}
            className="h-11 text-base w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!question.trim() || options.some(opt => !opt.text.trim())}
            className="h-11 text-base w-full sm:w-auto"
          >
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
