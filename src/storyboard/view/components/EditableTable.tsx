import React, { useState, useRef } from 'react';
import { TABLE_ICONS } from 'src/icons';
import { t } from 'src/i18n';

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  renderCell: (
    value: T[keyof T],
    row: T,
    onCellChangeForRow: (columnKey: keyof T, newValue: T[keyof T]) => void,
    rowIndex: number
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
  /**
   * 行がクリックされた際に呼び出されるオプションのコールバック
   */
  onRowClick?: (row: T, rowIndex: number) => void;
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
  onRowClick,
}: EditableTableProps<T>) => {
  // 全カラム分の幅を管理（初期値は512px、最後の列はundefinedで自動）
  const [colWidths, setColWidths] = useState<(number | undefined)[]>(
    Array.from({ length: columns.length }, (_, i) => (i === columns.length - 1 ? undefined : 512))
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
      <table className="w-full border-collapse border border-gray-300 mb-32 table-fixed">
        <colgroup>
          {columns.map((col, i) => (
            <col key={String(col.key)} className={colWidths[i] ? `w-[${colWidths[i]}px] min-w-[80px]` : ''} style={colWidths[i] ? { width: colWidths[i] + 'px', minWidth: '80px' } : {}} />
          ))}
          <col style={{ width: '1%', minWidth: '40px' }} />
        </colgroup>
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                className={`border border-gray-300 px-4 py-2 text-left relative group select-none ${colWidths[i] ? `w-[${colWidths[i]}px] min-w-[80px]` : ''}`}
                style={colWidths[i] ? { width: colWidths[i] + 'px', minWidth: '80px' } : {}}
              >
                <div className="flex items-center justify-between">
                  <span>{col.header}</span>
                  {/* ドラッグハンドル（最後の列以外） */}
                  {i < columns.length - 1 && (
                    <div
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-10 bg-transparent hover:bg-blue-200 transition"
                      onMouseDown={e => handleMouseDown(i, e)}
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            return (
              <tr key={index} className="hover:bg-gray-50" onClick={() => onRowClick?.(row, index)}>
                {columns.map((col) => {
                  return (
                    <td
                      key={`${index}-${String(col.key)}`}
                      className={`border border-gray-300 px-4 py-2 align-top`}
                    >
                      {col.renderCell
                        ? col.renderCell(
                            row[col.key],
                            row,
                            (columnKey: keyof T, newValue: T[keyof T]) => onCellChange(index, columnKey, newValue),
                            index
                          )
                        : String(row[col.key] ?? '')}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-1 py-2 text-center align-middle whitespace-nowrap">
                  <div className="flex flex-col items-start gap-y-1">
                    {onMoveRowUp && index > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveRowUp(index); }}
                        className="text-gray-400 hover:text-blue-500 text-base px-1 py-0.5"
                        title={t('MOVE_ROW_UP')}
                        style={{ lineHeight: 1 }}
                        dangerouslySetInnerHTML={{ __html: TABLE_ICONS.moveUp }}
                      />
                    )}
                    {onMoveRowDown && index < data.length - 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveRowDown(index); }}
                        className="text-gray-400 hover:text-blue-500 text-base px-1 py-0.5"
                        title={t('MOVE_ROW_DOWN')}
                        style={{ lineHeight: 1 }}
                        dangerouslySetInnerHTML={{ __html: TABLE_ICONS.moveDown }}
                      />
                    )}
                    {onInsertRowBelow && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onInsertRowBelow(index); }}
                        className="text-gray-400 hover:text-blue-500 text-base px-1 py-0.5"
                        title={t('INSERT_ROW_BELOW')}
                        style={{ lineHeight: 1 }}
                        dangerouslySetInnerHTML={{ __html: TABLE_ICONS.add }}
                      />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteRow(index); }}
                      className="text-gray-400 hover:text-red-500 text-base px-1 py-0.5"
                      title={t('DELETE_ROW')}
                      style={{ lineHeight: 1 }}
                      dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-100 hover:bg-gray-200"> 
            <td
              colSpan={columns.length + 1 } 
              className="border border-gray-300 px-4 py-2 text-center cursor-pointer text-gray-500 hover:text-gray-700" 
              onClick={() => onAddRow()}
              title={t('ADD_ROW')}
            >
              +
            </td>
          </tr>
        </tbody>
      </table>
  );
};

export default EditableTable;
