import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';

export default function DuplicateImageDialog({ open, onOpenChange, conflict, onResolve, onSkip }) {
  const [choice, setChoice] = useState('replace');
  const [copyName, setCopyName] = useState(conflict?.suggestedCopyName ?? '');

  // Sync copyName when a new conflict arrives (different file)
  const prevName = conflict?.suggestedCopyName;
  if (prevName && copyName !== prevName && choice === 'copy') {
    setCopyName(prevName);
  }
  if (open && !copyName && conflict?.suggestedCopyName) {
    setCopyName(conflict.suggestedCopyName);
  }

  const handleConfirm = () => {
    if (choice === 'replace') {
      onResolve({ strategy: 'replace' });
    } else {
      onResolve({ strategy: 'copy', name: copyName.trim() || conflict.suggestedCopyName });
    }
    setChoice('replace');
    setCopyName('');
  };

  const handleSkip = () => {
    setChoice('replace');
    setCopyName('');
    onSkip?.();
  };

  if (!conflict) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); onOpenChange?.(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-full bg-amber-100 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>File already exists</DialogTitle>
          </div>
          <DialogDescription>
            <span className="font-mono font-medium text-foreground">{conflict.existing.name}</span> already exists in your assets.
          </DialogDescription>
        </DialogHeader>

        {/* Size comparison */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Existing file</p>
            <p className="text-sm font-semibold">{conflict.existing.sizeFormatted}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">New upload</p>
            <p className="text-sm font-semibold">{conflict.incoming.sizeFormatted}</p>
          </div>
        </div>

        {/* Choice */}
        <div className="space-y-2 mt-1">
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              choice === 'replace' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
            }`}
          >
            <input
              type="radio"
              name="conflict-resolution"
              value="replace"
              checked={choice === 'replace'}
              onChange={() => setChoice('replace')}
              className="accent-primary"
            />
            <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Replace existing</p>
              <p className="text-xs text-muted-foreground">Overwrite the current file</p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              choice === 'copy' ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
            }`}
          >
            <input
              type="radio"
              name="conflict-resolution"
              value="copy"
              checked={choice === 'copy'}
              onChange={() => setChoice('copy')}
              className="accent-primary mt-0.5"
            />
            <Copy className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Save as copy</p>
              <p className="text-xs text-muted-foreground mb-2">Keep both files</p>
              {choice === 'copy' && (
                <input
                  type="text"
                  value={copyName}
                  onChange={e => setCopyName(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  placeholder={conflict.suggestedCopyName}
                />
              )}
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleSkip}>Skip this file</Button>
          <Button onClick={handleConfirm} disabled={choice === 'copy' && !copyName.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
