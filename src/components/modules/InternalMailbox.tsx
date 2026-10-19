import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Inbox,
  Mail,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiService } from '../../services/api.ts';
import type { InternalMessage } from '../../types/platform.ts';
import { formatBangladeshDateTime, normalizeBangladeshMobile } from '../../utils/formatters.ts';

interface RecipientSuggestion {
  id: string;
  fullName: string;
  role: string;
  mobile: string;
}

export const InternalMailbox: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SENT' | 'COMPOSE'>('INBOX');
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compose State
  const [recipientQuery, setRecipientQuery] = useState('');
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecipientSuggestion[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientSuggestion | null>(null);
  const [noUserFound, setNoUserFound] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getMessages();
      setMessages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Recipient Autocomplete Lookup by registered DropNest mobile number
  useEffect(() => {
    const query = recipientQuery.trim();
    if (!query || selectedRecipient) {
      setRecipientSuggestions([]);
      setNoUserFound(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRecipient(true);
      try {
        const results = await ApiService.lookupRecipients(query);
        // Exclude self from recipient list
        const eligible = results.filter((r: RecipientSuggestion) => r.id !== user?.id);
        setRecipientSuggestions(eligible);
        setNoUserFound(eligible.length === 0 && query.length >= 4);
      } catch {
        setRecipientSuggestions([]);
      } finally {
        setIsSearchingRecipient(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [recipientQuery, selectedRecipient, user?.id]);

  const handleSelectRecipient = (rec: RecipientSuggestion) => {
    setSelectedRecipient(rec);
    setRecipientQuery(rec.mobile);
    setRecipientSuggestions([]);
    setNoUserFound(false);
    setSendError(null);
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setRecipientQuery('');
    setRecipientSuggestions([]);
    setNoUserFound(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) {
      setSendError('You must select a verified registered DropNest recipient.');
      return;
    }
    if (!body.trim()) {
      setSendError('Message content cannot be blank.');
      return;
    }

    setSendError(null);
    try {
      await ApiService.sendMessage(selectedRecipient.mobile, subject, body);
      setSendSuccess(true);
      setSubject('');
      setBody('');
      handleClearRecipient();
      await fetchMessages();
      setTimeout(() => {
        setSendSuccess(false);
        setActiveTab('SENT');
      }, 1500);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message');
    }
  };

  const inboxMessages = messages.filter((m) => m.recipientId === user?.id);
  const sentMessages = messages.filter((m) => m.senderId === user?.id);

  return (
    <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[600px]">
      {/* Mailbox Header & Tabs */}
      <div className="p-4 border-b border-[#302741] flex flex-wrap items-center justify-between gap-3 bg-[#100D1B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FFFFFF]">Internal E-mail Box</h3>
            <p className="text-xs text-[#C9C4D6]">
              End-to-end verified communication network for DropNest accounts
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-[#080611] rounded-lg border border-[#302741]">
          <button
            type="button"
            onClick={() => setActiveTab('INBOX')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'INBOX'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Inbox ({inboxMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SENT')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'SENT'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sent ({sentMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPOSE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'COMPOSE'
                ? 'bg-[#22D3EE] text-black shadow-sm font-bold'
                : 'text-[#22D3EE] hover:bg-[#22D3EE]/10'
            }`}
          >
            <span>+ Compose Message</span>
          </button>

          <button
            type="button"
            onClick={fetchMessages}
            title="Refresh messages"
            className="p-1.5 text-[#C9C4D6] hover:text-white rounded hover:bg-[#171226] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Mailbox Workspace */}
      <div className="p-5 flex-1 flex flex-col">
        {/* =========================================================
            COMPOSE VIEW WITH RECIPIENT AUTOCOMPLETE
        ========================================================= */}
        {activeTab === 'COMPOSE' && (
          <form onSubmit={handleSendMessage} className="max-w-3xl w-full mx-auto space-y-4">
            {sendSuccess && (
              <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Message successfully transmitted to recipient's DropNest box.</span>
              </div>
            )}

            {sendError && (
              <div className="p-3 rounded-lg bg-[#F87171]/15 border border-[#F87171]/40 text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{sendError}</span>
              </div>
            )}

            {/* Recipient Lookup Field */}
            <div className="relative">
              <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
                Recipient (Enter Registered DropNest Mobile Number){' '}
                <span className="text-[#F87171]">*</span>
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#A855F7]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={recipientQuery}
                  onChange={(e) => {
                    setRecipientQuery(e.target.value);
                    if (selectedRecipient) setSelectedRecipient(null);
                  }}
                  placeholder="e.g. 01700000001 (or search by digits)"
                  className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-lg pl-9 pr-24 py-2.5 text-xs text-[#FFFFFF] focus:outline-none transition-colors"
                  required
                />

                {selectedRecipient && (
                  <button
                    type="button"
                    onClick={handleClearRecipient}
                    className="absolute right-2 px-2 py-1 text-[11px] bg-[#302741] hover:bg-[#F87171]/20 text-[#C9C4D6] hover:text-[#F87171] rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Exact Autocomplete Suggestion Display Required by Prompt */}
              {/* "Send To: [Registered Mobile Number] — M D JIHADUL ISLAM (SUPER ADMIN)" */}
              {recipientSuggestions.length > 0 && !selectedRecipient && (
                <div className="absolute left-0 right-0 mt-1 bg-[#100D1B] border border-[#7C3AED] rounded-lg shadow-2xl z-30 max-h-52 overflow-y-auto divide-y divide-[#302741]">
                  {recipientSuggestions.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleSelectRecipient(rec)}
                      className="w-full px-4 py-2.5 text-left text-xs text-[#FFFFFF] hover:bg-[#7C3AED]/20 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#34D399]" />
                        <span className="font-semibold text-white">
                          Send To: <span className="text-[#22D3EE] font-mono font-medium">{rec.mobile}</span> —{' '}
                          <span className="text-[#A855F7]">{rec.fullName}</span> ({rec.role})
                        </span>
                      </div>
                      <span className="text-[10px] text-[#C9C4D6] group-hover:text-white uppercase font-bold">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No User Found state */}
              {noUserFound && !selectedRecipient && (
                <div className="mt-1.5 p-2 rounded-md bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs flex items-center gap-2">
                  <UserX className="w-4 h-4" />
                  <span>No User Found with this registered mobile number. Messages can only be sent to verified DropNest accounts.</span>
                </div>
              )}

              {/* Verified Recipient Confirmation Pill */}
              {selectedRecipient && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-[#34D399]" />
                    <span className="text-[#FFFFFF]">
                      Recipient Confirmed: <strong className="text-[#A855F7]">{selectedRecipient.fullName}</strong>{' '}
                      ({selectedRecipient.role}) ·{' '}
                      <span className="font-mono text-[#22D3EE]">{selectedRecipient.mobile}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#34D399] font-semibold">Verified Account</span>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Urgent Order Fulfillment Query / Payment Settlement Notice"
                className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-[#FFFFFF] focus:outline-none transition-colors"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                Message Content <span className="text-[#F87171]">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Type your official DropNest message here..."
                required
                className="w-full bg-[#100D1B] border border-[#302741] focus:border-[#7C3AED] rounded-lg p-3 text-xs text-[#FFFFFF] focus:outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('INBOX')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#C9C4D6] hover:bg-[#302741] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedRecipient || !body.trim()}
                className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  selectedRecipient && body.trim()
                    ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md'
                    : 'bg-[#302741] text-[#C9C4D6]/50 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Internal Message</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            INBOX / SENT MESSAGE LIST
        ========================================================= */}
        {activeTab !== 'COMPOSE' && (
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#C9C4D6]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
                <span>Synchronizing encrypted messages...</span>
              </div>
            ) : (activeTab === 'INBOX' ? inboxMessages : sentMessages).length === 0 ? (
              <div className="py-16 text-center text-[#C9C4D6] flex flex-col items-center justify-center">
                <Inbox className="w-10 h-10 text-[#302741] mb-2" />
                <p className="text-sm font-semibold text-white">No Messages Found</p>
                <p className="text-xs text-[#C9C4D6]/70 mt-1 max-w-sm">
                  {activeTab === 'INBOX'
                    ? 'Your inbox is clear. Messages from DropNest administrators, suppliers, and resellers will appear here.'
                    : 'You have not dispatched any messages yet. Click "Compose Message" to initiate a thread.'}
                </p>
                {activeTab === 'INBOX' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('COMPOSE')}
                    className="mt-4 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-xs font-semibold hover:bg-[#6D28D9] transition-colors"
                  >
                    Start First Internal Message
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#302741] border border-[#302741] rounded-lg overflow-hidden bg-[#100D1B]">
                {(activeTab === 'INBOX' ? inboxMessages : sentMessages).map((msg) => (
                  <div key={msg.id} className="p-4 hover:bg-[#171226] transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {activeTab === 'INBOX' ? (
                            <>
                              From: <span className="text-[#A855F7]">{msg.senderName}</span> ({msg.senderRole})
                            </>
                          ) : (
                            <>
                              To: <span className="text-[#22D3EE]">{msg.recipientName}</span> ({msg.recipientRole})
                            </>
                          )}
                        </span>
                        <span className="text-[#302741]">·</span>
                        <span className="font-mono text-[#22D3EE] text-[11px]">
                          {activeTab === 'INBOX' ? msg.senderMobile : msg.recipientMobile}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#C9C4D6]/70 font-mono tabular-nums">
                        {formatBangladeshDateTime(msg.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#FFFFFF] mb-1">{msg.subject}</h4>
                    <p className="text-xs text-[#C9C4D6] whitespace-pre-line leading-relaxed">
                      {msg.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
