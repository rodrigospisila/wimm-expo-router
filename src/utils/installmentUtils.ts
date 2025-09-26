interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
  paymentMethod: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  installment?: {
    id: number;
    installmentCount: number;
    currentInstallment: number;
  };
  installmentId?: number;
  installmentNumber?: number;
}

export interface InstallmentGroup {
  installmentId: number;
  description: string;
  totalAmount: number;
  installmentCount: number;
  paidInstallments: number;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
  paymentMethod: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  transactions: Transaction[];
  type: 'INCOME' | 'EXPENSE';
}

export interface GroupedTransactions {
  installmentGroups: InstallmentGroup[];
  regularTransactions: Transaction[];
}

/**
 * Agrupa transações parceladas por installmentId
 * @param transactions Array de transações
 * @returns Objeto com grupos de parcelas e transações regulares separadas
 */
export function groupTransactionsByInstallment(transactions: Transaction[]): GroupedTransactions {
  const installmentGroups = new Map<number, InstallmentGroup>();
  const regularTransactions: Transaction[] = [];

  transactions.forEach(transaction => {
    if (transaction.installment && transaction.installmentId) {
      const installmentId = transaction.installmentId;
      
      if (!installmentGroups.has(installmentId)) {
        installmentGroups.set(installmentId, {
          installmentId,
          description: transaction.description,
          totalAmount: 0,
          installmentCount: transaction.installment.installmentCount || 1,
          paidInstallments: transaction.installment.currentInstallment || 0,
          category: transaction.category,
          paymentMethod: transaction.paymentMethod,
          transactions: [],
          type: transaction.type,
        });
      }

      const group = installmentGroups.get(installmentId)!;
      group.transactions.push(transaction);
      group.totalAmount += Math.abs(transaction.amount);
    } else {
      regularTransactions.push(transaction);
    }
  });

  return {
    installmentGroups: Array.from(installmentGroups.values()),
    regularTransactions,
  };
}

/**
 * Cria uma lista mista de grupos de parcelas e transações regulares para renderização
 * @param transactions Array de transações
 * @returns Array de itens para renderização (grupos e transações individuais)
 */
export function createMixedTransactionList(transactions: Transaction[]) {
  const { installmentGroups, regularTransactions } = groupTransactionsByInstallment(transactions);
  
  return [
    ...installmentGroups.map(group => ({ type: 'installment' as const, data: group })),
    ...regularTransactions.map(transaction => ({ type: 'transaction' as const, data: transaction }))
  ];
}

/**
 * Calcula estatísticas de parcelas para exibição em resumos
 * @param transactions Array de transações
 * @returns Estatísticas das parcelas
 */
export function calculateInstallmentStats(transactions: Transaction[]) {
  const { installmentGroups } = groupTransactionsByInstallment(transactions);
  
  const totalInstallmentGroups = installmentGroups.length;
  const completedGroups = installmentGroups.filter(group => 
    group.paidInstallments >= group.installmentCount
  ).length;
  const activeGroups = totalInstallmentGroups - completedGroups;
  
  const totalInstallmentAmount = installmentGroups.reduce((sum, group) => 
    sum + group.totalAmount, 0
  );
  
  const paidInstallmentAmount = installmentGroups.reduce((sum, group) => {
    const paidPercentage = Math.min(1, group.paidInstallments / group.installmentCount);
    return sum + (group.totalAmount * paidPercentage);
  }, 0);
  
  const remainingInstallmentAmount = totalInstallmentAmount - paidInstallmentAmount;
  
  return {
    totalGroups: totalInstallmentGroups,
    completedGroups,
    activeGroups,
    totalAmount: totalInstallmentAmount,
    paidAmount: paidInstallmentAmount,
    remainingAmount: remainingInstallmentAmount,
    completionPercentage: totalInstallmentAmount > 0 ? (paidInstallmentAmount / totalInstallmentAmount) * 100 : 0,
  };
}
