import { useState } from 'react';
import { Send, Smartphone, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { getToken } from '../../auth/adminAuth';

const SmsControlModal = ({ isOpen, onClose, onSent }) => {
  const [recipient, setRecipient] = useState('7019311747');
  const [message, setMessage] = useState(
    'EcoTrack Test: SMS notification service is online and active.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/alerts/test-sms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: recipient.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setResult(data.message || 'SMS sent successfully!');
        if (onSent) onSent();
      } else {
        setError(data.message || data.error || 'Failed to send SMS.');
      }
    } catch (err) {
      setError(err.message || 'Network error while attempting to dispatch SMS.');
    } finally {
      setLoading(false);
    }
  };

  const setTemplate = (tpl) => {
    switch (tpl) {
      case 'PRIORITY':
        setMessage('Notice: Bin BIN001 at College Library is at 85% capacity and nearing full level.');
        break;
      case 'CRITICAL':
        setMessage('Urgent: Bin BIN001 at College Library has reached 96% capacity. Please collect it immediately.');
        break;
      case 'FULL':
        setMessage('Critical Alert: Bin BIN001 at College Library has reached full capacity. Immediate action required.');
        break;
      default:
        setMessage('EcoTrack Test: SMS notification service is online and active.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading">SMS Dispatch Control</h3>
              <p className="text-xs text-gray-500">Test & trigger TextBee SMS notifications</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {result && (
            <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <span>{result}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Recipient Phone Number
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. 7019311747 or +917019311747"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                SMS Message
              </label>
              <div className="flex gap-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTemplate('PRIORITY')}
                  className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Priority
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('CRITICAL')}
                  className="px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Critical
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('FULL')}
                  className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  100% Full
                </button>
              </div>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Dispatching SMS...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Test SMS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmsControlModal;

