// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase, ConnectedAccount, AccountHolding } from '../lib/supabase';
import { Plus, RefreshCw, Trash2, Link as LinkIcon, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [holdings, setHoldings] = useState<{ [key: string]: AccountHolding[] }>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    provider_name: 'Boursobank',
    account_name: '',
    account_type: 'stocks',
    sync_frequency: 'daily'
  });

  useEffect(() => {
    if (user) {
      loadAccounts();
    } else {
      setAccounts([]);
      setHoldings({});
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load connected accounts
      const { data: accountsData } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accountsData) {
        setAccounts(accountsData);

        // Load holdings for each account
        const holdingsMap: { [key: string]: AccountHolding[] } = {};
        for (const account of accountsData) {
          const { data: holdingsData } = await supabase
            .from('account_holdings')
            .select('*')
            .eq('connected_account_id', account.id)
            .eq('user_id', user.id);

          if (holdingsData) {
            holdingsMap[account.id] = holdingsData;
          }
        }
        setHoldings(holdingsMap);
      }
    } catch (error) {
      console.error('Error loading connected accounts:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) {
        toast.error('Please sign in to connect an account.');
        return;
      }

      const accountData = {
        ...formData,
        user_id: user.id,
        is_active: true,
        metadata: {}
      };

      const { error } = await supabase
        .from('connected_accounts')
        .insert([accountData]);

      if (error) throw error;

      toast.success('Account connected successfully!');
      setShowAddModal(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Error connecting account:', error);
      toast.error('Failed to connect account');
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);

    try {
      // In a real implementation, this would call an API or Supabase Edge Function
      // to fetch the latest data from the investment provider
      toast.loading('Syncing account data...', { id: 'sync' });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update last_synced_at
      const { error } = await supabase
        .from('connected_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Account synced successfully!', { id: 'sync' });
      loadAccounts();
    } catch (error) {
      console.error('Error syncing account:', error);
      toast.error('Failed to sync account', { id: 'sync' });
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure? This will delete the account and all associated holdings.')) return;

    try {
      if (!user) return;

      const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Account disconnected successfully!');
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const resetForm = () => {
    setFormData({
      provider_name: 'Boursobank',
      account_name: '',
      account_type: 'stocks',
      sync_frequency: 'daily'
    });
  };

  const getProviderIcon = (provider: string) => {
    // In a real app, you'd have actual provider logos
    return <LinkIcon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connected Accounts</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Link your investment accounts for automatic portfolio tracking
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </button>
      </div>

      {/* Connected Accounts List */}
      {accounts.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-8 text-center">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Connected Accounts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your investment accounts to automatically track your portfolio performance and holdings.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {accounts.map(account => {
            const accountHoldings = holdings[account.id] || [];
            const totalValue = accountHoldings.reduce((sum, h) => sum + Number(h.current_value), 0);
            const totalGainLoss = accountHoldings.reduce((sum, h) => sum + Number(h.gain_loss || 0), 0);
            const isPositive = totalGainLoss >= 0;

            return (
              <div key={account.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                {/* Account Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        {getProviderIcon(account.provider_name)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {account.account_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {account.provider_name}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            {account.account_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSync(account.id)}
                        disabled={syncing === account.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync account"
                      >
                        <RefreshCw className={`w-5 h-5 ${syncing === account.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Disconnect account"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        ${totalValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Gain/Loss</p>
                      <p className={`text-xl font-bold mt-1 flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                        {isPositive ? '+' : ''}${totalGainLoss.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Holdings</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {accountHoldings.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Synced</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {account.last_synced_at
                          ? new Date(account.last_synced_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Holdings List */}
                {accountHoldings.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Holdings</h4>
                    <div className="space-y-2">
                      {accountHoldings.map(holding => {
                        const gainLoss = Number(holding.gain_loss || 0);
                        const gainLossPercent = Number(holding.gain_loss_percent || 0);
                        const isGain = gainLoss >= 0;

                        return (
                          <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {holding.symbol}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {holding.asset_name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {holding.quantity} shares @ ${Number(holding.current_price).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                ${Number(holding.current_value).toFixed(2)}
                              </p>
                              <p className={`text-xs font-semibold ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                                {isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Connect Investment Account
            </h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                <select
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option>Boursobank</option>
                  <option>Interactive Brokers</option>
                  <option>Degiro</option>
                  <option>Revolut</option>
                  <option>Trading 212</option>
                  <option>Manual Entry</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Nickname</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., My Stock Portfolio"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="stocks">Stocks</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bonds">Bonds</option>
                  <option value="etf">ETF</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sync Frequency</label>
                <select
                  value={formData.sync_frequency}
                  onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="realtime">Real-time (Premium)</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual Only</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Note:</strong> For now, this creates a placeholder account. In a production app, you would:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Authenticate with the provider's API (OAuth)</li>
                    <li>Securely store encrypted credentials</li>
                    <li>Set up automatic syncing via Supabase Edge Functions</li>
                    <li>Import real-time portfolio data</li>
                  </ul>
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Connect Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
