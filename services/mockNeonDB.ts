export interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
}

export interface UserData {
    name: string;
    balance: number;
    currency: string;
    recentTransactions: Transaction[];
}

export const MockNeonDB = {
    getUserData: async (): Promise<UserData> => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        return {
            name: 'Alishba',
            balance: 12450.75,
            currency: 'PKR',
            recentTransactions: [
                {
                    id: '1',
                    type: 'debit',
                    amount: 2500,
                    description: 'Electric Bill',
                    date: '2026-02-10',
                },
                {
                    id: '2',
                    type: 'credit',
                    amount: 45000,
                    description: 'Salary Deposit',
                    date: '2026-02-01',
                },
                {
                    id: '3',
                    type: 'debit',
                    amount: 1200,
                    description: 'Grocery Store',
                    date: '2026-02-08',
                },
                {
                    id: '4',
                    type: 'debit',
                    amount: 500,
                    description: 'Netflix Subscription',
                    date: '2026-02-05',
                },
            ],
        };
    },
};
