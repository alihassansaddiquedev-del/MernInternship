import type { FormEvent, ReactNode } from 'react';

interface BulkEditBarProps {
  selectedCount: number;
  onApply: (formData: FormData) => void;
  onClear: () => void;
}
export function BulkEditBar({ selectedCount, onApply, onClear }: BulkEditBarProps): ReactNode {
  if (!selectedCount) return null;
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onApply(new FormData(event.currentTarget));
    event.currentTarget.reset();
  };
  return (
    <form className="bulk-edit-bar" onSubmit={submit}>
      <strong>{selectedCount} selected</strong>
      <span className="bulk-divider" />
      <label htmlFor="bulk-operation">Bulk stock update</label>
      <select className="form-select" name="operation" id="bulk-operation" defaultValue="receive">
        <option value="receive">Receive units</option>
        <option value="deduct">Deduct units</option>
      </select>
      <input
        className="form-control"
        name="quantity"
        type="number"
        min="1"
        step="1"
        defaultValue="1"
        aria-label="Number of units"
      />
      <button className="btn bulk-apply" type="submit">
        Apply update <span>→</span>
      </button>
      <button className="btn bulk-cancel" type="button" onClick={onClear}>
        Clear
      </button>
    </form>
  );
}
