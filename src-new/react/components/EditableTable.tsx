import React, { useState, useRef } from 'react';
import { TABLE_ICONS, ADD_ICON_SVG } from '../../icons';
import IconButtonGroup from './IconButtonGroup';

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  renderCell: (
    value: T[keyof T],
    row: T,
    onCellChangeForRow: (columnKey: keyof T, newValue: T[keyof T]) => void,
    rowIndex: number,
    extra?: any
  ) => React.ReactNode;
}

export interface EditableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onCellChange: (rowIndex: number, columnKey: keyof T, newValue: T[keyof T]) => void;
  onAddRow: () => void;
  onDeleteRow: (rowIndex: number) => void;
  onMoveRowUp?: (rowIndex: number) => void;
  onMoveRowDown?: (rowIndex: number) => void;
  onInsertRowBelow?: (rowIndex: number) => void;
  showAddRow?: boolean;
  /**
   * 行がクリックされた際に呼び出されるオプションのコールバック
   */
  onRowClick?: (row: T, rowIndex: number) => void;
  /**
   * ヘッダー行のさらに上に挿入するカスタム行
   */
  headerTop?: React.ReactNode;
}

const EditableTable = <T,>({
  data,
  columns,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onMoveRowUp,
  onMoveRowDown,
  onInsertRowBelow,
  showAddRow = true,
  onRowClick,
  headerTop,
}: EditableTableProps<T>) => {
  // 全カラム分の幅を管理（初期値はすべて300px）
  const [colWidths, setColWidths] = useState<(number | undefined)[]>(
    Array.from({ length: columns.length }, () => 300)
  );
  const resizingCol = useRef<number | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  const handleMouseDown = (colIdx: number, e: React.MouseEvent) => {
    resizingCol.current = colIdx;
    startX.current = e.clientX;
    startWidth.current = colWidths[colIdx] || 0;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingCol.current === null) return;
    const delta = e.clientX - startX.current;
    setColWidths((prev) => {
      const next = [...prev];
      const base = startWidth.current;
      const colIndex = resizingCol.current;
      if (colIndex !== null) {
        next[colIndex] = Math.max(80, base + delta);
      }
      return next;
    });
  };

  const handleMouseUp = () => {
    resizingCol.current = null;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
      <table className="w-full border-collapse border border-modifier-border mb-0 table-fixed">
        <colgroup>
          {columns.map((col, i) => (
            <col key={String(col.key)} className={colWidths[i] ? `w-[${colWidths[i]}px] min-w-[80px]` : ''} style={colWidths[i] ? { width: colWidths[i] + 'px', minWidth: '80px' } : {}} />
          ))}
          <col style={{ width: '1%', minWidth: '40px' }} />
        </colgroup>
        <thead>
          {headerTop}
          <tr className="bg-secondary">
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                className={`border border-modifier-border px-4 py-2 text-left relative group select-none ${colWidths[i] ? `w-[${colWidths[i]}px] min-w-[80px]` : ''}`}
                style={colWidths[i] ? { width: colWidths[i] + 'px', minWidth: '80px' } : {}}
              >
                <div className="flex items-center justify-between">
                  <span>{col.header}</span>
                  {/* ドラッグハンドル（最後の列以外） */}
                  {i < columns.length - 1 && (
                    <div
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-10 bg-transparent hover:bg-accent-hover transition"
                      onMouseDown={e => handleMouseDown(i, e)}
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="border border-modifier-border px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            return (
              <tr key={index} className="hover:bg-modifier-hover" onClick={() => onRowClick?.(row, index)}>
                {columns.map((col) => {
                  return (
                    <td
                      key={`${index}-${String(col.key)}`}
                      className={`border border-modifier-border px-4 py-2 align-top`}
                    >
                      {col.renderCell
                        ? col.renderCell(
                            row[col.key],
                            row,
                            (columnKey: keyof T, newValue: T[keyof T]) => onCellChange(index, columnKey, newValue),
                            index,
                            undefined
                          )
                        : String(row[col.key] ?? '')}
                    </td>
                  );
                })}
                <td className="border border-modifier-border px-1 py-2 text-center align-middle whitespace-nowrap">
                  <IconButtonGroup
                    direction="vertical"
                    gap="gap-y-1"
                    className="items-center"
                    buttons={[
                      ...(onInsertRowBelow ? [{
                        icon: TABLE_ICONS.add,
                        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          onInsertRowBelow(index);
                        },
                        title: '下に行を挿入',
                        variant: 'secondary' as const,
                        className: 'text-text-faint hover:text-accent text-base px-1 py-0.5 leading-none'
                      }] : []),
                      {
                        icon: TABLE_ICONS.menu,
                        title: '行操作',
                        variant: 'secondary' as const,
                        className: 'text-text-faint hover:text-accent text-base px-1 py-0.5 leading-none',
                        menuOptions: [
                          ...(onMoveRowUp && index > 0 ? [{
                            label: '行を上に移動',
                            icon: TABLE_ICONS.moveUp,
                            onClick: () => onMoveRowUp(index),
                            variant: 'default' as const
                          }] : []),
                          ...(onMoveRowDown && index < data.length - 1 ? [{
                            label: '行を下に移動',
                            icon: TABLE_ICONS.moveDown,
                            onClick: () => onMoveRowDown(index),
                            variant: 'default' as const
                          }] : []),
                          ...(data.length > 1 ? [{
                            label: '削除',
                            icon: TABLE_ICONS.delete,
                            onClick: () => onDeleteRow(index),
                            variant: 'danger' as const
                          }] : [])
                        ]
                      }
                    ]}
                  />
                </td>
              </tr>
            );
          })}
          {showAddRow && (
            <tr className="bg-secondary hover:bg-modifier-hover">
              <td
                colSpan={columns.length + 1 }
                className="border border-modifier-border px-4 py-2 text-center cursor-pointer text-text-muted hover:text-text-normal"
                onClick={() => onAddRow()}
                title="新しい行を追加"
              >
                <div className="flex items-center justify-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }} />
                  <span className="text-sm">新しい行を追加</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
  );
};

export default EditableTable; 