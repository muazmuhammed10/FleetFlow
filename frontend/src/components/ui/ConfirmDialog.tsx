import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {variant === 'danger' && (
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
        )}
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
