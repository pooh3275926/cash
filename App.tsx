
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Category, Transaction } from './types';
import { CATEGORY_NAMES } from './constants';
import { 
    ChevronDownIcon, PlusIcon, CheckCircleIcon, XCircleIcon, 
    Cog6ToothIcon, WalletIcon, PencilIcon, TrashIcon, 
    ArrowDownTrayIcon, ArrowUpTrayIcon, CheckIcon, ArrowUpCircleIcon,
    MagnifyingGlassIcon, SunIcon, MoonIcon, XMarkIcon
} from './components/icons';

// --- HOOKS & UTILS ---

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

type Theme = 'light' | 'dark';
const useTheme = (): [Theme, React.Dispatch<React.SetStateAction<Theme>>] => {
    const [theme, setTheme] = usePersistentState<Theme>('theme', 
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);
    return [theme, setTheme];
};

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
}

const DARK_INPUT_STYLE = "appearance-none w-full px-4 py-3 bg-gray-100 dark:bg-dark-surface text-morandi-text-main dark:text-dark-text-main border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-morandi-accent transition-all shadow-sm placeholder:text-morandi-text-subtle dark:placeholder:text-dark-text-subtle";
const OPTION_STYLE = "text-black bg-white dark:text-white dark:bg-gray-800";

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-morandi-surface dark:bg-dark-surface rounded-xl shadow-lg p-6 w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-6 text-morandi-primary-dark dark:text-dark-text-main">{isEditing ? '編輯紀錄' : '新增紀錄'}</h2>
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
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">取消</button>
                        <button type="submit" className="px-5 py-2 bg-morandi-accent text-white rounded-lg font-semibold hover:bg-morandi-accent-dark transition-colors">{isEditing ? '儲存' : '新增'}</button>
                    </div>
                </form>
            </motion.div>
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
        <div className="fixed inset-0 bg-morandi-bg dark:bg-dark-bg flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-morandi-surface dark:bg-dark-surface rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
            >
                <WalletIcon className="mx-auto h-16 w-16 text-morandi-accent" />
                <h1 className="text-3xl font-bold text-morandi-text-main dark:text-dark-text-main mt-4">初始設定</h1>
                <p className="text-morandi-text-subtle dark:text-dark-text-subtle mt-2 mb-8">請設定您的零用金初始餘額與總額。</p>
                <div className="space-y-4">
                    <input type="number" placeholder="期初餘額 (可不填)" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className={DARK_INPUT_STYLE} />
                    <input type="number" placeholder="零用金總額" value={targetTotal} onChange={e => setTargetTotal(e.target.value)} className={DARK_INPUT_STYLE} />
                </div>
                <button onClick={handleStart} className="mt-8 w-full bg-morandi-accent text-white py-3 rounded-lg font-bold hover:bg-morandi-accent-dark transition-all transform hover:scale-105">開始使用</button>
            </motion.div>
        </div>
    );
};

// --- UI COMPONENTS ---

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const prevValue = useRef(value);

    useEffect(() => {
        const controls = animate(prevValue.current, value, {
            duration: 0.5,
            ease: "easeOut",
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = new Intl.NumberFormat().format(Math.round(latest));
                }
            },
        });
        prevValue.current = value;
        return () => controls.stop();
    }, [value]);

    return <span ref={ref} />;
};

const SummaryCard: React.FC<{ title: string; value: number; color: string; }> = ({ title, value, color }) => (
    <div className="bg-morandi-surface dark:bg-dark-surface p-4 rounded-xl shadow-md transition-all hover:shadow-lg dark:hover:shadow-morandi-primary/20">
        <h3 className="text-sm font-medium text-morandi-text-subtle dark:text-dark-text-subtle">{title}</h3>
        <p className={`text-3xl font-bold ${color} mt-4`}>$<AnimatedCounter value={value} /></p>
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
    const itemClass = isReimbursed ? 'bg-morandi-success/10 border-l-4 border-morandi-success dark:bg-morandi-success/5' : 'bg-morandi-surface dark:bg-dark-surface';
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 ${itemClass} transaction-item-wrapper transition-colors duration-200 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5`}
            onClick={() => onToggleSelect(transaction.id)}
        >
            <div
                role="button"
                aria-pressed={isSelected}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(transaction.id); }} 
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-4 border-2 transition-all duration-200
                            ${isSelected 
                                ? 'bg-morandi-accent border-morandi-accent scale-110' 
                                : 'bg-transparent border-gray-300 dark:border-gray-500 hover:border-morandi-accent'}`}
            >
                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-morandi-text-main dark:text-dark-text-main truncate pr-2">{transaction.description || CATEGORY_NAMES[transaction.category]}</p>
                <div className="flex items-center text-sm text-morandi-text-subtle dark:text-dark-text-subtle mt-1 flex-wrap">
                    <span>{CATEGORY_NAMES[transaction.category]}</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">&bull;</span>
                    <span>{transaction.date}</span>
                     {isReimbursed && (
                        <>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">&bull;</span>
                            <span className="text-xs font-bold text-morandi-success-dark bg-morandi-success/20 px-2 py-0.5 rounded-full">已核銷</span>
                        </>
                     )}
                </div>
            </div>

            <div className="w-24 md:w-32 text-right flex-shrink-0 ml-2">
                <p className={`font-bold text-lg whitespace-nowrap ${transaction.type === 'income' ? 'text-morandi-success-dark' : 'text-morandi-warning-dark'}`}>
                    {transaction.type === 'expense' ? '− ' : '+ '}{new Intl.NumberFormat().format(transaction.amount)}
                </p>
            </div>

            <div className="flex items-center space-x-0 md:space-x-1 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onEdit(transaction); }} className="p-2 rounded-full text-morandi-text-subtle dark:text-dark-text-subtle hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-morandi-primary dark:hover:text-white transition-colors">
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(transaction); }} className="p-2 rounded-full text-morandi-text-subtle dark:text-dark-text-subtle hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-morandi-warning dark:hover:text-morandi-warning-dark transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
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
        <motion.div layout className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-xl shadow-sm mb-4 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-50/30 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors">
                <h3 className="text-lg font-semibold text-morandi-primary-dark dark:text-dark-text-main">{month}</h3>
                <div className="flex items-center space-x-4">
                    <span className={`font-bold ${netTotal >= 0 ? 'text-morandi-success-dark' : 'text-morandi-warning-dark'}`}>月淨額: {new Intl.NumberFormat().format(netTotal)}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </div>
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <AnimatePresence>
                        {transactions.map(t => <TransactionItem key={t.id} transaction={t} isSelected={props.selectedIds.has(t.id)} {...props} />)}
                    </AnimatePresence>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
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
            <div className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out
                            peer-checked:bg-morandi-primary peer-checked:text-white 
                            bg-gray-100 text-morandi-text-subtle hover:bg-gray-200
                            dark:bg-gray-700 dark:text-dark-text-subtle dark:hover:bg-gray-600
                            dark:peer-checked:bg-morandi-accent dark:peer-checked:text-white">
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
    const [theme, setTheme] = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    
    const importFileRef = useRef<HTMLInputElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const visibleCategoriesSet = useMemo(() => new Set(visibleCategories), [visibleCategories]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const addNotification = useCallback((message: string, type: Notification['type'] = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);
    
    // Smart Deselection Logic
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (selectedTransactionIds.size === 0) return;
            if (isFormOpen || isSettingsOpen || deleteConfirmation) return;

            const target = event.target as HTMLElement;

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
        addNotification('紀錄已新增', 'success');
    };

    const handleUpdateTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a, b) => b.date.localeCompare(a.date)));
        setEditingTransaction(null);
        addNotification('紀錄已更新', 'success');
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
        addNotification('紀錄已刪除', 'warning');
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
        const dataToExport = { initialBalance, targetTotal, transactions };
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
        addNotification('資料已匯出', 'info');
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
                        addNotification('資料匯入成功！', 'success');
                    }
                } else {
                    throw new Error("Invalid data format");
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("匯入失敗：檔案格式不符或已損毀。");
            } finally {
                if (importFileRef.current) { importFileRef.current.value = ''; }
            }
        };
        reader.readAsText(file);
    };
    
    const filteredTransactions = useMemo(() => {
        let items = transactions.filter(t => visibleCategoriesSet.has(t.category));
        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            items = items.filter(t => 
                t.description.toLowerCase().includes(lowercasedQuery) ||
                CATEGORY_NAMES[t.category].toLowerCase().includes(lowercasedQuery) ||
                String(t.amount).includes(lowercasedQuery)
            );
        }
        return items;
    }, [transactions, visibleCategoriesSet, searchQuery]);

    const calculations = useMemo(() => {
        const visibleBalance = transactions.reduce((acc, t) => {
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
                if (t.type === 'expense' && t.reimbursed) { value = 0; }
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
        addNotification(reimburse ? `已核銷 ${selectedTransactionIds.size} 筆發票` : `已取消核銷 ${selectedTransactionIds.size} 筆發票`);
    };
    
    const { canReimburse, canCancelReimbursement } = useMemo(() => {
        if (selectedTransactionIds.size === 0) return { canReimburse: false, canCancelReimbursement: false };
        const selected = transactions.filter(t => selectedTransactionIds.has(t.id));
        const canReimburse = selected.length > 0 && selected.every(t => t.category === Category.INVOICE_REIMBURSEMENT && !t.reimbursed);
        const canCancelReimbursement = selected.length > 0 && selected.every(t => t.category === Category.INVOICE_REIMBURSEMENT && t.reimbursed);
        return { canReimburse, canCancelReimbursement };
    }, [selectedTransactionIds, transactions]);

    const handleFormClose = () => {
        setSelectedTransactionIds(new Set());
        setIsFormOpen(false); 
        setEditingTransaction(null);
    };
    
    if (initialBalance === null) return <InitialSetup onSetupComplete={(initial, target) => { setInitialBalance(initial); setTargetTotal(target); }} />;

    return (
        <div className="min-h-screen bg-morandi-bg dark:bg-dark-bg font-sans text-morandi-text-main dark:text-dark-text-main transition-colors duration-300">
            <AnimatePresence>
                {(isFormOpen || editingTransaction) && <TransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onClose={handleFormClose} editingTransaction={editingTransaction} />}
            </AnimatePresence>
            {isSettingsOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-morandi-surface dark:bg-dark-surface rounded-xl shadow-lg p-6 w-full max-w-sm"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-morandi-primary-dark dark:text-dark-text-main">修改設定</h2>
                        <div className="space-y-4">
                           <div>
                                <label className="text-sm font-medium text-morandi-text-subtle dark:text-dark-text-subtle mb-1 block">期初餘額</label>
                                <input type="number" defaultValue={initialBalance} onBlur={(e) => setInitialBalance(parseFloat(e.target.value))} className={DARK_INPUT_STYLE} />
                           </div>
                           <div>
                                <label className="text-sm font-medium text-morandi-text-subtle dark:text-dark-text-subtle mb-1 block">零用金總額</label>
                                <input type="number" defaultValue={targetTotal} onBlur={(e) => setTargetTotal(parseFloat(e.target.value))} className={DARK_INPUT_STYLE} />
                           </div>
                        </div>
                        <div className="border-t my-6 dark:border-gray-600"></div>
                        <h3 className="text-sm font-medium text-morandi-text-subtle dark:text-dark-text-subtle mb-2">外觀</h3>
                        <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-dark-bg p-1">
                            <button onClick={() => setTheme('light')} className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${theme === 'light' ? 'bg-white dark:bg-dark-surface shadow text-morandi-primary' : 'text-morandi-text-subtle dark:text-dark-text-subtle'}`}><SunIcon className="w-5 h-5 mx-auto"/></button>
                            <button onClick={() => setTheme('dark')} className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-white dark:bg-dark-surface shadow text-morandi-primary' : 'text-morandi-text-subtle dark:text-dark-text-subtle'}`}><MoonIcon className="w-5 h-5 mx-auto"/></button>
                        </div>
                        <div className="border-t my-6 dark:border-gray-600"></div>
                        <div className="space-y-3">
                            <input type="file" ref={importFileRef} onChange={handleImportData} className="hidden" accept="application/json" />
                            <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-morandi-primary dark:text-morandi-accent bg-morandi-primary/10 dark:bg-morandi-accent/10 hover:bg-morandi-primary/20 dark:hover:bg-morandi-accent/20 transition-colors">
                                <ArrowUpTrayIcon className="w-5 h-5 mr-2" /> 匯入資料
                            </button>
                             <button onClick={handleExportData} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-morandi-accent bg-morandi-accent/10 hover:bg-morandi-accent/20 transition-colors">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> 匯出資料
                            </button>
                        </div>
                         <div className="flex justify-end mt-6">
                            <button onClick={() => { setSelectedTransactionIds(new Set()); setIsSettingsOpen(false); }} className="px-5 py-2 bg-morandi-accent text-white rounded-lg font-semibold hover:bg-morandi-accent-dark">完成</button>
                        </div>
                    </motion.div>
                </div>
            )}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-morandi-surface dark:bg-dark-surface rounded-xl shadow-lg p-6 w-full max-w-sm text-center"
                    >
                        <h2 className="text-xl font-bold mb-4 text-morandi-text-main dark:text-dark-text-main">確定刪除?</h2>
                        <p className="text-morandi-text-subtle dark:text-dark-text-subtle mb-6">此操作無法復原。</p>
                         <div className="flex justify-center space-x-3">
                            <button onClick={() => setDeleteConfirmation(null)} className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">取消</button>
                            <button onClick={handleDelete} className="px-5 py-2 bg-morandi-warning text-white rounded-lg font-semibold hover:bg-morandi-warning-dark">刪除</button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="fixed top-4 right-4 z-[100] space-y-2">
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, y: -50, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.5 }}
                            className={`flex items-center justify-between w-64 p-3 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-morandi-success' : n.type === 'warning' ? 'bg-morandi-warning' : 'bg-morandi-primary'}`}
                        >
                            <span className="font-semibold text-sm">{n.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            <header ref={headerRef} className="bg-morandi-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm text-morandi-primary-dark dark:text-dark-text-main shadow-sm sticky top-0 z-40 transition-colors duration-300">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center relative h-16">
                    <button onClick={scrollToTop} className="p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors" aria-label="Back to Top">
                        <ArrowUpCircleIcon className="w-6 h-6"/>
                    </button>
                    <AnimatePresence>
                    {!isSearchActive && (
                        <motion.h1 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-xl md:text-2xl font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                        >
                            
                        </motion.h1>
                    )}
                    </AnimatePresence>
                    <div className="flex items-center space-x-2">
                         <AnimatePresence>
                            {isSearchActive && (
                                <motion.div 
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="relative"
                                >
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="搜尋..."
                                        className="h-10 pl-4 pr-10 rounded-full bg-gray-100 dark:bg-dark-bg focus:ring-2 focus:ring-morandi-accent focus:outline-none transition-all w-32 sm:w-48"
                                    />
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-morandi-text-subtle dark:text-dark-text-subtle"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button onClick={() => { setIsSearchActive(v => !v); if (isSearchActive) setSearchQuery(''); else setTimeout(() => searchInputRef.current?.focus(), 100); }} className="p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors" aria-label="搜尋">
                            <MagnifyingGlassIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { setSelectedTransactionIds(new Set()); setEditingTransaction(null); setIsFormOpen(true); }} className="p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors" aria-label="新增交易">
                            <PlusIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { setSelectedTransactionIds(new Set()); setIsSettingsOpen(true); }} className="p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-white/10 transition-colors" aria-label="修改設定">
                            <Cog6ToothIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-2 sm:p-4 pb-24">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                   <SummaryCard title="手存零用金餘額" value={calculations.visibleBalance} color="text-morandi-primary-dark dark:text-morandi-accent" />
                   <SummaryCard title="應收清晨國度" value={calculations.receivable} color="text-amber-600" />
                   <SummaryCard title="未核銷發票總額" value={calculations.unreimbursedTotal} color="text-morandi-warning-dark" />
                   <SummaryCard title="回推零用金總額" value={calculations.verificationTotal} color={calculations.verificationTotal === targetTotal ? "text-morandi-success-dark" : "text-orange-500"} />
                </div>
                
                 <div className="bg-morandi-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-6 sticky top-[64px] z-30 transition-colors duration-300">
                     <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                           <h3 className="font-semibold text-morandi-text-subtle dark:text-dark-text-subtle mb-2 text-sm">顯示科目:</h3>
                           <div className="flex flex-wrap gap-2">
                               {Object.values(Category).map(cat => (
                                    <CategoryToggle key={cat} category={cat} isChecked={visibleCategoriesSet.has(cat)} onToggle={handleToggleCategory} />
                               ))}
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                           <button disabled={!canReimburse} onClick={() => handleReimburse(true)} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-morandi-success text-white rounded-lg shadow-sm hover:bg-morandi-success-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-all"><CheckCircleIcon className="w-5 h-5 mr-1.5"/> 核銷</button>
                           <button disabled={!canCancelReimbursement} onClick={() => handleReimburse(false)} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-morandi-accent text-white rounded-lg shadow-sm hover:bg-morandi-accent-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-all"><XCircleIcon className="w-5 h-5 mr-1.5"/> 取消核銷</button>
                           <button disabled={selectedTransactionIds.size === 0} onClick={() => setSelectedTransactionIds(new Set())} className="action-bar-button flex items-center justify-center h-10 px-3 text-sm whitespace-nowrap bg-gray-500 text-white rounded-lg shadow-sm hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-all"><XCircleIcon className="w-5 h-5 mr-1.5"/> 取消選取</button>
                           <button disabled={selectedTransactionIds.size === 0} onClick={() => setDeleteConfirmation({ type: 'bulk' })} className="action-bar-button flex items-center justify-center w-10 h-10 bg-morandi-warning text-white rounded-lg shadow-sm hover:bg-morandi-warning-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-all"><TrashIcon className="w-5 h-5"/> </button>
                       </div>
                    </div>
                    {calculations.selectedForReimbursement > 0 && (
                        <div className="mt-4 text-center bg-morandi-primary/10 dark:bg-morandi-accent/10 p-2 rounded-lg"><p className="font-semibold text-morandi-primary-dark dark:text-morandi-accent">已選取核銷總額: NT$ {new Intl.NumberFormat().format(calculations.selectedForReimbursement)}</p></div>
                    )}
                 </div>

                <div className="relative">
                     {Object.keys(groupedTransactions).length > 0 ? (
                         Object.entries(groupedTransactions).map(([month, monthlyTransactions]) => (
                            <MonthlySection key={month} month={month} transactions={monthlyTransactions} selectedIds={selectedTransactionIds} onToggleSelect={handleToggleSelect} onEdit={handleEdit} onDelete={(t) => setDeleteConfirmation({ type: 'single', id: t.id })} />
                         ))
                     ) : (
                         <div className="text-center py-16 bg-morandi-surface dark:bg-dark-surface rounded-xl shadow-sm"><p className="text-morandi-text-subtle dark:text-dark-text-subtle">尚無交易紀錄 {/* FIX: `searchQuery` is a string, not a function. It should not be called. */}
{searchQuery && '或找不到符合的搜尋結果'}</p></div>
                     )}
                </div>
            </main>

        </div>
    );
}
