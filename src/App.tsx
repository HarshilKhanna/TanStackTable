import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './App.css';

// Generate random data for 15 contracts
const categories = ['Security', 'Finance', 'HR', 'Procurement', 'IT', 'Legal', 'Operations'];
const domains = ['Information Security', 'Accounting', 'Training', 'Vendor Management', 'Cloud', 'Compliance', 'Logistics'];
const subdomains = ['Risk Assessment', 'Reporting', 'Mandatory Training', 'Supplier Review', 'AWS', 'Policy', 'Inventory'];
const owners = ['John Smith', 'Emily Chen', 'Lisa Anderson', 'Jennifer Taylor', 'Michael Brown', 'Sarah Lee', 'David Wilson'];
const obligationTitles = [
  'Monthly Security Assessment Report',
  'Quarterly Audit',
  'Annual Compliance Review',
  'Incident Response Plan',
  'Vendor Risk Evaluation',
  'Employee Training',
  'Policy Update',
  'Inventory Check',
  'Financial Statement Review',
  'Access Control Review',
];
const criticalities = ['High', 'Medium', 'Low'];
const complianceStatuses = ['Compliant', 'Non-Compliant'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateData() {
  const existingData = sessionStorage.getItem('tableData');
  if (existingData) {
    return JSON.parse(existingData);
  }

  // Generate new data only if it doesn't exist in session storage
  const newData = (() => {
    let globalTaskCounter = 1;
    return Array.from({ length: 15 }, (_, i) => {
      const numTasks = getRandomInt(2, 7);
      const contractid = `CNT-2024-${(i + 1).toString().padStart(3, '0')}`;
      const category = categories[getRandomInt(0, categories.length - 1)];
      const domain = domains[getRandomInt(0, domains.length - 1)];
      const subdomain = subdomains[getRandomInt(0, subdomains.length - 1)];
      const owner = owners[getRandomInt(0, owners.length - 1)];
      
      const tasks = Array.from({ length: numTasks }, () => {
        const taskId = `T${globalTaskCounter.toString().padStart(3, '0')}`;
        globalTaskCounter++;
        
        const title = obligationTitles[getRandomInt(0, obligationTitles.length - 1)];
        const criticality = criticalities[getRandomInt(0, criticalities.length - 1)];
        const triggeredTasks = getRandomInt(1, 7);
        const openTasks = getRandomInt(0, triggeredTasks);
        const compliance = complianceStatuses[getRandomInt(0, complianceStatuses.length - 1)];
        const obligations = [{
          obligationTitle: title,
          criticality,
          triggeredTasks,
          openTasks,
          compliance,
        }];
        return {
          task: taskId,
          obligations,
        };
      });
      return {
        contractid,
        category,
        domain,
        subdomain,
        owner,
        numberOfTasks: numTasks,
        tasks,
      };
    });
  })();

  // Store the newly generated data in session storage
  sessionStorage.setItem('tableData', JSON.stringify(newData));
  return newData;
}

// Custom filter function for Contract ID
const contractIdFilter = (row: Row<any>, columnId: string, filterValue: string) => {
  if (!filterValue) return true;
  const value = String(row.getValue(columnId) || '').toLowerCase();
  const filter = filterValue.toLowerCase();

  // Exact match
  if (value === filter) return true;

  // Partial number match (e.g., "001" matches "CNT-2024-001")
  const numericFilter = filter.replace(/\D/g, '');
  if (numericFilter) {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.includes(numericFilter)) return true;
  }

  // Partial text match
  return value.includes(filter);
};

// Custom filter function for exact number match
const exactNumberFilter = (row: Row<any>, columnId: string, filterValue: string) => {
  if (filterValue === '' || filterValue == null) return true;
  const value = row.getValue(columnId);
  return String(value) === String(filterValue);
};

const initialColumns: ColumnDef<any, any>[] = [
  {
    header: 'Contract ID',
    accessorKey: 'contractid',
    cell: ({ row, getValue }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {row.getCanExpand() && (
          <button onClick={row.getToggleExpandedHandler()} className="arrow" aria-label="Expand/Collapse">
            <svg viewBox="0 0 16 16" width="14" height="14" style={{ transform: row.getIsExpanded() ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6,4 10,8 6,12" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getValue()}</span>
      </div>
    ),
    size: 140,
    minSize: 100,
    maxSize: 220,
    filterFn: contractIdFilter,
  },
  { header: 'Category', accessorKey: 'category', cell: info => info.getValue(), size: 110, minSize: 80, maxSize: 180 },
  { header: 'Domain', accessorKey: 'domain', cell: info => info.getValue(), size: 140, minSize: 100, maxSize: 200 },
  { header: 'Subdomain', accessorKey: 'subdomain', cell: info => info.getValue(), size: 140, minSize: 100, maxSize: 200 },
  {
    header: 'Owner',
    accessorKey: 'owner',
    cell: ({ getValue }) => {
      const owner = getValue();
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(owner)}&background=random&size=32`;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={avatarUrl} alt={owner} style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 4 }} />
          <span>{owner}</span>
        </span>
      );
    },
    size: 120,
    minSize: 80,
    maxSize: 180
  },
  {
    header: 'Number of Tasks',
    accessorKey: 'numberOfTasks',
    cell: info => info.getValue(),
    size: 120,
    minSize: 100,
    maxSize: 160,
    filterFn: exactNumberFilter,
    enableColumnFilter: true,
  },
];

const taskColumns: ColumnDef<any, any>[] = [
  {
    header: 'Task',
    accessorKey: 'task',
    cell: ({ row, getValue }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '20px' }}>
        {row.getCanExpand() && (
          <button onClick={row.getToggleExpandedHandler()} className="arrow" aria-label="Expand/Collapse">
            <svg viewBox="0 0 16 16" width="14" height="14" style={{ transform: row.getIsExpanded() ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6,4 10,8 6,12" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getValue()}</span>
      </div>
    ),
    size: 120,
    minSize: 80,
    maxSize: 200,
  },
];

const obligationColumns: ColumnDef<any, any>[] = [
  { header: 'Obligation Title', accessorKey: 'obligationTitle', cell: info => info.getValue() },
  { header: 'Criticality', accessorKey: 'criticality', cell: info => info.getValue() },
  { header: 'Triggered Tasks', accessorKey: 'triggeredTasks', cell: info => info.getValue() },
  { header: 'Open Tasks', accessorKey: 'openTasks', cell: info => info.getValue() },
  { header: 'Compliance', accessorKey: 'compliance', cell: info => info.getValue() },
];

function getColOrderFromDefs(defs: ColumnDef<any, any>[]) {
  return defs.map((col, i) => {
    if ('accessorKey' in col && typeof col.accessorKey === 'string') {
      return col.accessorKey;
    }
    return `col-${i}`;
  });
}

function ObligationTable({ obligations }: { obligations: any[] }) {
  return (
    <div style={{ marginLeft: 40 }}>
      {obligations.map((ob, idx) => (
        <div className="obligation-card" key={idx}>
          <div className="obligation-title">{ob.obligationTitle}</div>
          <div className="obligation-row">
            <span className="obligation-label">Criticality</span>
            <span className="obligation-criticality-high">{ob.criticality}</span>
            <span className="obligation-label" style={{ marginLeft: 32 }}>Triggered Tasks</span>
            <span>{ob.triggeredTasks}</span>
            <span className="obligation-label" style={{ marginLeft: 32 }}>Open Tasks</span>
            <span>{ob.openTasks}</span>
            <span className="obligation-label" style={{ marginLeft: 32 }}>Compliance</span>
            <span className="obligation-compliance">{ob.compliance}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskTable({ tasks }: { tasks: any[] }) {
  const table = useReactTable({
    data: tasks,
    columns: taskColumns,
    getCoreRowModel: getCoreRowModel(),
    getSubRows: (row: any) => row.obligations,
    getRowId: (row: any) => row.task,
  });

  return (
    <div style={{ marginLeft: 40 }}>
      <table className="tanstack-table">
        <thead>
          <tr>
            {taskColumns.map(column => (
              <th 
                key={typeof column.header === 'string' ? column.header : column.id}
                style={{ 
                  background: '#f5f7fa',
                  padding: '4px 10px',
                  fontSize: '13px',
                  textAlign: 'left'
                }}
              >
                {typeof column.header === 'string' ? column.header : ''}
              </th>
                ))}
              </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <React.Fragment key={row.id}>
              <tr>
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    style={{ 
                      padding: '8px 10px',
                      fontSize: '13px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      lineHeight: 1.4
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {row.getIsExpanded() && (
                <tr>
                  <td colSpan={taskColumns.length} style={{ padding: 0, border: 'none', background: 'none' }}>
                    <ObligationTable obligations={row.original.obligations} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper to flatten data for flat and transposed views
function flattenData(data: any[]) {
  const flat: any[] = [];
  data.forEach(contract => {
    contract.tasks.forEach((task: any) => {
      task.obligations.forEach((ob: any) => {
        flat.push({
          contractid: contract.contractid,
          taskid: task.task,
          obligationTitle: ob.obligationTitle,
          category: contract.category,
          domain: contract.domain,
          subdomain: contract.subdomain,
          criticality: ob.criticality,
          owner: contract.owner,
          triggeredTasks: ob.triggeredTasks,
          openTasks: ob.openTasks,
          compliance: ob.compliance,
          remarks: '',
        });
      });
    });
  });
  return flat;
}

const getCellValue = (rowIndex: number, columnId: string, originalValue: any) => {
  if (columnId === 'remarks') {
    const remarks = JSON.parse(sessionStorage.getItem('tableRemarks') || '{}');
    return remarks[rowIndex] ?? originalValue;
  }
  const edits = JSON.parse(sessionStorage.getItem('tableEdits') || '{}');
  return edits[rowIndex]?.[columnId] ?? originalValue;
};

const flatColumns: ColumnDef<any, any>[] = [
  { 
    header: 'Contract ID', 
    accessorKey: 'contractid', 
    enableColumnFilter: true, 
    size: 93, 
    minSize: 83, 
    maxSize: 123,
    filterFn: contractIdFilter,
    cell: ({ row, getValue }) => getCellValue(row.index, 'contractid', getValue())
  },
  { 
    header: 'Task ID', 
    accessorKey: 'taskid', 
    enableColumnFilter: true, 
    size: 73, 
    minSize: 63, 
    maxSize: 103,
    cell: ({ row, getValue }) => getCellValue(row.index, 'taskid', getValue())
  },
  { 
    header: 'Obligation Title', 
    accessorKey: 'obligationTitle', 
    enableColumnFilter: true, 
    size: 123, 
    minSize: 103, 
    maxSize: 163,
    cell: ({ row, getValue }) => getCellValue(row.index, 'obligationTitle', getValue())
  },
  { 
    header: 'Category', 
    accessorKey: 'category', 
    enableColumnFilter: true, 
    size: 83, 
    minSize: 73, 
    maxSize: 113,
    cell: ({ row, getValue }) => getCellValue(row.index, 'category', getValue())
  },
  { 
    header: 'Domain', 
    accessorKey: 'domain', 
    enableColumnFilter: true, 
    size: 93, 
    minSize: 83, 
    maxSize: 123,
    cell: ({ row, getValue }) => getCellValue(row.index, 'domain', getValue())
  },
  { 
    header: 'Subdomain', 
    accessorKey: 'subdomain', 
    enableColumnFilter: true, 
    size: 93, 
    minSize: 83, 
    maxSize: 123,
    cell: ({ row, getValue }) => getCellValue(row.index, 'subdomain', getValue())
  },
  { 
    header: 'Criticality', 
    accessorKey: 'criticality', 
    enableColumnFilter: true, 
    size: 83, 
    minSize: 73, 
    maxSize: 113,
    cell: ({ row, getValue }) => getCellValue(row.index, 'criticality', getValue())
  },
  {
    header: 'Owner',
    accessorKey: 'owner',
    enableColumnFilter: true,
    size: 93,
    minSize: 83,
    maxSize: 123,
    cell: ({ row, getValue }) => {
      const owner = getCellValue(row.index, 'owner', getValue());
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(owner)}&background=random&size=32`;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={avatarUrl} alt={owner} style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 4 }} />
          <span>{owner}</span>
        </span>
      );
    },
  },
  {
    header: 'Triggered Tasks',
    accessorKey: 'triggeredTasks',
    enableColumnFilter: true,
    size: 133,
    minSize: 113,
    maxSize: 153,
    filterFn: exactNumberFilter,
    cell: ({ row, getValue }) => getCellValue(row.index, 'triggeredTasks', getValue())
  },
  {
    header: 'Open Tasks',
    accessorKey: 'openTasks',
    enableColumnFilter: true,
    size: 93,
    minSize: 73,
    maxSize: 113,
    filterFn: exactNumberFilter,
    cell: ({ row, getValue }) => getCellValue(row.index, 'openTasks', getValue())
  },
  { 
    header: 'Compliance', 
    accessorKey: 'compliance', 
    enableColumnFilter: true, 
    size: 93, 
    minSize: 73, 
    maxSize: 113,
    cell: ({ row, getValue }) => getCellValue(row.index, 'compliance', getValue())
  },
];

function DraggableHeader({ header, openFilterForColumnId, setOpenFilterForColumnId }: { header: any, openFilterForColumnId: string | null, setOpenFilterForColumnId: (id: string | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'default',
    background: '#f5f7fa',
    padding: '4px 10px',
    userSelect: 'none',
    width: header.getSize(),
    position: 'relative',
  } as React.CSSProperties;
  const isSorted = header.column.getIsSorted();
  let sortIndicator = '';
  if (isSorted === 'asc') sortIndicator = ' ▲';
  else if (isSorted === 'desc') sortIndicator = ' ▼';

  // Popup filter logic
  const filterPopupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openFilterForColumnId) return;
    function handleClickOutside(event: MouseEvent) {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setOpenFilterForColumnId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterForColumnId, setOpenFilterForColumnId]);

  return (
    <th ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* Drag handle */}
          <span
            {...listeners}
            style={{
              cursor: 'grab',
              marginRight: 6,
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '13px',
            }}
            title="Drag to reorder"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
          >
            ≡
          </span>
          {/* Sortable header label */}
          <span
            style={{ flex: 1, cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '13px' }}
            onClick={header.column.getToggleSortingHandler?.()}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            <span style={{ marginLeft: 4, fontSize: '13px' }}>{sortIndicator}</span>
          </span>
          {/* Filter icon */}
          {header.column.getCanFilter?.() && (
            <span
              style={{ cursor: 'pointer', marginLeft: 2, fontSize: '13px', color: openFilterForColumnId === header.column.id ? '#2563eb' : '#888' }}
              title="Filter"
              onClick={e => {
                e.stopPropagation();
                setOpenFilterForColumnId(openFilterForColumnId === header.column.id ? null : header.column.id);
              }}
            >
              {/* Funnel SVG icon */}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5H17L11.5 12.5V17L8.5 15.5V12.5L3 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
          {header.column.getCanResize() && (
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`}
            />
          )}
        </div>
        {/* Filter popup */}
        {header.column.getCanFilter?.() && openFilterForColumnId === header.column.id && (
          <div
            ref={filterPopupRef}
            style={{
              position: 'absolute',
              top: 36,
              left: 0,
              zIndex: 10,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              padding: 8,
              minWidth: header.getSize(),
              width: header.getSize(),
            }}
            onClick={e => e.stopPropagation()}
          >
            {header.column.id === 'criticality' ? (
              <select
                value={(header.column.getFilterValue() ?? '') as string}
                onChange={e => header.column.setFilterValue(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
                autoFocus
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            ) : header.column.id === 'compliance' ? (
              <select
                value={(header.column.getFilterValue() ?? '') as string}
                onChange={e => header.column.setFilterValue(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
                autoFocus
              >
                <option value="">All</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            ) : (
              <input
                type={header.column.id === 'numberOfTasks' ? 'number' : 'text'}
                value={(header.column.getFilterValue() ?? '') as string}
                onChange={e => header.column.setFilterValue(e.target.value)}
                placeholder={`Filter...`}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
                autoFocus
              />
            )}
          </div>
        )}
      </div>
    </th>
  );
}

function FlatTable({ data, onRemarksChange, columnVisibility }: { 
  data: any[]; 
  onRemarksChange: (rowIdx: number, value: string) => void;
  columnVisibility: { [key: string]: boolean };
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(getColOrderFromDefs(flatColumns));
  const [columnSizing, setColumnSizing] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [openFilterForColumnId, setOpenFilterForColumnId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number, columnId: string } | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Custom filter function that considers edited values
  const filterFn = (row: Row<any>, columnId: string, filterValue: string) => {
    if (!filterValue) return true;
    
    // Get both original and edited values
    const originalValue = String(row.getValue(columnId) || '').toLowerCase();
    const editedValue = String(getCellValue(row.index, columnId, row.getValue(columnId)) || '').toLowerCase();
    const searchValue = filterValue.toLowerCase();

    // Match against both original and edited values
    return originalValue.includes(searchValue) || editedValue.includes(searchValue);
  };

  // Initialize session storage for edited data and remarks
  useEffect(() => {
    if (!sessionStorage.getItem('tableEdits')) {
      sessionStorage.setItem('tableEdits', JSON.stringify({}));
    }
    if (!sessionStorage.getItem('tableRemarks')) {
      sessionStorage.setItem('tableRemarks', JSON.stringify({}));
    }
  }, []);

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    // Store edit in session storage
    const edits = JSON.parse(sessionStorage.getItem('tableEdits') || '{}');
    if (!edits[rowIndex]) {
      edits[rowIndex] = {};
    }
    edits[rowIndex][columnId] = value;
    sessionStorage.setItem('tableEdits', JSON.stringify(edits));
    
    setEditingCell(null);
  };

  const handleRemarksChange = (rowIndex: number, value: string) => {
    const remarks = JSON.parse(sessionStorage.getItem('tableRemarks') || '{}');
    remarks[rowIndex] = value;
    sessionStorage.setItem('tableRemarks', JSON.stringify(remarks));
    onRemarksChange(rowIndex, value);
  };

  const editColumn: ColumnDef<any, any> = {
    id: 'edit',
    header: '',
    cell: ({ row }) => (
      <button
        onClick={() => {
          if (editingRowIndex === row.index) {
            setEditingRowIndex(null);
            setEditingCell(null);
          } else {
            setEditingRowIndex(row.index);
            alert('Click on any cell in this row to edit its content');
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          color: editingRowIndex === row.index ? '#2563eb' : '#666',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    ),
    size: 50,
  };

  const RemarksCell = React.memo(({ row, getValue }: { row: Row<any>; getValue: () => any }) => {
    const [localValue, setLocalValue] = useState(getCellValue(row.index, 'remarks', getValue() ?? ''));

    useEffect(() => {
      setLocalValue(getCellValue(row.index, 'remarks', getValue() ?? ''));
    }, [row.index, getValue]);

    return (
      <div style={{ marginLeft: '-4px' }}>
        <textarea
          value={localValue}
          onChange={e => {
            setLocalValue(e.target.value);
          }}
          onBlur={() => {
            handleRemarksChange(row.index, localValue);
          }}
          style={{
            width: '100%',
            height: '40px',
            padding: '4px 4px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            resize: 'none',
            lineHeight: '1.2',
            overflow: 'auto'
          }}
          placeholder="Add remarks..."
          onClick={e => e.stopPropagation()}
        />
      </div>
    );
  });

  const remarksColumn: ColumnDef<any, any> = {
    header: 'Remarks',
    accessorKey: 'remarks',
    enableColumnFilter: false,
    size: 100,
    minSize: 90,
    maxSize: 130,
    cell: RemarksCell,
  };

  // Apply custom filter function to all columns except specific ones
  const columnsWithCustomFilter = flatColumns.map(column => {
    // Type guard to check if column has accessorKey
    const hasAccessorKey = (col: ColumnDef<any, any>): col is ColumnDef<any, any> & { accessorKey: string } => {
      return 'accessorKey' in col;
    };

    if (column.id === 'edit' || 
        (hasAccessorKey(column) && (column.accessorKey === 'remarks' || column.accessorKey === 'numberOfTasks'))) {
      return column;
    }
    return {
      ...column,
      filterFn: filterFn
    };
  });

  const allColumns = [
    ...columnsWithCustomFilter.filter(col => {
      if (!('accessorKey' in col)) return false;
      return col.accessorKey !== 'remarks';
    }),
    remarksColumn,
    editColumn
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { 
      sorting, 
      columnFilters, 
      columnOrder, 
      columnSizing,
      columnVisibility, // Add this line
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    meta: { onRemarksChange },
  });

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', fontSize: '13px', overflowX: 'auto' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event) => {
          setIsDragging(false);
          const { active, over } = event;
          if (active.id !== over?.id) {
            setColumnOrder((prev) => {
              const oldIndex = prev.indexOf(active.id as string);
              const newIndex = prev.indexOf(over?.id as string);
              const newOrder = [...prev];
              const [moved] = newOrder.splice(oldIndex, 1);
              newOrder.splice(newIndex, 0, moved);
              return newOrder;
            });
          }
        }}
      >
        <table className="tanstack-table" style={{ fontSize: '13px', width: '100%' }}>
        <thead>
          <SortableContext
            items={table.getAllLeafColumns().map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <DraggableHeader
                    key={header.id}
                    header={header}
                    openFilterForColumnId={openFilterForColumnId}
                    setOpenFilterForColumnId={setOpenFilterForColumnId}
                  />
                ))}
              </tr>
            ))}
          </SortableContext>
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                style={{
                  background: editingRowIndex === row.index ? '#f0f9ff' : undefined,
                }}
              >
                {row.getVisibleCells().map(cell => {
                  const isEditing = editingCell?.rowIndex === row.index && editingCell?.columnId === cell.column.id;
                  const isEditable = cell.column.id !== 'edit' && cell.column.id !== 'remarks' && editingRowIndex === row.index;
                  const cellValue = getCellValue(row.index, cell.column.id, cell.getValue());
                  
                  return (
                <td
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                        fontSize: '13px',
                        padding: '8px 10px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: 1.4,
                        cursor: isEditable ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (isEditable) {
                          setEditingCell({ rowIndex: row.index, columnId: cell.column.id });
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          defaultValue={cellValue as string}
                          style={{
                            width: '100%',
                            padding: '4px',
                            border: '1px solid #2563eb',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(row.index, cell.column.id, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          onBlur={(e) => {
                            handleCellEdit(row.index, cell.column.id, e.target.value);
                          }}
                        />
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                </td>
                  );
                })}
            </tr>
          ))}
        </tbody>
      </table>
      </DndContext>
    </div>
  );
}

function TransposedRow({ 
  rowId, 
  col, 
  data, 
  filters, 
  setFilters, 
  rowSizing, 
  setRowSizing,
  openFilterForRowId, 
  setOpenFilterForRowId, 
  filterPopupRef, 
  thRefs,
  isDragging,
  sortBy,
  onSort
}: { 
  rowId: string;
  col: any;
  data: any[];
  filters: { [key: string]: string };
  setFilters: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  rowSizing: { [key: string]: number };
  setRowSizing: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  openFilterForRowId: string | null;
  setOpenFilterForRowId: React.Dispatch<React.SetStateAction<string | null>>;
  filterPopupRef: React.RefObject<HTMLDivElement>;
  thRefs: React.MutableRefObject<{ [key: string]: HTMLTableHeaderCellElement | null }>;
  isDragging: boolean;
  sortBy: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
}) {
  const key = (col as any).accessorKey;
  const [filterType, setFilterType] = useState<'single' | 'range'>('single');
  const [isResizing, setIsResizing] = useState(false);
  const startResizeY = useRef<number>(0);
  const startHeight = useRef<number>(0);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isRowDragging,
  } = useSortable({
    id: rowId,
  });

  // Handle row resize
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    startResizeY.current = e.clientY;
    startHeight.current = rowSizing[rowId] || 48;
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const diff = e.clientY - startResizeY.current;
    const newHeight = Math.max(48, startHeight.current + diff);
    const rowSizingUpdate = { ...rowSizing, [rowId]: newHeight };
    setRowSizing(rowSizingUpdate);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  // Handle click outside for filter popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setOpenFilterForRowId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const style: React.CSSProperties = {
    transform: transform ? `translate(0, ${transform.y}px)` : undefined,
    transition,
    height: rowSizing[rowId] || 48,
    position: 'relative',
    zIndex: isRowDragging ? 1 : 0,
    opacity: isRowDragging ? 0.8 : 1,
  };

  return (
    <tr style={style}>
      <th
        ref={setNodeRef}
        style={{
          position: 'relative',
          background: '#f5f7fa',
          padding: 0,
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px',
          borderRight: '1px solid #e5e7eb',
          cursor: 'default',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          padding: '8px',
          gap: '8px'
        }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="16"
              height="16"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              flex: 1,
              cursor: 'pointer' 
            }}
            onClick={() => onSort(key)}
          >
            <span>{col.header}</span>
            {sortBy && sortBy.field === key && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
                style={{
                  transform: sortBy.direction === 'desc' ? 'rotate(180deg)' : 'none'
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </div>

          {col.enableColumnFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenFilterForRowId(openFilterForRowId === rowId ? null : rowId);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: filters[key] ? 1 : 0.5,
                marginRight: '8px'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Row resize handle */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            cursor: 'row-resize',
            backgroundColor: isResizing ? '#2563eb' : 'transparent',
            transition: 'background-color 0.2s'
          }}
          onMouseDown={handleResizeStart}
        />

        {openFilterForRowId === rowId && (
          <div
            ref={filterPopupRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: -8,
              zIndex: 10,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              padding: 8,
              minWidth: '200px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 8 }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'single' | 'range')}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  marginBottom: '4px'
                }}
              >
                <option value="single">Single Value</option>
                <option value="range">Range</option>
              </select>
            </div>

            {filterType === 'range' ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                width: '100%'
              }}>
                <input
                  type={key === 'numberOfTasks' ? 'number' : 'text'}
                  value={filters[key]?.split(',')[0] ?? ''}
                  onChange={e => {
                    const currentValue = filters[key]?.split(',')[1] ?? '';
                    setFilters(f => ({ ...f, [key]: `${e.target.value},${currentValue}` }))
                  }}
                  placeholder="From"
                  style={{
                    width: '45%',
                    fontSize: '13px',
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    outline: 'none',
                  }}
                  autoFocus
                />
                <span style={{ color: '#666', fontSize: '12px' }}>to</span>
                <input
                  type={key === 'numberOfTasks' ? 'number' : 'text'}
                  value={filters[key]?.split(',')[1] ?? ''}
                  onChange={e => {
                    const currentValue = filters[key]?.split(',')[0] ?? '';
                    setFilters(f => ({ ...f, [key]: `${currentValue},${e.target.value}` }))
                  }}
                  placeholder="To"
                  style={{
                    width: '45%',
                    fontSize: '13px',
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    outline: 'none',
                  }}
                />
              </div>
            ) : (
                    <input
              type={key === 'numberOfTasks' ? 'number' : 'text'}
              value={filters[key] ?? ''}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                placeholder={`Filter ${col.header}...`}
              style={{
                width: '100%',
                fontSize: '13px',
                  padding: '4px 6px',
                border: '1px solid #ddd',
                borderRadius: 4,
                outline: 'none',
              }}
              autoFocus
            />
            )}
          </div>
        )}
      </th>
      {data.map((item, index) => (
        <td
          key={index}
          style={{
            padding: '8px',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '13px',
            minWidth: '200px',
            width: '200px',
          }}
        >
          {key === 'owner' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item[key])}&background=random&size=32`} 
                alt={item[key]} 
                style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 4 }} 
              />
              <span>{item[key]}</span>
            </span>
          ) : (
            item[key]
          )}
        </td>
      ))}
    </tr>
  );
}

interface TransposedTableProps {
  data: any[];
  rowVisibility: { [key: string]: boolean };
  rowOrder: string[];
  setRowOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setRowVisibility: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

function TransposedTable({ 
  data, 
  rowVisibility,
  rowOrder: externalRowOrder,
  setRowOrder: setExternalRowOrder,
  setRowVisibility
}: TransposedTableProps) {
  const columns = flatColumns.filter(col => (col as any).accessorKey !== 'remarks');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [rowSizing, setRowSizing] = useState<{ [key: string]: number }>({});
  const [openFilterForRowId, setOpenFilterForRowId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const thRefs = useRef<{ [key: string]: HTMLTableHeaderCellElement | null }>({});
  const sensors = useSensors(useSensor(PointerSensor));

  // Add sorting state
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  // Add click handler for sorting
  const handleSort = (field: string) => {
    setSortBy((prev: { field: string; direction: 'asc' | 'desc' } | null) => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  // Sort and filter the data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortBy.field === 'taskid') {
        aValue = parseInt(a.taskid?.replace(/\D/g, '') || '0');
        bValue = parseInt(b.taskid?.replace(/\D/g, '') || '0');
      } else if (sortBy.field === 'triggeredTasks' || sortBy.field === 'openTasks') {
        aValue = a[sortBy.field] ?? 0;
        bValue = b[sortBy.field] ?? 0;
      } else if (sortBy.field === 'contractid') {
        aValue = parseInt(a.contractid?.replace(/\D/g, '') || '0');
        bValue = parseInt(b.contractid?.replace(/\D/g, '') || '0');
      } else {
        aValue = a[sortBy.field];
        bValue = b[sortBy.field];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortBy.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
      }
      
      return sortBy.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
    }

    // Apply filters
    return result.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] ?? '').toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [data, sortBy, filters]);

  // Filter visible columns based on rowVisibility
  const visibleColumns = useMemo(() => {
    return externalRowOrder.filter(rowId => rowVisibility[rowId] !== false);
  }, [externalRowOrder, rowVisibility]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event) => {
        setIsDragging(false);
        const { active, over } = event;
        if (active.id !== over?.id) {
          setExternalRowOrder((prev) => {
            const oldIndex = prev.indexOf(active.id as string);
            const newIndex = prev.indexOf(over?.id as string);
            const newOrder = [...prev];
            const [moved] = newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, moved);
            return newOrder;
          });
        }
      }}
    >
      <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        <table className="tanstack-table">
          <tbody>
            <SortableContext items={visibleColumns} strategy={horizontalListSortingStrategy}>
              {visibleColumns.map((rowId: string) => {
                const col = columns.find(
                  (c: ColumnDef<any, any>) => c.id === rowId || (c as any).accessorKey === rowId
                );
                if (!col) return null;

                return (
                  <TransposedRow
                    key={rowId}
                    rowId={rowId}
                    col={col}
                    data={processedData}
                    filters={filters}
                    setFilters={setFilters}
                    rowSizing={rowSizing}
                    setRowSizing={setRowSizing}
                    openFilterForRowId={openFilterForRowId}
                    setOpenFilterForRowId={setOpenFilterForRowId}
                    filterPopupRef={filterPopupRef}
                    thRefs={thRefs}
                    isDragging={isDragging}
                    sortBy={sortBy?.field === (col as any).accessorKey ? sortBy : null}
                    onSort={handleSort}
                  />
                );
              })}
            </SortableContext>
        </tbody>
      </table>
    </div>
    </DndContext>
  );
}

interface SortCriterion {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
}

function SortingSection({ onSort }: { onSort: (sortCriteria: SortCriterion[]) => void }) {
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const sortableFields = [
    { value: 'contractid', label: 'Contract ID', isNumeric: true },
    { value: 'taskid', label: 'Task ID', isNumeric: true },
    { value: 'category', label: 'Category', isNumeric: false },
    { value: 'domain', label: 'Domain', isNumeric: false },
    { value: 'subdomain', label: 'Subdomain', isNumeric: false },
    { value: 'owner', label: 'Owner', isNumeric: false },
    { value: 'numberOfTasks', label: 'Number of Tasks', isNumeric: true },
    { value: 'triggeredTasks', label: 'Triggered Tasks', isNumeric: true },
    { value: 'openTasks', label: 'Open Tasks', isNumeric: true },
  ];

  const handleAddSort = () => {
    const newId = `sort-${Date.now()}`;
    setSortCriteria([
      ...sortCriteria,
      { id: newId, field: sortableFields[0].value, direction: 'asc' },
    ]);
  };

  const handleRemoveSort = (id: string) => {
    setSortCriteria(sortCriteria.filter((criterion) => criterion.id !== id));
  };

  const handleFieldChange = (id: string, field: string) => {
    setSortCriteria(
      sortCriteria.map((criterion) =>
        criterion.id === id ? { ...criterion, field } : criterion
      )
    );
  };

  const handleDirectionChange = (id: string, direction: 'asc' | 'desc') => {
    setSortCriteria(
      sortCriteria.map((criterion) =>
        criterion.id === id ? { ...criterion, direction } : criterion
      )
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSortCriteria((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleClearAll = () => {
    setSortCriteria([]);
    // Clear sorting without resetting to original data
    onSort([]);
  };

  const handleApplySort = () => {
    onSort(sortCriteria);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <div className="sidebar-section">
      
      <h3 className="sidebar-section-title">Sort Tasks</h3>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortCriteria.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortCriteria.map((criterion) => (
            <SortItem
              key={criterion.id}
              id={criterion.id}
              field={criterion.field}
              direction={criterion.direction}
              onFieldChange={handleFieldChange}
              onDirectionChange={handleDirectionChange}
              onRemove={handleRemoveSort}
              fields={sortableFields}
              isDragging={isDragging}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button className="add-sort" onClick={handleAddSort}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Sort
      </button>

      <div className="sort-actions">
        <button className="clear-sort" onClick={handleClearAll}>
          Clear All
        </button>
        <button className="apply-sort" onClick={handleApplySort}>
          Apply Sort
        </button>
      </div>
    </div>
  );
}

interface SortItemProps {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
  onFieldChange: (id: string, field: string) => void;
  onDirectionChange: (id: string, direction: 'asc' | 'desc') => void;
  onRemove: (id: string) => void;
  fields: { value: string; label: string; isNumeric: boolean }[];
  isDragging: boolean;
}

function SortItem({
  id,
  field,
  direction,
  onFieldChange,
  onDirectionChange,
  onRemove,
  fields,
  isDragging,
}: SortItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const selectedField = fields.find(f => f.value === field);
  const isNumeric = selectedField?.isNumeric ?? false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sort-item ${isItemDragging ? 'dragging' : ''}`}
      {...attributes}
    >
      <div className="drag-handle" {...listeners}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
      
      <div className="sort-selects">
        <select
          className="sort-select"
          value={field}
          onChange={(e) => onFieldChange(id, e.target.value)}
        >
          {fields.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          className="sort-select"
          value={direction}
          onChange={(e) => onDirectionChange(id, e.target.value as 'asc' | 'desc')}
        >
          {isNumeric ? (
            <>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </>
          ) : (
            <>
              <option value="asc">A to Z</option>
              <option value="desc">Z to A</option>
            </>
          )}
        </select>
      </div>

      <button className="remove-sort" onClick={() => onRemove(id)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface FilterCriterion {
  id: string;
  field: string;
  operator: string;
  value: string;
  upperValue?: string; // For range operator
}

const numericOperators = [
  { value: 'equals', label: 'equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'range', label: 'range' }
];

const textOperators = [
  { value: 'is', label: 'is' },
  { value: 'isNot', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' }
];

interface FilterSectionProps {
  onFilter: (filterCriteria: FilterCriterion[]) => void;
  data: any[];
}

function FilterSection({ onFilter, data }: FilterSectionProps) {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriterion[]>([]);
  const [availableContractIds, setAvailableContractIds] = useState<string[]>([]);
  const [availableTaskIds, setAvailableTaskIds] = useState<string[]>([]);

  // Get unique contract and task IDs from all data
  useEffect(() => {
    // For grouped view, we need to extract from the nested structure
    const extractIds = (data: any[]) => {
      const contractIds = new Set<string>();
      const taskIds = new Set<string>();
      
      data.forEach(item => {
        if (item.contractid) {
          contractIds.add(String(item.contractid));
        }
        if (item.tasks) {
          item.tasks.forEach((task: any) => {
            if (task.task) {
              taskIds.add(String(task.task));
            }
          });
        }
        // For flat view data
        if (item.taskid || item.task) {
          taskIds.add(String(item.taskid || item.task));
        }
      });

      return {
        contractIds: Array.from(contractIds).sort(),
        taskIds: Array.from(taskIds).sort()
      };
    };

    const { contractIds, taskIds } = extractIds(data);
    setAvailableContractIds(contractIds);
    setAvailableTaskIds(taskIds);
  }, [data]);

  const filterableFields = [
    { value: 'contractid', label: 'Contract ID', isNumeric: true, isId: true },
    { value: 'taskid', label: 'Task ID', isNumeric: true, isId: true },
    { value: 'category', label: 'Category', isNumeric: false },
    { value: 'domain', label: 'Domain', isNumeric: false },
    { value: 'subdomain', label: 'Subdomain', isNumeric: false },
    { value: 'owner', label: 'Owner', isNumeric: false },
    { value: 'triggeredTasks', label: 'Triggered Tasks', isNumeric: true },
    { value: 'openTasks', label: 'Open Tasks', isNumeric: true },
    { value: 'criticality', label: 'Criticality', isNumeric: false },
    { value: 'compliance', label: 'Compliance', isNumeric: false }
  ];

  const handleAddFilter = () => {
    const newId = `filter-${Date.now()}`;
    setFilterCriteria([
      ...filterCriteria,
      {
        id: newId,
        field: filterableFields[0].value,
        operator: filterableFields[0].isNumeric ? 'equals' : 'is',
        value: ''
      }
    ]);
  };

  const handleRemoveFilter = (id: string) => {
    setFilterCriteria(filterCriteria.filter(criterion => criterion.id !== id));
  };

  const handleFieldChange = (id: string, field: string) => {
    setFilterCriteria(
      filterCriteria.map(criterion => {
        if (criterion.id === id) {
          const selectedField = filterableFields.find(f => f.value === field);
          // Reset the filter values when changing fields
          return {
            ...criterion,
            field,
            operator: selectedField?.isNumeric ? 'equals' : 'is',
            value: '',
            upperValue: undefined
          };
        }
        return criterion;
      })
    );
  };

  const handleOperatorChange = (id: string, operator: string) => {
    setFilterCriteria(
      filterCriteria.map(criterion =>
        criterion.id === id
          ? { ...criterion, operator, value: '', upperValue: undefined }
          : criterion
      )
    );
  };

  const handleValueChange = (id: string, value: string, isUpperValue = false) => {
    setFilterCriteria(
      filterCriteria.map(criterion => {
        if (criterion.id === id) {
          if (isUpperValue) {
            return { ...criterion, upperValue: value };
          }
          return { ...criterion, value };
        }
        return criterion;
      })
    );
  };

  const handleClearAll = () => {
    setFilterCriteria([]);
    onFilter([]);
  };

  const handleApplyFilters = () => {
    onFilter(filterCriteria);
  };

  const matchesFilter = (value: any, criterion: FilterCriterion) => {
    if (!value) return criterion.operator === 'isEmpty';
    if (criterion.operator === 'isNotEmpty') return true;

    const strValue = String(value).toLowerCase();
    const filterValue = criterion.value.toLowerCase();

    // Extract numeric parts for ID fields
    const extractNumber = (str: string): number => {
      const matches = str.match(/\d+/g);
      return matches ? parseInt(matches[matches.length - 1]) : NaN;
    };

    // Handle numeric fields including IDs
    if (['triggeredTasks', 'openTasks', 'contractid', 'taskid'].includes(criterion.field)) {
      let numValue: number;
      let filterNum: number;
      
      if (criterion.field === 'contractid' || criterion.field === 'taskid') {
        numValue = extractNumber(strValue);
        filterNum = extractNumber(filterValue);
      } else {
        numValue = parseInt(strValue);
        filterNum = parseInt(filterValue);
      }
      
      if (isNaN(filterNum)) return false;

      switch (criterion.operator) {
        case 'equals':
          return numValue === filterNum;
        case 'gt':
          return numValue > filterNum;
        case 'lt':
          return numValue < filterNum;
        case 'gte':
          return numValue >= filterNum;
        case 'lte':
          return numValue <= filterNum;
        case 'range':
          let upperNum: number;
          if (criterion.field === 'contractid' || criterion.field === 'taskid') {
            upperNum = extractNumber(criterion.upperValue || '');
          } else {
            upperNum = parseInt(criterion.upperValue || '');
          }
          return !isNaN(upperNum) && numValue >= filterNum && numValue <= upperNum;
        case 'contains':
          return strValue.includes(filterValue);
        default:
          return false;
      }
    }

    // Handle text fields
    switch (criterion.operator) {
      case 'is':
      case 'equals':
        return strValue === filterValue;
      case 'isNot':
        return strValue !== filterValue;
      case 'contains':
        return strValue.includes(filterValue);
      case 'isEmpty':
        return !value || String(value).trim() === '';
      case 'isNotEmpty':
        return value && String(value).trim() !== '';
      default:
        return true;
    }
  };

  const getOperatorsForField = (field: string) => {
    if (['contractid', 'taskid', 'triggeredTasks', 'openTasks'].includes(field)) {
      return numericOperators;
    }
    if (field === 'criticality' || field === 'compliance') {
      return [
        { value: 'is', label: 'is' },
        { value: 'isNot', label: 'is not' },
        { value: 'isEmpty', label: 'is empty' },
        { value: 'isNotEmpty', label: 'is not empty' }
      ];
    }
    return textOperators;
  };

  const renderValueInput = (criterion: FilterCriterion) => {
        const selectedField = filterableFields.find(f => f.value === criterion.field);
        const showValueInput = !['isEmpty', 'isNotEmpty'].includes(criterion.operator);
        const showRangeInput = criterion.operator === 'range';
    const isIdField = criterion.field === 'contractid' || criterion.field === 'taskid';
    const isNumericField = ['triggeredTasks', 'openTasks'].includes(criterion.field);

    if (!showValueInput) return null;

    if (showRangeInput) {
      return (
        <div className="filter-range-inputs" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          width: '100%',
          paddingLeft: '8px'
        }}>
                    {isIdField ? (
                      <>
                        <select
                          value={criterion.value}
                          onChange={(e) => handleValueChange(criterion.id, e.target.value)}
                          className="filter-value-input"
                style={{ width: '45%' }}
                        >
                <option value="">From</option>
                          {(criterion.field === 'contractid' ? availableContractIds : availableTaskIds).map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
              <span style={{ color: '#666', fontSize: '12px', padding: '0 2px' }}>to</span>
                        <select
                          value={criterion.upperValue || ''}
                          onChange={(e) => handleValueChange(criterion.id, e.target.value, true)}
                          className="filter-value-input"
                style={{ width: '45%' }}
                        >
                <option value="">To</option>
                          {(criterion.field === 'contractid' ? availableContractIds : availableTaskIds).map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <input
                type={isNumericField ? 'number' : 'text'}
                          value={criterion.value}
                          onChange={(e) => handleValueChange(criterion.id, e.target.value)}
                          placeholder="From"
                          className="filter-value-input"
                style={{ width: '45%' }}
                        />
              <span style={{ color: '#666', fontSize: '12px', padding: '0 2px' }}>to</span>
                        <input
                type={isNumericField ? 'number' : 'text'}
                          value={criterion.upperValue || ''}
                          onChange={(e) => handleValueChange(criterion.id, e.target.value, true)}
                          placeholder="To"
                          className="filter-value-input"
                style={{ width: '45%' }}
                        />
                      </>
                    )}
                  </div>
      );
    }

    if (isIdField) {
      return (
        <div style={{ paddingLeft: '8px' }}>
                    <select
                      value={criterion.value}
                      onChange={(e) => handleValueChange(criterion.id, e.target.value)}
                      className="filter-value-input"
            style={{ width: '100%' }}
                    >
                      <option value="">Select {selectedField?.label}</option>
                      {(criterion.field === 'contractid' ? availableContractIds : availableTaskIds).map((id) => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
        </div>
      );
    }

    if (criterion.field === 'compliance') {
      return (
        <div style={{ paddingLeft: '8px' }}>
                    <select
                      value={criterion.value}
                      onChange={(e) => handleValueChange(criterion.id, e.target.value)}
                      className="filter-value-input"
            style={{ width: '100%' }}
                    >
                      <option value="">Select Compliance Status</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Non-Compliant">Non-Compliant</option>
                    </select>
        </div>
      );
    }

    if (criterion.field === 'criticality') {
      return (
        <div style={{ paddingLeft: '8px' }}>
                    <select
                      value={criterion.value}
                      onChange={(e) => handleValueChange(criterion.id, e.target.value)}
                      className="filter-value-input"
            style={{ width: '100%' }}
                    >
                      <option value="">Select Criticality</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
        </div>
      );
    }

    return (
      <div style={{ paddingLeft: '8px' }}>
                    <input
          type={isNumericField ? 'number' : 'text'}
                      value={criterion.value}
                      onChange={(e) => handleValueChange(criterion.id, e.target.value)}
          placeholder={`Enter ${selectedField?.label}...`}
                      className="filter-value-input"
          style={{ width: '100%' }}
                    />
              </div>
    );
  };

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-section-title">Filter Tasks</h3>
      
      {filterCriteria.map((criterion) => {
        const selectedField = filterableFields.find(f => f.value === criterion.field);
        const operators = getOperatorsForField(criterion.field);

        return (
          <div key={criterion.id} className="filter-row">
            <div className="filter-header">
              <select
                className="filter-field-select"
                value={criterion.field}
                onChange={(e) => handleFieldChange(criterion.id, e.target.value)}
              >
                {filterableFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>

              <select
                className="filter-operator-select"
                value={criterion.operator}
                onChange={(e) => handleOperatorChange(criterion.id, e.target.value)}
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              <button
                className="filter-remove"
                onClick={() => handleRemoveFilter(criterion.id)}
                title="Remove filter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="16"
                  height="16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="filter-content">
              {renderValueInput(criterion)}
            </div>
          </div>
        );
      })}

      <button className="add-filter-button" onClick={handleAddFilter}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Filter
      </button>

      <div className="filter-actions">
        <button className="clear-filters" onClick={handleClearAll}>
          Clear All
        </button>
        <button className="apply-filters" onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function VisibilitySection({ 
  items, 
  visibility, 
  onVisibilityChange, 
  type = 'column'
}: { 
  items: { id: string; header: string }[];
  visibility: { [key: string]: boolean };
  onVisibilityChange: (id: string, isVisible: boolean) => void;
  type?: 'column' | 'row';
}) {
  return (
    <div className="sidebar-section">
      <h3 className="sidebar-section-title">{type === 'column' ? 'Column Visibility' : 'Row Visibility'}</h3>
      <div className="visibility-list">
        {items.map((item) => (
          <div key={item.id} className="visibility-item">
            <label className="visibility-label">
              <input
                type="checkbox"
                checked={visibility[item.id] !== false}
                onChange={(e) => onVisibilityChange(item.id, e.target.checked)}
              />
              <span>{item.header}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Task {
  task: string;
  taskid?: string;  // Add optional taskid field
  obligations?: Array<{
    triggeredTasks?: number;
    openTasks?: number;
    [key: string]: any;
  }>;
}

interface Contract {
  tasks: Task[];
  [key: string]: any;
}

export default function App() {
  const originalData = useRef(generateData());
  const [data, setData] = useState(() => originalData.current);
  const [flatData, setFlatData] = useState(() => flattenData(originalData.current));
  const [viewMode, setViewMode] = useState<'grouped' | 'flat' | 'transposed'>('grouped');
  const [columnOrder, setColumnOrder] = useState(() => getColOrderFromDefs(initialColumns));
  const [columnSizing, setColumnSizing] = useState<{ [key: string]: number }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [openFilterForColumnId, setOpenFilterForColumnId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const [groupedColumnVisibility, setGroupedColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const [rowVisibility, setRowVisibility] = useState<{ [key: string]: boolean }>({});
  const [rowOrder, setRowOrder] = useState<string[]>(() => 
    flatColumns.map((col) => col.id || (col as any).accessorKey || '')
  );

  // Handler for remarks in flat/transposed view
  const handleFlatRemarksChange = (rowIdx: number, value: string) => {
    setFlatData(prev => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next[rowIdx] = { ...next[rowIdx], remarks: value };
      return next;
    });
  };

  const handleSort = (sortCriteria: SortCriterion[]) => {
    if (!sortCriteria.length) {
      // Don't reset to original data, just clear sorting
      return;
    }

    // Convert sort criteria to TanStack Table format
    const newSorting = sortCriteria.map(({ field, direction }) => ({
      id: field,
      desc: direction === 'desc',
    }));
    setSorting(newSorting);

    // For grouped view, sort tasks within each contract using current filtered data
    const newData = [...data].map(row => {
      if (row.tasks) {
        const sortedTasks = [...row.tasks].sort((a, b) => {
          for (const { field, direction } of sortCriteria) {
            if (field === 'task' || field === 'taskid') {
              const aValue = a.task || a.taskid || '';
              const bValue = b.task || b.taskid || '';
              const numA = parseInt(aValue.replace(/\D/g, ''));
              const numB = parseInt(bValue.replace(/\D/g, ''));
              if (numA !== numB) {
                return direction === 'asc' ? numA - numB : numB - numA;
              }
            }
            if (field === 'triggeredTasks' || field === 'openTasks') {
              const aValue = a.obligations?.[0]?.[field] ?? 0;
              const bValue = b.obligations?.[0]?.[field] ?? 0;
              if (aValue !== bValue) {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
              }
            }
          }
          return 0;
        });
        return { ...row, tasks: sortedTasks };
      }
      return row;
    });

    // For flat and transposed views, sort all tasks globally using current filtered data
    let newFlatData = [...flatData].sort((a, b) => {
      for (const { field, direction } of sortCriteria) {
        let aValue, bValue;
        
        if (field === 'task' || field === 'taskid') {
          aValue = parseInt((a.task || a.taskid)?.replace(/\D/g, '') || '0');
          bValue = parseInt((b.task || b.taskid)?.replace(/\D/g, '') || '0');
          if (aValue !== bValue) {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
        } else if (field === 'triggeredTasks' || field === 'openTasks') {
          aValue = a.obligations?.[0]?.[field] ?? 0;
          bValue = b.obligations?.[0]?.[field] ?? 0;
          if (aValue !== bValue) {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
        } else if (field === 'contractid') {
          aValue = parseInt(a.contractid?.replace(/\D/g, '') || '0');
          bValue = parseInt(b.contractid?.replace(/\D/g, '') || '0');
          if (aValue !== bValue) {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
        } else {
          aValue = a[field];
          bValue = b[field];
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            if (comparison !== 0) {
              return direction === 'asc' ? comparison : -comparison;
            }
          } else if (aValue !== bValue) {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
        }
      }
      return 0;
    });

    setData(newData);
    setFlatData(newFlatData);
  };

  const handleFilter = (filterCriteria: FilterCriterion[]) => {
    if (!filterCriteria.length) {
      setData([...originalData.current]);
      setFlatData(flattenData(originalData.current));
      return;
    }

    const matchesFilter = (value: any, criterion: FilterCriterion) => {
      if (!value) return criterion.operator === 'isEmpty';
      if (criterion.operator === 'isNotEmpty') return true;

      const strValue = String(value).toLowerCase();
      const filterValue = criterion.value.toLowerCase();

      // Extract numeric parts for ID fields
      const extractNumber = (str: string): number => {
        const matches = str.match(/\d+/g);
        return matches ? parseInt(matches[matches.length - 1]) : NaN;
      };

      // Handle numeric fields including IDs
      if (['triggeredTasks', 'openTasks', 'contractid', 'taskid'].includes(criterion.field)) {
        let numValue: number;
        let filterNum: number;
        
        if (criterion.field === 'contractid' || criterion.field === 'taskid') {
          numValue = extractNumber(strValue);
          filterNum = extractNumber(filterValue);
        } else {
          numValue = parseInt(strValue);
          filterNum = parseInt(filterValue);
        }
        
        if (isNaN(filterNum)) return false;

        switch (criterion.operator) {
          case 'equals':
            return numValue === filterNum;
          case 'gt':
            return numValue > filterNum;
          case 'lt':
            return numValue < filterNum;
          case 'gte':
            return numValue >= filterNum;
          case 'lte':
            return numValue <= filterNum;
          case 'range':
            let upperNum: number;
            if (criterion.field === 'contractid' || criterion.field === 'taskid') {
              upperNum = extractNumber(criterion.upperValue || '');
            } else {
              upperNum = parseInt(criterion.upperValue || '');
            }
            return !isNaN(upperNum) && numValue >= filterNum && numValue <= upperNum;
          case 'contains':
            return strValue.includes(filterValue);
          default:
            return false;
        }
      }

      // Handle text fields
      switch (criterion.operator) {
        case 'is':
        case 'equals':
          return strValue === filterValue;
        case 'isNot':
          return strValue !== filterValue;
        case 'contains':
          return strValue.includes(filterValue);
        case 'isEmpty':
          return !value || String(value).trim() === '';
        case 'isNotEmpty':
          return value && String(value).trim() !== '';
        default:
          return true;
      }
    };

    // Apply filters to grouped data
    let filteredData = [...originalData.current] as Contract[];

    // Apply each filter criterion
    filterCriteria.forEach(criterion => {
      if (['taskid', 'task', 'triggeredTasks', 'openTasks', 'criticality', 'compliance'].includes(criterion.field)) {
        // Task and obligation level filters
        filteredData = filteredData.map(contract => ({
          ...contract,
          tasks: contract.tasks.filter(task => {
            if (criterion.field === 'taskid' || criterion.field === 'task') {
              return matchesFilter(task.task, criterion);
            }
            if (criterion.field === 'triggeredTasks' || criterion.field === 'openTasks') {
              const value = task.obligations?.[0]?.[criterion.field];
              return matchesFilter(value, criterion);
            }
            if (criterion.field === 'criticality' || criterion.field === 'compliance') {
              return task.obligations?.some(obligation => 
                matchesFilter(obligation[criterion.field], criterion)
              ) ?? false;
            }
            return true;
          })
        })).filter(contract => contract.tasks.length > 0);
      } else {
        // Contract-level filters
        filteredData = filteredData.filter(contract => 
          matchesFilter(contract[criterion.field], criterion)
        );
      }
    });

    // Generate flat data from the filtered grouped data
    const newFlatData = flattenData(filteredData);

    setData(filteredData);
    setFlatData(newFlatData);
  };

  const table = useReactTable({
    data,
    columns: initialColumns,
    state: {
      columnOrder,
      columnSizing,
      sorting,
      columnFilters,
      columnVisibility: groupedColumnVisibility,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getSubRows: (row: any) => row.tasks,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  // Dropdown for view mode
  const viewOptions = [
    { value: 'grouped', label: 'Grouped View' },
    { value: 'flat', label: 'Flat View' },
    { value: 'transposed', label: 'Transposed View' },
  ];

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar');
      const configureButton = document.querySelector('.configure-button');
      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        configureButton &&
        !configureButton.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    if (viewMode === 'grouped') {
      setGroupedColumnVisibility(prev => ({
        ...prev,
        [columnId]: isVisible
      }));
    } else {
      setColumnVisibility(prev => ({
        ...prev,
        [columnId]: isVisible
      }));
    }
  };

  const handleRowVisibilityChange = (rowId: string, isVisible: boolean) => {
    setRowVisibility(prev => {
      const newVisibility = { ...prev };
      if (isVisible) {
        delete newVisibility[rowId];
      } else {
        newVisibility[rowId] = false;
      }
      return newVisibility;
    });
  };

  // Modify the table props to include visibility
  const flatTableProps = {
    data: flatData,
    onRemarksChange: handleFlatRemarksChange,
    columnVisibility,
  };

  const groupedTableProps = {
    data,
    columns: initialColumns,
    state: {
      columnOrder,
      columnSizing,
      sorting,
      columnFilters,
      columnVisibility: groupedColumnVisibility,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getSubRows: (row: any) => row.tasks,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  };

  // Update the transposedTableProps definition
  const transposedTableProps: TransposedTableProps = {
    data: flatData,
    rowVisibility,
    rowOrder,
    setRowOrder: setRowOrder,
    setRowVisibility,
  };

  return (
    <div className="App">
      <div className="table-controls">
        <button
          className="configure-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            width="16"
            height="16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Configure
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="viewMode" style={{ fontWeight: 500 }}>View:</label>
        <select
          id="viewMode"
          value={viewMode}
          onChange={e => setViewMode(e.target.value as any)}
          style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd' }}
        >
          {viewOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      </div>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2 className="sidebar-title">Table Controls</h2>
            <p className="sidebar-subtitle">Configure your data view</p>
          </div>
          <button className="close-button" onClick={() => setIsSidebarOpen(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="sidebar-section">
          <FilterSection onFilter={handleFilter} data={flatData} />
          <SortingSection onSort={handleSort} />
          {viewMode === 'flat' && (
            <VisibilitySection
              items={flatColumns.map(col => ({
                id: col.id || (col as any).accessorKey,
                header: typeof col.header === 'string' ? col.header : col.id || (col as any).accessorKey
              }))}
              visibility={columnVisibility}
              onVisibilityChange={handleColumnVisibilityChange}
              type="column"
            />
          )}
          {viewMode === 'grouped' && (
            <VisibilitySection
              items={initialColumns.map(col => ({
                id: col.id || (col as any).accessorKey,
                header: typeof col.header === 'string' ? col.header : col.id || (col as any).accessorKey
              }))}
              visibility={groupedColumnVisibility}
              onVisibilityChange={handleColumnVisibilityChange}
              type="column"
            />
          )}
          {viewMode === 'transposed' && (
            <VisibilitySection
              items={flatColumns.map(col => ({
                id: col.id || (col as any).accessorKey,
                header: typeof col.header === 'string' ? col.header : col.id || (col as any).accessorKey
              }))}
              visibility={rowVisibility}
              onVisibilityChange={handleRowVisibilityChange}
              type="row"
            />
          )}
        </div>
      </div>

      {viewMode === 'grouped' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (active.id !== over?.id) {
              setColumnOrder((prev) => {
                const oldIndex = prev.indexOf(active.id as string);
                const newIndex = prev.indexOf(over?.id as string);
                const newOrder = [...prev];
                const [moved] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, moved);
                return newOrder;
              });
            }
          }}
        >
          <table className="tanstack-table">
            <thead>
              <SortableContext
                items={table.getAllLeafColumns().map((col) => col.id)}
                strategy={horizontalListSortingStrategy}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <DraggableHeader
                        key={header.id}
                        header={header}
                        openFilterForColumnId={openFilterForColumnId}
                        setOpenFilterForColumnId={setOpenFilterForColumnId}
                      />
                    ))}
                  </tr>
                ))}
              </SortableContext>
            </thead>
            <tbody>
              {table.getRowModel().rows
                .filter(row => row.depth === 0 && !!row.original)
                .map(row => (
                  <React.Fragment key={row.id}>
                    <tr>
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={row.getVisibleCells().length} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                          <div style={{ margin: 0, padding: 0 }}>
                            <TaskTable tasks={row.original.tasks} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </DndContext>
      )}
      {viewMode === 'flat' && (
        <FlatTable {...flatTableProps} />
      )}
      {viewMode === 'transposed' && (
        <TransposedTable 
          data={flatData} 
          rowVisibility={rowVisibility}
          rowOrder={rowOrder}
          setRowOrder={setRowOrder}
          setRowVisibility={setRowVisibility}
        />
      )}
    </div>
  );
}
