import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Category, Transaction } from './types';
import { CATEGORY_NAMES } from './constants';
import { 
    ChevronDownIcon, PlusIcon, CheckCircleIcon, XCircleIcon, 
    Cog6ToothIcon, WalletIcon, PencilIcon, TrashIcon, 
    ArrowDownTrayIcon, ArrowUpTrayIcon, CheckIcon, ArrowUpCircleIcon
} from './components/icons';

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

const DARK_INPUT_STYLE = "appearance-none w-full px-4 py-3 bg-morandi-primary-dark text-white border border-transparent rounded-lg focus:ring-2 focus:ring-morandi-accent transition-shadow shadow-sm placeholder:text-gray-400";
const OPTION_STYLE = "text-black bg-white";

// --- MODALS AND FORMS ---

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'reimbursed'>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onClose: () => void;
  editingTransaction: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onUpdateTransaction, onClose, editingTransaction }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<Category>(Category.INVOICE_REIMBURSEMENT);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const isEditing = !!editingTransaction;

    useEffect(() => {
        if (isEditing) {
            setDate(editingTransaction.date);
            setCategory(editingTransaction.category);
            setDescription(editingTransaction.description);
            setAmount(String(editingTransaction.amount));
            setType(editingTransaction.type);
        }
    }, [editingTransaction, isEditing]);

    const availableCategories = useMemo(() => {
        if (type === 'income') {
            return Object.values(Category).filter(c => c !== Category.INVOICE_REIMBURSEMENT && c !== Category.MORNING_KINGDOM);
        }
        return Object.values(Category).filter(c => c !== Category.STUDENT_PAYMENT);
    }, [type]);

    useEffect(() => {
        if (!availableCategories.includes(category)) {
            setCategory(availableCategories[0] || Category.OTHER_ADJUSTMENT);
        }
    }, [availableCategories, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !amount || parseFloat(amount) <= 0) {
            alert('請填寫日期与金额');
            return;
        }
        const transactionData = { date, category, description, amount: parseFloat(amount), type };
        if (isEditing) {
            onUpdateTransaction({ ...transactionData, id: editingTransaction.id, reimbursed: editingTransaction.reimbursed });
        } else {
            onAddTransaction(transactionData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-morandi-surface rounded-xl shadow-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-morandi-primary-dark">{isEditing ? '編輯紀錄' : '新增紀錄'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={DARK_INPUT_STYLE} />
                    <div className="relative">
                        <select value={type} onChange={e => setType(e.target.value as 'income' | 'expense')} className={DARK_INPUT_STYLE}>
                            <option className={OPTION_STYLE} value="expense">支出</option>
                            <option className={OPTION_STYLE} value="income">收入</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={category} onChange={e => setCategory(e.target.value as Category)} className={DARK_INPUT_STYLE}>
                            {availableCategories.map(cat => <option key={cat} value={cat} className={OPTION_STYLE}>{CATEGORY_NAMES[cat]}</option>)}
                        </select>
                         <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <input type="text" placeholder="說明 (選填)" value={description} onChange={e => setDescription(e.target.value)} className={DARK_INPUT_STYLE} />
                    <input type="number" placeholder="金額" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" className={DARK_INPUT_STYLE} />
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">取消</button>
                        <button type="submit" className="px-5 py-2 bg-morandi-accent text-white rounded-lg font-semibold hover:bg-morandi-accent-dark transition-colors">{isEditing ? '儲存' : '新增'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InitialSetup: React.FC<{ onSetupComplete: (initial: number, target: number) => void }> = ({ onSetupComplete }) => {
    const [initialBalance, setInitialBalance] = useState('');
    const [targetTotal, setTargetTotal] = useState('30000');

    const handleStart = () => {
        const initial = initialBalance.trim() === '' ? 0 : parseFloat(initialBalance);
        const target = parseFloat(targetTotal);
        if (!isNaN(initial) && !isNaN(target) && initial >= 0 && target > 0) {
            onSetupComplete(initial, target);
        } else {
            alert('請輸入有效的數字');
        }
    };

    return (
        <div className="fixed inset-0 bg-morandi-bg flex items-center justify-center z-50 p-4">
            <div className="bg-morandi-surface rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
                <WalletIcon className="mx-auto h-16 w-16 text-morandi-accent" />
                <h1 className="text-3xl font-bold text-morandi-text-main mt-4">初始設定</h1>
                <p className="text-morandi-text-subtle mt-2 mb-8">請設定您的零用金初始餘額與總額。</p>
                <div className="space-y-4">
                    <input type="number" placeholder="期初餘額 (可不填)" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className={DARK_INPUT_STYLE} />
                    <input type="number" placeholder="零用金總額" value={targetTotal} onChange={e => setTargetTotal(e.target.value)} className={DARK_INPUT_STYLE} />
                </div>
                <button onClick={handleStart} className="mt-8 w-full bg-morandi-accent text-white py-3 rounded-lg font-bold hover:bg-morandi-accent-dark transition-all transform hover:scale-105">開始使用</button>
            </div>
        </div>
    );
};

// --- UI COMPONENTS ---

const SummaryCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-morandi-surface p-4 rounded-xl shadow-md transition-shadow hover:shadow-lg">
        <h3 className="text-sm font-medium text-morandi-text-subtle">{title}</h3>
        <p className={`text-3xl font-bold ${color} mt-4`}>{value}</p>
    </div>
);

interface TransactionItemProps {
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
}
const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, isSelected, onToggleSelect, onEdit, onDelete }) => {
    const isReimbursed = transaction.reimbursed;
    const itemClass = isReimbursed ? 'bg-morandi-success/10 border-l-4 border-morandi-success' : 'bg-morandi-surface';
    
    return (
        <div 
            className={`flex items-center p-3 md:p-4 border-b border-gray-100 ${itemClass} transaction-item-wrapper transition-all cursor-pointer hover:bg-gray-50/50`}
            onClick={() => onToggleSelect(transaction.id)}
        >
            {/* Custom Selection UI */}
            <div
                role="button"
                aria-pressed={isSelected}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(transaction.id); }} 
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-4 border-2 transition-colors
                            ${isSelected 
                                ? 'bg-morandi-accent border-morandi-accent' 
                                : 'bg-transparent border-gray-300 hover:border-morandi-accent'}`}
            >
                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
            </div>
            
            {/* Main info section */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-morandi-text-main truncate pr-2">{transaction.description || CATEGORY_NAMES[transaction.category]}</p>
                <div className="flex items-center text-sm text-morandi-text-subtle mt-1 flex-wrap">
                    <span>{CATEGORY_NAMES[transaction.category]}</span>
                    <span className="mx-2 text-gray-300">&bull;</span>
                    <span>{transaction.date}</span>
                     {isReimbursed && (
                        <>
                            <span className="mx-2 text-gray-300">&bull;</span>
                            <span className="text-xs font-bold text-morandi-success-dark bg-morandi-success/20 px-2 py-0.5 rounded-full">已核銷</span>
                        </>
                     )}
                </div>
            </div>

            {/* Amount (right-aligned) */}
            <div className="w-24 md:w-32 text-right flex-shrink-0 ml-2">
                <p className={`font-bold text-lg whitespace-nowrap ${transaction.type === 'income' ? 'text-morandi-success-dark' : 'text-morandi-warning-dark'}`}>
                    {transaction.type === 'expense' ? '− ' : '+ '}{new Intl.NumberFormat().format(transaction.amount)}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-0 md:space-x-1 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onEdit(transaction); }} className="p-2 rounded-full text-morandi-text-subtle hover:bg-gray-200 hover:text-morandi-primary transition-colors">
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(transaction); }} className="p-2 rounded-full text-morandi-text-subtle hover:bg-gray-200 hover:text-morandi-warning transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

interface MonthlySectionProps {
    month: string;
    transactions: Transaction[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
}
const MonthlySection: React.FC<MonthlySectionProps> = ({ month, transactions, ...props }) => {
    const [isOpen, setIsOpen] = useState(true);
    const netTotal = useMemo(() => transactions.reduce((acc, t) => {
        let value = t.type === 'income' ? t.amount : -t.amount;
        if (t.category === Category.INVOICE_REIMBURSEMENT && t.type === 'expense' && t.reimbursed) {
            value = 0;
        }
        return acc + value;
    }, 0), [transactions]);

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-sm mb-4 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-50/30 hover:bg-gray-100/50 transition-colors">
                <h3 className="text-lg font-semibold text-morandi-primary-dark">{month}</h3>
                <div className="flex items-center space-x-4">
                    <span className={`font-bold ${netTotal >= 0 ? 'text-morandi-success-dark' : 'text-morandi-warning-dark'}`}>月淨額: {new Intl.NumberFormat().format(netTotal)}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div>
                    {transactions.map(t => <TransactionItem key={t.id} transaction={t} isSelected={props.selectedIds.has(t.id)} {...props} />)}
                </div>
            )}
        </div>
    );
};


const CategoryToggle: React.FC<{ category: Category; isChecked: boolean; onToggle: (cat: Category) => void }> = ({ category, isChecked, onToggle }) => {
    return (
        <label className="cursor-pointer">
            <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={() => onToggle(category)}
                className="sr-only peer"
            />
            <div className="px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ease-in-out
                            peer-checked:bg-morandi-primary peer-checked:text-white 
                            bg-gray-100 text-morandi-text-subtle hover:bg-gray-200">
                {CATEGORY_NAMES[category]}
            </div>
        </label>
    );
};

// --- MAIN APP ---

export default function App() {
    const [transactions, setTransactions] = usePersistentState<Transaction[]>('transactions', []);
    const [initialBalance, setInitialBalance] = usePersistentState<number | null>('initialBalance', null);
    const [targetTotal, setTargetTotal] = usePersistentState<number>('targetTotal', 30000);
    const [visibleCategories, setVisibleCategories] = usePersistentState<string[]>('visibleCategories', Object.values(Category));
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'single' | 'bulk'; id?: string; } | null>(null);
    
    const importFileRef = useRef<HTMLInputElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    const visibleCategoriesSet = useMemo(() => new Set(visibleCategories), [visibleCategories]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Smart Deselection Logic
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (selectedTransactionIds.size === 0) return;
            if (isFormOpen || isSettingsOpen || deleteConfirmation) return;

            const target = event.target as HTMLElement;

            // Check if the click is on an interactive element that should NOT clear selection
            const isSafeClick = 
                target.closest('.transaction-item-wrapper') ||
                target.closest('.action-bar-button') ||
                (headerRef.current && headerRef.current.contains(target) && target.closest('button'));

            if (!isSafeClick) {
                setSelectedTransactionIds(new Set());
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [selectedTransactionIds.size, isFormOpen, isSettingsOpen, deleteConfirmation]);


    const handleToggleCategory = (category: Category) => {
        setSelectedTransactionIds(new Set());
        const newVisible = new Set(visibleCategoriesSet);
        if (newVisible.has(category)) newVisible.delete(category);
        else newVisible.add(category);
        setVisibleCategories(Array.from(newVisible));
    };

    const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'reimbursed'>) => {
        const newTransaction: Transaction = { ...transaction, id: Date.now().toString(), reimbursed: false };
        setTransactions(prev => [...prev, newTransaction].sort((a, b) => b.date.localeCompare(a.date)));
    };

    const handleUpdateTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a, b) => b.date.localeCompare(a.date)));
        setEditingTransaction(null);
    };

    const handleEdit = (transaction: Transaction) => { 
        setSelectedTransactionIds(new Set());
        setEditingTransaction(transaction); 
        setIsFormOpen(true); 
    };
    
    const handleDelete = () => {
        if (!deleteConfirmation) return;
        if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
            setTransactions(prev => prev.filter(t => t.id !== deleteConfirmation.id));
        } else if (deleteConfirmation.type === 'bulk') {
            setTransactions(prev => prev.filter(t => !selectedTransactionIds.has(t.id)));
            setSelectedTransactionIds(new Set());
        }
        setDeleteConfirmation(null);
    };

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedTransactionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const handleExportData = () => {
        const dataToExport = {
            initialBalance,
            targetTotal,
            transactions,
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `petty-cash-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                
                const data = JSON.parse(text);
                
                if (typeof data.initialBalance === 'number' && typeof data.targetTotal === 'number' && Array.isArray(data.transactions)) {
                    if (window.confirm('這將會覆蓋您目前所有的資料，確定要匯入嗎？')) {
                        setInitialBalance(data.initialBalance);
                        setTargetTotal(data.targetTotal);
                        setTransactions(data.transactions.sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date)));
                        setIsSettingsOpen(false);
                        alert('資料匯入成功！');
                    }
                } else {
                    throw new Error("Invalid data format");
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("匯入失敗：檔案格式不符或已損毀。");
            } finally {
                if (importFileRef.current) {
                    importFileRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const filteredTransactions = useMemo(() => transactions.filter(t => visibleCategoriesSet.has(t.category)), [transactions, visibleCategoriesSet]);

    const calculations = useMemo(() => {
        const visibleBalance = filteredTransactions.reduce((acc, t) => {
            let value = t.type === 'income' ? t.amount : -t.amount;
            if (t.category === Category.INVOICE_REIMBURSEMENT && t.type === 'expense' && t.reimbursed) {
                value = 0;
            }
            return acc + value;
        }, initialBalance ?? 0);
        
        const receivable = transactions.reduce((acc, t) => {
            if (t.category === Category.MORNING_KINGDOM) return acc + t.amount;
            if (t.category === Category.STUDENT_PAYMENT) return acc - t.amount;
            return acc;
        }, 0);
        
        const invoiceOnlyBalance = transactions.reduce((acc, t) => {
            if (t.category === Category.INVOICE_REIMBURSEMENT) {
                let value = t.type === 'income' ? t.amount : -t.amount;
                if (t.type === 'expense' && t.reimbursed) {
                    value = 0;
                }
                return acc + value;
            }
            return acc;
        }, initialBalance ?? 0);

        const unreimbursedTotal = transactions.reduce((acc, t) => (t.category === Category.INVOICE_REIMBURSEMENT && t.type === 'expense' && !t.reimbursed) ? acc + t.amount : acc, 0);
        
        const verificationTotal = invoiceOnlyBalance + unreimbursedTotal;
        
        const selectedForReimbursement = Array.from(selectedTransactionIds).reduce((acc, id) => {
            const t = transactions.find(trans => trans.id === id);
            return (t && t.category === Category.INVOICE_REIMBURSEMENT && !t.reimbursed) ? acc + t.amount : acc;
        }, 0);

        return { visibleBalance, receivable, verificationTotal, unreimbursedTotal, selectedForReimbursement };
    }, [filteredTransactions, transactions, initialBalance, selectedTransactionIds]);
    
    const groupedTransactions = useMemo(() => filteredTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
        const month = t.date.substring(0, 7).replace('-', '/');
        if (!acc[month]) acc[month] = [];
        acc[month].push(t);
        return acc;
    }, {}), [filteredTransactions]);
    
    const handleReimburse = (reimburse: boolean) => {
        setTransactions(prev => prev.map(t => selectedTransactionIds.has(t.id) ? { ...t, reimbursed: reimburse } : t));
        setSelectedTransactionIds(new Set());
    };
    
    const { canReimburse, canCancelReimbursement } = useMemo(() => {
        if (selectedTransactionIds.size === 0) return { canReimburse: false, canCancelReimbursement: false };
        const selected = transactions.filter(t => selectedTransactionIds.has(t.id));
        const canReimburse = selected.every(t => t.category === Category.INVOICE_REIMBURSEMENT && !t.reimbursed);
        const canCancelReimbursement = selected.every(t => t.category === Category.INVOICE_REIMBURSEMENT && t.reimbursed);
        return { canReimburse, canCancelReimbursement };
    }, [selectedTransactionIds, transactions]);

    const handleFormClose = () => {
        setSelectedTransactionIds(new Set());
        setIsFormOpen(false); 
        setEditingTransaction(null);
    };
    
    if (initialBalance === null) return <InitialSetup onSetupComplete={(initial, target) => { setInitialBalance(initial); setTargetTotal(target); }} />;

    return (
        <div className="min-h-screen bg-morandi-bg font-sans text-morandi-text-main">
            {(isFormOpen || editingTransaction) && <TransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onClose={handleFormClose} editingTransaction={editingTransaction} />}
            {isSettingsOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-morandi-surface rounded-xl shadow-lg p-6 w-full max-w-sm">
                        <h2 className="text-2xl font-bold mb-6 text-morandi-primary-dark">修改設定</h2>
                        <div className="space-y-4">
                           <div>
                                <label className="text-sm font-medium text-morandi-text-subtle mb-1 block">期初餘額</label>
                                <input type="number" defaultValue={initialBalance} onBlur={(e) => setInitialBalance(parseFloat(e.target.value))} className={DARK_INPUT_STYLE} />
                           </div>
                           <div>
                                <label className="text-sm font-medium text-morandi-text-subtle mb-1 block">零用金總額</label>
                                <input type="number" defaultValue={targetTotal} onBlur={(e) => setTargetTotal(parseFloat(e.target.value))} className={DARK_INPUT_STYLE} />
                           </div>
                        </div>
                        <div className="border-t my-6"></div>
                        <div className="space-y-3">
                            <input type="file" ref={importFileRef} onChange={handleImportData} className="hidden" accept="application/json" />
                            <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-morandi-primary bg-morandi-primary/10 hover:bg-morandi-primary/20 transition-colors">
                                <ArrowUpTrayIcon className="w-5 h-5 mr-2" /> 匯入資料
                            </button>
                             <button onClick={handleExportData} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-morandi-accent bg-morandi-accent/10 hover:bg-morandi-accent/20 transition-colors">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> 匯出資料
                            </button>
                        </div>
                         <div className="flex justify-end mt-6">
                            <button onClick={() => { setSelectedTransactionIds(new Set()); setIsSettingsOpen(false); }} className="px-5 py-2 bg-morandi-accent text-white rounded-lg font-semibold hover:bg-morandi-accent-dark">完成</button>
                        </div>
                    </div>
                </div>
            )}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-morandi-surface rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
                        <h2 className="text-xl font-bold mb-4 text-morandi-text-main">確定刪除?</h2>
                        <p className="text-morandi-text-subtle mb-6">此操作無法復原。</p>
                         <div className="flex justify-center space-x-3">
                            <button onClick={() => setDeleteConfirmation(null)} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">取消</button>
                            <button onClick={handleDelete} className="px-5 py-2 bg-morandi-warning text-white rounded-lg font-semibold hover:bg-morandi-warning-dark">刪除</button>
                        </div>
                    </div>
                </div>
            )}
            
            <header ref={headerRef} className="bg-morandi-surface/80 backdrop-blur-sm text-morandi-primary-dark shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center relative">
                    <button onClick={scrollToTop} className="p-2 rounded-full hover:bg-gray-200/80 transition-colors" aria-label="Back to Top">
                        <ArrowUpCircleIcon className="w-6 h-6"/>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap">教會零用金管理</h1>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { setSelectedTransactionIds(new Set()); setEditingTransaction(null); setIsFormOpen(true); }} className="p-2 rounded-full hover:bg-gray-200/80 transition-colors" aria-label="新增交易">
                            <PlusIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { setSelectedTransactionIds(new Set()); setIsSettingsOpen(true); }} className="p-2 rounded-full hover:bg-gray-200/80 transition-colors" aria-label="修改設定">
                            <Cog6ToothIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-2 sm:p-4 pb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                   <SummaryCard title="手存零用金餘額" value={`$${new Intl.NumberFormat().format(calculations.visibleBalance)}`} color="text-morandi-primary-dark" />
                   <SummaryCard title="應收清晨國度" value={`$${new Intl.NumberFormat().format(calculations.receivable)}`} color="text-amber-600" />
                   <SummaryCard title="未核銷發票總額" value={`$${new Intl.NumberFormat().format(calculations.unreimbursedTotal)}`} color="text-morandi-warning-dark" />
                   <SummaryCard title="回推零用金總額" value={`$${new Intl.NumberFormat().format(calculations.verificationTotal)}`} color={calculations.verificationTotal === targetTotal ? "text-morandi-success-dark" : "text-orange-500"} />
                </div>
                
                 <div className="bg-morandi-surface/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-6 sticky top-[60px] md:top-[68px] z-30">
                     <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                           <h3 className="font-semibold text-morandi-text-subtle mb-2 text-sm">顯示科目:</h3>
                           <div className="flex flex-wrap gap-2">
                               {Object.values(Category).map(cat => (
                                    <CategoryToggle key={cat} category={cat} isChecked={visibleCategoriesSet.has(cat)} onToggle={handleToggleCategory} />
                               ))}
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                           <button disabled={!canReimburse} onClick={() => handleReimburse(true)} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-morandi-success text-white rounded-lg shadow-sm hover:bg-morandi-success-dark disabled:bg-gray-300 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-1.5"/> 核銷</button>
                           <button disabled={!canCancelReimbursement} onClick={() => handleReimburse(false)} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-morandi-accent text-white rounded-lg shadow-sm hover:bg-morandi-accent-dark disabled:bg-gray-300 transition-colors"><XCircleIcon className="w-5 h-5 mr-1.5"/> 取消核銷</button>
                           <button disabled={selectedTransactionIds.size === 0} onClick={() => setSelectedTransactionIds(new Set())} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-gray-500 text-white rounded-lg shadow-sm hover:bg-gray-600 disabled:bg-gray-300 transition-colors"><XCircleIcon className="w-5 h-5 mr-1.5"/> 取消選取</button>
                           <button disabled={selectedTransactionIds.size === 0} onClick={() => setDeleteConfirmation({ type: 'bulk' })} className="action-bar-button flex items-center justify-center w-10 h-10 bg-morandi-warning text-white rounded-lg shadow-sm hover:bg-morandi-warning-dark disabled:bg-gray-300 transition-colors"><TrashIcon className="w-5 h-5"/> </button>
                       </div>
                    </div>
                    {calculations.selectedForReimbursement > 0 && (
                        <div className="mt-4 text-center bg-morandi-primary/10 p-2 rounded-lg"><p className="font-semibold text-morandi-primary-dark">已選取核銷總額: NT$ {new Intl.NumberFormat().format(calculations.selectedForReimbursement)}</p></div>
                    )}
                 </div>

                <div>
                     {Object.keys(groupedTransactions).length > 0 ? (
                         Object.entries(groupedTransactions).map(([month, monthlyTransactions]) => (
                            <MonthlySection key={month} month={month} transactions={monthlyTransactions} selectedIds={selectedTransactionIds} onToggleSelect={handleToggleSelect} onEdit={handleEdit} onDelete={(t) => setDeleteConfirmation({ type: 'single', id: t.id })} />
                         ))
                     ) : (
                         <div className="text-center py-16 bg-morandi-surface rounded-xl shadow-sm"><p className="text-morandi-text-subtle">尚無交易紀錄</p></div>
                     )}
                </div>
            </main>

        </div>
    );
}