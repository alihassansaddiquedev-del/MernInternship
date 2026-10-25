import type { Key, ReactNode } from 'react';

export interface GenericTableColumn<T> {
  id: string;
  heading: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

interface GenericTableProps<T> {
  rows: readonly T[];
  columns: readonly GenericTableColumn<T>[];
  rowKey: (row: T) => Key;
  rowClassName?: (row: T) => string;
  className?: string;
}

export function GenericTable<T>({
  rows,
  columns,
  rowKey,
  rowClassName,
  className = '',
}: GenericTableProps<T>): ReactNode {
  return (
    <table className={`table align-middle mb-0 ${className}`}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th className={column.className} key={column.id} scope="col">
              {column.heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className={rowClassName?.(row)} key={rowKey(row)}>
            {columns.map((column) => (
              <td className={column.className} key={column.id}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
