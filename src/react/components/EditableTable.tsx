import React, { useState, useRef } from 'react';
import { TABLE_ICONS, ADD_ICON_SVG } from '../../constants/icons';
import IconButtonGroup from './IconButtonGroup';

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  renderCell: (
    value: T[keyof T],
    row: T,
    onCellChangeForRow: (columnKey: keyof T, newValue: T[keyof T]) => void,
    rowIndex: number,
    extra?: unknown
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
  onMoveRowTo?: (fromIndex: number, toIndex: number) => void;
  showAddRow?: boolean;

  onRowClick?: (row: T, rowIndex: number) => void;

  headerTop?: React.ReactNode;

  selectedRowIndexes?: number[];

  onSelectRow?: (rowIndex: number, isSelected: boolean) => void;

  onClearSelection?: () => void;
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
  onMoveRowTo,
  showAddRow = true,
  onRowClick,
  headerTop,
  selectedRowIndexes,
  onSelectRow,
  onClearSelection,
}: EditableTableProps<T>) => {

  const [colWidths, setColWidths] = useState<(number | undefined)[]>(
    Array.from({ length: columns.length }, (_, index) => {
      // 黄金比（φ ≈ 1.618）を使った美しい比率
      const promptWidth = 250; // プロンプトカラムをベース
      const goldenRatio = 1.618;

      if (index === 0) return Math.round(promptWidth * goldenRatio); // 画像カラム: 405px（プロンプトの1.6倍）
      if (index === 1) return Math.round(promptWidth * goldenRatio); // 話者・台詞カラム: 405px（プロンプトの1.6倍）
      if (index === 2) return promptWidth; // プロンプトカラム: 250px（ベース）
      return Math.round(promptWidth * goldenRatio); // その他: 405px
    })
  );
  const resizingCol = useRef<number | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const startNextWidth = useRef<number>(0);

  const handleMouseDown = (colIdx: number, e: React.MouseEvent) => {
    resizingCol.current = colIdx;
    startX.current = e.clientX;
    startWidth.current = colWidths[colIdx] || 300;
    startNextWidth.current = colWidths[colIdx + 1] || 300;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingCol.current === null) return;
    const delta = e.clientX - startX.current;
    setColWidths((prev) => {
      const next = [...prev];
      const colIndex = resizingCol.current;
      if (colIndex !== null && colIndex < columns.length - 1) {
        const nextColIndex = colIndex + 1;

        // 現在の列の新しい幅を計算（最小80px）
        const newCurrentWidth = Math.max(80, startWidth.current + delta);
        // 右隣の列の新しい幅を計算（最小80px）
        const newNextWidth = Math.max(80, startNextWidth.current - delta);

        // 両方の列の幅を更新
        next[colIndex] = newCurrentWidth;
        next[nextColIndex] = newNextWidth;
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

  const totalWidth = colWidths.reduce((sum, w) => (sum || 0) + (w || 0), 0) || 1;

  return (
    <div>
      <table className="border-collapse border border-modifier-border mb-0 w-full table-fixed">
        <colgroup>
          {columns.map((col, i) => (
            <col
              key={String(col.key)}
              style={{ width: ((colWidths[i] || 0) / totalWidth) * 100 + '%' }}
            />
          ))}
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead>
          {headerTop}
          <tr className="bg-secondary">
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                className="border border-modifier-border px-4 py-2 text-left relative group select-none"
                style={{ width: ((colWidths[i] || 0) / totalWidth) * 100 + '%' }}
              >
                <div className="flex items-center justify-between">
                  <span>{col.header}</span>

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
            const isSelected = selectedRowIndexes?.includes(index) ?? false;
            return (
              <tr key={index} className={`${isSelected ? 'bg-accent text-on-accent' : 'hover:bg-modifier-hover'}`} onClick={() => onRowClick?.(row, index)}>
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
                          ...(onSelectRow ? [{
                            label: isSelected ? '選択を解除' : '選択状態にする',
                            icon: '✓',
                            onClick: () => onSelectRow(index, !isSelected),
                            variant: 'default' as const
                          }] : []),
                          ...(onMoveRowTo && selectedRowIndexes && selectedRowIndexes.length > 0 && !selectedRowIndexes.includes(index) ? [{
                            label: `選択した${selectedRowIndexes.length}行をここに移動`,
                            icon: '→',
                            onClick: () => {
                              if (selectedRowIndexes && selectedRowIndexes.length > 0) {

                                onMoveRowTo(selectedRowIndexes[0], index);
                                onClearSelection?.();
                              }
                            },
                            variant: 'default' as const
                          }] : []),
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
                            variant: 'default' as const
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
    </div>
  );
};

export default EditableTable;
